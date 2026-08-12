import { describe, expect, it } from 'vitest';
import {
  recordLoginFailure,
  clearLoginFailure,
  loginLockout,
  MAX_LOGIN_FAILS,
} from './rate-limit';

describe('登录防爆破：账号级锁定', () => {
  it('连续失败达到阈值后锁定，成功后清零可恢复', () => {
    const u = 'brute_test_user';
    clearLoginFailure(u); // 隔离

    for (let i = 0; i < MAX_LOGIN_FAILS - 1; i++) {
      recordLoginFailure(u);
      expect(loginLockout(u).ok).toBe(true); // 阈值前不锁
    }
    recordLoginFailure(u); // 第 MAX_LOGIN_FAILS 次
    const locked = loginLockout(u);
    expect(locked.ok).toBe(false);
    expect(typeof (locked as { retryAfter: number }).retryAfter).toBe('number');

    clearLoginFailure(u);
    expect(loginLockout(u).ok).toBe(true); // 清零后恢复
  });

  it('不同账号的失败计数互不影响', () => {
    const a = 'acct_a';
    const b = 'acct_b';
    clearLoginFailure(a);
    clearLoginFailure(b);
    for (let i = 0; i < MAX_LOGIN_FAILS; i++) recordLoginFailure(a);
    expect(loginLockout(a).ok).toBe(false);
    expect(loginLockout(b).ok).toBe(true); // b 未失败，不受影响
  });
});
