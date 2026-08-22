/**
 * ───────────────────────────────────────────────────────────────────────────
 * 服务端中文/英文 TTS —— 手写版「微软 Edge 在线神经语音」客户端
 * ───────────────────────────────────────────────────────────────────────────
 *
 * 合成链路（按优先级）：
 *   1) Vercel Edge 路由代理（首选）——海外节点可直连 Edge TTS，不受大陆 geo-block 影响。
 *      设 VERCEL_EDGE_TTS_URL 环境变量指向已部署的 /api/tts-edge 路由即可启用。
 *      延迟 ~150-400ms，音质为微软神经嗓音（晓晓/Aria），优于 Kokoro。
 *
 *   2) 直连 Edge 在线 TTS（兜底）——NAS 大陆可能 geo-block，仅作为最后尝试。
 *
 *   3) 浏览器 Web Speech（前端自动降级）——服务端两条路都失败时，speak.ts 触发。
 *
 * 注意：Kokoro 离线 TTS 已弃用（CPU 推理 5s+ 远超 Edge TTS 的 ~200ms，
 * 且 MX150 GPU 不兼容新版模型）。如将来换 GPU 更强的设备可再考虑加入。
 * ───────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import { safeJson } from '@/lib/safe-json';
import { createHash } from 'node:crypto';
import WebSocket from 'ws';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

// Edge 在线 TTS 需要 Node 运行时（WebSocket 连微软服务）
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Edge 在线 TTS 配置 ──────────────────────────────────────────────────
const TRUSTED_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const SECURITY_URL = 'https://edge.microsoft.com/tts/cfg/security';

const VOICE_EDGE: Record<string, string> = {
  zh: 'zh-CN-XiaoxiaoNeural',
  en: 'en-US-AriaNeural',
};

// Vercel Edge TTS 代理 URL（海外节点，绕过大区 geo-block）：
// 用法：VERCEL_EDGE_TTS_URL=https://your-app.vercel.app/api/tts-edge
const VERCEL_EDGE_TTS_URL = process.env.VERCEL_EDGE_TTS_URL;

function uuid() {
  return crypto.randomUUID().replaceAll('-', '');
}

/**
 * 取微软要求的 Sec-MS-GEC 安全令牌。
 */
async function getSecToken(): Promise<string> {
  const date = new Date().toUTCString();
  if (cachedSec && cachedSec.date === date) return cachedSec.token;
  const resp = await fetch(SECURITY_URL, {
    headers: { 'x-client-birth': date, 'x-client-current': date },
  });
  if (!resp.ok) throw new Error(`sec cfg ${resp.status}`);
  const data = (await resp.json()) as { secret?: string };
  if (!data.secret) throw new Error('sec cfg no secret');
  const sha = createHash('sha256').update(`GEC${date}${data.secret}`).digest('base64');
  cachedSec = { date, token: sha };
  return sha;
}

const TTS_LIMIT = { windowSeconds: 60, maxRequests: 30 };

// ── 内存缓存（降低重复朗读延迟） ──────────────────────────────
// (1) Sec-MS-GEC 令牌按 UTC 日缓存
const ttsCache = new Map<string, { data: Buffer; type: string }>();
const TTS_CACHE_MAX = 500;
let cachedSec: { date: string; token: string } | null = null;

function ttsCacheKey(text: string, lang: string, rate: string, pause: number): string {
  return `${lang}|${rate}|${pause}|${text}`;
}

// 复用一条到微软的 WebSocket 暖连接
let pooledWs: WebSocket | null = null;

function acquireWs(sec: string): WebSocket {
  if (pooledWs && pooledWs.readyState === WebSocket.OPEN) {
    const ws = pooledWs;
    pooledWs = null;
    return ws;
  }
  if (pooledWs) {
    try { pooledWs.terminate(); } catch { /* ignore */ }
    pooledWs = null;
  }
  const wsUrl =
    `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1` +
    `?TrustedClientToken=${TRUSTED_TOKEN}` +
    `&Sec-MS-GEC=${encodeURIComponent(sec)}` +
    `&Sec-MS-GEC-Version=1` +
    `&ConnectionId=${uuid()}`;
  return new WebSocket(wsUrl, {
    host: 'speech.platform.bing.com',
    origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.66 Safari/537.36 Edg/103.0.1264.44',
    },
  });
}

/**
 * 通过 Vercel Edge 路由代理调用 Edge TTS（首选路径）。
 * 部署在 Vercel 海外的 /api/tts-edge 路由可直连 edge.microsoft.com，
 * 不受大陆 geo-block 影响。NAS 端只需设置 VERCEL_EDGE_TTS_URL 环境变量。
 *
 * 协议：POST JSON {text, lang, rate, pause} → 返回音频二进制。
 */
