import { NextResponse, type NextRequest } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  await clearSessionCookie();
  // 使用当前部署域名的 origin，避免回退到 localhost
  return NextResponse.redirect(new URL('/login', request.nextUrl.origin));
}
