/**
 * ───────────────────────────────────────────────────────────────────────────
 * Vercel Serverless Function —— Edge TTS 代理（海外节点部署）
 * ───────────────────────────────────────────────────────────────────────────
 *
 * 用途：给大陆 NAS 服务端做中转。NAS 无法直连 edge.microsoft.com（geo-block），
 * 但 Vercel Serverless Function 强制部署在美国节点（iad1），不受此限制。
 *
 * 部署：随本仓库一起部署到 Vercel，vercel.json 配置 regions=["iad1"]。
 * NAS 端 VERCEL_EDGE_TTS_URL 指向 https://your-app.vercel.app/api/tts-edge。
 *
 * 延迟：~300-800ms（短文本），远低于 Kokoro CPU 的 5s+。
 * 音质：Edge TTS 神经嗓音（晓晓/Aria），优于 Kokoro。
 * ───────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import { tts } from 'edge-tts';

// 必须用 nodejs 运行时（serverless function），才能：
//   1) 支持 regions 配置（强制美国节点，绕过大区 geo-block）
//   2) 使用 edge-tts npm 包（WebSocket 内部封装，无需手动实现协议）
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VOICE_EDGE: Record<string, string> = {
  zh: 'zh-CN-XiaoxiaoNeural',
  en: 'en-US-AriaNeural',
};

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

    const buffer = await tts(textWithPause, {
      voice,
      rate: rateStr,
      pitch: '+0Hz',
      volume: '+0%',
    });

    return new NextResponse(buffer, {
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