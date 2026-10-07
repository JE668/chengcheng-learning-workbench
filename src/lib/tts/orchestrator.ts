'use client';

import { playTtsWithResult } from '@/lib/speak';
import { logger } from '@/lib/logger';
import type { TTSLanguage, TTSOptions, TTSResult, TTSMetrics, TTSEngineType } from './types';

/**
 * TTS 编排器 —— **薄适配层**。
 *
 * ## 为什么要这么改（本文件曾是一套完整的平行实现）
 *
 * 项目此前存在两套各自独立实现的「三层降级」：
 *
 * | | `lib/speak.ts` | `lib/tts/orchestrator.ts`（旧版） |
 * | --- | --- | --- |
 * | 使用方 | 生产路径，**55 个文件** | 仅 `/tts-diag` 诊断页，1 个 |
 * | 长文本切分 | ✅ `splitSpeechText` 绕过 Android Chrome 卡死 bug | ❌ 整段直接交给引擎 |
 * | keep-alive | ✅ 每 8s pause/resume 踢醒引擎 | ❌ 无 |
 * | 服务端音频缓存 | ✅ blob 缓存（命中秒回） | ❌ 无 |
 * | 熔断器 | 无 | ✅ 有（但对诊断用途价值有限） |
 * | 指标统计 | 无 | ✅ 有 |
 *
 * 两套并存导致两个真实问题：
 *  1. **重复维护**：三层降级策略各写一遍，改一处容易漏另一处；
 *  2. **能力分叉**：orchestrator 的引擎缺少 speak.ts 才有的一批关键处理
 *     （尤其长文本切分 —— 那是项目为绕开安卓平板 TTS 卡死积累的核心经验）。
 *     旧 orchestrator 若真的接管生产，会引入比它修复的更多问题。
 *
 * `lib/tts/migration-guide.md` 原本计划让 orchestrator 成为唯一实现，
 * 但 `useTTS` hook 从未落地，实际演进方向反了：speak.ts 成了真实实现，
 * orchestrator 停留在纸面。因此本文件改为**委托给 speak.ts 的适配器**，
 * 保留原有公开接口（诊断页与潜在调用方无需改动），消除重复实现。
 *
 * 熔断器能力暂时保留在适配层（对服务端长期不可用时的抖动有缓冲价值）；
 * 若后续确认无价值，可连同 engines/ 目录一并删除。
 */

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  open: boolean;
}

/** 平台检测 —— 识别已知有问题的平台（Edge on Android）。 */
function detectPlatform(): { isEdgeOnAndroid: boolean; isProblematic: boolean } {
  if (typeof navigator === 'undefined') return { isEdgeOnAndroid: false, isProblematic: false };
  const ua = navigator.userAgent;
  const isEdge = /Edg\//i.test(ua);
  const isAndroid = /Android/i.test(ua);
  // Edge on Android（含小米平板 Edge）—— Web Speech 支持有限
  const isEdgeOnAndroid = isEdge && isAndroid;
  return { isEdgeOnAndroid, isProblematic: isEdgeOnAndroid };
}

/** 编排器：对外保持原接口，内部统一走 speak.ts 的降级实现。 */
export class TTSOrchestrator {
  private metrics: TTSMetrics = emptyMetrics();
  /** 熔断器状态：按引擎类型记录连续失败次数。 */
  private circuitBreakers: Map<TTSEngineType, CircuitBreakerState> = new Map();
  private readonly FAILURE_THRESHOLD = 5;
  private readonly RESET_TIMEOUT = 60000;
  private platformInfo = detectPlatform();

  constructor() {
    for (const type of ['web-speech-strict', 'web-speech-loose', 'edge-tts'] as const) {
      this.circuitBreakers.set(type, { failures: 0, lastFailure: 0, open: false });
    }
  }