async function synthesizeWithVercelEdge(
  text: string,
  lang: 'zh' | 'en',
  rate: string,
  pause: number,
): Promise<{ data: Buffer; type: string }> {
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

/**
 * 用 Edge 在线 TTS 合成音频（兜底路径）。
 * 大陆直连可能被 geo-block。
 */
async function synthesizeWithEdge(
  text: string,
  lang: 'zh' | 'en',
  rate: string,
  pause: number,
): Promise<{ data: Buffer; type: string }> {
  const sec = await getSecToken();
  const audio = await new Promise<Buffer>((resolve, reject) => {
    const ws = acquireWs(sec);
    const chunks: Buffer[] = [];
    let settled = false;
    let sent = false;

    const done = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const sendSsml = () => {
      if (sent) return;
      sent = true;
      const cfg =
        `X-Timestamp:${new Date()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: { sentenceBoundaryEnabled: false, wordBoundaryEnabled: false },
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
              },
            },
          },
        });
      ws.send(cfg, { compress: true }, (e) => e && done(() => reject(e)));

      const ssml =
        `X-RequestId:${uuid()}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${new Date()}Z\r\nPath:ssml\r\n\r\n` +
        `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
        `<voice name='${VOICE_EDGE[lang]}'><prosody pitch='+0Hz' rate='${rate}' volume='+0%'>${text}</prosody>${pause > 0 ? `<break time='${pause}ms'/>` : ''}</voice></speak>`;
      ws.send(ssml, { compress: true }, (e) => e && done(() => reject(e)));
    };

    ws.on('message', (raw: WebSocket.RawData, isBinary: boolean) => {
      if (!isBinary) {
        const s = raw.toString('utf8');
        if (s.includes('turn.end')) {
          done(() => {
            try { ws.removeAllListeners(); } catch { /* ignore */ }
            pooledWs = ws;
            resolve(Buffer.concat(chunks));
          });
        }
        return;
      }
      const buf = Buffer.from(raw as Buffer);
      const sep = 'Path:audio\r\n';
      const i = buf.indexOf(sep);
      if (i >= 0) chunks.push(buf.subarray(i + sep.length));
    });
    ws.on('error', (e) =>
      done(() => {
        try { ws.terminate(); } catch { /* ignore */ }
        if (pooledWs === ws) pooledWs = null;
        reject(e);
      }),
    );
    ws.on('open', () => sendSsml());
    if (ws.readyState === WebSocket.OPEN) sendSsml();

    setTimeout(
      () =>
        done(() => {
          try { ws.terminate(); } catch { /* ignore */ }
          if (pooledWs === ws) pooledWs = null;
          reject(new Error('tts timeout'));
        }),
      30000,
    );
  });

  return { data: audio, type: 'audio/mpeg' };
}

// ═══════════════════════════════════════════════════════════════════════════
// 入口
// ═══════════════════════════════════════════════════════════════════════════
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

  // 第一层：Vercel Edge 路由代理（海外节点，可绕过大区 geo-block）
  try {
    result = await synthesizeWithVercelEdge(text, lang, rate, pause);
    return returnAudio(cacheKey, ttsCache, TTS_CACHE_MAX, result);
  } catch (e) {
    const vercelErr = e instanceof Error ? e.message : String(e);
    console.warn('[tts] Vercel Edge 代理失败，回退直连 Edge：', vercelErr);
    try {
      result = await synthesizeWithEdge(text, lang, rate, pause);
      return returnAudio(cacheKey, ttsCache, TTS_CACHE_MAX, result);
    } catch (e2) {
      const edgeErr = e2 instanceof Error ? e2.message : String(e2);
      console.warn('[tts] Edge 也失败，前端降级 Web Speech：', edgeErr);
      return NextResponse.json(
        { error: 'tts failed', vercel: vercelErr, edge: edgeErr },
        { status: 502 },
      );
    }
  }
}

function returnAudio(
  cacheKey: string,
  cache: Map<string, { data: Buffer; type: string }>,
  cacheMax: number,
  result: { data: Buffer; type: string },
): NextResponse {
  if (cache.size >= cacheMax) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(cacheKey, { data: result.data, type: result.type });

  return new NextResponse(new Uint8Array(result.data), {
    status: 200,
    headers: {
      'content-type': result.type,
      'cache-control': 'public, max-age=86400',
    },
  });
}