'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useTTSStore } from '@/lib/stores';
import { getTTSOrchestrator, TTSOrchestrator } from '@/lib/tts/orchestrator';
import { TTSLanguage, TTSOptions } from '@/lib/tts/types';

/** TTS Hook 选项 */
export interface UseTTSOptions {
  /** 默认语言 */
  defaultLang?: TTSLanguage;
  /** 默认选项 */
  defaultOptions?: TTSOptions;
  /** 是否自动预热 */
  autoWarmup?: boolean;
}

/** TTS Hook 返回值 */
export interface UseTTSReturn {
  /** 朗读文本 */
  speak: (text: string, lang?: TTSLanguage, options?: TTSOptions) => Promise<boolean>;
  /** 中文朗读快捷方式 */
  speakZh: (text: string, options?: TTSOptions) => Promise<boolean>;
  /** 英文朗读快捷方式 */
  speakEn: (text: string, options?: TTSOptions) => Promise<boolean>;
  /** 拼音朗读 */
  speakPinyin: (syllable: string, han?: string) => Promise<boolean>;
  /** 表扬语音 */
  praise: (rate?: number) => Promise<boolean>;
  /** 停止当前播放 */
  stop: () => void;
  /** 清空队列 */
  clear: () => void;
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 当前队列长度 */
  queueLength: number;
  /** 获取指标 */
  getMetrics: () => ReturnType<TTSOrchestrator['getMetrics']>;
}

/** 默认表扬语 */
const PRAISES = [
  '你真棒！',
  '太厉害啦！',
  '答对啦，了不起！',
  '程程好聪明！',
  '哇，全对！',
  '萌可给你点赞！',
  '继续加油，你最棒！',
];

/**
 * TTS React Hook
 * 集成 Zustand Store + 编排器，提供完整的语音播放能力
 */
export function useTTS(options: UseTTSOptions = {}): UseTTSReturn {
  const {
    defaultLang = 'zh',
    defaultOptions = {},
    autoWarmup = true,
  } = options;

  const {
    enqueue,
    dequeue,
    setPlaying,
    clear: clearQueue,
    interrupt,
    queue,
    isPlaying,
  } = useTTSStore();

  const orchestratorRef = useRef<TTSOrchestrator | null>(null);
  const processingRef = useRef(false);

  // 初始化编排器
  useEffect(() => {
    orchestratorRef.current = getTTSOrchestrator();
    if (autoWarmup) {
      orchestratorRef.current.warmup().catch(console.warn);
    }
    return () => {
      // 不要在这里 dispose，因为是单例
    };
  }, [autoWarmup]);

  // 处理队列
  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    const orchestrator = orchestratorRef.current;
    if (!orchestrator) return;

    const item = dequeue();
    if (!item) {
      setPlaying(false, null);
      return;
    }

    processingRef.current = true;
    setPlaying(true, item);

    try {
      const result = await orchestrator.speak(item.text, item.lang, item.opts);
      item.resolve(result.success);
    } catch (e) {
      console.error('[TTS] Queue processing error:', e);
      item.resolve(false);
    } finally {
      processingRef.current = false;
      setPlaying(false, null);
      // 处理下一个
      if (queue.length > 0) {
        setTimeout(processQueue, 0);
      }
    }
  }, [dequeue, setPlaying, queue.length]);

  // 队列变化时处理
  useEffect(() => {
    if (queue.length > 0 && !isPlaying) {
      processQueue();
    }
  }, [queue.length, isPlaying, processQueue]);

  /** 核心朗读函数 */
  const speak = useCallback(async (
    text: string,
    lang: TTSLanguage = defaultLang,
    options: TTSOptions = {}
  ): Promise<boolean> => {
    if (!text.trim()) return true;

    const orchestrator = orchestratorRef.current;
    if (!orchestrator) return false;

    // 高优先级直接插队
    const priority = options.priority ?? 'normal';
    const mergedOptions = { ...defaultOptions, ...options };

    if (priority === 'high') {
      // 直接播放，不入队
      setPlaying(true, { id: 'immediate', text, lang, opts: mergedOptions, resolve: () => {} } as any);
      try {
        const result = await orchestrator.speak(text, lang, mergedOptions);
        setPlaying(false, null);
        return result.success;
      } catch (e) {
        console.error('[TTS] Immediate speak error:', e);
        setPlaying(false, null);
        return false;
      }
    }

    // 正常入队
    return new Promise((resolve) => {
      enqueue({
        text,
        lang,
        opts: mergedOptions,
        resolve,
      });
    });
  }, [defaultLang, defaultOptions, enqueue, setPlaying]);

  /** 中文朗读 */
  const speakZh = useCallback(async (text: string, options?: TTSOptions) => {
    return speak(text, 'zh', { rate: 0.55, pitch: 1.1, ...options });
  }, [speak]);

  /** 英文朗读 */
  const speakEn = useCallback(async (text: string, options?: TTSOptions) => {
    return speak(text, 'en', { rate: 0.55, pitch: 1.05, ...options });
  }, [speak]);

  /** 拼音朗读 - 使用同音汉字 */
  const speakPinyin = useCallback(async (syllable: string, han?: string) => {
    const text = han && /[\u4e00-\u9fff]/.test(han) ? han : syllable;
    return speak(text, 'zh', { rate: 0.45, pitch: 1.15, pauseMs: 700 });
  }, [speak]);

  /** 表扬语音 */
  const praise = useCallback(async (rate = 0.7) => {
    const text = PRAISES[Math.floor(Math.random() * PRAISES.length)];
    return speak(text, 'zh', { rate });
  }, [speak]);

  /** 停止当前播放 */
  const stop = useCallback(() => {
    interrupt();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [interrupt]);

  /** 清空队列 */
  const clear = useCallback(() => {
    clearQueue();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [clearQueue]);

  /** 获取指标 */
  const getMetrics = useCallback(() => {
    return orchestratorRef.current?.getMetrics() ?? {
      totalRequests: 0,
      successByEngine: { 'web-speech-strict': 0, 'web-speech-loose': 0, 'edge-tts': 0 },
      fallbackCount: 0,
      avgLatencyByEngine: { 'web-speech-strict': 0, 'web-speech-loose': 0, 'edge-tts': 0 },
    };
  }, []);

  return {
    speak,
    speakZh,
    speakEn,
    speakPinyin,
    praise,
    stop,
    clear,
    isPlaying,
    queueLength: queue.length,
    getMetrics,
  };
}

/** 简化版 Hook - 仅暴露核心功能 */
export function useSimpleTTS() {
  const { speak, speakZh, speakEn, stop } = useTTS();
  return { speak, speakZh, speakEn, stop };
}