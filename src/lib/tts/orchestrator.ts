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
import { logger } from '@/lib/logger';

/** 熔断器状态 */
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  open: boolean;
}

/**
 * 平台检测 - 识别已知有问题的平台
 */
function detectPlatform(): { isEdgeOnAndroid: boolean; isProblematic: boolean } {
  if (typeof navigator === 'undefined') return { isEdgeOnAndroid: false, isProblematic: false };
  
  const ua = navigator.userAgent;
  const isEdge = /Edg\//i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMobile = /Mobile|Tablet/i.test(ua) || (isAndroid && !/Chrome/i.test(ua));
  
  // Edge on Android (包括小米平板 Edge) - Web Speech 支持有限
  const isEdgeOnAndroid = isEdge && isAndroid;
  
  // 其他已知问题平台
  const isProblematic = isEdgeOnAndroid;
  
  return { isEdgeOnAndroid, isProblematic };
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
  
  // 平台信息缓存
  private platformInfo = detectPlatform();

  constructor() {
    this.initEngines();
    this.initCircuitBreakers();
  }

  private initEngines(): void {
    // 在有问题的平台上，直接跳过 Web Speech，使用 Edge TTS
    if (this.platformInfo.isProblematic) {
      logger.warn('[TTS] Detected problematic platform, skipping Web Speech engines');
      this.engines = [
        new EdgeTTSEngine(),
      ];
    } else {
      this.engines = [
        new WebSpeechStrictEngine(),
        new WebSpeechLooseEngine(),
        new EdgeTTSEngine(),
      ];
    }
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

    for (let i = 0; i < this.engines.length; i++) {
      const engine = this.engines[i];
      
      // 检查熔断器
      if (this.isCircuitOpen(engine.type)) {
        logger.debug(`[TTS] ${engine.name} circuit open, skipping`);
        continue;
      }

      // 检查可用性
      const available = await engine.isAvailable(lang);
      if (!available) {
        logger.debug(`[TTS] ${engine.name} not available`);
        continue;
      }

      try {
        logger.debug(`[TTS] Trying ${engine.name} for: "${text.slice(0, 30)}..."`);
        const result = await engine.speak(text, lang, options);

        if (result.success) {
          this.recordSuccess(engine.type, result.latencyMs);
          return result;
        } else {
          this.recordFailure(engine.type, result.error ?? 'Unknown error');
          logger.warn(`[TTS] ${engine.name} failed: ${result.error}`);
        }
      } catch (e: any) {
        this.recordFailure(engine.type, e.message);
        logger.error(`[TTS] ${engine.name} threw`, undefined, e);
      }

      // 记录降级
      this.metrics.fallbackCount++;
      
      // 降级前短暂等待，确保前一个引擎的音频完全停止
      if (i < this.engines.length - 1) {
        await new Promise(r => setTimeout(r, 50));
      }
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
        logger.warn(`[TTS] Circuit breaker OPENED for ${type} after ${state.failures} failures`);
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