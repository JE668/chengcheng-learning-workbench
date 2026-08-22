/**
 * ───────────────────────────────────────────────────────────────────────────
 * 服务端中文/英文 TTS —— Edge 在线神经语音客户端
 * ───────────────────────────────────────────────────────────────────────────
 *
 * 合成链路（按优先级）：
 *   1) Edge TTS 直连（首选）—— NAS 在住宅网络上，speech.platform.bing.com 可直连。
 *      使用 TrustedClientToken 认证（无需 Sec-MS-GEC 令牌），
 *      WebSocket 协议与 edge-tts@1.0.1 npm 包完全一致。
 *   2) Vercel Edge 代理（可选）—— 若 NAS 无法直连（如部分公司网络），
 *      设 VERCEL_EDGE_TTS_URL 指向已部署的 /api/tts-edge Vercel 路由。
 *   3) 浏览器 Web Speech（前端自动降级）—— 全部服务端路径失败时触发。
 *
 * 延迟：直连 ~200-500ms（短文本）。音质：Edge TTS 神经嗓音（晓晓/Aria）。
 * ───────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import { safeJson } from '@/lib/safe-json';
import WebSocket from 'ws';
import { randomUUID } from 'node:crypto';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VOICE_EDGE: Record<string, string> = {
  zh: 'zh-CN-XiaoxiaoNeural',
  en: 'en-US-AriaNeural',
};

const TRUSTED_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';

const VERCEL_EDGE_TTS_URL = process.env.VERCEL_EDGE_TTS_URL;

const TTS_LIMIT = { windowSeconds: 60, maxRequests: 30 };

const ttsCache = new Map<string, { data: Buffer; type: string }>();
const TTS_CACHE_MAX = 500;

function ttsCacheKey(text: string, lang: string, rate: string, pause: number): string {
  return `${lang}|${rate}|${pause}|${text}`;
}

/**
 * 直连 speech.platform.bing.com 合成音频（首选）。
 * 仅使用 TrustedClientToken，无需 Sec-MS-GEC 令牌。
 * 住宅 IP 不受限，数据中心 IP（如 Vercel）可能被拒。
 */
