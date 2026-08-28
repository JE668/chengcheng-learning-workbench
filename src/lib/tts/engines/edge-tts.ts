'use client';

import { TTSEngine, TTSEngineType, TTSLanguage, TTSOptions, TTSResult } from '../types';

/**
 * Edge TTS 服务端引擎
 * 调用 /api/tts 获取音频
 */
export class EdgeTTSEngine implements TTSEngine {
  readonly type: TTSEngineType = 'edge-tts';
  readonly name = 'Edge TTS (Server)';

  private static readonly VOICE_MAP: Record<TTSLanguage, string> = {
    zh: 'zh-CN-XiaoxiaoNeural',
    en: 'en-US-AriaNeural',
  };

  private healthCheckCache: { available: boolean; timestamp: number } | null = null;
  private readonly HEALTH_CHECK_TTL = 30000; // 30秒缓存
  private prewarmed = false;

  async isAvailable(_lang: TTSLanguage): Promise<boolean> {
    // 检查缓存
    if (this.healthCheckCache && Date.now() - this.healthCheckCache.timestamp < this.HEALTH_CHECK_TTL) {
      return this.healthCheckCache.available;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('/api/tts/health', { method: 'GET', signal: controller.signal });
      clearTimeout(timeout);
      const available = res.ok;
      this.healthCheckCache = { available, timestamp: Date.now() };
      return available;
    } catch {
      this.healthCheckCache = { available: false, timestamp: Date.now() };
      return false;
    }
  }

  /**
   * 预热连接 - 建立 HTTP/2 连接、DNS 预解析
   */
  async warmup(): Promise<void> {
    if (this.prewarmed) return;
    
    try {
      // 预热健康检查端点
      await fetch('/api/tts/health', { method: 'GET', keepalive: true });
      this.prewarmed = true;
    } catch {
      // 忽略预热失败
    }
  }

  async speak(text: string, lang: TTSLanguage, options: TTSOptions = {}): Promise<TTSResult> {
    const startTime = performance.now();
    const timeout = options.timeout ?? 12000;

    try {
      // 先取消 Web Speech 语音，防止重叠
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const wsRate = options.rate ?? 0.8;
      const edgeRate = this.toEdgeRate(wsRate);

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text,
          lang,
          voice: EdgeTTSEngine.VOICE_MAP[lang],
          rate: edgeRate,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error');
        return {
          success: false,
          error: `HTTP ${res.status}: ${errorText}`,
          engineUsed: this.type,
          latencyMs: performance.now() - startTime,
        };
      }

      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();

      // 播放音频
      await this.playAudio(arrayBuffer, options.pauseMs);

      return {
        success: true,
        audioBuffer: arrayBuffer,
        engineUsed: this.type,
        latencyMs: performance.now() - startTime,
      };
    } catch (e: any) {
      if (e.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout',
          engineUsed: this.type,
          latencyMs: performance.now() - startTime,
        };
      }
      return {
        success: false,
        error: e.message ?? 'Unknown error',
        engineUsed: this.type,
        latencyMs: performance.now() - startTime,
      };
    }
  }

  private async playAudio(arrayBuffer: ArrayBuffer, pauseMs?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContext.decodeAudioData(arrayBuffer.slice(0), (buffer) => {
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          source.onended = () => {
            if (pauseMs && pauseMs > 0) {
              setTimeout(resolve, pauseMs);
            } else {
              resolve();
            }
          };
          source.start(0);
        }, reject);
      } catch {
        // 降级到 Audio 元素
        const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          if (pauseMs && pauseMs > 0) {
            setTimeout(resolve, pauseMs);
          } else {
            resolve();
          }
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Audio playback failed'));
        };
        audio.play().catch(reject);
      }
    });
  }

  private toEdgeRate(wsRate: number): string {
    const pct = Math.round((wsRate - 1) * 100);
    return pct === 0 ? '+0%' : `${pct > 0 ? '+' : ''}${pct}%`;
  }

  dispose(): void {
    this.healthCheckCache = null;
    this.prewarmed = false;
  }
}