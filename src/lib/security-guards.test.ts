/**
 * P0 安全控制的回归测试（承接 src/lib/api-reward-guard.test.ts）。
 *
 * 覆盖此前只能用「读代码」验证的三项控制：
 *   1. 限流 key 的 IP 解析：必须取 X-Forwarded-For 的最后一跳，否则攻击者
 *      换一个伪造 IP 就能绕过全部限流；
 *   2. 推送 endpoint 的 SSRF 校验：必须拒绝内网地址；
 *   3. tts-debug 默认关闭：诊断端点不应在公网部署里开放。
 */
import { describe, expect, it } from 'vitest';
import type { NextRequest } from 'next/server';

import { getClientIp } from '@/lib/rate-limit';
import { isSafePushEndpoint } from '@/lib/push-endpoint';
import { GET as ttsDebugGET } from '@/app/api/tts-debug/route';

describe('限流 IP 解析（防 X-Forwarded-For 伪造）', () => {
  it('取最后一跳，而不是第一个', () => {
    const req = new Request('http://x/', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientIp(req)).toBe('5.6.7.8');
  });

  it('前缀里塞多个伪造 IP 也不影响结果', () => {
    const req = new Request('http://x/', {
      headers: { 'x-forwarded-for': '9.9.9.9, 10.0.0.1, 203.0.113.7' },
    });
    expect(getClientIp(req)).toBe('203.0.113.7');
  });

  it('没有 XFF 时退回 x-real-ip', () => {
    const req = new Request('http://x/', { headers: { 'x-real-ip': '198.51.100.9' } });
    expect(getClientIp(req)).toBe('198.51.100.9');
  });

  it('两者都没有时返回 unknown（同一共享桶）', () => {
    expect(getClientIp(new Request('http://x/'))).toBe('unknown');
  });
});

describe('推送 endpoint SSRF 防护', () => {
  it('放行正常的 https 推送服务域名', () => {
    expect(isSafePushEndpoint('https://fcm.googleapis.com/fcm/send/abc')).toBe(true);
    expect(isSafePushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/xyz')).toBe(true);
    expect(isSafePushEndpoint('https://web.push.apple.com/xyz')).toBe(true);
  });

  it('拒绝非 https', () => {
    expect(isSafePushEndpoint('http://fcm.googleapis.com/x')).toBe(false);
  });

  it('拒绝内网 / 回环 / 本地地址（SSRF 的核心）', () => {
    expect(isSafePushEndpoint('https://192.168.1.1/hook')).toBe(false);
    expect(isSafePushEndpoint('https://10.0.0.5:8443/hook')).toBe(false);
    expect(isSafePushEndpoint('https://172.16.0.9/hook')).toBe(false);
    expect(isSafePushEndpoint('https://127.0.0.1/hook')).toBe(false);
    expect(isSafePushEndpoint('https://localhost/hook')).toBe(false);
    expect(isSafePushEndpoint('https://[::1]/hook')).toBe(false);
    expect(isSafePushEndpoint('https://nas.local/hook')).toBe(false);
    expect(isSafePushEndpoint('https://router.internal/hook')).toBe(false);
  });

  it('拒绝无法解析的字符串', () => {
    expect(isSafePushEndpoint('not a url')).toBe(false);
    expect(isSafePushEndpoint('')).toBe(false);
  });
});

describe('tts-debug 默认关闭', () => {
  it('未设置 ENABLE_TTS_DEBUG 时返回 404', async () => {
    // 测试环境没有该环境变量，模块加载时 DEBUG_ENABLED 即为 false
    const res = await ttsDebugGET({} as NextRequest);
    expect(res.status).toBe(404);
  });
});
