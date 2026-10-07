// @vitest-environment node
/**
 * CSRF 防护回归测试（middleware 层）。
 *
 * 背景（真实缺陷）：session cookie 是 `sameSite: 'lax'`，而本项目全部写操作都是 POST。
 * 跨站表单可以用 `text/plain` / `form-urlencoded` 这类「简单请求」发出 —— 不触发 CORS 预检，
 * 浏览器照发 —— 于是外部页面可借家长登录态调用 /api/castle/grant 等写接口。
 * 修复：middleware 对所有非安全方法做跨站判定（Sec-Fetch-Site 优先，回退 Origin vs Host）。
 */
import { describe, expect, it } from 'vitest';
import { middleware } from '@/middleware';
import type { NextRequest } from 'next/server';

function makeReq(opts: {
  method: string;
  host?: string;
  origin?: string;
  secFetchSite?: string;
  path?: string;
}): NextRequest {
  const headers: Record<string, string> = {
    host: opts.host ?? 'study.example.com',
  };
  if (opts.origin) headers.origin = opts.origin;
  if (opts.secFetchSite) headers['sec-fetch-site'] = opts.secFetchSite;
  return new Request('http://' + headers.host + (opts.path ?? '/api/castle/grant'), {
    method: opts.method,
    headers,
  }) as unknown as NextRequest;
}

/** middleware 需要 nextUrl / cookies，取中间件关心的最小面即可。 */
function withNextBits(req: NextRequest, path: string, hasSession: boolean): NextRequest {
  const url = new URL('http://x' + path);
  Object.defineProperty(req, 'nextUrl', {
    value: {
      pathname: path,
      clone: () => ({ pathname: '/login', search: '' }),
      get search() {
        return '';
      },
    },
    configurable: true,
  });
  Object.defineProperty(req, 'cookies', {
    value: { has: () => hasSession },
    configurable: true,
  });
  return req;
}

function run(opts: Parameters<typeof makeReq>[0], hasSession = true) {
  const path = opts.path ?? '/api/castle/grant';
  const req = withNextBits(makeReq(opts), path, hasSession);
  return middleware(req);
}

describe('CSRF · 跨站写请求必须被拒绝', () => {
  it('攻击形态：evil.com 的表单 POST（Origin 不同 + Sec-Fetch-Site: cross-site）', () => {
    const res = run({
      method: 'POST',
      origin: 'https://evil.com',
      secFetchSite: 'cross-site',
    });
    expect(res.status).toBe(403);
  });

  it('仅凭 Sec-Fetch-Site: cross-site 即可拦截（浏览器强制头不可伪造）', () => {
    const res = run({ method: 'POST', secFetchSite: 'cross-site' });
    expect(res.status).toBe(403);
  });

  it('无 Sec-Fetch-Site 时回退 Origin 比对：不同 host 必须拒绝', () => {
    const res = run({ method: 'POST', origin: 'http://attacker.internal' });
    expect(res.status).toBe(403);
  });

  it('同源 POST（Origin === Host）必须放行 —— 正常业务不能被打断', () => {
    const res = run({ method: 'POST', origin: 'https://study.example.com' });
    expect(res.status).not.toBe(403);
  });

  it('Sec-Fetch-Site: same-origin 必须放行', () => {
    const res = run({ method: 'POST', secFetchSite: 'same-origin' });
    expect(res.status).not.toBe(403);
  });

  it('同站（same-site，如 http→https）必须放行', () => {
    const res = run({ method: 'POST', secFetchSite: 'same-site' });
    expect(res.status).not.toBe(403);
  });
});

describe('CSRF · 不能误伤正常请求', () => {
  it('GET 不校验（安全方法）', () => {
    const res = run({ method: 'GET', secFetchSite: 'cross-site', origin: 'https://evil.com' });
    expect(res.status).not.toBe(403);
  });

  it('非浏览器客户端（无 Origin、无 Sec-Fetch-Site）放行 —— curl/E2E 直连', () => {
    const res = run({ method: 'POST' });
    expect(res.status).not.toBe(403);
  });

  it('无 Origin 但有 same-origin 头时放行', () => {
    const res = run({ method: 'POST', secFetchSite: 'same-origin' });
    expect(res.status).not.toBe(403);
  });

  it('登录接口（公开路由）跨站也应被拒 —— login 不豁免 CSRF', () => {
    const res = run({ method: 'POST', secFetchSite: 'cross-site', path: '/api/auth/login' });
    expect(res.status).toBe(403);
  });
});
