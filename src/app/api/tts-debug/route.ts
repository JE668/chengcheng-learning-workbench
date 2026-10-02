/** Debug endpoint: 测试各种 TTS 端点 */
import { NextRequest, NextResponse } from 'next/server';
import WebSocket from 'ws';
import { randomUUID } from 'node:crypto';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 诊断端点会对外发起多次探测，成本更高，限流更严。
const TTS_DEBUG_LIMIT = { windowSeconds: 60, maxRequests: 5 };

/**
 * 该端点会主动对外发起探测（含一次硬等 6 秒的 WebSocket 尝试），并把上游
 * 响应体与错误原文回传，属于「开发诊断工具」，不应在公网可达的部署里开放。
 *
 * 默认关闭；需要排查 TTS 时在 NAS 的 .env 里临时设 ENABLE_TTS_DEBUG=true 并重建容器。
 */
const DEBUG_ENABLED = process.env.ENABLE_TTS_DEBUG === 'true';

export async function GET(req: NextRequest) {
  if (!DEBUG_ENABLED) {
    // 对外表现得像路由不存在，避免暴露诊断面的存在
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }
  const ip = getClientIp(req);
  const limit = rateLimit('tts-debug:' + ip, TTS_DEBUG_LIMIT);
  if (!limit.ok) {
    return NextResponse.json({ error: `请求太频繁，请 ${limit.retryAfter} 秒后再试` }, { status: 429 });
  }

  const results: Record<string, any> = {};
  const date = new Date().toUTCString();

  // 测试 1: edge.microsoft.com /tts/cfg/security
  try {
    const r = await fetch('https://edge.microsoft.com/tts/cfg/security', {
      headers: {
        'x-client-birth': date, 'x-client-current': date,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      },
      signal: AbortSignal.timeout(5000),
    });
    results.edge_microsoft = { status: r.status, body: (await r.text()).slice(0, 100) };
  } catch (e: unknown) { results.edge_microsoft = e instanceof Error ? e.message : String(e); }

  // 测试 2: speech.platform.bing.com 只有 TrustedClientToken (无 Sec-MS-GEC)
  try {
    const TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
    const connId = randomUUID().replaceAll('-', '');
    const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TOKEN}&ConnectionId=${connId}`;

    const ws = new WebSocket(wsUrl, {
      host: 'speech.platform.bing.com',
      origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.66 Safari/537.36 Edg/103.0.1264.44',
      },
      timeout: 5000,
    });

    let opened = false;
    ws.on('open', () => { opened = true; ws.close(); });
    ws.on('error', (e: Error) => { results.ws_no_sec = `error: ${e.message}`; });
    await new Promise<void>((r) => setTimeout(r, 6000));
    results.ws_no_sec = opened ? 'connected (will close)' : 'not opened';
  } catch (e: unknown) { results.ws_no_sec = e instanceof Error ? e.message : String(e); }

  // 测试 3: api-edge.bing.com
  try {
    const r = await fetch('https://api-edge.bing.com/tts', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000),
    });
    results.api_edge_bing = { status: r.status };
  } catch (e: unknown) { results.api_edge_bing = e instanceof Error ? e.message : String(e); }

  return NextResponse.json(results);
}