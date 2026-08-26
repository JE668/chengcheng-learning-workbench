'use client';

import {
  TTSEngine,
  TTSEngineType,
  TTSLanguage,
  TTSOptions,
  TTSResult,
  TTSMetrics,
} from './types';
import { WebSpeechStrictEngine } from './engines/web-speech-strict';
import { WebSpeechLooseEngine } from './engines/web-speech-loose';
import { EdgeTTSEngine } from './engines/edge-tts';

/** 熔断器状态 */
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  open: boolean;
}

/**
 * TTS 编排器 - 管理三层降级策略
 */
export class TTSOrchestrator {
  private engines: TTSEngine[] = [];
  private metrics: TTSMetrics = {
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

  // 熔断器配置
  private circuitBreakers: Map<TTSEngineType, CircuitBreakerState> = new Map();
  private readonly FAILURE_THRESHOLD = 5;
  private readonly RESET_TIMEOUT = 60000; // 60秒

  constructor() {
    this.initEngines();
    this.initCircuitBreakers();
  }

  private initEngines(): void {
    this.engines = [
      new WebSpeechStrictEngine(),
      new WebSpeechLooseEngine(),
      new EdgeTTSEngine(),
    ];
  }

  private initCircuitBreakers(): void {
    for (const engine of this.engines) {
      this.circuitBreakers.set(engine.type, {
        failures: 0,
        lastFailure: 0,
        open: false,
      });
    }
  }

  /**
   * 朗读文本 - 自动降级
   */
  async speak(text: string, lang: TTSLanguage, options: TTSOptions = {}): Promise<TTSResult> {
    this.metrics.totalRequests++;

    for (const engine of this.engines) {
      // 检查熔断器
      if (this.isCircuitOpen(engine.type)) {
        console.log(`[TTS] ${engine.name} circuit open, skipping`);
        continue;
      }

      // 检查可用性
      const available = await engine.isAvailable(lang);
      if (!available) {
        console.log(`[TTS] ${engine.name} not available`);
        continue;
      }

      try {
        console.log(`[TTS] Trying ${engine.name} for: "${text.slice(0, 30)}..."`);
        const result = await engine.speak(text, lang, options);

        if (result.success) {
          this.recordSuccess(engine.type, result.latencyMs);
          return result;
        } else {
          this.recordFailure(engine.type, result.error ?? 'Unknown error');
          console.warn(`[TTS] ${engine.name} failed: ${result.error}`);
        }
      } catch (e: any) {
        this.recordFailure(engine.type, e.message);
        console.error(`[TTS] ${engine.name} threw:`, e);
      }

      // 记录降级
      this.metrics.fallbackCount++;
    }

    // 全部失败
    return {
      success: false,
      error: 'All TTS engines failed',
      engineUsed: 'edge-tts',
      latencyMs: 0,
    };
  }

  /**
   * 预热所有引擎
   */
  async warmup(): Promise<void> {
    await Promise.all(
      this.engines
        .filter(e => e.warmup)
        .map(e => e.warmup!().catch(() => {}))
    );
  }

  /** 获取指标 */
  getMetrics(): TTSMetrics {
    return { ...this.metrics };
  }

  /** 重置指标 */
  resetMetrics(): void {
    this.metrics = {
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

  /** 获取引擎状态 */
  getEngineStatus(): Record<TTSEngineType, { available: boolean; circuitOpen: boolean }> {
    const status: Record<TTSEngineType, { available: boolean; circuitOpen: boolean }> = {
      'web-speech-strict': { available: false, circuitOpen: false },
      'web-speech-loose': { available: false, circuitOpen: false },
      'edge-tts': { available: false, circuitOpen: false },
    };

    for (const engine of this.engines) {
      // 这里只能同步检查，实际可用性需要异步
      status[engine.type] = {
        available: false, // 需要异步检查
        circuitOpen: this.isCircuitOpen(engine.type),
      };
    }

    return status;
  }

  /** 清理资源 */
  dispose(): void {
    for (const engine of this.engines) {
      engine.dispose?.();
    }
    this.engines = [];
  }

  // ==================== 私有方法 ====================

  private isCircuitOpen(type: TTSEngineType): boolean {
    const state = this.circuitBreakers.get(type);
    if (!state || !state.open) return false;

    // 检查是否该重置
    if (Date.now() - state.lastFailure > this.RESET_TIMEOUT) {
      state.failures = 0;
      state.open = false;
      console.log(`[TTS] Circuit breaker for ${type} reset`);
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

    this.metrics.successByEngine[type]++;
    const prevAvg = this.metrics.avgLatencyByEngine[type];
    const count = this.metrics.successByEngine[type];
    this.metrics.avgLatencyByEngine[type] = prevAvg + (latencyMs - prevAvg) / count;
  }

  private recordFailure(type: TTSEngineType, error: string): void {
    const state = this.circuitBreakers.get(type);
    if (state) {
      state.failures++;
      state.lastFailure = Date.now();
      if (state.failures >= this.FAILURE_THRESHOLD) {
        state.open = true;
        console.warn(`[TTS] Circuit breaker OPENED for ${type} after ${state.failures} failures`);
      }
    }

    this.metrics.lastError = { engine: type, error, timestamp: Date.now() };
  }
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