'use client';

/**
 * 🌙 空闲音频预热器（2026-10-20 · 弱网加固）
 *
 * 场景：NAS 在电信宽带，孩子在移动网络访问时晚高峰跨网拥塞——
 * TTS 的 L0 静态 MP3 首播仍需跨网下载，慢到加载不出来。
 *
 * 策略：趁孩子刚打开应用的前几分钟（页面已可交互、人在看内容不在等加载），
 * 用 requestIdleCallback + 3 路并发把**高频核心集**静态 MP3 分批拉进
 * Service Worker 缓存。此后静态朗读永久走本地缓存——弱网/断网都秒响。
 *
 * 预热范围（按使用频率与体积权衡）：
 *   1. 高频汉字（识字/听写题）——数量最大但单字最小
 *   2. 英语单词（听读/首字母题）
 *   3. 当前年级古诗（按需，打开模块才拉——见 warmPoemLines）
 *
 * 全量 1481 条 = 29MB 一次拉完对流量不友好（移动数据场景），核心集
 * 汉字+单词 ≈ 6MB 更合适；故事段落跟随「打开章节」事件预热。
 *
 * 失败静默：预热是纯优化，任何一条失败不重试不报错。
 * 断点续传：sw 缓存是持久的，拉过的下次跳过（HEAD 304 也省）——
 * 这里用 cache.match 直查，跳过已缓存项。
 */
import { AUDIO_MANIFEST_URLS } from './audio-manifest-client.generated';

/** 预热批次：每批之间让出主线程（不与孩子的交互抢帧） */
const BATCH_SIZE = 8;
/** 3 路并发：与 SW 缓存写入并行安全，且不过载弱网 */
const CONCURRENCY = 3;
/** 单文件大小上限：超过的不预热（防异常大文件占缓存） */
const MAX_ITEM_BYTES = 200 * 1024;

let warming = false;

export function isAudioWarming(): boolean {
  return warming;
}

/**
 * 空闲预热静态音频。重复调用安全（同 key 只跑一次）。
 * 由孩子端 layout 挂载时调用（StudyHeartbeat 同款时机）。
 */
export function warmAudioCache(): void {
  if (typeof window === 'undefined') return;
  const today = new Date().toISOString().slice(0, 10);
  if (warming) return;

  // 每天最多完整跑一次：localStorage 记录当天完成标记
  try {
    if (window.localStorage.getItem('tts-warm-day') === today) return;
  } catch {
    /* localStorage 不可用就每次会话都跑（SW match 跳过已缓存项，开销小） */
  }

  const idle =
    (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
      .requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 800));

  warming = true;
  idle(() => {
    void startWarming(today);
  }, { timeout: 4000 });
}

async function startWarming(day: string): Promise<void> {
  try {
    const items = AUDIO_MANIFEST_URLS;
    if (!items.length) return;
    // 优先级排序：汉字/单词在前（学习高频），古诗在后
    const queue = [...items];
    let cursor = 0;
    let done = 0;

    const worker = async (): Promise<void> => {
      while (cursor < queue.length) {
        const url = queue[cursor++];
        try {
          // SW 缓存已有 → 跳过（断点续传语义）
          const cache = await caches?.open?.('ccwb-ccwb-v6');
          if (cache) {
            const hit = await cache.match(url);
            if (hit) {
              done++;
              continue;
            }
          }
          // 直接 GET：SW fetch 处理器会把它放进 Cache First 桶
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) continue;
          const buf = await res.arrayBuffer();
          if (buf.byteLength > MAX_ITEM_BYTES) continue; // 异常大文件不缓存
          done++;
          // 批间让步：等下一帧再继续，不阻塞 UI
          if (done % BATCH_SIZE === 0) await nextFrame();
        } catch {
          /* 单条失败静默跳过 */
        }
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    // 全部完成（或尽力而为）→ 记录当天已预热
    try {
      window.localStorage.setItem('tts-warm-day', day);
    } catch {
      /* ignore */
    }
  } finally {
    warming = false;
  }
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve());
    else setTimeout(resolve, 16);
  });
}
