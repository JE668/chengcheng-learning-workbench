/** TTS 策略接口定义 */

export type TTSLanguage = 'zh' | 'en';
export type TTSEngineType = 'web-speech-strict' | 'web-speech-loose' | 'edge-tts';

export interface TTSOptions {
  /** 语速 (0.1 - 2.0) */
  rate?: number;
  /** 音调 (0.1 - 2.0) */
  pitch?: number;
  /** 语音 */
  voice?: string;
  /** 暂停时间 (ms) */
  pauseMs?: number;
  /** 优先级 */
  priority?: 'normal' | 'high';
  /** 超时时间 (ms) */
  timeout?: number;
}

export interface TTSResult {
  success: boolean;
  audioBuffer?: ArrayBuffer;
  error?: string;
  engineUsed: TTSEngineType;
  latencyMs: number;
}

export interface TTSEngine {
  /** 引擎类型标识 */
  readonly type: TTSEngineType;
  /** 引擎名称 */
  readonly name: string;
  /** 是否可用 */
  isAvailable(lang: TTSLanguage): Promise<boolean>;
  /** 朗读 */
  speak(text: string, lang: TTSLanguage, options: TTSOptions): Promise<TTSResult>;
  /** 预热 */
  warmup?(): Promise<void>;
  /** 清理资源 */
  dispose?(): void;
}

export interface TTSMetrics {
  totalRequests: number;
  successByEngine: Record<TTSEngineType, number>;
  fallbackCount: number;
  avgLatencyByEngine: Record<TTSEngineType, number>;
  lastError?: { engine: TTSEngineType; error: string; timestamp: number };
}