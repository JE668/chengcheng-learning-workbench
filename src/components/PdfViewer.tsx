'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * 画布式 PDF 阅读器（基于 PDF.js，自托管 worker）。
 *
 * 为什么不用 <iframe src=xxx.pdf>：
 * 部分浏览器/手机 WebView 没有内置 PDF 预览，会直接「下载」；
 * 用 PDF.js 把每页渲染成 <canvas>，彻底绕开浏览器原生下载行为，
 * 实现「只能看、不能下载」。
 *
 * worker 自托管在 /pdf.worker.min.mjs（同源，不受国内访问影响）。
 * PDF 源支持跨域（镜像/对象存储），但跨域源需返回
 * Access-Control-Allow-Origin: *（PDF.js 用 fetch 取 PDF）。
 */
export default function PdfViewer({ url, className = '' }: { url: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';
    setStatus('loading');
    setErrorMsg('');

    (async () => {
      try {
        // 兜底：Promise.withResolvers 是较新的 API，老设备/浏览器可能没有
        if (typeof (Promise as any).withResolvers !== 'function') {
          (Promise as any).withResolvers = function () {
            let resolve!: (v: unknown) => void;
            let reject!: (e: unknown) => void;
            const promise = new Promise((res, rej) => {
              resolve = res as (v: unknown) => void;
              reject = rej;
            });
            return { promise, resolve, reject };
          };
        }

        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const pdf = await pdfjs.getDocument({ url }).promise;
        if (cancelled) {
          (pdf as any).destroy?.();
          return;
        }

        const containerWidth = container.clientWidth || 600;
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const scale = (containerWidth / base.width) * dpr;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.className = 'block mx-auto mb-3 rounded-lg shadow bg-white';
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = `${containerWidth}px`;
          canvas.style.height = `${(viewport.height / dpr).toFixed(0)}px`;

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
          if (cancelled) return;
          container.appendChild(canvas);
        }

        if (!cancelled) setStatus('ready');
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg(e instanceof Error ? e.message : 'PDF 加载失败');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className={className}>
      {status === 'loading' && (
        <div className="flex items-center justify-center text-gray-400 py-10">📄 正在加载绘本…</div>
      )}
      {status === 'error' && (
        <div className="flex flex-col items-center justify-center text-gray-500 py-10 gap-2 text-center px-4">
          <span>😢 PDF 加载失败（{errorMsg}）</span>
          <a href={url} target="_blank" rel="noreferrer" className="text-moko-rose font-bold underline">
            尝试在新标签打开 ↗
          </a>
        </div>
      )}
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
