'use client';

import { TTSEngine, TTSEngineType, TTSLanguage, TTSOptions, TTSResult } from './types';

/**
 * Web Speech API - 严格模式
 * 仅使用 zh-CN / en-US 标准嗓音
 */
export class WebSpeechStrictEngine implements TTSEngine {
  readonly type: TTSEngineType = 'web-speech-strict';
  readonly name = 'Web Speech (Strict)';

  private voiceCache: Map<TTSLanguage, SpeechSynthesisVoice | null> = new Map();
  private voicesReady = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initVoices();
    }
  }

  private initVoices(): void {
    if (!window.speechSynthesis) return;

    const loadVoices = () => {
      this.voicesReady = true;
      this.voiceCache.clear();
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      loadVoices();
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true });
    }
  }

  private getVoice(lang: TTSLanguage): SpeechSynthesisVoice | null {
    if (!window.speechSynthesis) return null;

    const cacheKey = lang;
    if (this.voiceCache.has(cacheKey)) {
      return this.voiceCache.get(cacheKey) ?? null;
    }

    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    const targetLang = lang === 'zh' ? 'zh-CN' : 'en-US';
    const voice = voices.find(v => {
      const vLang = (v.lang || '').toLowerCase();
      if (lang === 'zh') {
        return vLang === 'zh-cn' && !vLang.startsWith('zh-hk') && !vLang.startsWith('zh-tw');
      }
      return vLang === 'en-us' && !vLang.startsWith('en-gb');
    }) ?? null;

    this.voiceCache.set(cacheKey, voice);
    return voice;
  }

  async isAvailable(lang: TTSLanguage): Promise<boolean> {
    if (typeof window === 'undefined' || !window.speechSynthesis) return false;
    if (!this.voicesReady && window.speechSynthesis.getVoices().length === 0) return false;
    return this.getVoice(lang) !== null;
  }

  async speak(text: string, lang: TTSLanguage, options: TTSOptions = {}): Promise<TTSResult> {
    const startTime = performance.now();

    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve({ success: false, error: 'SpeechSynthesis not available', engineUsed: this.type, latencyMs: 0 });
        return;
      }

      const voice = this.getVoice(lang);
      if (!voice) {
        resolve({ success: false, error: 'No strict voice available', engineUsed: this.type, latencyMs: performance.now() - startTime });
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
      utterance.rate = this.calibrateRate(options.rate ?? 0.55);
      utterance.pitch = options.pitch ?? 1.05;
      utterance.voice = voice;

      let started = false;
      let resolved = false;

      const finish = (success: boolean, error?: string) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(startTimer);
        clearTimeout(endTimer);
        resolve({
          success,
          error,
          engineUsed: this.type,
          latencyMs: performance.now() - startTime,
        });
      };

      utterance.onstart = () => {
        started = true;
        clearTimeout(startTimer);
      };

      utterance.onend = () => {
        if (options.pauseMs && options.pauseMs > 0) {
          endTimer = setTimeout(() => finish(started), options.pauseMs);
        } else {
          finish(started);
        }
      };

      utterance.onerror = (e) => {
        finish(started, e.error);
      };

      // 等待队列清空
      const waitForQueue = () => {
        if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
          window.speechSynthesis.speak(utterance);
        } else {
          setTimeout(waitForQueue, 10);
        }
      };

      window.speechSynthesis.cancel();
      waitForQueue();

      const startTimer = setTimeout(() => {
        if (!started) finish(false, 'start timeout');
      }, 1500);

      let endTimer: NodeJS.Timeout;
      endTimer = setTimeout(() => finish(started, 'end timeout'), 30000);
    });
  }

  private calibrateRate(rate: number): number {
    if (typeof navigator === 'undefined') return rate;
    const ua = navigator.userAgent;
    const hasChrome = /Chrome/i.test(ua);
    const isGenuineSafari = /Safari/i.test(ua) && !hasChrome;
    if ((hasChrome || /Edg/i.test(ua)) && !isGenuineSafari) {
      return Math.max(0.1, rate * 0.8);
    }
    return rate;
  }

  dispose(): void {
    this.voiceCache.clear();
  }
}