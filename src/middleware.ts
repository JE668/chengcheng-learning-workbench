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
 */
const COOKIE_NAME = 'session';

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
  // 排除静态资源 / 图片 / 媒体 / PDF，避免每个静态请求都跑一遍中间件
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|mp4|webm|mp3|pdf)$).*)',
  ],
};
