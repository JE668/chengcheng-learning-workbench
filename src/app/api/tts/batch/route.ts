import { NextRequest, NextResponse } from 'next/server';
import { safeJson } from '@/lib/safe-json';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { synthesizeWithEdgeTTS, VOICE_EDGE, ttsCacheKey, ttsCache, TTS_CACHE_MAX } from '../_lib';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 🚀 B4 批量 TTS 预取（2026-10-18）：
 * 客户端进入练习页时把整轮动态文本一次打包请求（省 N 次 HTTP 往返 + N 次
 * 单接口排队），服务端循环走既有合成/缓存路径，返回 { text, lang, rate } →
 * base64 mp3 的映射。静态内容已被第 0 层本地文件接管，批量接口只服务动态文本
 *（错题题干/台词）——单批 ≤10 条防滥用。
 *
 * 与 /api/tts 同为公开无鉴权端点（middleware 放行 /api/tts 前缀），
 * IP 限流 + 条数上限双闸。
 */
const BATCH_LIMIT = { windowSeconds: 60, maxRequests: 10 };
const MAX_ITEMS = 10;
const MAX_TEXT_LENGTH = 500;

interface BatchItem {
  text: string;
  lang: string;
  rate?: string;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit(`tts-batch:${ip}`, BATCH_LIMIT);
  if (!limit.ok) {
    return NextResponse.json({ error: '请求太频繁' }, { status: 429 });
  }

  const body = await safeJson(req, {});
  const items: BatchItem[] = Array.isArray(body?.items) ? body.items.slice(0, MAX_ITEMS) : [];
  if (items.length === 0) {
    return NextResponse.json({ error: '缺少 items' }, { status: 400 });
  }

  const results: Record<string, string> = {};
  const errors: string[] = [];
  // 顺序合成（复用单接口的 Python 进程协议，天然串行安全）
  for (const it of items) {
    const text = typeof it?.text === 'string' ? it.text : '';
    const lang = it?.lang === 'en' ? 'en' : 'zh';
    if (!text || text.length > MAX_TEXT_LENGTH) {
      errors.push(`invalid: ${text.slice(0, 20)}`);
      continue;
    }
    const rate =
      typeof it.rate === 'string' && /^[+-]?\d{1,3}%$/.test(it.rate) ? it.rate : '+0%';
    const voice = VOICE_EDGE[lang] ?? VOICE_EDGE.zh;
    const key = ttsCacheKey(text, voice, rate);
    try {
      let data = ttsCache.get(key)?.data;
      if (!data) {
        data = await synthesizeWithEdgeTTS(text, voice, rate);
        ttsCache.set(key, { data, type: 'audio/mpeg' });
        if (ttsCache.size > TTS_CACHE_MAX) {
          const first = ttsCache.keys().next().value;
          if (first) ttsCache.delete(first);
        }
      }
      results[`${lang}|${rate}|${text}`] = data.toString('base64');
    } catch (e) {
      errors.push(`${text.slice(0, 20)}: ${(e instanceof Error ? e.message : 'failed').slice(0, 60)}`);
    }
  }

  return NextResponse.json({ audio: results, errors });
}
