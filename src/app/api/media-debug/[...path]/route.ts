import type { NextRequest } from 'next/server';
import { parseByteRange } from '@/lib/media-range';

// 临时诊断端点：仅回显服务端收到的请求头与会话状态，不读取/不返回任何文件内容。
// 用于定位「桌面 Chrome 能播、安卓 Edge 不能播」的差异（重点看 range / hasSession / userAgent）。
// 定位清楚后可删除本文件。
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const rel = (params.path ?? []).join('/');
  const cookie = req.headers.get('cookie') ?? '';
  const hasSession = /(?:^|;\s*)session=/.test(cookie);
  const range = req.headers.get('range');
  const ua = req.headers.get('user-agent') ?? '';
  const accept = req.headers.get('accept') ?? '';
  // 用示意文件大小预览我的 Range 解析是否成功（不读真实文件）
  const parsedSample = parseByteRange(range, 1_000_000);

  return new Response(
    JSON.stringify(
      {
        note: '调试用：展示服务端收到的请求头与会话状态，不影响文件。',
        path: rel,
        hasSession,
        cookieLen: cookie.length,
        range,
        rangeParsedOk: parsedSample !== null,
        rangeParsed: parsedSample,
        userAgent: ua,
        accept,
      },
      null,
      2,
    ),
    { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } },
  );
}
