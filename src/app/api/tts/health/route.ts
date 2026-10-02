import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 公开无鉴权端点，必须限流。 */
const HEALTH_LIMIT = { windowSeconds: 60, maxRequests: 30 };

/**
 * python3 版本探测结果缓存。
 * 每个请求都 execSync 会在单进程 NAS 上阻塞事件循环，是个现成的 DoS 面；
 * 缓存 60 秒即可让探测退化成廉价操作，同时仍能反映环境变化。
 */
let pythonCache: { at: number; version: string } | null = null;
const PYTHON_CACHE_TTL_MS = 60_000;

/**
 * GET /api/tts/health — TTS 服务健康检查。
 * edge-tts.ts 引擎的 isAvailable() 依赖此端点判断是否走服务端降级。
 * 返回 200 表示 TTS 基础设施就绪（python3 + tts-server.py 存在）。
 */
export async function GET(req: NextRequest) {
  const limit = rateLimit('tts-health:' + getClientIp(req), HEALTH_LIMIT);
  if (!limit.ok) {
    return NextResponse.json(
      { error: '请求太频繁，请 ' + limit.retryAfter + ' 秒后再试' },
      { status: 429 }
    );
  }
  try {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const scriptPath = path.join(process.cwd(), 'scripts', 'tts-server.py');
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json({ ok: false, reason: 'tts-server.py not found' }, { status: 503 });
    }
    // 检查 python3 是否在 PATH 中（结果带 TTL 缓存，避免每请求 spawn 子进程）
    const now = Date.now();
    if (!pythonCache || now - pythonCache.at > PYTHON_CACHE_TTL_MS) {
      const { execSync } = await import('node:child_process');
      const version = execSync('python3 --version', { timeout: 3000, encoding: 'utf8' }).trim();
      pythonCache = { at: now, version };
    }
    return NextResponse.json({ ok: true, python: pythonCache.version });
  } catch {
    // 失败不缓存，下次请求会重试
    pythonCache = null;
    return NextResponse.json({ ok: false, reason: 'python3 not available or timed out' }, { status: 503 });
  }
}
