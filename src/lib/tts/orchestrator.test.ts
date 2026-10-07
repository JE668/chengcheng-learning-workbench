/**
 * TTS 两套实现合并后的不变量测试。
 *
 * ## 背景
 * 项目曾存在两套各自实现一遍的三层降级：
 *   - `lib/speak.ts`（生产路径，55+ 文件在用）
 *   - `lib/tts/orchestrator.ts` + `lib/tts/engines/*`（仅诊断页在用）
 * 两套并存导致重复维护，且 orchestrator 那套缺少长文本切分、keep-alive、
 * 服务端音频缓存等 speak.ts 才有的关键处理（尤其长文本切分是项目为绕开
 * 安卓平板 TTS 卡死积累的核心经验）。
 *
 * 合并后：speak.ts 是唯一降级实现，orchestrator 是薄适配层。
 * 本测试锁住这个结构，避免将来又有人写第二套。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { playTtsWithResult } from '@/lib/speak';

// mock 掉真正的朗读实现，聚焦「orchestrator 是否委派给它」
vi.mock('@/lib/speak', () => ({
  playTtsWithResult: vi.fn(),
}));

import { TTSOrchestrator, getTTSOrchestrator, resetTTSOrchestrator } from './orchestrator';

const mockedPlay = vi.mocked(playTtsWithResult);

beforeEach(() => {
  resetTTSOrchestrator();
  mockedPlay.mockReset();
});

afterEach(() => {
  resetTTSOrchestrator();
});

describe('TTSOrchestrator · 薄适配层', () => {
  it('朗读实际委托给 speak.ts 的 playTtsWithResult（而非自建引擎）', async () => {
    mockedPlay.mockResolvedValue({ success: true, engineUsed: 'web-speech-strict', latencyMs: 12 });
    const orch = new TTSOrchestrator();

    const res = await orch.speak('你好', 'zh', { rate: 0.5, pitch: 1.1, pauseMs: 300 });

    expect(mockedPlay).toHaveBeenCalledTimes(1);
    // 参数需原样透传（语速/音调/停顿）
    expect(mockedPlay).toHaveBeenCalledWith('你好', 'zh', {
      wsRate: 0.5,
      pitch: 1.1,
      pauseMs: 300,
    });
    expect(res.success).toBe(true);
    expect(res.engineUsed).toBe('web-speech-strict');
  });

  it('回传命中的降级层用于指标统计', async () => {
    mockedPlay.mockResolvedValue({ success: true, engineUsed: 'edge-tts', latencyMs: 340 });
    const orch = new TTSOrchestrator();

    await orch.speak('长文本', 'zh');

    const m = orch.getMetrics();
    expect(m.totalRequests).toBe(1);
    expect(m.successByEngine['edge-tts']).toBe(1);
    // 滚动平均延迟
    expect(m.avgLatencyByEngine['edge-tts']).toBeCloseTo(340);
  });

  it('三层全失败时返回失败而非抛异常', async () => {
    mockedPlay.mockResolvedValue({ success: false, engineUsed: 'edge-tts', latencyMs: 50 });
    const orch = new TTSOrchestrator();

    const res = await orch.speak('随便什么', 'zh');

    expect(res.success).toBe(false);
    expect(res.error).toContain('failed');
    const m = orch.getMetrics();
    expect(m.successByEngine['edge-tts']).toBe(0);
    expect(m.lastError).toBeDefined();
  });

  it('朗读抛异常时被捕获并转成失败结果', async () => {
    mockedPlay.mockRejectedValue(new Error('boom'));
    const orch = new TTSOrchestrator();

    const res = await orch.speak('会炸的文本', 'zh');

    expect(res.success).toBe(false);
    expect(res.error).toBe('boom');
  });

  it('getEngineStatus 始终报告三层（服务端层恒可用）', () => {
    const orch = new TTSOrchestrator();
    const status = orch.getEngineStatus();
    expect(Object.keys(status).sort()).toEqual([
      'edge-tts',
      'web-speech-loose',
      'web-speech-strict',
    ]);
    // 服务端层不依赖浏览器能力
    expect(status['edge-tts'].available).toBe(true);
  });

  it('连续失败达到阈值后熔断开启', async () => {
    mockedPlay.mockResolvedValue({ success: false, engineUsed: 'edge-tts', latencyMs: 1 });
    const orch = new TTSOrchestrator();

    for (let i = 0; i < 5; i++) await orch.speak('失败', 'zh');

    expect(orch.getEngineStatus()['edge-tts'].circuitOpen).toBe(true);
  });

  it('单例 getTTSOrchestrator 复用同一实例，reset 后重建', () => {
    const a = getTTSOrchestrator();
    const b = getTTSOrchestrator();
    expect(a).toBe(b);
    resetTTSOrchestrator();
    expect(getTTSOrchestrator()).not.toBe(a);
  });

  it('resetMetrics 清零统计', async () => {
    mockedPlay.mockResolvedValue({ success: true, engineUsed: 'web-speech-strict', latencyMs: 10 });
    const orch = new TTSOrchestrator();
    await orch.speak('一次', 'zh');
    expect(orch.getMetrics().totalRequests).toBe(1);

    orch.resetMetrics();
    expect(orch.getMetrics().totalRequests).toBe(0);
    expect(orch.getMetrics().successByEngine['web-speech-strict']).toBe(0);
  });
});
