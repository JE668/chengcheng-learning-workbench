/**
 * ───────────────────────────────────────────────────────────────────────────
 * 服务端中文/英文 TTS —— 手写版「微软 Edge 在线神经语音」客户端
 * ───────────────────────────────────────────────────────────────────────────
 * 合成链路（按可靠性优先）：
 *   1) 【Kokoro 离线神经语音】——首选。ONNX Runtime 推理，中文(af_bella) + 英文(af_sarah)
 *      模型已在镜像构建期装进 /opt/kokoro（见 scripts/fetch-kokoro.mjs 与 Dockerfile）。
 *      完全不依赖外网，是国内网络下最稳的普通话来源；跨设备音质一致。
 *   2) 【Edge 在线神经语音（晓晓/ Aria）】——Kokoro 不可用时的兜底。
 *      手写对接微软给 Edge「大声朗读」用的免费公开 TTS（与 edge-tts 等包同一后端）。
 *      国内网络常被拒（实测返回 "Our services aren't available"），故仅作次级兜底。
 *   3) 【浏览器原生 Web Speech】——服务端两条路都失败时，前端 speak.ts 自动降级。
 *
 * 为什么 Kokoro 优先：项目部署在国内 NAS，微软免费 TTS 端点经常被拒（geo-block），
 * 一旦失败只能靠浏览器 Web Speech，而部分设备（iPad 设成香港/仅粤语、个别安卓/
 * 平板无普通话嗓音、Safari 首句静音）根本没有可用的普通话嗓音 → 整段静音。
 * Kokoro 离线合成彻底绕开外网，保证「服务端一定有普通话音频」。
 *
 * 注意：Kokoro Python 脚本是 CPU 推理，NAS 上约 200-500ms/句（短文本）；
 * 若 Python 环境异常，自动回退 Edge → Web Speech，行为与改动前一致。
 * ───────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import { safeJson } from '@/lib/safe-json';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import WebSocket from 'ws';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

// Edge 在线 TTS 需要 Node 运行时（WebSocket 连微软服务，不能用 Edge/浏览器运行时）
export const runtime = 'nodejs';
// 每次按文本实时合成，不应被构建期缓存
export const dynamic = 'force-dynamic';

// ── Kokoro 离线 TTS（首选）─────────────────────────────────────────────────
const KOKORO_DIR = process.env.KOKORO_DIR || '/opt/kokoro';
const KOKORO_MODEL = join(KOKORO_DIR, 'kokoro-v1.0.onnx');
const KOKORO_VOICES = join(KOKORO_DIR, 'voices-v1.0.bin');
const KOKORO_SCRIPT = join(process.cwd(), 'scripts', 'kokoro-tts.py');

// 选定的神经嗓音（Kokoro 多音色库）：
//   中文 → af_bella（自然女声，适合学习）；英文 → af_sarah（清晰女声）。
const VOICE_KOKORO: Record<string, string> = {
  zh: 'af_bella',
  en: 'af_sarah',
};

// ── Edge 在线 TTS（兜底）─────────────────────────────────────────────────
// TrustedClientToken：Edge 浏览器「大声朗读」客户端写死的一个公开固定 token，
// 微软官方 Read Aloud 就带这个值。@micro/edge-tts 等包内部用的也是它（非机密）。
const TRUSTED_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
// 取安全令牌 secret 的端点（见下方协议第 1 步）。
const SECURITY_URL = 'https://edge.microsoft.com/tts/cfg/security';

// 选定的神经嗓音（与 @micro/edge-tts 等包可调用的同一批微软在线嗓音）：
//   中文 → 晓晓 XiaoxiaoNeural（自然女声）；英文 → Aria AriaNeural（清晰女声）。
const VOICE_EDGE: Record<string, string> = {
  zh: 'zh-CN-XiaoxiaoNeural',
  en: 'en-US-AriaNeural',
};

function uuid() {
  return crypto.randomUUID().replaceAll('-', '');
}

/**
 * 取微软要求的 Sec-MS-GEC 安全令牌：
 * 向 edge.microsoft.com/tts/cfg/security 取 secret，再用 sha256("GEC" + 日期 + secret) 算出。
 * 该令牌必须拼进 WebSocket 的查询串，否则服务端返回 403。
 */
