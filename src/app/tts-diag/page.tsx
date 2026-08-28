'use client';

import { useState, useEffect } from 'react';
import { getTTSOrchestrator } from '@/lib/tts/orchestrator';
import { logger } from '@/lib/logger';

/**
 * TTS 诊断页（仅在出问题的设备上手动打开，例如 https://你的域名/tts-diag）。
 * 目的：确认「读古诗词 / 各模块语音」到底走的是「服务端 TTS（跨设备一致普通话）」
 * 还是「浏览器原生 Web Speech 降级（随设备系统语言变，iPad 设粤语就会变粤语）」。
 * 在 iPad / 小米 / Mac Safari 上各点一次，把下方结果发我，即可定位根因。
 */
export default function TtsDiagPage() {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [orchestrator] = useState(() => getTTSOrchestrator());
  const [platformInfo, setPlatformInfo] = useState<{ isEdgeOnAndroid: boolean; isProblematic: boolean } | null>(null);
  const [engineStatus, setEngineStatus] = useState<Record<string, { available: boolean; circuitOpen: boolean }> | null>(null);
  const [metrics, setMetrics] = useState<ReturnType<typeof orchestrator.getMetrics> | null>(null);

  const push = (s: string) => setLog((l) => [...l, s]);
  const clearLog = () => setLog([]);

  useEffect(() => {
    // 获取平台信息
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent;
      const isEdge = /Edg\//i.test(ua);
      const isAndroid = /Android/i.test(ua);
      const isMobile = /Mobile|Tablet/i.test(ua) || (isAndroid && !/Chrome/i.test(ua));
      const isEdgeOnAndroid = isEdge && isAndroid;
      const isProblematic = isEdgeOnAndroid;
      setPlatformInfo({ isEdgeOnAndroid, isProblematic });
    }

    // 获取引擎状态
    if (orchestrator) {
      const status = orchestrator.getEngineStatus();
      setEngineStatus(status);
      setMetrics(orchestrator.getMetrics());
    }
  }, [orchestrator]);

  async function runFullTest() {
    setBusy(true);
    clearLog();
    push('=== TTS 完整诊断开始 ===');
    push(`时间: ${new Date().toISOString()}`);
    push('');

    // 1. 基础环境信息
    push('--- 1. 基础环境信息 ---');
    push(`User Agent: ${navigator.userAgent}`);
    push(`Platform: ${navigator.platform}`);
    push(`Language: ${navigator.language}`);
    push(`Web Speech 支持: ${typeof window !== 'undefined' && !!window.speechSynthesis ? '是' : '否'}`);
    push(`AudioContext 支持: ${typeof window !== 'undefined' && (!!window.AudioContext || !!(window as any).webkitAudioContext) ? '是' : '否'}`);
    
    if (platformInfo) {
      push(`Edge on Android: ${platformInfo.isEdgeOnAndroid ? '⚠️ 是 (已知问题平台)' : '否'}`);
      push(`问题平台标记: ${platformInfo.isProblematic ? '⚠️ 是' : '否'}`);
    }
    push('');

    // 2. Web Speech 嗓音
    push('--- 2. Web Speech 嗓音详情 ---');
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      push(`可用嗓音总数: ${voices.length}`);
      voices.forEach(v => {
        const isZhCN = /zh-cn/i.test(v.lang);
        const isZh = /zh/i.test(v.lang);
        const isEn = /en/i.test(v.lang);
        const tags = [];
        if (isZhCN) tags.push('✅ zh-CN');
        else if (isZh) tags.push('⚠️ zh-*');
        if (isEn) tags.push('🔤 en-*');
        push(`  - ${v.name} [${v.lang}] ${tags.join(' ')}`);
      });
      if (!voices.length) {
        push('  ⚠️ 暂无可用嗓音 (voiceschanged 可能未触发)');
      }
    } else {
      push('  ❌ Web Speech API 不可用');
    }
    push('');

    // 3. 编排器状态
    if (orchestrator && engineStatus) {
      push('--- 3. 编排器引擎状态 ---');
      Object.entries(engineStatus).forEach(([engine, status]) => {
        push(`  ${engine}: 可用=${status.available ? '✅' : '❌'}, 熔断=${status.circuitOpen ? '🔴 开启' : '🟢 关闭'}`);
      });
      push('');

      push('--- 4. 编排器指标 ---');
      if (metrics) {
        push(`  总请求数: ${metrics.totalRequests}`);
        push(`  降级次数: ${metrics.fallbackCount}`);
        Object.entries(metrics.successByEngine).forEach(([engine, count]) => {
          const avgLatency = metrics.avgLatencyByEngine[engine];
          push(`  ${engine}: 成功=${count}, 平均延迟=${avgLatency.toFixed(0)}ms`);
        });
      }
      push('');
    }

    // 5. 服务端 TTS 测试
    push('--- 5. 服务端 Edge TTS 测试 ---');
    const t0 = performance.now();
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: '你好，我是程程学习工作台。', lang: 'zh', rate: '-45%', pause: 0 }),
      });
      const elapsed = Math.round(performance.now() - t0);
      push(`/api/tts 状态码: ${res.status} (耗时 ${elapsed}ms)`);
      if (res.ok) {
        const blob = await res.blob();
        push(`返回音频: ${blob.size} 字节, type=${blob.type}`);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        try {
          await audio.play();
          push('✅ 服务端音频 play() 成功 → 本设备用的是服务端 TTS（普通话、跨设备一致）');
        } catch (e) {
          push(`⚠️ play() 被拒绝/失败: ${(e as Error).message} → 可能是自动播放限制`);
        }
        URL.revokeObjectURL(url);
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
      push(`❌ fetch /api/tts 失败 (${elapsed}ms): ${(e as Error).message}`);
      push('→ 说明本设备没用上服务端 TTS，已降级到浏览器原生嗓音（随系统语言变）');
    }
    push('');

    // 6. 健康检查端点
    push('--- 6. 健康检查端点 ---');
    try {
      const healthRes = await fetch('/api/tts/health');
      push(`/api/tts/health 状态码: ${healthRes.status}`);
      if (healthRes.ok) {
        const data = await healthRes.json().catch(() => ({}));
        push(`健康检查响应: ${JSON.stringify(data)}`);
      }
    } catch (e) {
      push(`❌ 健康检查失败: ${(e as Error).message}`);
    }
    push('');

    // 7. 实时测试各引擎
    push('--- 7. 实时引擎测试 (顺序播放) ---');
    const testText = '测试语音播放。';
    const engines = ['web-speech-strict', 'web-speech-loose', 'edge-tts'];
    
    for (const engineName of engines) {
      if (!orchestrator) continue;
      
      // 通过私有方法访问引擎（仅用于诊断）
      const engine = (orchestrator as any).engines?.find((e: any) => e.type === engineName);
      if (!engine) {
        push(`  ${engineName}: 引擎未找到`);
        continue;
      }

      const available = await engine.isAvailable('zh');
      if (!available) {
        push(`  ${engineName}: ❌ 不可用 (isAvailable=false)`);
        continue;
      }

      const start = performance.now();
      try {
        const result = await engine.speak(testText, 'zh', { rate: 0.5, pauseMs: 0 });
        const elapsed = Math.round(performance.now() - start);
        if (result.success) {
          push(`  ${engineName}: ✅ 成功 (${elapsed}ms, 引擎=${result.engineUsed})`);
        } else {
          push(`  ${engineName}: ❌ 失败 - ${result.error} (${elapsed}ms)`);
        }
      } catch (e) {
        const elapsed = Math.round(performance.now() - start);
        push(`  ${engineName}: ❌ 异常 - ${(e as Error).message} (${elapsed}ms)`);
      }
      
      // 短暂等待避免重叠
      await new Promise(r => setTimeout(r, 200));
    }
    push('');

    push('=== 诊断完成 ===');
    push('请复制上方日志发送给开发者。');
    setBusy(false);
  }

  async function testSpeak(text: string) {
    if (!orchestrator) return;
    setBusy(true);
    clearLog();
    push(`测试朗读: "${text}"`);
    try {
      const result = await orchestrator.speak(text, 'zh', { rate: 0.55, pauseMs: 0 });
      push(`结果: ${result.success ? '✅ 成功' : '❌ 失败 - ' + result.error}`);
      push(`引擎: ${result.engineUsed}, 延迟: ${result.latencyMs}ms`);
    } catch (e) {
      push(`异常: ${(e as Error).message}`);
    }
    setBusy(false);
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 20, fontFamily: 'system-ui, sans-serif', lineHeight: 1.7 }}>
      <h1>TTS 诊断面板</h1>
      <p style={{ color: '#666' }}>在出问题的设备上打开本页，点「完整诊断」或「快速测试」，把结果发给开发者即可定位语音问题。</p>
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={runFullTest}
          disabled={busy}
          style={{ padding: '12px 24px', fontSize: 16, cursor: busy ? 'default' : 'pointer', background: '#0066cc', color: 'white', border: 'none', borderRadius: '6px' }}
        >
          {busy ? '诊断中…' : '🔍 完整诊断'}
        </button>
        <button
          onClick={() => testSpeak('你好，我是程程学习工作台。')}
          disabled={busy}
          style={{ padding: '12px 24px', fontSize: 16, cursor: busy ? 'default' : 'pointer', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px' }}
        >
          🎤 快速测试（中文）
        </button>
        <button
          onClick={() => testSpeak('Hello, this is Chengcheng Learning Workbench.')}
          disabled={busy}
          style={{ padding: '12px 24px', fontSize: 16, cursor: busy ? 'default' : 'pointer', background: '#6f42c1', color: 'white', border: 'none', borderRadius: '6px' }}
        >
          🎤 快速测试（英文）
        </button>
        <button
          onClick={clearLog}
          disabled={busy}
          style={{ padding: '12px 24px', fontSize: 16, cursor: busy ? 'default' : 'pointer', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px' }}
        >
          🗑️ 清空日志
        </button>
      </div>

      <pre
        style={{
          whiteSpace: 'pre-wrap',
          background: '#1e1e1e',
          color: '#d4d4d4',
          padding: 16,
          borderRadius: 8,
          fontSize: 13,
          fontFamily: 'Menlo, Monaco, Consolas, monospace',
          maxHeight: '70vh',
          overflow: 'auto',
        }}
      >
        {log.join('\n') || '（点上方按钮开始测试）'}
      </pre>
    </div>
  );
}