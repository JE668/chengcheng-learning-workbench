import { NextResponse } from 'next/server';
import { getChildId } from '@/lib/db';
import { getCastleState } from '@/lib/castle';

// Vercel Cron 调用：对城堡做一次结算（惩罚/成长刷新）
export async function POST(req: Request) {
  const secret = req.headers.get('authorization') || new URL(req.url).searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 401 });
  }
  const childId = await getChildId();
  if (!childId) return NextResponse.json({ ok: true, skipped: true });
  const state = await getCastleState(childId);
  return NextResponse.json({ ok: true, prosperity: state.prosperity, starCoins: state.starCoins });
}
