import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fsp } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serveMedia } from './serve-media';

const COOKIE = 'session=abc123';

function req(rel: string, opts: { range?: string; cookie?: string } = {}) {
  const headers: Record<string, string> = {};
  if (opts.range) headers.range = opts.range;
  if (opts.cookie) headers.cookie = opts.cookie;
  return new Request(`http://localhost/api/media/${rel}`, { headers });
}

describe('serveMedia（受保护媒体路由核心，始终整文件 200 以绕开反代对 Range 的破坏）', () => {
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

  it('已登录 + 无 Range → 200 整文件，content-type 正确', async () => {
    const res = await serveMedia(req('raz/videos/A.mp4', { cookie: COOKIE }), 'raz/videos/A.mp4', dir);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('video/mp4');
    expect(res.headers.get('accept-ranges')).toBeNull();
    expect(res.headers.get('content-length')).toBe('100');
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.length).toBe(100);
    expect(buf.every((b) => b === 7)).toBe(true);
  });

  it('已登录 + 带 Range 头（反代场景）→ 仍返回 200 整文件，不依赖 206', async () => {
    const res = await serveMedia(
      req('raz/videos/A.mp4', { cookie: COOKIE, range: 'bytes=10-19' }),
      'raz/videos/A.mp4',
      dir,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-range')).toBeNull();
    expect(res.headers.get('content-length')).toBe('100');
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.length).toBe(100); // 整文件，而非 10 字节分段
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
