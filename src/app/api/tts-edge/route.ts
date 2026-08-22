/**
 * ───────────────────────────────────────────────────────────────────────────
 * Vercel Edge 路由 —— Edge TTS 代理（海外节点部署）
 * ───────────────────────────────────────────────────────────────────────────
 *
 * 用途：给大陆 NAS 服务端做中转。NAS 无法直连 edge.microsoft.com（geo-block），
 * 但 Vercel Edge 节点在全球海外，不受此限制。
 *
 * 部署：随本仓库一起部署到 Vercel（已有 Vercel 版本可直接用），
 * NAS 端 /api/tts 在 Kokoro 不可用时改为调用本端点
 * （VERCEL_EDGE_TTS_URL 环境变量指向 https://your-app.vercel.app/api/tts-edge）。
 *
 * 延迟：~150-400ms（短文本），远低于 Kokoro CPU 的 5s+。
 * 音质：Edge TTS 神经嗓音（Xiaoxiao/Aria），优于 Kokoro。
 * 免费额度：Vercel Hobby 512 万次/月 + Edge TTS 无用量限制。
 * ───────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Edge 在线 TTS 端点
const SECURITY_URL = 'https://edge.microsoft.com/tts/cfg/security';
const WS_URL = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';
const TRUSTED_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';

const VOICE_EDGE: Record<string, string> = {
  zh: 'zh-CN-XiaoxiaoNeural',
  en: 'en-US-AriaNeural',
};

let cachedSec: { date: string; token: string } | null = null;

async function sha256Base64(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  const bytes = new Uint8Array(hash);
  const binary = bytes.reduce((acc, b) => acc + String.fromCharCode(b), '');
  return btoa(binary);
}

async function getSecToken(): Promise<string> {
  const date = new Date().toUTCString();
  if (cachedSec && cachedSec.date === date) return cachedSec.token;
  const resp = await fetch(SECURITY_URL, {
    headers: { 'x-client-birth': date, 'x-client-current': date },
  });
  if (!resp.ok) throw new Error(`sec cfg ${resp.status}`);
  const data = (await resp.json()) as { secret?: string };
  if (!data.secret) throw new Error('sec cfg no secret');
  const token = await sha256Base64(`GEC${date}${data.secret}`);
  cachedSec = { date, token };
  return token;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function edgeTTS(
  text: string,
  lang: 'zh' | 'en',
  rate: number,
  pause: number,
  sig: AbortSignal,
): Promise<{ data: Uint8Array; type: string }> {
  const token = await getSecToken();
  const wsUrl = `${WS_URL}?trustedclienttoken=${TRUSTED_TOKEN}&X-ConnectionId=${crypto.randomUUID().replaceAll('-', '')}&Sec-MS-GEC=${token}`;

  const voice = VOICE_EDGE[lang];
  const speed = `${(rate - 1) * 100}%`;
  const pauseMs = Math.round(pause * 1000);
  const ssml = [
    '<speak version="1.0" xml:lang="zh-CN" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts">',
    `<voice name="${voice}">`,
    `<mstts:express-as style="general" styledegree="1.0">`,
    `<prosody rate="${speed}">`,
    escapeXml(text),
    `</prosody>`,
    '</mstts:express-as>',
    '</voice>',
    `</speak>`,
    '',
    JSON.stringify({
      context: {
        synthesis: {
          audio: { metadataoptions: { sentenceBoundaryEnabled: 'false', wordBoundaryEnabled: 'false' }, outputformat: 'audio-24khz-48kbitrate-mono-mp3' },
        },
      },
    }),
    'PathAlloc=true',
    'ContextType=StorageResponse',
    '',
  ].join('\r\n');

  const dataChunks: Uint8Array[] = [];
  let totalBytes = 0;

  await new Promise<void>((resolve, reject) => {
    const abortHandler = () => reject(new Error('tts timeout'));
    sig.addEventListener('abort', abortHandler, { once: true });

    const ws = new WebSocket(wsUrl);
    let started = false;

    ws.onopen = () => {
      started = true;
      ws.send(ssml);
    };

    ws.onmessage = (e) => {
      if (typeof e.data === 'string') {
        if (e.data.includes('Path*=audio/') || e.data.includes('Turn')) {
          ws.close();
        }
        return;
      }
      const buf = e.data instanceof ArrayBuffer ? new Uint8Array(e.data) : new Uint8Array(e.data.buffer);
      dataChunks.push(buf);
      totalBytes += buf.length;
      // 100 字节都没到 → 空响应，直接关闭
      if (dataChunks.length > 0 && totalBytes < 100 && dataChunks.length > 30) {
        ws.close();
      }
    };

    ws.onclose = () => {
      sig.removeEventListener('abort', abortHandler);
      resolve();
    };

    ws.onerror = (err) => {
      sig.removeEventListener('abort', abortHandler);
      // WebSocket 错误事件对象没有标准 message 属性，只传简单字符串
      reject(new Error(`websocket error`));
    };

    // 握手超时
    if (!started) {
      setTimeout(() => {
        if (!started) { ws.close(); reject(new Error('ws handshake timeout')); }
      }, 8000);
    }
  });

  if (totalBytes === 0) throw new Error('no audio data');

  // 合并所有音频 chunk
  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of dataChunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  return { data: combined, type: 'audio/mpeg' };
}

export async function POST(request: NextRequest) {
  try {
    const { text, lang = 'zh', rate = 1.0, pause = 0.1 } = (await request.json()) as {
      text?: string;
      lang?: 'zh' | 'en';
      rate?: number;
      pause?: number;
    };

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'text required' }, { status: 400 });
    }

    const signal = AbortSignal.timeout(12000);

    const result = await edgeTTS(text.trim(), (lang as 'zh' | 'en') || 'zh', rate || 1.0, pause || 0.1, signal);

    // Uint8Array.buffer 类型为 ArrayBufferLike (= ArrayBuffer | SharedArrayBuffer)，
    // BodyInit 只接受 ArrayBuffer。new Uint8Array() 只生成 ArrayBuffer，断言安全。
    const body = result.data.buffer as ArrayBuffer;

    return new NextResponse(body, {
      headers: {
        'Content-Type': result.type,
        'Content-Length': String(result.data.byteLength),
        'X-TTS-Engine': 'edge',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'edge-tts failed', reason: msg }, { status: 502 });
  }
}