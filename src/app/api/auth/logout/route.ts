import { NextResponse, type NextRequest } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  await clearSessionCookie();
  // 优先用浏览器发出的 Origin 头（经反代/域名访问时即为真实对外地址）；
  // 直连 IP:端口访问时 Origin 头同样是 http://<IP>:3000，均不会回退到 localhost。
  const origin = request.headers.get('origin') || request.nextUrl.origin;
  return NextResponse.redirect(new URL('/login', origin));
}
