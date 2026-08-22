/** Debug endpoint: 直接从 Vercel 测试 edge.microsoft.com 可达性 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const date = new Date().toUTCString();
  const results: any = { date };

  // 测试 1: fetch 默认
  try {
    const r = await fetch('https://edge.microsoft.com/tts/cfg/security', {
      headers: {
        'x-client-birth': date,
        'x-client-current': date,
      },
      signal: AbortSignal.timeout(5000),
    });
    results.fetch_default = { status: r.status, body: await r.text().then(s => s.slice(0, 200)) };
  } catch (e: any) { results.fetch_default = e.message; }

  // 测试 2: fetch 带完整浏览器头
  try {
    const r = await fetch('https://edge.microsoft.com/tts/cfg/security', {
      headers: {
        'x-client-birth': date,
        'x-client-current': date,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        'Accept': 'application/json',
        'Referer': 'https://www.bing.com/',
      },
      signal: AbortSignal.timeout(5000),
    });
    results.fetch_browser = { status: r.status, body: await r.text().then(s => s.slice(0, 200)) };
  } catch (e: any) { results.fetch_browser = e.message; }

  // 测试 3: https 模块直连
  try {
    const https = require('https');
    const r = await new Promise<any>((resolve, reject) => {
      const req = https.request({
        hostname: 'edge.microsoft.com',
        path: '/tts/cfg/security',
        method: 'GET',
        headers: {
          'x-client-birth': date,
          'x-client-current': date,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        },
      }, (res) => {
        let data = '';
        res.on('data', c => { data += c; if (data.length > 200) res.destroy(); });
        res.on('end', () => resolve({ status: res.statusCode, body: data.slice(0, 200) }));
      });
      req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
      req.end();
    });
    results.https_module = r;
  } catch (e: any) { results.https_module = e.message; }

  return NextResponse.json(results, { status: 200 });
}