async function getSecToken(): Promise<string> {
  // 注意：date 必须同时用于 (a) 请求头 x-client-birth/current 与 (b) GEC 哈希；
  // 二者必须完全一致，否则令牌校验失败、握手返回 403。
  const date = new Date().toUTCString();
  // 按 UTC 日缓存：令牌只用 date 派生，当天内有效，省掉每次请求的出境 HTTPS 往返。
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

const TTS_LIMIT = { windowSeconds: 60, maxRequests: 30 }; // 每 IP 每分钟 30 次

// ── 性能优化：内存缓存（降低语音延迟的主要手段） ─────────────────────
// (1) Sec-MS-GEC 安全令牌按 UTC 日缓存：原本每次 TTS 请求都要先向 edge.microsoft.com
//     发一次 HTTPS 取 secret 再算令牌，等于每次多一趟出境网络往返；令牌本身只用 UTC
//     日期派生、当天有效，缓存即可省掉这趟请求。
// (2) 合成结果按 (text,lang,rate,pause) 缓存：儿童学习场景大量重复朗读（同一字母 /
//     单词 / 夸夸语反复出现），命中缓存直接秒回，彻底绕过微软 WebSocket 握手。
//     限定上限做 LRU 淘汰，防内存膨胀。Node 持久进程下缓存跨请求复用，收益最大。
const ttsCache = new Map<string, Buffer>();
const TTS_CACHE_MAX = 500;
let cachedSec: { date: string; token: string } | null = null;

function ttsCacheKey(text: string, lang: string, rate: string, pause: number): string {
  return `${lang}|${rate}|${pause}|${text}`;
}

// 复用一条到微软的 WebSocket 暖连接，省去每次请求都新建 TLS + WS 握手的固定开销
// （约 100~300ms，是缓存未命中时首趟延迟的主要来源）。
// 防御原则：仅在 OPEN 且空闲时复用；任一请求出错/超时即废弃并在下次重建，当前请求
// 回退到新建连接——行为不会劣于「每次新建」。客户端另有 8s 超时，即便服务端偶发卡住，
// 用户也已降级到浏览器原生 Web Speech，不会更慢。
let pooledWs: WebSocket | null = null;

function acquireWs(sec: string): WebSocket {
  if (pooledWs && pooledWs.readyState === WebSocket.OPEN) {
    const ws = pooledWs;
    pooledWs = null; // 取出占用，避免并发复用同一条连接
    return ws;
  }
  // 旧连接已不可用，先回收再新建
  if (pooledWs) {
    try {
      pooledWs.terminate();
    } catch {
      /* ignore */
    }
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
 * 用 Kokoro 离线合成音频（首选路径）。
 * 返回 { data, type }，type 为 audio/wav。
 * 任何异常（模型缺失/Python 报错）均抛出，由调用方降级到 Edge。
 */
async function synthesizeWithKokoro(
  text: string,
  lang: 'zh' | 'en',
  rate: number,
): Promise<{ data: Buffer; type: string }> {
  if (!existsSync(KOKORO_MODEL) || !existsSync(KOKORO_VOICES) || !existsSync(KOKORO_SCRIPT)) {
    throw new Error('kokoro 模型或脚本缺失');
  }

  // 语速映射：Kokoro speed 0.5-2.0，对应 Edge rate -50%~+100%
  // rate=0.55 (Edge -45%) ≈ speed=1.35；rate=0.8 (Edge -20%) ≈ speed=1.0
  const speed = Math.max(0.5, Math.min(2.0, 1 / rate));

  const out = join(tmpdir(), `kokoro-${uuid()}.wav`);

  return new Promise((resolve, reject) => {
    const p = spawn('python3', [
      KOKORO_SCRIPT,
      '--model', KOKORO_MODEL,
      '--voices', KOKORO_VOICES,
      '--voice', VOICE_KOKORO[lang],
      '--lang', lang,
      '--speed', String(speed),
    ], { stdio: ['pipe', 'ignore', 'pipe'] });

    p.stdin.write(text);
    p.stdin.end();

    let err = '';
    p.stderr.on('data', (d) => (err += String(d)));
    p.on('error', reject);
    p.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error(`kokoro 退出码 ${code}: ${err.slice(0, 200)}`));
        return;
      }
      try {
        const data = await readFile(out);
        await unlink(out).catch(() => {});
        resolve({ data, type: 'audio/wav' });
      } catch (e) {
        reject(e);
      }
    });
  });
}

