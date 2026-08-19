import type { NextRequest } from 'next/server';
import { serveMedia } from '@/lib/serve-media';

// 媒体服务需读磁盘 + 流式返回，必须用 Node.js 运行时（不能用 Edge）。
export const runtime = 'nodejs';
// 每个请求按路径/Range 动态返回，禁止被静态化。
export const dynamic = 'force-dynamic';

/**
 * 受保护媒体统一入口：课本 PDF / RAZ 绘本 PDF / RAZ 动画视频。
 * - 同源访问经此路由，自带登录软闸 + HTTP Range 支持，绕开 Next 中间件对静态
 *   媒体 Range 请求的处理缺陷（该缺陷会导致 <video> 在反代 + 中间件下加载不出）。
 * - 直接裸取 /raz/*、/textbooks/* 静态路径仍由 middleware 兜底拦截（需登录）。
 */
export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const rel = (params.path ?? []).join('/');
  return serveMedia(req, rel);
}
