'use client';

import { useState } from 'react';

/**
 * TTS 诊断页（仅在出问题的设备上手动打开，例如 https://你的域名/tts-diag）。
 * 目的：确认「读古诗词 / 各模块语音」到底走的是「服务端 TTS（跨设备一致普通话）」
 * 还是「浏览器原生 Web Speech 降级（随设备系统语言变，iPad 设粤语就会变粤语）」。
 * 在 iPad / 小米 / Mac Safari 上各点一次，把下方结果发我，即可定位根因。
 */
export default function TtsDiagPage() {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const push = (s: string) => setLog((l) => [...l, s]);

  async function test() {
    setBusy(true);
    setLog([]);
    const hasSS = typeof window !== 'undefined' && !!window.speechSynthesis;
    const voices = hasSS ? window.speechSynthesis.getVoices().map((v) => `${v.name}[${v.lang}]`) : [];
    push(`浏览器 UA: ${navigator.userAgent}`);
    push(`Web Speech 支持: ${hasSS ? '是' : '否'}`);
    push(`本机可用嗓音(${voices.length}): ${voices.join(' | ') || '无'}`);
    push(`含 zh-CN 普通话嗓音: ${voices.some((v) => /zh-cn/i.test(v)) ? '是' : '否（iPad 设粤语时常为否）'}`);
    push('----------------------------------------');

    const t0 = performance.now();
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: '你好，我是程程学习工作台。', lang: 'zh', rate: '-45%', pause: 0 }),
      });
      const elapsed = Math.round(performance.now() - t0);
      push(`/api/tts 状态码: ${res.status}（耗时 ${elapsed}ms）`);
      if (res.ok) {
        const blob = await res.blob();
        push(`返回音频: ${blob.size} 字节, type=${blob.type}`);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        try {
          await audio.play();
          push('✅ 服务端音频 play() 成功 → 本设备用的是服务端 TTS（普通话、跨设备一致）');
        } catch (e) {
          push(`⚠️ play() 被拒绝/失败: ${(e as Error).message} → 可能是自动播放限制（已在 speak.ts 做首次交互解锁）`);
        }
      } else {
        const txt = await res.text().catch(() => '');
        push(`服务端返回非 200，内容: ${txt.slice(0, 400)}`);
        try {
          const j = JSON.parse(txt);
          if (j.reason) push(`  ↳ 失败原因: ${j.reason}`);
        } catch { /* 不是 JSON */ }
      }
    } catch (e) {
      const elapsed = Math.round(performance.now() - t0);
      push(`❌ fetch /api/tts 失败（${elapsed}ms）: ${(e as Error).message}`);
      push('→ 说明本设备没用上服务端 TTS，已降级到浏览器原生嗓音（随系统语言变）');
    }
    setBusy(false);
  }

  return (
    <div style={{ maxWidth: 760, margin: '40px auto', padding: 20, fontFamily: 'system-ui', lineHeight: 1.7 }}>
      <h1>TTS 诊断</h1>
      <p style={{ color: '#666' }}>在出问题的设备上打开本页，点「开始测试」，把结果发我即可定位语音问题。</p>
      <button
        onClick={test}
        disabled={busy}
        style={{ padding: '10px 22px', fontSize: 16, cursor: busy ? 'default' : 'pointer' }}
      >
        {busy ? '测试中…' : '开始测试'}
      </button>
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          background: '#f5f5f5',
          padding: 14,
          marginTop: 16,
          borderRadius: 8,
          fontSize: 13,
        }}
      >
        {log.join('\n') || '（点上方按钮开始）'}
      </pre>
    </div>
  );
}
