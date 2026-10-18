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
/** 真实合成探测结果缓存（合成有网络开销，TTL 拉长到 5 分钟） */
let synthCache: { at: number; ok: boolean } | null = null;
const SYNTH_CACHE_TTL_MS = 5 * 60_000;

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
    // ⚠️ 真实合成探测（2026-10-19）：只查「python3 在不在」会漏掉
    // edge-tts 令牌被 Microsoft 拒绝这类「进程活着但合成必败」的故障
    //（7.2.8 实测：health 200 而合成全 500）。每次（TTL 内首次）真合成
    // 一小段，失败时把 ok 置 false 并带上错误——诊断页据此直接显示根因。
    let synthError: string | null = null;
    if (!synthCache || now - synthCache.at > SYNTH_CACHE_TTL_MS) {
      try {
        const { synthesizeWithEdgeTTS } = await import('../_lib');
        const buf = await synthesizeWithEdgeTTS('测', 'zh-CN-XiaoxiaoNeural', '+0%');
        synthCache = { at: now, ok: buf.length > 100 };
        if (!synthCache.ok) synthError = '合成返回空音频';
      } catch (e) {
        synthCache = { at: now, ok: false };
        synthError = (e as Error).message.slice(0, 120);
      }
    }
    if (!synthCache?.ok) {
      return NextResponse.json(
        { ok: false, python: pythonCache.version, synthError: synthError ?? '合成探测失败' },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: true, python: pythonCache.version });
  } catch {
    // 失败不缓存，下次请求会重试
    pythonCache = null;
    return NextResponse.json({ ok: false, reason: 'python3 not available or timed out' }, { status: 503 });
  }
}
