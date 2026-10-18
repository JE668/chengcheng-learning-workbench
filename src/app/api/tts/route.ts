/**
 * ───────────────────────────────────────────────────────────────────────────
 * 服务端中文/英文 TTS —— edge-tts Python 持久化进程
 * ───────────────────────────────────────────────────────────────────────────
 *
 * 技术路线（已验证从 NAS 广东电信住宅 IP 可用）：
 *   Python edge-tts 包持久化进程（stdin/stdout 协议）：
 *     - 进程启动后保持运行，避免每次请求的 Python 启动开销（~200-300ms）
 *     - WebSocket 直连 speech.platform.bing.com（Chromium 143 headers）
 *     - Sec-MS-GEC 令牌通过时间戳 + SHA256 计算，无需 edge.microsoft.com
 *     - stream() 获取 MP3 音频块，base64 输出
 *
 * 延迟：~100-300ms（持久化 Python 进程，无启动开销），内存缓存命中秒回。
 *
 * 降级：edge-tts 失败时，前端 speak.ts 自动降级到 Web Speech。
 *
 * 2026-10-18 B4：进程管理/缓存/合成抽到 ./_lib.ts，与本路由及
 * /api/tts/batch 共享同一个 Python 进程与缓存（单进程串行协议的正确语义）。
 */

import { NextRequest, NextResponse } from 'next/server';
import { safeJson } from '@/lib/safe-json';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import {
  VOICE_EDGE,
  ttsCache,
  TTS_CACHE_MAX,
  ttsCacheKey,
  synthesizeWithEdgeTTS,
} from './_lib';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TTS_LIMIT = { windowSeconds: 60, maxRequests: 30 };

/**
 * 入参上限。
 *
 * `/api/tts` 是**公开无鉴权**端点（middleware 放行 /api/tts 前缀，仅有 IP 限流），
 * 因此必须限制单次请求的规模，否则匿名调用可用超长文本反复撑大缓存与 Python 侧开销。
 * 上学阶段的课文/句子远小于 500 字。
 */
const MAX_TEXT_LENGTH = 500;
/** rate 合法格式：+25% / -25% / +0% （edge-tts prosody 语法） */
const RATE_PATTERN = /^[+-]?\d{1,3}%$/;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit('tts:' + ip, TTS_LIMIT);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `请求太频繁，请 ${limit.retryAfter} 秒后再试` },
      { status: 429 }
    );
  }

  const { text, lang, rate } = await safeJson(req, {});
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: '缺少 text' }, { status: 400 });
  }
  // 公开端点：限制单次合成规模，避免超长文本放大 Python 侧耗时与缓存占用
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: `文本过长（最多 ${MAX_TEXT_LENGTH} 字）` }, { status: 400 });
  }

  const voice = VOICE_EDGE[lang as string] ?? VOICE_EDGE.zh;
  // rate 会原样透传给 Python 的 Communicate(rate=...) 并参与缓存 key，
  // 必须校验格式，否则任意字符串会污染缓存键并可能让上游报错。
  const r = typeof rate === 'string' && RATE_PATTERN.test(rate) ? rate : '+0%';
  const cacheKey = ttsCacheKey(text, voice, r);
  const cached = ttsCache.get(cacheKey);
  if (cached) {
    return new NextResponse(new Uint8Array(cached.data), {
      status: 200,
      headers: {
        'Content-Type': cached.type,
        'Cache-Control': 'public, max-age=86400',
        'X-TTS-Cache': 'HIT',
      },
    });
  }

  try {
    const data = await synthesizeWithEdgeTTS(text, voice, r);
    const type = 'audio/mpeg';
    ttsCache.set(cacheKey, { data, type });
    if (ttsCache.size > TTS_CACHE_MAX) {
      const first = ttsCache.keys().next().value;
      if (first) ttsCache.delete(first);
    }
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=86400',
        'X-TTS-Cache': 'MISS',
      },
    });
  } catch (e) {
    console.error('[TTS] edge-tts failed:', (e as Error).message);
    return NextResponse.json(
      { error: 'TTS 合成失败，前端已自动降级到 Web Speech' },
      { status: 500 }
    );
  }
}
