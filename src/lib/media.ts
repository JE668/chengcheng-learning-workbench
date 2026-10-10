/**
 * 媒体源根地址（PDF / 视频）。
 *
 * 默认空字符串 = 同源（部署后的应用自身，例如 /raz/books/AA-01.pdf）。
 *
 * 当同源直供的静态资源在国内访问不稳（速度慢或时通时断）时，可把媒体改指到任意
 * 「国内可达」的源，而无需改动任何具体文件路径：设置环境变量 NEXT_PUBLIC_MEDIA_BASE
 * 为一个「前缀」即可，所有 /raz/...、/textbooks/... 都会自动拼上它。
 *
 * 常见填法（按你选用的镜像/存储调整）：
 *   - GitHub raw 镜像（ghproxy 风格，整条原始 URL 作前缀）：
 *     https://gh.felicity.ac.cn/https://github.com/JE668/chengcheng-learning-workbench/raw/main
 *   - GitHub raw 镜像（owner/repo/raw/branch 风格）：
 *     https://gh.felicity.ac.cn/JE668/chengcheng-learning-workbench/raw/main
 *   - 对象存储 + CDN（R2 / 阿里云 OSS / 腾讯云 COS 等，把 public/ 内容同步过去）：
 *     https://your-cdn.example.com
 *
 * 注意：跨域（镜像/对象存储）提供 PDF 时，需该源返回
 *   Access-Control-Allow-Origin: * （PDF.js 用 fetch 取 PDF，否则跨域失败）。
 * 视频 <video> 跨域同样需要 CORS 头（或改为同源）。
 */
const RAW = (process.env.NEXT_PUBLIC_MEDIA_BASE || '').trim().replace(/\/+$/, '');

/** 把应用内的媒体相对路径（如 /raz/books/x.pdf）解析为最终 URL。 */
export function mediaUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  // 同源：改走 /api/media 路由（serve-media.ts），不再用 public/ 静态直出。
  // ⚠️ 原因（2026-10 实测，15.5.24/15.5.27 一致）：静态直出自带 ETag/Last-Modified +
  // max-age=0，安卓/Edge 的媒体框架缓存后会发「Range + If-None-Match」请求，
  // 静态层在再验证命中时回 304 并完全忽略 Range —— 安卓媒体框架对 Range 强制要求 206，
  // 空体 304 即拒播（PDF.js 走 fetch、304 无害，所以症状是「视频黑屏、PDF 正常」）。
  // 中间层拦截不可行：Next 15.5 对静态扩展名请求跳过 middleware，
  // beforeFiles 重写也拦不到 public/ 文件。/api/media 是 route handler：
  // 永不回 304、Range/206 齐全、Cache-Control 由代码掌控（private, max-age=86400），
  // 鉴权为「有效会话或同源 Referer」（9848910），应用内 <video>/PDF.js/新窗口链接均满足。
  // 若你的反代环境下媒体异常，请分别「绕过反代直连容器端口」与「走反代」各 curl 一次对比。
  if (!RAW) return '/api/media' + p;
  return `${RAW}${p}`;
}

export const MEDIA_BASE = RAW;
