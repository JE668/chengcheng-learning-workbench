import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fsp } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serveMedia } from './serve-media';
import { parseByteRange } from './media-range';

const COOKIE = 'session=abc123';

function req(rel: string, opts: { range?: string; cookie?: string; referer?: string; host?: string } = {}) {
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
    const res = await serveMedia(req('raz/videos/A.mp4'), 'raz/videos/A.mp4', dir);
    expect(res.status).toBe(401);
  });

  it('无 session 但有同源 Referer（页面内 <video> 发起）→ 放行 200', async () => {
    const res = await serveMedia(
      req('raz/videos/A.mp4', { referer: 'http://localhost/study/moko' }),
      'raz/videos/A.mp4',
      dir,
    );
    expect(res.status).toBe(200);
  });

  it('无 session 且跨域 Referer → 401（仍防裸取）', async () => {
    const res = await serveMedia(
      req('raz/videos/A.mp4', { referer: 'https://evil.example.com/x' }),
      'raz/videos/A.mp4',
      dir,
    );
    expect(res.status).toBe(401);
  });

  it('已登录 + 无 Range → 200 整文件，content-type 正确', async () => {
    const res = await serveMedia(req('raz/videos/A.mp4', { cookie: COOKIE }), 'raz/videos/A.mp4', dir);
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
    );
    expect(res.status).toBe(206);
    expect(res.headers.get('content-range')).toBe('bytes 10-19/100');
    expect(res.headers.get('content-length')).toBe('10');
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.length).toBe(10);
  });

  it('PDF 走同一路由，content-type 为 application/pdf', async () => {
    const res = await serveMedia(req('raz/books/A.pdf', { cookie: COOKIE }), 'raz/books/A.pdf', dir);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
  });

  it('不存在的文件 → 404', async () => {
    const res = await serveMedia(req('raz/videos/NOPE.mp4', { cookie: COOKIE }), 'raz/videos/NOPE.mp4', dir);
    expect(res.status).toBe(404);
  });

  it('目录穿越（../）被拦截 → 403', async () => {
    const rel = '../secret.txt';
    await fsp.writeFile(path.join(dir, 'secret.txt'), 'topsecret');
    const res = await serveMedia(req(rel, { cookie: COOKIE }), rel, dir);
    expect(res.status).toBe(403);
  });
});
