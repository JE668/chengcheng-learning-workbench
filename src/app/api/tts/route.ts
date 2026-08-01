import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import WebSocket from 'ws';

// Edge 在线 TTS 需要 Node 运行时（WebSocket 连微软服务）
export const runtime = 'nodejs';
// 每次按文本合成，不应被构建期缓存
export const dynamic = 'force-dynamic';

const TRUSTED_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const SECURITY_URL = 'https://edge.microsoft.com/tts/cfg/security';

// 中文用晓晓（XiaoxiaoNeural，自然女声），英文用 Aria（清晰女声）
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
  try {
    const body = await req.json();
    text = typeof body.text === 'string' ? body.text : '';
    lang = body.lang === 'en' ? 'en' : 'zh';
    if (typeof body.rate === 'string' && body.rate.trim()) rate = body.rate.trim();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  if (!text.trim()) return NextResponse.json({ error: 'missing text' }, { status: 400 });
  // 防止超长文本把微软接口/内存打爆
  if (text.length > 500) text = text.slice(0, 500);
  // 未指定则按语言给一个适合一年级小朋友的偏慢语速
  if (!rate) rate = lang === 'en' ? '-20%' : '-20%';

  try {
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

        const ssml =
          `X-RequestId:${uuid()}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${new Date()}Z\r\nPath:ssml\r\n\r\n` +
          `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
          `<voice name='${VOICE[lang]}'><prosody pitch='+0Hz' rate='${rate}' volume='+0%'>${text}</prosody></voice></speak>`;
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
