// @vitest-environment node
/**
 * push endpoint 的 SSRF 防护测试。
 *
 * 背景：这个值会被存进数据库，之后由 web-push 主动向它发起 POST。若不校验，
 * 任何登录用户（含孩子账号）都能填成家庭内网地址（如 https://192.168.1.1/），
 * 把服务器变成内网探测器。该函数此前**零测试覆盖**。
 */
import { describe, expect, it } from 'vitest';
import { isSafePushEndpoint } from '@/lib/push-endpoint';

describe('isSafePushEndpoint · SSRF 防护', () => {
  it('真实浏览器推送网关应放行', () => {
    for (const e of [
      'https://fcm.googleapis.com/fcm/send/abc123',
      'https://updates.push.services.mozilla.com/wpush/v2/xyz',
      'https://web.push.apple.com/abc',
      'https://wns2-by3p.notify.windows.com/w/?token=abc',
    ]) {
      expect(isSafePushEndpoint(e), e).toBe(true);
    }
  });

  it('必须 https：http 会导致明文传输推送凭据', () => {
    expect(isSafePushEndpoint('http://fcm.googleapis.com/x')).toBe(false);
    expect(isSafePushEndpoint('ftp://a.example.com/x')).toBe(false);
    expect(isSafePushEndpoint('javascript:alert(1)')).toBe(false);
    expect(isSafePushEndpoint('data:text/plain,hi')).toBe(false);
  });

  it('内网 / 本机地址必须拒绝（SSRF 的核心）', () => {
    for (const e of [
      'https://192.168.1.1/notify',
      'https://10.0.0.5/x',
      'https://172.16.0.1/x',
      'https://127.0.0.1/x',
      'https://localhost/x',
      'https://router.local/x',
      'https://nas.internal/x',
      'https://foo.localhost/x',
      'https://[::1]/x',
      'https://[fd00::1]/x',
    ]) {
      expect(isSafePushEndpoint(e), e).toBe(false);
    }
  });

  it('畸形输入必须拒绝而不是抛错', () => {
    for (const e of ['', 'not a url', 'https://', '://x', 'https://.']) {
      expect(isSafePushEndpoint(e), JSON.stringify(e)).toBe(false);
    }
  });

  it('⚠️ 绕过尝试：内网 IP 用十进制/八进制表示也必须拒绝', () => {
    // 2130706433 === 127.0.0.1 的十进制形式；Node 的 URL 会把它规范化为 127.0.0.1，
    // 但我们不依赖解析结果，只要求 hostname 含点且非 IP 字面量 —— 双重保险。
    for (const e of ['https://2130706433/x', 'https://0x7f000001/x', 'https://127.1/x']) {
      const r = isSafePushEndpoint(e);
      // 要么直接拒绝，要么被 URL 规范化成带点的 IP 后拒绝；不接受 true
      expect(r, e).toBe(false);
    }
  });
});
