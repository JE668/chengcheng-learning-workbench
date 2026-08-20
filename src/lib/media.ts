/**
 * 媒体源根地址（PDF / 视频）。
 *
 * 默认空字符串 = 同源（部署后的应用自身，例如 /raz/books/AA-01.pdf）。
 *
 * 国内访问 Vercel 静态资源不稳时，可把媒体改指到任意「国内可达」的源，
 * 而无需改动任何具体文件路径：设置环境变量 NEXT_PUBLIC_MEDIA_BASE 为一
 * 个「前缀」即可，所有 /raz/...、/textbooks/... 都会自动拼上它。
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
  if (!RAW) return p; // 同源：直接走 public/ 静态直出（Range 由标准静态服务器/Next 原生处理，
  // 比 /api/media 的流式 206 更不易被反代缓冲破坏；防盗链由 middleware 的 /raz、/textbooks 软闸负责）。
  return `${RAW}${p}`;
}

export const MEDIA_BASE = RAW;