async function synthesizeDirect(text: string, voice: string, rate: string): Promise<Buffer> {
  const connId = randomUUID().replaceAll('-', '');
  const wsUrl =
    `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1` +
    `?TrustedClientToken=${TRUSTED_TOKEN}` +
    `&ConnectionId=${connId}`;

  const audioData: Buffer[] = [];

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl, {
      host: 'speech.platform.bing.com',
      origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.66 Safari/537.36 Edg/103.0.1264.44',
      },
      timeout: 8000,
    });

    let sent = false;
    let done = false;

    const sendSsml = () => {
      if (sent) return;
      sent = true;

      const speechConfig = JSON.stringify({
        context: {
          synthesis: {
            audio: {
              metadataoptions: { sentenceBoundaryEnabled: false, wordBoundaryEnabled: false },
              outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
            },
          },
        },
      });
      ws.send(
        `X-Timestamp:${Date()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${speechConfig}`,
      );

      ws.send(
        `X-RequestId:${randomUUID().replaceAll('-', '')}\r\nContent-Type:application/ssml+xml\r\n` +
        `X-Timestamp:${Date()}Z\r\nPath:ssml\r\n\r\n` +
        `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
        `<voice name='${voice}'><prosody pitch='+0Hz' rate='${rate}' volume='+0%'>${text}</prosody></voice></speak>`,
      );
    };

    ws.on('open', () => sendSsml());

    ws.on('message', (raw, isBinary) => {
      if (isBinary) {
        const buf = Buffer.from(raw as Buffer);
        const sep = 'Path:audio\r\n';
        const i = buf.indexOf(sep);
        if (i >= 0) audioData.push(buf.subarray(i + sep.length));
      } else {
        const s = raw.toString('utf8');
        if (s.includes('turn.end')) {
          done = true;
          ws.close();
        }
      }
    });

    ws.on('close', () => {
      if (audioData.length > 0) resolve(Buffer.concat(audioData));
      else reject(new Error('no audio data received'));
    });

    ws.on('error', (e) => {
      if (!done) reject(e);
    });

    setTimeout(() => {
      if (!done) { ws.close(); reject(new Error('tts timeout 8s')); }
    }, 8000);
  });
}

/**
 * 通过 Vercel Edge 路由代理（备选）。
 * Vercel 服务器在美国 iad1 节点，可绕过大区网络限制。
 * 注：当前 Vercel 数据中⼼ IP 被 Microsoft 封禁，此路径可能不可用。
 */
async function synthesizeWithVercel(text: string, lang: 'zh' | 'en', rate: string, pause: number): Promise<{ data: Buffer; type: string }> {
  if (!VERCEL_EDGE_TTS_URL) throw new Error('VERCEL_EDGE_TTS_URL not set');

  const rateMatch = /([+-]?\d+(?:\.\d+)?)\s*%/.exec(rate);
  const pct = rateMatch ? parseFloat(rateMatch[1]) : 0;
  const speed = 1 + pct / 100;

  const resp = await fetch(VERCEL_EDGE_TTS_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, lang, rate: Math.max(0.5, Math.min(2.0, speed)), pause }),
    signal: AbortSignal.timeout(15000),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`vercel-edge ${resp.status}${body ? `: ${body.slice(0, 100)}` : ''}`);
  }

  const data = Buffer.from(await resp.arrayBuffer());
  if (data.length < 50) throw new Error(`vercel-edge returned ${data.length} bytes`);
  return { data, type: resp.headers.get('content-type') || 'audio/mpeg' };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit(`tts:${ip}`, TTS_LIMIT);
  if (!limit.ok) {
    return NextResponse.json({ error: `语音朗读太频繁，请 ${limit.retryAfter} 秒后再试` }, { status: 429 });
  }

  let text = '';
  let lang: 'zh' | 'en' = 'zh';
  let rate = '';
  let pause = 0;
  try {
    const body = await safeJson(req, {});
    text = typeof body.text === 'string' ? body.text : '';
    lang = body.lang === 'en' ? 'en' : 'zh';
    if (typeof body.rate === 'string' && body.rate.trim()) rate = body.rate.trim();
    if (typeof body.pause === 'number' && Number.isFinite(body.pause)) {
      pause = Math.max(0, Math.min(2000, Math.round(body.pause)));
    }
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  if (!text.trim()) return NextResponse.json({ error: 'missing text' }, { status: 400 });
  if (text.length > 500) text = text.slice(0, 500);
  if (!rate) rate = '-45%';

  const textWithPause = pause > 0
    ? text.trim() + `<break time="${pause}ms"/>`
    : text.trim();
  const voice = VOICE_EDGE[lang];

  const cacheKey = ttsCacheKey(text, lang, rate, pause);
  const hit = ttsCache.get(cacheKey);
  if (hit) {
    ttsCache.delete(cacheKey);
    ttsCache.set(cacheKey, hit);
    return new NextResponse(new Uint8Array(hit.data), {
      status: 200,
      headers: { 'content-type': hit.type, 'cache-control': 'public, max-age=86400' },
    });
  }

  let result: { data: Buffer; type: string };

  // 第一层：直连 speech.platform.bing.com（住宅 IP，无需 Sec-MS-GEC）
  try {
    const buffer = await synthesizeDirect(textWithPause, voice, rate);
    result = { data: buffer, type: 'audio/mpeg' };
  } catch (e) {
    const directErr = e instanceof Error ? e.message : String(e);
    console.warn('[tts] 直连 Edge 失败，尝试 Vercel 代理：', directErr);

    // 第二层：Vercel Edge 代理
    try {
      result = await synthesizeWithVercel(text, lang, rate, pause);
    } catch (e2) {
      const vercelErr = e2 instanceof Error ? e2.message : String(e2);
      console.warn('[tts] Vercel 也失败，前端降级 Web Speech：', vercelErr);
      return NextResponse.json(
        { error: 'tts failed', direct: directErr, vercel: vercelErr },
        { status: 502 },
      );
    }
  }

  if (ttsCache.size >= TTS_CACHE_MAX) {
    const oldest = ttsCache.keys().next().value;
    if (oldest !== undefined) ttsCache.delete(oldest);
  }
  ttsCache.set(cacheKey, { data: result.data, type: result.type });

  return new NextResponse(new Uint8Array(result.data), {
    status: 200,
    headers: {
      'content-type': result.type,
      'cache-control': 'public, max-age=86400',
    },
  });
}