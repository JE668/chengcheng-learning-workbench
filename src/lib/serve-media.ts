import { createReadStream, promises as fsp } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { parseByteRange, type ByteRange } from './media-range';

/** 登录软闸用的 cookie 名，须与 middleware.ts 的 COOKIE_NAME 保持一致。 */
const COOKIE_NAME = 'session';

const MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/** 从请求头里抠出 session cookie 的值（标准 Request 不解析 cookie，手动解析以兼容单测）。 */
function getCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.get('cookie');
  if (!raw) return undefined;
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

/**
 * 判断请求是否来自「同源页面」。
 * 只比对 host（含端口），忽略协议（http/https 都算同源：局域网直连是 http，
 * 反代对外是 https，都是自家）。用于软闸放行：同源页面内的 <video>/<img>/fetch
 * 自带同源 Referer，说明是「自家人打开的页面」，应放行；只有无 Referer 也无
 * cookie 的裸取（外人猜 URL）才拦截，保留防盗链本意。
 */
function isSameOriginReferer(referer: string | null, host: string | null): boolean {
  if (!referer || !host) return false;
  try {
    return new URL(referer).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * 把本地可读流桥接成 Web ReadableStream（用于 Range 分段流式返回）。
 * 视频分段必须流式，不能整文件读进内存（否则大视频爆内存）。
 * 用 node:stream 的 Readable.toWeb 产出与 DOM ReadableStream 类型一致的流，
 * 避免 Node / DOM 两套 ReadableStream 类型互相不兼容导致 tsc 报错。
 */
function nodeToWeb(node: Readable): ReadableStream<Uint8Array> {
  return Readable.toWeb(node) as unknown as ReadableStream<Uint8Array>;
}

/**
 * 受保护媒体的统一服务逻辑（同源 /api/media 背后调用）：
 *  - 登录软闸：无 session cookie → 401（与 middleware 一致，防裸取）；
 *  - 目录穿越防护：relPath 必须落在 rootDir 内，否则 403；
 *  - HTTP Range：支持 `bytes=start-end`，返回 206 + Content-Range，让 <video> 正常流式播放；
 *  - 同源返回标准 Response，既能在 Next 路由里用，也能在 vitest 里直接用 Node 的 Request 测。
 *
 * @param req       标准 Request（取 Range 头与 cookie）
 * @param relPath   媒体相对路径，如 "raz/videos/AA-01.mp4"
 * @param rootDir   媒体根目录，默认 process.cwd()/public（部署时即 /app/public）
 */
export async function serveMedia(req: Request, relPath: string, rootDir?: string): Promise<Response> {
  // 1) 登录软闸：无 session 且非同源页面请求 → 401（防外人裸取 URL 下载）。
  //    已登录、或同源页面内发起的请求（<video>/<img>/fetch 自带同源 Referer）均放行，
  //    避免把孩子平板（登录态过期但未登录）误挡成黑屏——这正是「加了防盗链后播不了」的根因。
  const session = getCookie(req, COOKIE_NAME);
  const referer = req.headers.get('referer');
  const host = req.headers.get('host');
  if (!session && !isSameOriginReferer(referer, host)) {
    return new Response(JSON.stringify({ error: '未登录或登录已过期' }), {
      status: 401,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  // 2) 路径归一化 + 目录穿越防护
  const root = path.resolve(rootDir ?? path.join(process.cwd(), 'public'));
  const safeRel = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const abs = path.resolve(root, safeRel);
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    return new Response('Forbidden', { status: 403 });
  }

  // 3) 文件存在性
  let stat;
  try {
    stat = await fsp.stat(abs);
  } catch {
    return new Response('Not Found', { status: 404 });
  }
  if (!stat.isFile()) return new Response('Not Found', { status: 404 });

  const ext = path.extname(abs).toLowerCase();
  const contentType = MIME[ext] ?? 'application/octet-stream';
  const total = stat.size;
  const range = parseByteRange(req.headers.get('range'), total);

  const headers: Record<string, string> = {
    'content-type': contentType,
    'accept-ranges': 'bytes',
    'cache-control': 'private, max-age=86400',
    'content-disposition': 'inline',
  };

  if (range) {
    const { start, end } = range;
    const chunkSize = end - start + 1;
    const node = createReadStream(abs, { start, end });
    headers['content-range'] = `bytes ${start}-${end}/${total}`;
    headers['content-length'] = String(chunkSize);
    return new Response(nodeToWeb(node), {
      status: 206,
      headers,
    });
  }

  // 整文件（无 Range / 非法 Range）
  const node = createReadStream(abs);
  headers['content-length'] = String(total);
  return new Response(nodeToWeb(node), {
    status: 200,
    headers,
  });
}

export type { ByteRange };
