import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 路由级统一鉴权（软闸）。
 *
 * 说明：鉴权的「真值」仍由各处 API route / layout 内的 getCurrentUser() 比对数据库决定；
 * 本中间件只做一层统一拦截——未带 session cookie 的请求，页面跳 /login、API 直接 401，
 * 把「漏写鉴权」的概率降到最低，也避免出现「能进页面却 401」的不一致。
 *
 * 不做 DB 查询（middleware 跑在 Edge，也不应碰 DB），仅检查 cookie 是否存在；
 * 伪造 cookie 会被后续 getCurrentUser 拦下，安全边界不变。
 *
 * 媒体资源（/textbooks、/raz）不做逐字节鉴权、直接公开直出：
 * 反代（lucky 等）后 req host 与浏览器 Referer host 不一致，会导致 <video>/<img>
 * 在部分端（安卓 Edge）被 401 黑屏；私有家庭部署下「猜 URL 直取媒体」风险可忽略，
 * 应用整体仍由页面级登录保护。如需强防盗链，后续可改用签名 URL。
 */
const COOKIE_NAME = 'session';

// 媒体资源前缀（仅用于「跳过页面级登录跳转」，不做逐字节鉴权）。
const MEDIA_PREFIXES = ['/textbooks/', '/raz/'];

// 公开 API：登录/登出、cron（自带 CRON_SECRET）、TTS（免费公开语音代理，已限流）
function isPublicApi(pathname: string): boolean {
  return (
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/api/tts')
  );
}

/**
 * CSRF 防护：跨站请求伪造校验。
 *
 * ## 为什么需要
 * session cookie 是 `sameSite: 'lax'`。lax 允许跨站顶层 GET，但对 **POST 等非安全方法
 * 会拦** —— 可跨站发起的表单里，`application/x-www-form-urlencoded`、`multipart/form-data`、
 * `text/plain` 这三种属于「简单请求」，**不发 CORS 预检**，浏览器照发。
 * 而本项目全部写操作都是 POST，于是构造一个指向 `/api/castle/grant` 的跨站表单，
 * 即可借家长的登录态造币 / 发道具。
 *
 * ## 为什么放在 middleware 而不是每个 route
 * 52 个路由逐个加检查必然漏；middleware 是**唯一必经的咽喉**，一次实现覆盖全部写操作，
 * 新增路由默认受保护（与本文件既有的鉴权思路一致）。
 * 它也天然不影响单测 —— 单测直接 import handler 调用，不经过 middleware。
 *
 * ## 判定顺序（任一命中即放行）
 * 1. 安全方法（GET/HEAD/OPTIONS）—— 按 HTTP 语义不改变状态，不校验。
 * 2. `Sec-Fetch-Site` 为 `same-origin` / `same-site` —— 浏览器强制附加、**页面无法伪造**
 *    （属 forbidden header，非浏览器客户端没有这个头，走下面兜底）。这是最可靠的一条。
 * 3. 没有 `Sec-Fetch-Site`（老浏览器 / 非浏览器客户端）→ 回退比对 `Origin` 与 `Host`。
 *
 * 反代注意：本项目部署在 NAS + lucky/nginx 后面，浏览器发来的 Origin 与 Host 通常都是
 * 外层域名（反代一般原样透传 Host），可直接比对。若你的反代改写了 Host，
 * 用 ALLOWED_ORIGINS 显式声明外部域名（逗号分隔）。
 */
function isCrossSiteRequest(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return false;

  // 1) 浏览器强制头：页面脚本无法伪造
  const secFetchSite = req.headers.get('sec-fetch-site');
  if (secFetchSite) {
    return secFetchSite !== 'same-origin' && secFetchSite !== 'same-site';
  }

  // 2) 回退：比对 Origin 与 Host（部分老浏览器不发 Sec-Fetch-Site）
  const origin = req.headers.get('origin');
  if (!origin) {
    // 非浏览器客户端（curl / 脚本 / E2E 直连）：没有 Origin 头不代表跨站攻击。
    // 真正的跨站攻击必须由浏览器发起，而浏览器发起的跨站 POST 一定带 Origin。
    return false;
  }
  try {
    const originHost = new URL(origin).host.toLowerCase();
    const requestHost = req.headers.get('host')?.toLowerCase();
    if (originHost === requestHost) return false;
    // 反代改写了 Host 时的逃生门：显式声明可信外部域名。
    const allowed = (process.env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (allowed.includes(originHost) || allowed.includes(origin.toLowerCase())) return false;
    return true;
  } catch {
    // Origin 解析失败：宁可放过也不误伤正常请求（cookie 鉴权仍是兜底）
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has(COOKIE_NAME);

  // 媒体资源（课本 PDF / RAZ 音视频）：公开直出，不做登录软闸，避免跨设备/反代下黑屏。
  if (MEDIA_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // CSRF：跨站写请求一律拒绝。
  if (isCrossSiteRequest(req)) {
    return NextResponse.json({ error: '跨站请求被拒绝（CSRF）' }, { status: 403 });
  }

  // API 路由
  if (pathname.startsWith('/api/')) {
    if (isPublicApi(pathname)) return NextResponse.next();
    if (!hasSession) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // 页面路由
  // 登录页本身始终可访问；其余未登录页面统一跳登录页
  if (pathname !== '/login' && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // 排除静态资源 / 图片 / 媒体 / PDF，避免每个静态请求都跑一遍中间件。
  // /textbooks、/raz 仍显式纳入，但仅作「跳过页面级登录跳转」用——
  // 媒体本身已改为公开直出（见上方 MEDIA_PREFIXES 说明），不再逐字节鉴权。
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|mp4|webm|mp3|pdf|json)$).*)',
    '/textbooks/:path*',
    '/raz/:path*',
  ],
};
