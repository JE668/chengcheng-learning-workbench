import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/tts/health — TTS 服务健康检查。
 * edge-tts.ts 引擎的 isAvailable() 依赖此端点判断是否走服务端降级。
 * 返回 200 表示 TTS 基础设施就绪（python3 + tts-server.py 存在）。
 */
export async function GET() {
  try {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const scriptPath = path.join(process.cwd(), 'scripts', 'tts-server.py');
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json({ ok: false, reason: 'tts-server.py not found' }, { status: 503 });
    }
    // 检查 python3 是否在 PATH 中
    const { execSync } = await import('node:child_process');
    const version = execSync('python3 --version', { timeout: 3000, encoding: 'utf8' }).trim();
    return NextResponse.json({ ok: true, python: version });
  } catch {
    return NextResponse.json({ ok: false, reason: 'python3 not available or timed out' }, { status: 503 });
  }
}
