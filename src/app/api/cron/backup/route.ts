import { NextResponse, type NextRequest } from 'next/server';
import { backupDatabase, listBackups } from '@/lib/backup';

// 备份要读写本地文件系统（VACUUM INTO / fs），必须在 Node 运行时。
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 与 /api/cron/settle 复用同一个 CRON_SECRET，防止外部随意触发。
function authorized(req: NextRequest): boolean {
  const secret = req.headers.get('authorization') || new URL(req.url).searchParams.get('secret');
  return !!secret && secret === process.env.CRON_SECRET;
}

// 触发一次备份。NAS「计划任务」里每天凌晨跑一次即可。
//   curl -X POST -H "Authorization: $CRON_SECRET" http://127.0.0.1:3000/api/cron/backup
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'forbidden' }, { status: 401 });
  const result = await backupDatabase();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

// 列出当前已有备份（便于排查「到底有没有备上」）。
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'forbidden' }, { status: 401 });
  return NextResponse.json({ backups: await listBackups() });
}
