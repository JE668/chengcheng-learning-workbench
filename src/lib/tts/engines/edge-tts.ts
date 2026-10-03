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
    // 先试 Web Audio，失败（解码错误或同步异常）再降级到 <audio> 元素。
    // ⚠️ 原实现把 decodeAudioData 的失败回调直接接到 reject —— 那样解码失败时
    // **不会走降级分支**（catch 只兜同步异常），有声音的场景会静默播不出来。
    try {
      await this.playWithWebAudio(arrayBuffer, pauseMs);
      return;
    } catch {
      /* 落到下面的 <audio> 降级 */
    }
    await this.playWithAudioElement(arrayBuffer, pauseMs);
  }

  /**
   * 用 Web Audio 播放。
   * ⚠️ AudioContext 必须用 close() 释放：浏览器对同时存在的 AudioContext 数量有上限
   * （约 6 个），而这里每次朗读都会新建一个 —— 不关闭的话，连续朗读几次之后就再也播不出声。
   */
  private async playWithWebAudio(arrayBuffer: ArrayBuffer, pauseMs?: number): Promise<void> {
    const Ctor =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) throw new Error('Web Audio 不可用');

    const audioContext: AudioContext = new Ctor();
    try {
      // 传副本：decodeAudioData 可能「拿走」传入的 buffer，而调用方后面还要用它做降级
      const buffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      await new Promise<void>((resolve, reject) => {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.onended = () => resolve();
        try {
          source.start(0);
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });
      if (pauseMs && pauseMs > 0) await new Promise((r) => setTimeout(r, pauseMs));
    } finally {
      // 无论成功失败都关闭，避免耗尽 AudioContext 配额
      await audioContext.close().catch(() => {});
    }
  }

  /** 降级路径：用 <audio> 元素播放，并确保 objectURL 一定被回收。 */
  private playWithAudioElement(arrayBuffer: ArrayBuffer, pauseMs?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      const revoke = () => URL.revokeObjectURL(url);

      audio.onended = () => {
        revoke();
        if (pauseMs && pauseMs > 0) setTimeout(resolve, pauseMs);
        else resolve();
      };
      audio.onerror = () => {
        revoke();
        reject(new Error('Audio playback failed'));
      };
      audio.play().catch((err) => {
        revoke();
        reject(err instanceof Error ? err : new Error(String(err)));
      });
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