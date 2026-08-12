/**
 * ───────────────────────────────────────────────────────────────────────────
 * 服务端中文/英文 TTS —— 手写版「微软 Edge 在线神经语音」客户端
 * ───────────────────────────────────────────────────────────────────────────
 * 背景：本项目没有采购任何付费 TTS，而是直接对接微软给 Edge 浏览器
 *       「大声朗读 (Read Aloud)」功能用的那个【免费公开】在线 TTS 服务。
 *
 * 重要：这与 npm 上的 @micro/edge-tts / edge-tts / edge-tts-client 等包
 *       **连的是同一个后端、同一批神经嗓音**（zh-CN-XiaoxiaoNeural 晓晓、
 *       en-US-AriaNeural 等），因此音质完全相同。那些包本质就是把下面这套
 *       协议封装了一遍；这里手写是为了：
 *         (1) 不引入额外 TTS 专用依赖（仅用已在用的 ws）；
 *         (2) 能在 SSML 里插入 <break> 把单个拼音拉长到约 1 秒（拼音跟读需要）；
 *         (3) 完全可控。
 *
 * 协议简述（均为微软公开端点，无鉴权账号，靠固定 client token + 动态安全令牌）：
 *   1. 先 GET https://edge.microsoft.com/tts/cfg/security 取 secret；
 *   2. 用 sha256("GEC" + UTC日期 + secret) 算出 Sec-MS-GEC 令牌（防滥用校验）；
 *   3. 用 wss://speech.platform.bing.com/... 的 WebSocket 握手，
 *      查询串带 TrustedClientToken + Sec-MS-GEC + Sec-MS-GEC-Version；
 *   4. 先发 speech.config，再发一段 SSML（指定嗓音/语速/音调/停顿）；
 *   5. 服务端把 MP3 音频帧用 "Path:audio\r\n" 分隔符嵌在二进制消息里回流，
 *      我们按该分隔符切片拼成完整 MP3 返回前端。
 *
 * 前端 speak.ts 会优先调用本路由，任何失败（离线 / 令牌端点不可达 / 握手 403 /
 * 超时）都降级到浏览器原生 Web Speech，保证朗读永远可用。
 *
 * 维护提醒：若微软改了令牌端点或握手参数，本文件需同步调整；
 *           npm 包则会由作者先踩坑修复。两者脆弱性本质相同（都用同一个
 *           固定的 TRUSTED_TOKEN 与扩展 UA）。
 * ───────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import WebSocket from 'ws';

// Edge 在线 TTS 需要 Node 运行时（WebSocket 连微软服务，不能用 Edge/浏览器运行时）
export const runtime = 'nodejs';
// 每次按文本实时合成，不应被构建期缓存
export const dynamic = 'force-dynamic';

// TrustedClientToken：Edge 浏览器「大声朗读」客户端写死的一个公开固定 token，
// 微软官方 Read Aloud 就带这个值。@micro/edge-tts 等包内部用的也是它（非机密）。
const TRUSTED_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
// 取安全令牌 secret 的端点（见上方协议第 1 步）。
const SECURITY_URL = 'https://edge.microsoft.com/tts/cfg/security';

// 选定的神经嗓音（与 @micro/edge-tts 等包可调用的同一批微软在线嗓音）：
//   中文 → 晓晓 XiaoxiaoNeural（自然女声）；英文 → Aria AriaNeural（清晰女声）。
// 想换嗓音直接改这里即可（如中文换成云野 YunyangNeural 男声）。
const VOICE: Record<string, string> = {
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
  const resp = await fetch(SECURITY_URL, {
    headers: { 'x-client-birth': date, 'x-client-current': date },
  });
  if (!resp.ok) throw new Error(`sec cfg ${resp.status}`);
  const data = (await resp.json()) as { secret?: string };
  if (!data.secret) throw new Error('sec cfg no secret');
  const sha = createHash('sha256').update(`GEC${date}${data.secret}`).digest('base64');
  return sha;
}

import { getClientIp, rateLimit } from '@/lib/rate-limit';

const TTS_LIMIT = { windowSeconds: 60, maxRequests: 30 }; // 每 IP 每分钟 30 次

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit(`tts:${ip}`, TTS_LIMIT);
  if (!limit.ok) {
    return NextResponse.json({ error: `语音朗读太频繁，请 ${limit.retryAfter} 秒后再试` }, { status: 429 });
  }

  let text = '';
  let lang = 'zh';
  let rate = '';
  let pause = 0;
  try {
    const body = await req.json();
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
  if (!rate) rate = lang === 'en' ? '-35%' : '-35%';

  try {
    // 协议第 2~3 步：取动态安全令牌，并拼出带令牌的 WebSocket 握手地址。
    const sec = await getSecToken();
    const wsUrl =
      `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1` +
      `?TrustedClientToken=${TRUSTED_TOKEN}` +
      `&Sec-MS-GEC=${encodeURIComponent(sec)}` +
      `&Sec-MS-GEC-Version=1` +
      `&ConnectionId=${uuid()}`;

    const audio = await new Promise<Buffer>((resolve, reject) => {
      const ws = new WebSocket(wsUrl, {
        host: 'speech.platform.bing.com',
        origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.66 Safari/537.36 Edg/103.0.1264.44',
        },
      });
      const chunks: Buffer[] = [];
      let settled = false;
      const done = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };

      ws.on('message', (raw: WebSocket.RawData, isBinary: boolean) => {
        // 文本消息：微软用 "turn.end" 标记整段语音合成结束 → 收尾并返回。
        if (!isBinary) {
          const s = raw.toString('utf8');
          if (s.includes('turn.end')) {
            done(() => {
              ws.close();
              resolve(Buffer.concat(chunks));
            });
          }
          return;
        }
        // 二进制消息：音频帧被包在 "Path:audio\r\n" 分隔头之后；
        // 按该分隔符切掉头，剩余即 MP3 数据，多帧累加即为完整音频。
        const buf = Buffer.from(raw as Buffer);
        const sep = 'Path:audio\r\n';
        const i = buf.indexOf(sep);
        if (i >= 0) chunks.push(buf.subarray(i + sep.length));
      });
      ws.on('error', (e) => done(() => reject(e)));
      ws.on('open', () => {
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

        // 协议第 4 步：构造 SSML，指定神经嗓音(VOICE)、语速(rate)、<break> 静音停顿。
        // 注意：<break time> 是拼音跟读的关键——在单个音节后插入静音，使总时长接近 1 秒。
        const ssml =
          `X-RequestId:${uuid()}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${new Date()}Z\r\nPath:ssml\r\n\r\n` +
          `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
          `<voice name='${VOICE[lang]}'><prosody pitch='+0Hz' rate='${rate}' volume='+0%'>${text}</prosody>${pause > 0 ? `<break time='${pause}ms'/>` : ''}</voice></speak>`;
        ws.send(ssml, { compress: true }, (e) => e && done(() => reject(e)));
      });

      setTimeout(() => done(() => reject(new Error('tts timeout'))), 30000);
    });

    // Buffer 在 Node20 类型下可能是 SharedArrayBuffer 后端，转成普通 Uint8Array 以满足 BodyInit
    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        'content-type': 'audio/mpeg',
        'cache-control': 'public, max-age=86400',
      },
    });
  } catch {
    // 合成失败（令牌端点不可达 / 握手 403 / 超时）→ 交由前端降级到 Web Speech
    return NextResponse.json({ error: 'tts failed' }, { status: 502 });
  }
}
