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

/**
 * 从请求头里抠出 session cookie 的值（标准 Request 不解析 cookie，手动解析以兼容单测）。
 *
 * ⚠️ decodeURIComponent 必须包 try/catch：`Cookie: session=%` 或 `session=%zz`
 * 这类畸形百分号编码会抛 URIError，原实现未捕获 → 匿名请求即可让 /api/media
 * 返回 500（廉价 DoS）。
 */
function getCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.get('cookie');
  if (!raw) return undefined;
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) {
      try {
        return decodeURIComponent(v.join('='));
      } catch {
        // 畸形编码：按原样返回，仍会被下面的有效性校验拦下
        return v.join('=');
      }
    }
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
 * 默认会话校验：查 sessions 表确认 token 真实存在且未过期。
 *
 * 放在函数体内动态 require，是为了避免本模块被单测直接 import 时
 * 就连上数据库（serve-media 本身不依赖 DB，只有真正需要鉴权时才碰）。
 */
const defaultVerifySession = async (token: string): Promise<boolean> => {
  try {
    const { getDb } = await import('./db-core');
    const ttl = Number(process.env.SESSION_TTL_DAYS) || 7;
    const res = await getDb().execute({
      sql: `SELECT 1 FROM sessions
            WHERE token = ?
              AND created_at > datetime('now', '-' || ? || ' days')`,
      args: [token, ttl],
    });
    return res.rows.length > 0;
  } catch (e) {
    // 校验本身失败时**不放行**（fail-closed）：宁可让孩子平板黑屏，
    // 也不能因为一次 DB 抖动就把全部课本/视频敞开。
    console.error('[serve-media] 会话校验失败，按未登录处理:', e instanceof Error ? e.message : e);
    return false;
  }
};

/**
 * 受保护媒体的统一服务逻辑（同源 /api/media 背后调用）：
 *  - 会话校验：携带的 session token 必须**在库里真实有效**，否则 401；
 *  - 目录穿越防护：relPath 必须落在 rootDir 内，否则 403；
 *  - HTTP Range：支持 `bytes=start-end`，返回 206 + Content-Range，让 <video> 正常流式播放；
 *  - 同源返回标准 Response，既能在 Next 路由里用，也能在 vitest 里直接用 Node 的 Request 测。
 *
 * @param req       标准 Request（取 Range 头与 cookie）
 * @param relPath   媒体相对路径，如 "raz/videos/AA-01.mp4"
 * @param rootDir   媒体根目录，默认 process.cwd()/public（部署时即 /app/public）
 * @param verifySession 可选的会话校验函数（默认走 lib/auth 的真值校验）。
 *                      单测可注入桩函数，避免依赖真实数据库。
 */
export async function serveMedia(
  req: Request,
  relPath: string,
  rootDir?: string,
  verifySession: (token: string) => Promise<boolean> = defaultVerifySession
): Promise<Response> {
  // 1) 会话闸：token 必须**真实有效**，不能只看 cookie 是否存在。
  //    ⚠️ 原实现只判 `!session`（存在性），于是 `Cookie: session=null`、
  //    `session=0`、`session=undefined` 这类任意非空值都能通过，
  //    拿到全部课本 PDF 与 RAZ 视频 —— 而 middleware.ts 的注释
  //    「伪造 cookie 会被 getCurrentUser 拦下」在本路径上并不成立
  //    （/api/media 直接调用 serveMedia，没有二次鉴权）。
  //
  //    同源页面内的 <video>/<img>/fetch 放行：反代下 req host 与浏览器 Referer host
  //    可能不一致（lucky 等），硬校验会导致安卓 Edge 黑屏；私有家庭部署下
  //    「猜 URL 直取媒体」风险可忽略。
  const session = getCookie(req, COOKIE_NAME);
  const referer = req.headers.get('referer');
  const host = req.headers.get('host');
  // 校验函数自身抛错（DB 抖动/超时）时按「未登录」处理而非冒泡成 500 ——
  // 否则一次数据库抖动就会让全部课本与视频请求集体报错。
  let sessionValid = false;
  if (session) {
    try {
      sessionValid = await verifySession(session);
    } catch (e) {
      console.error(
        '[serve-media] 会话校验异常，按未登录处理:',
        e instanceof Error ? e.message : e
      );
      sessionValid = false;
    }
  }
  if (!sessionValid && !isSameOriginReferer(referer, host)) {
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
  // ⚠️ 0 字节文件必须早退：parseByteRange('bytes=-500', 0) 会返回
  // {start:0, end:-1}，随后 createReadStream(abs, {start:0, end:-1}) 会
  // **同步抛出** ERR_OUT_OF_RANGE（不是流上的异步 error），直接冒泡成 500。
  // 对空文件发一个 Range 头即可触发，属可被数据触发的崩溃。
  if (total === 0) {
    return new Response(null, {
      status: 200,
      headers: {
        'content-type': contentType,
        'accept-ranges': 'none',
        'content-length': '0',
        'cache-control': 'private, max-age=86400',
      },
    });
  }
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
