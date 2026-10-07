// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fsp } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serveMedia } from './serve-media';
import { parseByteRange } from './media-range';

const COOKIE = 'session=abc123';

/**
 * 会话校验桩。
 *
 * ⚠️ 鉴权语义已变更：serveMedia 现在**校验 token 是否真实有效**，
 * 而不只是判断 cookie 是否存在（原先 `session=abc123` 这种任意值都能通过，
 * 等于任何人都能取走课本 PDF 与 RAZ 视频）。
 * 因此单测必须显式注入校验函数，不能再依赖「有 cookie 就算登录」。
 */
const validSession = async (token: string) => token === 'abc123';
const noSession = async () => false;

function req(
  rel: string,
  opts: { range?: string; cookie?: string; referer?: string; host?: string } = {}
) {
  const headers: Record<string, string> = { host: opts.host ?? 'localhost' };
  if (opts.range) headers.range = opts.range;
  if (opts.cookie) headers.cookie = opts.cookie;
  if (opts.referer) headers.referer = opts.referer;
  return new Request(`http://localhost/api/media/${rel}`, { headers });
}

describe('parseByteRange', () => {
  it('bytes=0- → 从头到尾', () => {
    expect(parseByteRange('bytes=0-', 100)).toEqual({ start: 0, end: 99, total: 100 });
  });
  it('bytes=10-20 → 闭区间', () => {
    expect(parseByteRange('bytes=10-20', 100)).toEqual({ start: 10, end: 20, total: 100 });
  });
  it('bytes=50- → 从 50 到尾', () => {
    expect(parseByteRange('bytes=50-', 100)).toEqual({ start: 50, end: 99, total: 100 });
  });
  it('bytes=-30 → 末尾 30 字节', () => {
    expect(parseByteRange('bytes=-30', 100)).toEqual({ start: 70, end: 99, total: 100 });
  });
  it('越界 end 被收敛到 total-1', () => {
    expect(parseByteRange('bytes=10-999', 100)).toEqual({ start: 10, end: 99, total: 100 });
  });
  it('无 Range 头 → null', () => {
    expect(parseByteRange(null, 100)).toBeNull();
  });
  it('多段 Range → null（不支持，回退整文件）', () => {
    expect(parseByteRange('bytes=0-10,20-30', 100)).toBeNull();
  });
  it('格式非法 → null', () => {
    expect(parseByteRange('items=0-10', 100)).toBeNull();
  });
});

describe('serveMedia（受保护媒体路由核心）', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'media-test-'));
    await fsp.mkdir(path.join(dir, 'raz', 'videos'), { recursive: true });
    await fsp.mkdir(path.join(dir, 'raz', 'books'), { recursive: true });
    await fsp.writeFile(path.join(dir, 'raz', 'videos', 'A.mp4'), Buffer.alloc(100, 7));
    await fsp.writeFile(path.join(dir, 'raz', 'books', 'A.pdf'), '%PDF-1.4 hello');
  });
  afterEach(async () => {
    await fsp.rm(dir, { recursive: true, force: true });
  });

  it('无 session cookie → 401', async () => {
    const res = await serveMedia(req('raz/videos/A.mp4'), 'raz/videos/A.mp4', dir, noSession);
    expect(res.status).toBe(401);
  });

  it('无 session 但有同源 Referer（页面内 <video> 发起）→ 放行 200', async () => {
    const res = await serveMedia(
      req('raz/videos/A.mp4', { referer: 'http://localhost/study/moko' }),
      'raz/videos/A.mp4',
      dir,
      validSession
    );
    expect(res.status).toBe(200);
  });

  it('无 session 且跨域 Referer → 401（仍防裸取）', async () => {
    const res = await serveMedia(
      req('raz/videos/A.mp4', { referer: 'https://evil.example.com/x' }),
      'raz/videos/A.mp4',
      dir,
      validSession
    );
    expect(res.status).toBe(401);
  });

  it('已登录 + 无 Range → 200 整文件，content-type 正确', async () => {
    const res = await serveMedia(
      req('raz/videos/A.mp4', { cookie: COOKIE }),
      'raz/videos/A.mp4',
      dir,
      validSession
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('video/mp4');
    expect(res.headers.get('accept-ranges')).toBe('bytes');
    expect(res.headers.get('content-length')).toBe('100');
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.length).toBe(100);
    expect(buf.every((b) => b === 7)).toBe(true);
  });

  it('已登录 + Range → 206 分段，Content-Range 正确', async () => {
    const res = await serveMedia(
      req('raz/videos/A.mp4', { cookie: COOKIE, range: 'bytes=10-19' }),
      'raz/videos/A.mp4',
      dir,
      validSession
    );
    expect(res.status).toBe(206);
    expect(res.headers.get('content-range')).toBe('bytes 10-19/100');
    expect(res.headers.get('content-length')).toBe('10');
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.length).toBe(10);
  });

  it('PDF 走同一路由，content-type 为 application/pdf', async () => {
    const res = await serveMedia(
      req('raz/books/A.pdf', { cookie: COOKIE }),
      'raz/books/A.pdf',
      dir,
      validSession
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
  });

  it('不存在的文件 → 404', async () => {
    const res = await serveMedia(
      req('raz/videos/NOPE.mp4', { cookie: COOKIE }),
      'raz/videos/NOPE.mp4',
      dir,
      validSession
    );
    expect(res.status).toBe(404);
  });

  it('目录穿越（../）被拦截 → 403', async () => {
    const rel = '../secret.txt';
    await fsp.writeFile(path.join(dir, 'secret.txt'), 'topsecret');
    const res = await serveMedia(req(rel, { cookie: COOKIE }), rel, dir, validSession);
    expect(res.status).toBe(403);
  });
});

