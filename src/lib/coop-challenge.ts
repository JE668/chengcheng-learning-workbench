import { getDb } from './db';
import { dateStr } from './date';
import { logGrowthEvent } from './castle-core';

/**
 * 🤝 每日组队挑战（2026-10-17，迁移 v22）：
 * 家长发起「今天兄妹一起完成某个模块」，全员完成后各 +5 星星币。
 * 进度由 upsertModuleProgress 顺带记录（模块完成即检查），
 * 结算用 rewarded 标志保证只发一次。
 */
export const COOP_REWARD_STARS = 5;

/** 记录一个孩子完成了某个模块；若匹配今日挑战则记进度，全员完成即结算。 */
export async function recordCoopProgress(childId: number, moduleKey: string): Promise<void> {
  const db = getDb();
  const day = dateStr();
  // 今日挑战存在且模块匹配？
  const ch = await db.execute({
    sql: 'SELECT module_key, module_label, rewarded FROM coop_challenges WHERE day = ?',
    args: [day],
  });
  if (!ch.rows.length) return;
  const row = ch.rows[0];
  if (String(row.module_key) !== moduleKey) return;
  if (Number(row.rewarded) === 1) return; // 已结算过，迟到的完成不再触发

  // 记录该孩子完成（幂等）
  await db.execute({
    sql: 'INSERT OR IGNORE INTO coop_challenge_progress (day, child_id) VALUES (?, ?)',
    args: [day, childId],
  });

  // 全员完成了吗？= 家长名下所有孩子都有进度
  const siblings = await db.execute({
    sql: 'SELECT id FROM users WHERE role = ? AND parent_id = (SELECT parent_id FROM users WHERE id = ?)',
    args: ['child', childId],
  });
  const total = siblings.rows.length;
  if (total < 2) return; // 单娃家庭：组队挑战无意义，不结算

  const done = await db.execute({
    sql: 'SELECT COUNT(*) n FROM coop_challenge_progress WHERE day = ?',
    args: [day],
  });
  if (Number(done.rows[0]?.n ?? 0) < total) return;

  // 全员完成 → 结算。rewarded=1 的置位必须先于发奖（原子 UPDATE 抢锁），
  // 并发到达时只有一个请求 rowsAffected=1，杜绝双发。
  const claim = await db.execute({
    sql: 'UPDATE coop_challenges SET rewarded = 1 WHERE day = ? AND rewarded = 0',
    args: [day],
  });
  if (Number(claim.rowsAffected ?? 0) === 0) return;

  const label = String(row.module_label ?? moduleKey);
  for (const s of siblings.rows) {
    const sid = Number(s.id);
    await db.execute({
      sql: 'UPDATE castle_state SET star_coins = star_coins + ? WHERE child_id = ?',
      args: [COOP_REWARD_STARS, sid],
    });
    await logGrowthEvent(
      sid,
      'coop',
      '🤝',
      '组队挑战成功！',
      `和兄妹一起完成「${label}」，组队奖励 +${COOP_REWARD_STARS} 星星币！`
    );
    // 推送通知每个孩子（失败静默）
    void import('./push-notifications').then(({ notifyChildSubscribers }) =>
      notifyChildSubscribers(sid, {
        title: '🤝 组队成功！',
        body: `和兄妹一起完成「${label}」，各得 ${COOP_REWARD_STARS} 星星币！`,
        data: { type: 'coop-reward', day },
      })
    );
  }
}

/** 今日挑战视图（co-op 页/家长发起用）：挑战 + 每个孩子的完成态。 */
export async function getTodayChallengeView(parentId: number) {
  const db = getDb();
  const day = dateStr();
  const ch = await db.execute({
    sql: 'SELECT day, module_key, module_label, rewarded FROM coop_challenges WHERE day = ?',
    args: [day],
  });
  if (!ch.rows.length) return null;
  const siblings = await db.execute({
    sql: "SELECT id, display_name FROM users WHERE role = 'child' AND parent_id = ?",
    args: [parentId],
  });
  const done = await db.execute({
    sql: 'SELECT child_id FROM coop_challenge_progress WHERE day = ?',
    args: [day],
  });
  const doneSet = new Set(done.rows.map((r) => Number(r.child_id)));
  return {
    day,
    moduleKey: String(ch.rows[0].module_key),
    moduleLabel: String(ch.rows[0].module_label ?? ''),
    rewarded: Number(ch.rows[0].rewarded) === 1,
    children: siblings.rows.map((r) => ({
      id: Number(r.id),
      name: String(r.display_name ?? ''),
      completed: doneSet.has(Number(r.id)),
    })),
  };
}
