import { NextResponse, type NextRequest } from 'next/server';
import { backupDatabase, listBackups } from '@/lib/backup';
import { isCronAuthorized } from '@/lib/cron-auth';

// 备份要读写本地文件系统（VACUUM INTO / fs），必须在 Node 运行时。
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 与 /api/cron/settle 复用同一个 CRON_SECRET，鉴权逻辑见 lib/cron-auth。
// 只认 Authorization 头（不再接受 ?secret=），恒定时间比较。
//   curl -X POST -H "Authorization: $CRON_SECRET" http://127.0.0.1:<对外端口>/api/cron/backup
export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req)) return NextResponse.json({ error: 'forbidden' }, { status: 401 });
  const result = await backupDatabase();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

// 列出当前已有备份（便于排查「到底有没有备上」）。
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) return NextResponse.json({ error: 'forbidden' }, { status: 401 });
  return NextResponse.json({ backups: await listBackups() });
}
