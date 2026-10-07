// @vitest-environment node
/**
 * 限流器**核心逻辑**回归测试。
 *
 * 为什么单独写这个文件（对应全量审查 H1）：
 * 原先 rate-limit.test.ts 只覆盖了**账号级锁定**（recordLoginFailure /
 * clearLoginFailure / loginLockout），而主限流函数 `rateLimit()` 与
 * `getClientIp()` 一个用例都没有 —— 而它们恰恰是全文件最需要回归保护的部分。
 *
 * `getClientIp` 刻意取 X-Forwarded-For 的**最后一跳**（rate-limit.ts 注释写明：
 * "原来取第一个值等于把限流 key 交给攻击者"）。这是一次**真实修过的安全漏洞**，
 * 却没有任何测试锁住它 —— 下次重构极易改回第一跳而无人察觉。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getClientIp, rateLimit, type RateLimitRule } from './rate-limit';

let keySeq = 0;
/** 每个用例用独立 key，避开模块级内存状态互相干扰。 */
function freshKey(tag: string): string {
  return `test:${tag}:${++keySeq}:${Math.random()}`;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getClientIp · 必须取 XFF 最后一跳（安全回归）', () => {
  it('多个 XFF 值时取**最后一个**（反代追加真实 IP，伪造值在前面）', () => {
    const req = new Request('http://x', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.9.9.9' },
    });
    expect(getClientIp(req)).toBe('9.9.9.9');
  });

  it('⚠️ 回归：改回取第一跳就会让攻击者用假 IP 绕过限流', () => {
    // 攻击者每次请求自带一个随机 XFF 首值 —— 若实现取第一个，
    // 每次请求的限流 key 都不同，限流形同虚设。
    const fake1 = new Request('http://x', { headers: { 'x-forwarded-for': '250.250.250.250' } });
    const fake2 = new Request('http://x', { headers: { 'x-forwarded-for': '251.251.251.251' } });
    // 单值时首尾一致，下面这条锁定「单值」也要正确
    expect(getClientIp(fake1)).toBe('250.250.250.250');
    expect(getClientIp(fake2)).toBe('251.251.251.251');

    // 关键断言：带伪造前缀时，key 必须取**后缀**而不是前缀
    const spoofed = new Request('http://x', {
      headers: { 'x-forwarded-for': '1.1.1.1, 203.0.113.9' },
    });
    expect(getClientIp(spoofed)).not.toBe('1.1.1.1');
    expect(getClientIp(spoofed)).toBe('203.0.113.9');
  });

  it('XFF 前后空白与多余逗号要正确裁剪', () => {
    const req = new Request('http://x', {
      headers: { 'x-forwarded-for': '  1.1.1.1 ,  2.2.2.2  ,  3.3.3.3 ' },
    });
    expect(getClientIp(req)).toBe('3.3.3.3');
  });

  it('无 XFF 时回退 x-real-ip', () => {
    const req = new Request('http://x', { headers: { 'x-real-ip': '8.8.8.8' } });
    expect(getClientIp(req)).toBe('8.8.8.8');
  });

  it('XFF 优先于 x-real-ip', () => {
    const req = new Request('http://x', {
      headers: { 'x-forwarded-for': '9.9.9.9', 'x-real-ip': '8.8.8.8' },
    });
    expect(getClientIp(req)).toBe('9.9.9.9');
  });

  it('两个头都没有时返回 unknown（不抛错）', () => {
    expect(getClientIp(new Request('http://x'))).toBe('unknown');
  });
});

describe('rateLimit · 固定窗口限流', () => {
  const rule: RateLimitRule = { windowSeconds: 60, maxRequests: 3 };

  it('窗口内前 N 次放行，第 N+1 次拒绝', () => {
    const key = freshKey('basic');
    expect(rateLimit(key, rule).ok).toBe(true);
    expect(rateLimit(key, rule).ok).toBe(true);
    expect(rateLimit(key, rule).ok).toBe(true);
    const denied = rateLimit(key, rule);
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.retryAfter).toBeGreaterThan(0);
  });

  it('remaining 随调用递减', () => {
    const key = freshKey('remaining');
    const first = rateLimit(key, rule);
    expect(first.ok && first.remaining).toBe(rule.maxRequests - 1);
    const second = rateLimit(key, rule);
    expect(second.ok && second.remaining).toBe(rule.maxRequests - 2);
  });

  it('窗口过期后自动恢复放行', () => {
    const key = freshKey('expiry');
    for (let i = 0; i < 3; i++) rateLimit(key, rule);
    expect(rateLimit(key, rule).ok).toBe(false);
    // 推进时间越过窗口
    vi.advanceTimersByTime(61_000);
    expect(rateLimit(key, rule).ok).toBe(true);
  });

  it('不同 key 互不影响', () => {
    const a = freshKey('iso-a');
    const b = freshKey('iso-b');
    for (let i = 0; i < 3; i++) rateLimit(a, rule);
    expect(rateLimit(a, rule).ok).toBe(false);
    expect(rateLimit(b, rule).ok).toBe(true);
  });

  it('被拒的调用不消耗额外配额（不推进计数）', () => {
    const key = freshKey('noconsume');
    for (let i = 0; i < 3; i++) rateLimit(key, rule);
    for (let i = 0; i < 10; i++) expect(rateLimit(key, rule).ok).toBe(false);
    vi.advanceTimersByTime(61_000);
    // 配额没有被那 10 次拒绝消耗掉，所以一恢复就能拿回完整额度
    const first = rateLimit(key, rule);
    expect(first.ok && first.remaining).toBe(rule.maxRequests - 1);
  });
});