// ============================================================================
// 以下为「鉴权绕过 / 畸形输入 / 空文件崩溃」三项缺陷的回归测试
// ============================================================================

describe('serveMedia · 会话必须真实有效（鉴权绕过回归）', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'media-auth-'));
    await fsp.mkdir(path.join(dir, 'raz', 'videos'), { recursive: true });
    await fsp.writeFile(path.join(dir, 'raz', 'videos', 'A.mp4'), Buffer.alloc(100, 7));
    await fsp.writeFile(path.join(dir, 'empty.mp4'), '');
  });
  afterEach(async () => {
    await fsp.rm(dir, { recursive: true, force: true });
  });

  // 这些值都曾能通过鉴权：原先只判断「cookie 是否存在」，不校验 token 真伪
  for (const fake of ['null', '0', 'undefined', 'x']) {
    it(`伪造的 session=${fake} 被拒绝 401`, async () => {
      const res = await serveMedia(
        req('raz/videos/A.mp4', { cookie: `session=${fake}` }),
        'raz/videos/A.mp4',
        dir,
        validSession
      );
      expect(res.status).toBe(401);
    });
  }

  it('真实有效的 token 放行并返回内容', async () => {
    const res = await serveMedia(
      req('raz/videos/A.mp4', { cookie: COOKIE }),
      'raz/videos/A.mp4',
      dir,
      validSession
    );
    expect(res.status).toBe(200);
    expect(Buffer.from(await res.arrayBuffer()).length).toBe(100);
  });

  it('校验函数抛错时 fail-closed（不放行，也不 500）', async () => {
    const res = await serveMedia(
      req('raz/videos/A.mp4', { cookie: COOKIE }),
      'raz/videos/A.mp4',
      dir,
      async () => {
        throw new Error('db down');
      }
    );
    // 一次 DB 抖动不应让全部媒体请求集体 500
    expect(res.status).not.toBe(200);
    expect(res.status).not.toBe(500);
  });
});

describe('serveMedia · 畸形 Cookie 不再 500', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'media-cookie-'));
    await fsp.writeFile(path.join(dir, 'a.mp4'), Buffer.alloc(10, 1));
  });
  afterEach(async () => {
    await fsp.rm(dir, { recursive: true, force: true });
  });

  // decodeURIComponent('%') / ('%zz') 抛 URIError，原实现未捕获 → 匿名可触发 500
  for (const raw of ['%', '%zz', '%E0%A4%A']) {
    it(`Cookie: session=${raw} 返回 401 而非 500`, async () => {
      const res = await serveMedia(
        req('a.mp4', { cookie: `session=${raw}` }),
        'a.mp4',
        dir,
        validSession
      );
      expect(res.status).toBe(401);
    });
  }
});

describe('serveMedia · 0 字节文件不崩溃', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'media-empty-'));
    await fsp.writeFile(path.join(dir, 'empty.mp4'), '');
  });
  afterEach(async () => {
    await fsp.rm(dir, { recursive: true, force: true });
  });

  // parseByteRange('bytes=-500', 0) → {start:0, end:-1}
  // createReadStream(..., {end:-1}) 会**同步抛** ERR_OUT_OF_RANGE → 500
  it('空文件带 Range 头返回 200 而非 500', async () => {
    const res = await serveMedia(
      req('empty.mp4', { cookie: COOKIE, range: 'bytes=-500' }),
      'empty.mp4',
      dir,
      validSession
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-length')).toBe('0');
  });

  it('空文件带任意 Range 也不崩', async () => {
    for (const range of ['bytes=0-', 'bytes=0-10', 'bytes=-1']) {
      const res = await serveMedia(
        req('empty.mp4', { cookie: COOKIE, range }),
        'empty.mp4',
        dir,
        validSession
      );
      expect(res.status, `range=${range}`).toBe(200);
    }
  });

  it('空文件不带 Range 正常返回', async () => {
    const res = await serveMedia(
      req('empty.mp4', { cookie: COOKIE }),
      'empty.mp4',
      dir,
      validSession
    );
    expect(res.status).toBe(200);
  });
});
