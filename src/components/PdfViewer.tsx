'use client';

import { Component, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * 画布式 PDF 阅读器（基于 PDF.js，自托管 worker）。
 *
 * 设计目标：
 *  1) 优先用 PDF.js 把每页渲染成 <canvas> —— 彻底绕开浏览器原生「下载」行为，实现只能看不能下载；
 *  2) 任何失败（PDF.js 加载/初始化/渲染抛错、弱网下取不到 PDF）都**安全降级**为内嵌 <iframe>，
 *     由 vercel.json 的 Content-Disposition: inline 保证桌面端内联显示；
 *  3) 用 ErrorBoundary 接住一切未被 try/catch 兜住的同步渲染异常，绝不让整页白屏（client-side exception）。
 *
 * worker 自托管在 /pdf.worker.min.mjs（同源，不受国内访问影响）。
 * PDF 源支持跨域（镜像/对象存储），但跨域源需返回 Access-Control-Allow-Origin: *。
 */

/** 降级方案：内嵌 iframe 直接打开 PDF（不会崩，桌面端内联显示，移动端可能触发下载亦可用） */
function PdfIframeFallback({ url }: { url: string }) {
  return (
    <iframe
      src={url}
      title="PDF 阅读"
      className="w-full border-0 rounded-lg bg-white"
      style={{ height: '100%', minHeight: '60vh' }}
    />
  );
}

/** 错误边界：接住子组件的同步渲染异常，降级为 iframe，避免整页 client-side exception 白屏 */
class PdfErrorBoundary extends Component<{ url: string; children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    /* 仅作降级，无需上报 */
  }
  render() {
    if (this.state.hasError) return <PdfIframeFallback url={this.props.url} />;
    return this.props.children;
  }
}

/** 真正的 canvas 渲染逻辑；异步任何失败都置 failed，由本组件渲染 iframe 降级 */
function PdfCanvas({ url, className = '' }: { url: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';
    setStatus('loading');
    setFailed(false);

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
          if (!base.width || !base.height) continue;
          const scale = (containerWidth / base.width) * dpr;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.className = 'block mx-auto mb-3 rounded-lg shadow bg-white';
          canvas.width = Math.max(1, Math.floor(viewport.width));
          canvas.height = Math.max(1, Math.floor(viewport.height));
          canvas.style.width = `${containerWidth}px`;
          canvas.style.height = `${Math.max(1, Math.floor(viewport.height / dpr))}px`;

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
          if (cancelled) return;
          container.appendChild(canvas);
        }

        if (!cancelled) setStatus('ready');
      } catch {
        if (!cancelled) setFailed(true); // 降级为 iframe，避免白屏
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  // 任意失败 → iframe 降级（不再白屏）
  if (failed) return <PdfIframeFallback url={url} />;

  return (
    <div className={className}>
      {status === 'loading' && (
        <div className="flex items-center justify-center text-gray-400 py-10">📄 正在加载绘本…</div>
      )}
      {status === 'error' && (
        <div className="flex items-center justify-center text-gray-500 py-10">😢 该绘本暂不可用</div>
      )}
      <div ref={containerRef} className="w-full" />
    </div>
  );
}

export default function PdfViewer({ url, className = '' }: { url: string; className?: string }) {
  return (
    <PdfErrorBoundary url={url}>
      <PdfCanvas url={url} className={className} />
    </PdfErrorBoundary>
  );
}
