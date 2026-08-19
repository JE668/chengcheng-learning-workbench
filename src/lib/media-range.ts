/**
 * 把 HTTP Range 请求头解析为「文件内的字节区间」(单段，视频/音频播放场景足够)。
 *
 * 浏览器 <video>/<audio> 播放时会发 `Range: bytes=0-` 探测服务端是否支持分段；
 * 本模块只负责「把字符串解析成 {start,end,total}」，不碰 IO，方便单测。
 *
 * 支持的写法：
 *   - bytes=0-            → 从 0 到末尾
 *   - bytes=100-200       → 闭区间 [100,200]
 *   - bytes=100-          → 从 100 到末尾
 *   - bytes=-500          → 末尾 500 字节
 * 其它（多段 / 格式非法）返回 null，调用方应回退为「整文件 200」。
 */
export interface ByteRange {
  start: number;
  end: number; // 闭区间末尾（含）
  total: number;
}

export function parseByteRange(header: string | null, total: number): ByteRange | null {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m) return null; // 多段或不合法 → 不支持，回退整文件
  const [, s, e] = m;
  if (s === '' && e === '') return null;
  let start: number;
  let end: number;
  if (s === '') {
    // bytes=-500 → 末尾 500 字节
    const suffix = Number(e);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, total - suffix);
    end = total - 1;
  } else {
    start = Number(s);
    end = e === '' ? total - 1 : Number(e);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    if (start > end) return null;
    if (start >= total) return null; // 越界
    if (end >= total) end = total - 1; // 末尾可调
  }
  if (start < 0) return null;
  return { start, end, total };
}
