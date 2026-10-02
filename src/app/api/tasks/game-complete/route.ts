import { NextRequest, NextResponse } from 'next/server';
import { getDb, getChildPoints } from '@/lib/db';
import { safeJson } from '@/lib/safe-json';
import { getCurrentUser } from '@/lib/auth';
import { dateStr, LOCAL_DAY_COL } from '@/lib/date';
import { games } from '@/lib/moko';

/** 已知的游戏 ID 白名单：防止用任意字符串刷出无数条 completions 记录。 */
const KNOWN_GAME_IDS = new Set(games.map((g) => g.id));

/**
 * 单局游戏积分的服务端上限。
 *
 * 取值依据是各游戏自己的计分公式（src/components/games/*.tsx）：
 * 合法单局最高约 420（例如 WordMatch: max(20, 350-(100-time)+70)），
 * 因此 500 不会削减孩子的正常奖励，但能把「POST score 为 1e9」这类伪造
 * 从十亿压到 500，并留下告警日志。
 *
 * 说明：彻底杜绝伪造需要把游戏判定搬到服务端，成本较高，
 * 见 docs/评审修复计划与交接.md 第 7 节。
 */
const MAX_GAME_SCORE = 500;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { gameId, score } = await safeJson(req, {});
  if (typeof gameId !== 'string' || !KNOWN_GAME_IDS.has(gameId)) {
    return NextResponse.json({ error: '未知的游戏标识' }, { status: 400 });
  }

  const rawScore = Math.floor(Number(score));
  if (!Number.isFinite(rawScore) || rawScore < 0) {
    return NextResponse.json({ error: '无效的分数' }, { status: 400 });
  }
  if (rawScore > MAX_GAME_SCORE) {
    console.warn(
      '[game-complete] 分数超出上限已截断：gameId=' + gameId +
        ' childId=' + user.id + ' 上报=' + rawScore
    );
  }
  const points = Math.min(rawScore, MAX_GAME_SCORE);

  const db = getDb();
  const today = dateStr();
  // 防重放刷分：同一孩子同一游戏当天只计分一次。
  // 注意：created_at 是 UTC 的 CURRENT_TIMESTAMP，用 LOCAL_DAY_COL（'localtime'）折算到服务器本地日期，
  // 与上文 today（本地日期）对齐，避免部署在 UTC 服务器时「每日一次」跨时区错位。
  const res = await db.execute({
    sql: `INSERT INTO completions (child_id, points, source)
          SELECT ?, ?, ?
          WHERE NOT EXISTS (SELECT 1 FROM completions WHERE child_id = ? AND source = ? AND ${LOCAL_DAY_COL} = ?)`,
    args: [user.id, points, String(gameId), user.id, String(gameId), today],
  });
  if (Number(res.rowsAffected ?? 0) === 0) {
    return NextResponse.json({ error: '今天已经玩过这个游戏啦，明天再来挑战！' }, { status: 409 });
  }
  const balance = await getChildPoints(user.id);
  return NextResponse.json({ ok: true, gained: points, balance, message: `游戏完成，获得 ${points} 积分！` });
}