  /**
   * 朗读文本 —— 自动降级。
   * 降级策略完全由 speak.ts 负责（严格 Web Speech → 宽松 Web Speech → 服务端）。
   */
  async speak(text: string, lang: TTSLanguage, options: TTSOptions = {}): Promise<TTSResult> {
    this.metrics.totalRequests++;

    if (this.platformInfo.isProblematic) {
      logger.debug('[TTS] 问题平台（Edge on Android）：优先走服务端兜底');
    }

    try {
      const res = await playTtsWithResult(text, lang, {
        wsRate: options.rate,
        pitch: options.pitch,
        pauseMs: options.pauseMs,
      });

      if (res.success) {
        this.recordSuccess(res.engineUsed, res.latencyMs);
        return {
          success: true,
          engineUsed: res.engineUsed,
          latencyMs: res.latencyMs,
        };
      }

      this.recordFailure('edge-tts', 'All TTS layers failed');
      return {
        success: false,
        error: 'All TTS layers failed',
        engineUsed: 'edge-tts',
        latencyMs: res.latencyMs,
      };
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      this.recordFailure('edge-tts', err.message);
      logger.error('[TTS] 朗读异常', undefined, err);
      return { success: false, error: err.message, engineUsed: 'edge-tts', latencyMs: 0 };
    }
  }

  /** 预热：speak.ts 无需显式预热（引擎在首次调用时惰性初始化）。 */
  async warmup(): Promise<void> {
    // 预读一次嗓音列表可缩短首次朗读延迟，属可选优化。
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.getVoices();
      } catch {
        /* 忽略 */
      }
    }
  }

  getMetrics(): TTSMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = emptyMetrics();
  }

  /**
   * 引擎状态。
   *
   * 说明：三层降级现在由 speak.ts 内部完成，本层不再持有独立引擎实例，
   * 因此 `available` 只能依据本地能力静态推断（是否有 Web Speech 支持），
   * 而不能像旧版那样逐个调 engine.isAvailable()。
   */
  getEngineStatus(): Record<string, { available: boolean; circuitOpen: boolean }> {
    const hasWebSpeech = typeof window !== 'undefined' && !!window.speechSynthesis;
    const status: Record<string, { available: boolean; circuitOpen: boolean }> = {};
    for (const type of ['web-speech-strict', 'web-speech-loose', 'edge-tts'] as const) {
      status[type] = {
        // 服务端层始终可用（网络可达即可）；两个 Web Speech 层依赖浏览器支持
        available: type === 'edge-tts' || hasWebSpeech,
        circuitOpen: this.isCircuitOpen(type),
      };
    }
    return status;
  }

  /** 清理资源：降级实现内无长驻资源（定时器均随朗读结束清理）。 */
  dispose(): void {
    this.circuitBreakers.clear();
  }

  // ==================== 私有方法 ====================

  private isCircuitOpen(type: TTSEngineType): boolean {
    const state = this.circuitBreakers.get(type);
    if (!state || !state.open) return false;
    if (Date.now() - state.lastFailure > this.RESET_TIMEOUT) {
      state.failures = 0;
      state.open = false;
      logger.debug(`[TTS] Circuit breaker for ${type} reset`);
      return false;
    }
    return true;
  }

  private recordSuccess(type: TTSEngineType, latencyMs: number): void {
    const state = this.circuitBreakers.get(type);
    if (state) {
      state.failures = 0;
      state.open = false;
    }
    const bucket = this.metrics.successByEngine;
    bucket[type] = (bucket[type] ?? 0) + 1;
    const count = bucket[type];
    const prevAvg = this.metrics.avgLatencyByEngine[type] ?? 0;
    this.metrics.avgLatencyByEngine[type] = prevAvg + (latencyMs - prevAvg) / count;
  }

  private recordFailure(type: TTSEngineType, error: string): void {
    const state = this.circuitBreakers.get(type);
    if (state) {
      state.failures++;
      state.lastFailure = Date.now();
      if (state.failures >= this.FAILURE_THRESHOLD) {
        state.open = true;
        logger.warn(`[TTS] Circuit breaker OPENED for ${type} after ${state.failures} failures`);
      }
    }
    this.metrics.lastError = { engine: type, error, timestamp: Date.now() };
  }
}

function emptyMetrics(): TTSMetrics {
  return {
    totalRequests: 0,
    successByEngine: {
      'web-speech-strict': 0,
      'web-speech-loose': 0,
      'edge-tts': 0,
    },
    fallbackCount: 0,
    avgLatencyByEngine: {
      'web-speech-strict': 0,
      'web-speech-loose': 0,
      'edge-tts': 0,
    },
  };
}

/** 单例实例 */
let orchestratorInstance: TTSOrchestrator | null = null;

export function getTTSOrchestrator(): TTSOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new TTSOrchestrator();
  }
  return orchestratorInstance;
}

export function resetTTSOrchestrator(): void {
  orchestratorInstance?.dispose();
  orchestratorInstance = null;
}
