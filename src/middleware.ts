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
 * 另含「受保护媒体软闸」：课本 PDF（/textbooks）与 RAZ 音视频（/raz）在公网部署
 * （公网 IP + 反代）时须登录才能取，防止猜 URL 直接下载；已登录浏览器的
 * <img>/<video>/fetch 会自带 session cookie，正常放行。
 */
const COOKIE_NAME = 'session';

// 受保护的学习媒体前缀：课本 PDF / RAZ 音视频。公网暴露（公网 IP + 反代）时，
// 这些资源必须登录才能取，防止「猜 URL 直接下载」造成内容裸奔。
// 已登录浏览器的 <img>/<video>/fetch 会自带 session cookie，正常放行；只挡裸取。
const PROTECTED_MEDIA_PREFIXES = ['/textbooks/', '/raz/'];

// 公开 API：登录/登出、cron（自带 CRON_SECRET）、TTS（免费公开语音代理，已限流）
function isPublicApi(pathname: string): boolean {
  return (
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/api/tts')
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has(COOKIE_NAME);

  // 受保护媒体（课本 PDF / RAZ 视频）：软闸——未登录直接取资源则拦下。
  // 导航请求（人在地址栏敲 URL）跳登录页；接口式请求（<img>/<video>/fetch）返回 401。
  if (PROTECTED_MEDIA_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!hasSession) {
      if (req.headers.get('sec-fetch-mode') === 'navigate') {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        url.search = '';
        return NextResponse.redirect(url);
      }
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 });
    }
    return NextResponse.next();
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
  // 但 /textbooks、/raz 下的 PDF/视频/图片必须显式纳入中间件做登录软闸
  //（否则上面那条正则会因 .pdf/.mp4 后缀把它们排除，软闸失效）。
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|mp4|webm|mp3|pdf)$).*)',
    '/textbooks/:path*',
    '/raz/:path*',
  ],
};
