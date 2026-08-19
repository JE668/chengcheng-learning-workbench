import { createReadStream, promises as fsp } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';

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
 *  - 始终「整文件 200 流式返回」，**不依赖 HTTP Range**：
 *    部分反代（如 lucky）会破坏 <video> 的 Range/206 流式，导致视频加载不出；
 *    而 PDF 走整文件 GET 能正常代理。让视频也走整文件 200，行为与 PDF 一致，
 *    从而绕开反代对 Range 的破坏。代价是视频不可拖动进度（seek）。
 *  - 同源返回标准 Response，既能在 Next 路由里用，也能在 vitest 里直接用 Node 的 Request 测。
 *
 * @param req       标准 Request（取 cookie）
 * @param relPath   媒体相对路径，如 "raz/videos/AA-01.mp4"
 * @param rootDir   媒体根目录，默认 process.cwd()/public（部署时即 /app/public）
 */
export async function serveMedia(req: Request, relPath: string, rootDir?: string): Promise<Response> {
  // 1) 登录软闸
  const session = getCookie(req, COOKIE_NAME);
  if (!session) {
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

  // 始终整文件 200 流式返回：绕开反代对 Range/206 的破坏（见文件头注释）。
  const headers: Record<string, string> = {
    'content-type': contentType,
    'cache-control': 'private, max-age=86400',
    'content-disposition': 'inline',
    'content-length': String(total),
  };

  const node = createReadStream(abs);
  return new Response(nodeToWeb(node), {
    status: 200,
    headers,
  });
}
