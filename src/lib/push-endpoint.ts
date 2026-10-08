/**
 * 推送订阅 endpoint 的安全校验。
 *
 * 背景：这个值会被存进数据库，之后由 web-push 主动向它发起 POST。若不做校验，
 * 任何登录用户（包括孩子的账号）都能把它填成家庭内网地址（例如
 * https://192.168.1.1/... ），把服务器变成一个内网探测器（SSRF）。
 *
 * 这里不做严格的服务商白名单（各家浏览器用的推送网关不同，白名单容易误伤），
 * 而是要求 https + 域名，并显式排除 IP 字面量与内网后缀 —— 足以切断 SSRF。
 *
 * 独立成模块（而不是放在 route.ts 里）是为了能单元测试：
 * Next.js 只允许 route 文件导出 HTTP 方法与配置，额外导出会导致构建报错。
 */
export function isSafePushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  if (!host || !host.includes('.')) return false; // 必须是带点的域名，排除 localhost
  // ⚠️ `https://.` 能被 new URL 解析且 hostname 为 "." —— 它含点、能过上面那关，
  // 但并不是合法主机名。域名至少要含一个非点的字符，否则会被存进库、
  // 之后由 web-push 向它 POST。
  if (!/[a-z0-9]/.test(host)) return false;
  // 排除 IP 字面量：IPv4 点分十进制，或任何含冒号的 IPv6
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':')) return false;
  // 排除内网/本地后缀
  if (host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.localhost')) {
    return false;
  }
  return true;
}
