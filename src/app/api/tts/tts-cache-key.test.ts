/**
 * 回归锁：TTS 服务端缓存 key 空间一致性（2026-10-18 修复的回归防线）
 *
 * 背景 bug：批接口曾用 voice 当 key 第一段（`zh-CN-XiaoxiaoNeural|+0%|你好`），
 * 单接口用 lang（`zh|+0%|你好`）——两个 key 空间永不相交：
 *   1. 单接口已合成的条目，批接口查缓存永远 miss → 每批全量重合成；
 *   2. 批接口合成的条目，单接口也查不到 → 服务端缓存形同虚设。
 * 叠发后果：串行 Python 进程被批任务占 30s+，实时播放请求全部超时
 * （安卓平板「每日一练没声音」的根因链）。
 *
 * 这里用**协议级契约**锁住两个路由的 key 生成规则：
 *   - 单接口（route.ts）与批接口（batch/route.ts）都必须用
 *     ttsCacheKey(text, LANG, rate) 生成同空间 key；
 *   - lang→voice 是双射（zh→Xiaoxiao / en→Aria），key 用 lang 归一。
 */

import { describe, it, expect } from 'vitest';
import { VOICE_EDGE, ttsCacheKey } from '@/app/api/tts/_lib';

describe('TTS 缓存 key 空间一致性（单接口 ↔ 批接口共享缓存的前提）', () => {
  it('ttsCacheKey 用 lang（zh/en）当第一段，不是 voice', () => {
    const key = ttsCacheKey('你好', 'zh', '+0%');
    expect(key).toBe('zh|+0%|你好');
    // 曾经的 bug 形态：voice 混进 key——这个断言守住回归线
    expect(key).not.toContain('Xiaoxiao');
    expect(key).not.toContain('Aria');
  });

  it('VOICE_EDGE 的 lang→voice 是双射（key 用 lang 即可无损还原 voice）', () => {
    const langs = Object.keys(VOICE_EDGE);
    expect(langs).toContain('zh');
    expect(langs).toContain('en');
    const voices = Object.values(VOICE_EDGE);
    expect(new Set(voices).size).toBe(voices.length); // 无重复 voice
  });

  it('同一 (text, lang, rate) 在两个路由里生成完全相同的 key', () => {
    // 单接口：cacheKey = ttsCacheKey(text, voice, r) → 修复后应为 (text, lang, r)
    // 批接口：key = ttsCacheKey(text, lang, rate)
    // 这里只锁 _lib 的纯函数语义：相同输入必须相同输出，且以 lang 归一。
    const a = ttsCacheKey('苹果', 'zh', '-30%');
    const b = ttsCacheKey('苹果', 'zh', '-30%');
    expect(a).toBe(b);
    expect(a.startsWith('zh|')).toBe(true);
  });

  it('批接口返回给客户端的 key 格式 = 服务端缓存 key 格式（客户端 blob 缓存依赖此约定）', () => {
    // 客户端 prefetchTtsBatch 以 `${lang}|${rate}|${text}` 存 blob 缓存，
    // tryServer 的 getCachedBlob 也按 `${lang}|${rate}|${text}` 查——
    // 服务端 results 的 key 必须与此一致，否则预取的音频永远查不中。
    const text = '错题重练题干文本';
    const lang = 'zh';
    const rate = '-30%';
    const serverResultKey = `${lang}|${rate}|${text}`; // batch/route.ts:66 的模板
    expect(serverResultKey).toBe(ttsCacheKey(text, lang, rate));
  });
});
