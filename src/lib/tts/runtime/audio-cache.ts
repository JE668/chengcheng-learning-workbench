/** 服务端 TTS 音频缓存：内存 LRU + localStorage 持久化。 */

import type { SpeechLanguage } from './browser-platform';

const ttsBlobCache = new Map<string, Blob>();
const TTS_CACHE_MAX = 80;
const TTS_LS_PREFIX = 'tts-audio:';
const TTS_LS_MAX = 60;
const TTS_LS_MAX_ITEM_BYTES = 60 * 1024;

let lsRestored = false;

function cacheKey(text: string, lang: SpeechLanguage, edgeRate: string): string {
  return `${lang}|${edgeRate}|${text}`;
}

/** 启动回填：把 localStorage 的持久音频还原进内存缓存（一次，惰性）。 */
function restoreFromLocalStorage() {
  if (lsRestored || typeof window === 'undefined') return;
  lsRestored = true;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const storageKey = window.localStorage.key(i);
      if (!storageKey || !storageKey.startsWith(TTS_LS_PREFIX)) continue;
      const key = storageKey.slice(TTS_LS_PREFIX.length);
      if (ttsBlobCache.has(key)) continue;
      const base64 = window.localStorage.getItem(storageKey);
      if (!base64) continue;
      try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
        ttsBlobCache.set(key, new Blob([bytes], { type: 'audio/mpeg' }));
      } catch {
        // 坏条目直接清掉
        try {
          window.localStorage.removeItem(storageKey);
        } catch {}
      }
    }
  } catch {
    /* localStorage 不可用（隐私模式等）——只用内存缓存 */
  }
}

/** 持久化一条（条数超限时淘汰最旧；写失败静默）。 */
function persistToLocalStorage(key: string, blob: Blob) {
  if (typeof window === 'undefined') return;
  try {
    if (blob.size > TTS_LS_MAX_ITEM_BYTES) return;
    const mine: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const storageKey = window.localStorage.key(i);
      if (storageKey && storageKey.startsWith(TTS_LS_PREFIX)) mine.push(storageKey);
    }
    while (mine.length >= TTS_LS_MAX) {
      mine.sort();
      const victim = mine.shift();
      if (victim) window.localStorage.removeItem(victim);
    }
    blob
      .arrayBuffer()
      .then((buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        // 分块 btoa（大字符串会栈溢出）
        const CHUNK = 8192;
        for (let i = 0; i < bytes.length; i += CHUNK) {
          binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
        }
        window.localStorage.setItem(TTS_LS_PREFIX + key, btoa(binary));
      })
      .catch(() => {});
  } catch {
    /* 配额满等——静默，内存缓存仍然有效 */
  }
}

function storeBlob(key: string, blob: Blob) {
  if (ttsBlobCache.has(key)) return;
  ttsBlobCache.set(key, blob);
  persistToLocalStorage(key, blob);
  if (ttsBlobCache.size > TTS_CACHE_MAX) {
    const first = ttsBlobCache.keys().next().value;
    if (first) ttsBlobCache.delete(first);
  }
}

/** 播放层拿到新音频后写入同一套内存/持久缓存。 */
export function persistTtsBlob(
  text: string,
  lang: SpeechLanguage,
  edgeRate: string,
  blob: Blob
): void {
  storeBlob(cacheKey(text, lang, edgeRate), blob);
}

export function getCachedBlob(
  text: string,
  lang: SpeechLanguage,
  edgeRate: string
): Blob | undefined {
  return ttsBlobCache.get(cacheKey(text, lang, edgeRate));
}

export function discardCachedBlob(text: string, lang: SpeechLanguage, edgeRate: string) {
  const key = cacheKey(text, lang, edgeRate);
  ttsBlobCache.delete(key);
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(TTS_LS_PREFIX + key);
  } catch {
    /* localStorage 不可用时只清内存缓存 */
  }
}

function base64ToBlob(base64: string): Blob | null {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: 'audio/mpeg' });
  } catch {
    return null;
  }
}

export function prefetchTts(text: string, lang: SpeechLanguage, rate = '+0%'): void {
  if (typeof window === 'undefined' || !('fetch' in window)) return;
  restoreFromLocalStorage();
  const key = cacheKey(text, lang, rate);
  if (ttsBlobCache.has(key)) return;
  fetch('/api/tts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, lang, rate }),
  })
    .then((res) => (res.ok ? res.blob() : null))
    .then((blob) => {
      if (!blob) return;
      storeBlob(key, blob);
    })
    .catch(() => {});
}

export function prefetchTtsBatch(
  items: Array<{ text: string; lang: SpeechLanguage; rate?: string }>
): void {
  if (typeof window === 'undefined' || !('fetch' in window)) return;
  restoreFromLocalStorage();

  const seen = new Set<string>();
  const todo: Array<{ text: string; lang: SpeechLanguage; rate: string }> = [];
  for (const item of items) {
    if (!item || !item.text) continue;
    // 静态短文本（≤20 字，可命中第 0 层本地 MP3）不进批量接口：
    // 串行合成会占住服务端，实时播放请求可能在 6s 后排队超时。
    const plain = item.text.replace(/[，。！？、：；,.!?\s]/g, '');
    if (plain.length > 0 && plain.length <= 20) continue;
    const rate = item.rate ?? '+0%';
    const key = cacheKey(item.text, item.lang, rate);
    if (ttsBlobCache.has(key) || seen.has(key)) continue;
    seen.add(key);
    todo.push({ text: item.text, lang: item.lang, rate });
    if (todo.length >= 10) break;
  }

  if (todo.length < 2) return;
  fetch('/api/tts/batch', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items: todo }),
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((json: { audio?: Record<string, string> } | null) => {
      if (!json?.audio) return;
      for (const [key, base64] of Object.entries(json.audio)) {
        if (ttsBlobCache.has(key)) continue;
        const blob = base64ToBlob(base64);
        if (!blob) continue;
        storeBlob(key, blob);
      }
    })
    .catch(() => {});
}
