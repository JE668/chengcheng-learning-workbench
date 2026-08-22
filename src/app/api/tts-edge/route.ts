/**
 * ───────────────────────────────────────────────────────────────────────────
 * Vercel Serverless Function —— Edge TTS 代理（海外节点部署）
 * ───────────────────────────────────────────────────────────────────────────
 *
 * 用途：给大陆 NAS 服务端做中转。NAS 直连 edge.microsoft.com 被 geo-block，
 * 但此路由通过 Vercel 美国节点（iad1）获取 Sec-MS-GEC 安全令牌，再连
 * wss://speech.platform.bing.com 完成 TTS 合成。
 *
 * 部署：随本仓库一起部署到 Vercel，vercel.json 配置 regions=["iad1"]。
 * NAS 端 VERCEL_EDGE_TTS_URL 指向 https://your-app.vercel.app/api/tts-edge。
 *
 * 延迟：~300-800ms（短文本）。音质：Edge TTS 神经嗓音（晓晓/Aria）。
 * ───────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import WebSocket from 'ws';
import { randomUUID, createHash } from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VOICE_EDGE: Record<string, string> = {
  zh: 'zh-CN-XiaoxiaoNeural',
  en: 'en-US-AriaNeural',
};

const TRUSTED_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const SECURITY_URL = 'https://edge.microsoft.com/tts/cfg/security';

let cachedSec: { date: string; token: string } | null = null;

/**
 * 从 edge.microsoft.com 获取 Sec-MS-GEC 安全令牌。
 * Vercel 服务器在美国 iad1 节点，不受大陆 geo-block 影响。
 */
async function getSecToken(): Promise<string> {
  const date = new Date().toUTCString();
  if (cachedSec && cachedSec.date === date) return cachedSec.token;
  const resp = await fetch(SECURITY_URL, {
    headers: {
      'x-client-birth': date,
      'x-client-current': date,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      'Referer': 'https://www.bing.com/',
    },
  });
  if (!resp.ok) throw new Error(`sec cfg ${resp.status}`);
  const data = (await resp.json()) as { secret?: string };
  if (!data.secret) throw new Error('sec cfg no secret');
  const sha = createHash('sha256').update(`GEC${date}${data.secret}`).digest('base64');
  cachedSec = { date, token: sha };
  return sha;
}

async function edgeTTS(
  text: string,
  voice: string,
  rate: string,
): Promise<Buffer> {
  const sec = await getSecToken();
  const connId = randomUUID().replaceAll('-', '');
  const wsUrl =
    `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1` +
    `?TrustedClientToken=${TRUSTED_TOKEN}` +
    `&Sec-MS-GEC=${encodeURIComponent(sec)}` +
    `&Sec-MS-GEC-Version=1` +
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
      timeout: 10000,
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
      const cfg = `X-Timestamp:${new Date()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${speechConfig}`;
      ws.send(cfg, { compress: true });

      const ssml =
        `X-RequestId:${randomUUID().replaceAll('-', '')}\r\nContent-Type:application/ssml+xml\r\n` +
        `X-Timestamp:${new Date()}Z\r\nPath:ssml\r\n\r\n` +
        `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
        `<voice name='${voice}'><prosody pitch='+0Hz' rate='${rate}' volume='+0%'>${text}</prosody></voice></speak>`;
      ws.send(ssml, { compress: true });
    };

    ws.on('open', () => sendSsml());
    if (ws.readyState === WebSocket.OPEN) sendSsml();

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
      if (!done) { ws.close(); reject(new Error('tts timeout 10s')); }
    }, 10000);
  });
}

export async function POST(request: NextRequest) {
  try {
    const { text, lang = 'zh', rate = 1.0, pause = 0.1 } = (await request.json()) as {
      text?: string;
      lang?: 'zh' | 'en';
      rate?: number;
      pause?: number;
    };

    if (!text?.trim()) {
      return NextResponse.json({ error: 'text required' }, { status: 400 });
    }

    const voice = VOICE_EDGE[lang] || VOICE_EDGE.zh;
    const rateStr = `${Math.round((rate - 1) * 100)}%`;
    const textWithPause = pause > 0
      ? text.trim() + `<break time="${Math.round(pause * 1000)}ms"/>`
      : text.trim();

    const buffer = await edgeTTS(textWithPause, voice, rateStr);

    // Buffer<ArrayBufferLike> 不匹配 BodyInit，转 ArrayBuffer
    const body = buffer.buffer as ArrayBuffer;

    return new NextResponse(body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(buffer.length),
        'X-TTS-Engine': 'edge',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'edge-tts failed', reason: msg }, { status: 502 });
  }
}