import type { NextRequest } from 'next/server';
import { serveMedia } from '@/lib/serve-media';

// 媒体服务需读磁盘 + 流式返回，必须用 Node.js 运行时（不能用 Edge）。
export const runtime = 'nodejs';
// 每个请求按路径/Range 动态返回，禁止被静态化。
export const dynamic = 'force-dynamic';

/**
 * 受保护媒体统一入口：课本 PDF / RAZ 绘本 PDF / RAZ 动画视频。
 * - 同源访问经此路由，自带登录软闸，且始终返回「整文件 200 流式」，
 *   不依赖 HTTP Range/206（移动端浏览器对 Range 流式兼容性差，206 易导致视频加载不出）。
 * - middleware 的 matcher 因后缀负向前瞻排除项（.mp4/.pdf 等），不会截到 /api/media，
 *   故本路由自行完成登录软闸，无双重鉴权。
 * - 直接裸取 /raz/*、/textbooks/* 静态路径仍由 middleware 兜底拦截（需登录）。
 */
export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const rel = (params.path ?? []).join('/');
  return serveMedia(req, rel);
}