/**
 * 用 Edge 在线 TTS 合成音频（兜底路径）。
 * 返回 { data, type }，type 为 audio/mpeg。
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
            try {
              ws.removeAllListeners();
            } catch {
              /* ignore */
            }
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
        try {
          ws.terminate();
        } catch {
          /* ignore */
        }
        if (pooledWs === ws) pooledWs = null;
        reject(e);
      }),
    );
    ws.on('open', () => sendSsml());
    if (ws.readyState === WebSocket.OPEN) sendSsml();

    setTimeout(
      () =>
        done(() => {
          try {
            ws.terminate();
          } catch {
            /* ignore */
          }
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
    // 可选：音节后追加静音停顿（毫秒），用于把单个拼音拉长到接近 1 秒
    if (typeof body.pause === 'number' && Number.isFinite(body.pause)) {
      pause = Math.max(0, Math.min(2000, Math.round(body.pause)));
    }
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  if (!text.trim()) return NextResponse.json({ error: 'missing text' }, { status: 400 });
  // 防止超长文本把微软接口/内存打爆
  if (text.length > 500) text = text.slice(0, 500);
  // 未指定则按语言给一个适合一年级小朋友的偏慢、清晰的语速
  if (!rate) rate = lang === 'en' ? '-45%' : '-45%';

  // 命中合成缓存：重复朗读（同一字母 / 单词 / 夸夸语）直接秒回，无需再连微软。
  const cacheKey = ttsCacheKey(text, lang, rate, pause);
  const hit = ttsCache.get(cacheKey);
  if (hit) {
    // 命中即移到末尾，维持 LRU（热门短语不被淘汰）
    ttsCache.delete(cacheKey);
    ttsCache.set(cacheKey, hit);
    return new NextResponse(new Uint8Array(hit), {
      status: 200,
      headers: { 'content-type': 'audio/mpeg', 'cache-control': 'public, max-age=86400' },
    });
  }

  try {
    // 主路径：Kokoro 离线合成（国内网络最稳、跨设备一致、不依赖外网）。
    // 任何失败（模型缺失/Python 报错）→ 回退 Edge 在线 TTS。
    let result: { data: Buffer; type: string };
    try {
      // rate 格式转换：Edge 的 "-45%" 需要转成 Kokoro 的 speed 数值
      const rateMatch = /([+-]?\d+(?:\.\d+)?)\s*%/.exec(rate);
      const pct = rateMatch ? parseFloat(rateMatch[1]) : 0;
      const speed = 1 + pct / 100; // -45% -> 0.55
      result = await synthesizeWithKokoro(text, lang, Math.max(0.5, Math.min(2.0, 1 / speed)));
    } catch (e) {
      console.warn(
        '[tts] Kokoro 不可用，回退 Edge 在线 TTS：',
        e instanceof Error ? e.message : String(e),
      );
      result = await synthesizeWithEdge(text, lang, rate, pause);
    }

    // 写入合成缓存（限定上限，FIFO 淘汰最旧），供后续重复朗读秒回
    if (ttsCache.size >= TTS_CACHE_MAX) {
      const oldest = ttsCache.keys().next().value;
      if (oldest !== undefined) ttsCache.delete(oldest);
    }
    ttsCache.set(cacheKey, result.data);

    return new NextResponse(new Uint8Array(result.data), {
      status: 200,
      headers: {
        'content-type': result.type,
        'cache-control': 'public, max-age=86400',
      },
    });
  } catch (e) {
    // 合成失败（Kokoro 与 Edge 均不可用）→ 交由前端降级到 Web Speech
    console.warn(
      '[tts] 合成失败（Kokoro 与 Edge 均不可用），前端将降级到浏览器 Web Speech：',
      e instanceof Error ? e.message : String(e),
    );
    return NextResponse.json({ error: 'tts failed' }, { status: 502 });
  }
}
