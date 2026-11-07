/** HTMLAudio 播放器：本地静态音频优先，服务端 edge-tts 最后兜底。 */

import { toEdgeRate, type SpeechLanguage } from './browser-platform';
import { discardCachedBlob, getCachedBlob, persistTtsBlob } from './audio-cache';

export function localAudioUrl(text: string, lang: SpeechLanguage): string {
  // 英语统一小写：清单把 'Apple' 与 'apple' 合并成一个小写文件；
  // 播放层必须同规则，否则 Linux 上会命中不到文件。
  const source = lang === 'en' ? text.toLowerCase() : text;
  // 磁盘存明文文件名，URL 按浏览器语义 percent-encode；服务器解码后再查文件。
  const encoded = encodeURIComponent(source).replace(/[()*!']/g, (char) => {
    return (
      {
        '(': '%28',
        ')': '%29',
        '*': '%2A',
        '!': '%21',
        "'": '%27',
      }[char] || char
    );
  });
  return `/audio/${lang}/${encoded}.mp3`;
}

const staticPreloaded = new Set<string>();

/**
 * 静态 MP3 预取（弱网加固 · 故事页专用）：
 * 用 <link rel="preload" as="audio"> 让浏览器和 Service Worker 提前缓存。
 * 与 prefetchTts 的服务端合成路线互不干扰。
 */
export function prefetchStaticAudio(text: string, lang: SpeechLanguage): void {
  if (typeof document === 'undefined') return;
  const url = localAudioUrl(text, lang);
  if (staticPreloaded.has(url)) return;
  staticPreloaded.add(url);
  try {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'audio';
    link.href = url;
    document.head.appendChild(link);
    // 不自动移除：弱网下移除 <link> 可能取消仍在进行的下载。
  } catch {
    /* 预取是纯优化，任何失败静默 */
  }
}

/**
 * 第 0 层播放器：命中返回 true；404/解码失败返回 false（降级信号）。
 */
export function playLocalAudio(
  text: string,
  lang: SpeechLanguage,
  wsRate: number,
  pauseMs: number,
  /** true = 跳过 20 字门（调用方确知文本在预生成清单里，如故事段落）。 */
  skipLengthGate = false
): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('Audio' in window)) {
      resolve(false);
      return;
    }
    // 动态文本几乎必然未命中——长度门限避免先等 404 再降级的额外延迟。
    if (!skipLengthGate) {
      const plain = text.replace(/[，。！？、：；,.!?\s]/g, '');
      if (plain.length === 0 || plain.length > 20) {
        resolve(false);
        return;
      }
    }

    try {
      const audio = new Audio(localAudioUrl(text, lang));
      if (wsRate && wsRate > 0 && wsRate !== 1) audio.playbackRate = wsRate;
      let settled = false;
      let failTimer: ReturnType<typeof setTimeout> | null = null;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        if (failTimer) clearTimeout(failTimer);
        // 失败时释放 src；成功时保留给 Service Worker/HTTP 缓存。
        if (!ok) audio.removeAttribute('src');
        if (ok && pauseMs > 0) setTimeout(() => resolve(true), pauseMs);
        else resolve(ok);
      };
      // 部分安卓 WebView 解码异常时不触发 onerror，只能用时长兜底。
      failTimer = setTimeout(() => done(false), 15000);
      audio.onended = () => done(true);
      audio.onerror = () => done(false);
      audio.play().catch(() => done(false));
    } catch {
      resolve(false);
    }
  });
}

let audioUnlocked = false;

export function unlockAudioOnce() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  try {
    const silent = new Audio(
      'data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA'
    );
    silent.volume = 0;
    const playback = silent.play();
    if (playback && typeof (playback as { catch?: () => void }).catch === 'function') {
      playback.catch(() => {});
    }
  } catch {
    /* 解锁失败不影响后续逻辑 */
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const events = ['pointerdown', 'touchstart', 'click', 'keydown'];
  const onFirstInteraction = () => {
    unlockAudioOnce();
    events.forEach((event) => document.removeEventListener(event, onFirstInteraction));
  };
  events.forEach((event) =>
    document.addEventListener(event, onFirstInteraction, { passive: true })
  );
}

/**
 * 第 3 层：走服务端 /api/tts 播放。
 * 缓存命中时直接播放；播放失败会丢弃坏缓存并返回 false。
 */
export function playServerAudio(
  text: string,
  lang: SpeechLanguage,
  opts: {
    wsRate?: number;
    pitch?: number;
    pauseMs?: number;
  }
): Promise<boolean> {
  const wsRate = opts.wsRate ?? 0.8;
  const pauseMs = opts.pauseMs ?? 0;

  return new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined' || !('fetch' in window)) {
      resolve(false);
      return;
    }

    let settled = false;
    let abortTimer: ReturnType<typeof setTimeout> | null = null;
    let objectUrl: string | null = null;
    const settle = (ok: boolean, ms = 0) => {
      if (settled) return;
      settled = true;
      if (abortTimer) {
        clearTimeout(abortTimer);
        abortTimer = null;
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
      if (ms > 0) setTimeout(() => resolve(ok), ms);
      else resolve(ok);
    };

    const edgeRate = toEdgeRate(wsRate);
    const cached = getCachedBlob(text, lang, edgeRate);
    if (cached) {
      objectUrl = URL.createObjectURL(cached);
      const audio = new Audio(objectUrl);
      audio.preload = 'auto';
      audio.onended = () => settle(true, pauseMs);
      audio.onerror = () => {
        discardCachedBlob(text, lang, edgeRate);
        settle(false);
      };
      audio.play().catch(() => settle(false));
      return;
    }

    const controller = new AbortController();
    // 长文合成需要更久；播放本身不计入超时。
    const timeoutMs = Math.min(20000, Math.max(6000, text.length * 120));
    abortTimer = setTimeout(() => controller.abort(), timeoutMs);
    fetch('/api/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, lang, rate: toEdgeRate(wsRate) }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.blob();
      })
      .then((blob) => {
        persistTtsBlob(text, lang, toEdgeRate(wsRate), blob);
        objectUrl = URL.createObjectURL(blob);
        const audio = new Audio(objectUrl);
        audio.preload = 'auto';
        audio.onended = () => settle(true, pauseMs);
        audio.onerror = () => settle(false);
        audio.play().catch(() => settle(false));
      })
      .catch(() => settle(false));
  });
}
