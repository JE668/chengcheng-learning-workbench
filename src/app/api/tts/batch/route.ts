import { NextRequest, NextResponse } from 'next/server';
import { safeJson } from '@/lib/safe-json';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { synthesizeForBatch, VOICE_EDGE, ttsCacheKey, ttsCache, TTS_CACHE_MAX } from '../_lib';

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
// 单批文本总量上限（2026-11-10 第三轮审查）：10 条 × 500 字 = 单请求 5000 字合成，
// 10 批/分 → 单 IP 每分钟可打 5 万字进**单实例串行**的 Python 合成队列，
// 匿名刷可让全站实时 TTS 排队超时（历史「安卓无声」故障形态）。
// 正常批量预取一轮练习的动态文本远达不到 800 字（约 8-10 道题的题干+选项）。
const MAX_BATCH_TOTAL_CHARS = 800;

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

  // 总量闸（2026-11-10 第三轮审查）：单批全部 text 的合计字符数。
  const totalChars = items.reduce(
    (sum, it) => sum + (typeof it?.text === 'string' ? it.text.length : 0),
    0
  );
  if (totalChars > MAX_BATCH_TOTAL_CHARS) {
    return NextResponse.json(
      { error: `单批文本总量超限（${totalChars} > ${MAX_BATCH_TOTAL_CHARS} 字符）` },
      { status: 413 }
    );
  }

  const results: Record<string, string> = {};
  const errors: string[] = [];
  // 顺序合成（复用单接口的 Python 进程协议，天然串行安全）。
  // ⚠️ 缓存 key 必须与单接口一致（lang|rate|text）：批接口此前误用
  // voice 当第一段，导致单接口已合成的条目批查询永远 miss——每批
  // 全量重合成 10 条，串行 Python 进程被占 30s+，实时播放的 L3 请求
  // 全部排队超时（安卓平板「点了没声音」的服务端根因）。
  for (const it of items) {
    const text = typeof it?.text === 'string' ? it.text : '';
    const lang = it?.lang === 'en' ? 'en' : 'zh';
    if (!text || text.length > MAX_TEXT_LENGTH) {
      errors.push(`invalid: ${text.slice(0, 20)}`);
      continue;
    }
    const rate = typeof it.rate === 'string' && /^[+-]?\d{1,3}%$/.test(it.rate) ? it.rate : '+0%';
    const voice = VOICE_EDGE[lang] ?? VOICE_EDGE.zh;
    // lang→voice 是双射（zh→Xiaoxiao / en→Aria），key 用 lang 即可
    // 与单接口的 `${lang}|${rate}|${text}` 完全同空间
    const key = ttsCacheKey(text, lang, rate);
    try {
      let data = ttsCache.get(key)?.data;
      if (!data) {
        // 批量预取走「排队让路」入口：实时播放（单接口）在队头优先，
        // 预取永远排在任何等待发声的孩子之后。
        data = await synthesizeForBatch(text, voice, rate);
        // kokoro 备胎输出 WAV：按 RIFF 头嗅探（与单接口同规则）
        const type =
          data.length > 4 && data[0] === 0x52 && data[1] === 0x49 ? 'audio/wav' : 'audio/mpeg';
        ttsCache.set(key, { data, type });
        if (ttsCache.size > TTS_CACHE_MAX) {
          const first = ttsCache.keys().next().value;
          if (first) ttsCache.delete(first);
        }
      }
      results[`${lang}|${rate}|${text}`] = data.toString('base64');
    } catch (e) {
      errors.push(
        `${text.slice(0, 20)}: ${(e instanceof Error ? e.message : 'failed').slice(0, 60)}`
      );
    }
  }

  return NextResponse.json({ audio: results, errors });
}
