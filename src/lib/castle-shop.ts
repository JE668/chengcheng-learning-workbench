/** 城堡商城：道具购买、护盾兑换与皮肤切换。 */

import { getDb, withWriteLock } from './db';
import { dateStr } from './date';
import { COST_SPRAY, COST_SHIELD, COST_FREEZE } from './economy';
import { SHIELD_STREAK_REQ } from './moko';
import { computeStreak, ensureCastle } from './castle-core';

export async function buy(childId: number, itemKey: string) {
  return withWriteLock(async () => {
    const db = getDb();
    await ensureCastle(childId);

    // ⚠️ 本函数每条分支都是「先扣货币、再发货」两次写。此前只有 withWriteLock
    // （进程内串行队列），**没有事务**：容器在两次写之间被重启/被杀（NAS 断电、
    // docker 重启）就会「扣了阳光但没拿到道具」。withWriteLock 解决并发，
    // 不解决崩溃 —— 那正是 BEGIN/COMMIT 的职责（与 castle.confirm 同一套做法）。
    const runPurchase = async (): Promise<{ ok: boolean; message: string }> => {
      if (itemKey === 'spray') {
        const cost = COST_SPRAY;
        const res = await db.execute({
          sql: 'UPDATE castle_state SET sunlight = sunlight - ? WHERE child_id = ? AND sunlight >= ?',
          args: [cost, childId, cost],
        });
        if (Number(res.rowsAffected ?? 0) === 0) return { ok: false, message: '阳光能量不足' };
        await db.execute({
          sql: 'INSERT INTO inventory (child_id, item_key, qty) VALUES (?, ?, 1) ON CONFLICT(child_id, item_key) DO UPDATE SET qty = qty + 1',
          args: [childId, 'spray'],
        });
        return { ok: true, message: '购买魔法喷雾成功！' };
      }
      if (itemKey === 'freeze') {
        const cost = COST_FREEZE;
        const res = await db.execute({
          sql: 'UPDATE castle_state SET sunlight = sunlight - ? WHERE child_id = ? AND sunlight >= ?',
          args: [cost, childId, cost],
        });
        if (Number(res.rowsAffected ?? 0) === 0)
          return { ok: false, message: '阳光能量不足（需要 ' + cost + ' 阳光）' };
        await db.execute({
          sql: 'INSERT INTO inventory (child_id, item_key, qty) VALUES (?, ?, 1) ON CONFLICT(child_id, item_key) DO UPDATE SET qty = qty + 1',
          args: [childId, 'freeze'],
        });
        return { ok: true, message: '🧊 冰冻徽章购买成功！下次漏卡会自动消耗保护一天连胜。' };
      }
      if (itemKey === 'shield') {
        const cost = COST_SHIELD;
        const streak = await computeStreak(childId, dateStr());
        if (streak < SHIELD_STREAK_REQ)
          return {
            ok: false,
            message:
              '需连续打卡 ' + SHIELD_STREAK_REQ + ' 天才能兑换护盾（当前 ' + streak + ' 天）',
          };
        const res = await db.execute({
          sql: 'UPDATE castle_state SET sunlight = sunlight - ?, shield_equipped = shield_equipped + 1 WHERE child_id = ? AND sunlight >= ?',
          args: [cost, childId, cost],
        });
        if (Number(res.rowsAffected ?? 0) === 0) return { ok: false, message: '阳光能量不足' };
        return { ok: true, message: '护盾已兑换并自动装备到城堡！' };
      }
      const starItem = (await import('./moko')).starShop.find((s) => s.key === itemKey);
      if (!starItem) return { ok: false, message: '未知商品' };
      const starRes = await db.execute({
        sql: 'UPDATE castle_state SET star_coins = star_coins - ? WHERE child_id = ? AND star_coins >= ?',
        args: [starItem.cost, childId, starItem.cost],
      });
      if (Number(starRes.rowsAffected ?? 0) === 0) return { ok: false, message: '星星币不足' };
      await db.execute({
        sql: 'INSERT INTO inventory (child_id, item_key, qty) VALUES (?, ?, 1) ON CONFLICT(child_id, item_key) DO UPDATE SET qty = qty + 1',
        args: [childId, itemKey],
      });
      if (itemKey.startsWith('skin_')) {
        await db.execute({
          sql: 'UPDATE castle_state SET skin = ? WHERE child_id = ?',
          args: [itemKey, childId],
        });
        return { ok: true, message: '兑换「' + starItem.name + '」成功，城堡已换上新皮肤！' };
      }
      return { ok: true, message: '兑换「' + starItem.name + '」成功！' };
    };

    // 「余额不足 / 未知商品」这些提前返回没有写入任何东西，COMMIT 空事务即可；
    // 真正的异常（磁盘满 / SQL 错 / 进程被杀）由 ROLLBACK 保证不出现「扣了没发货」。
    await db.execute('BEGIN IMMEDIATE');
    try {
      const result = await runPurchase();
      await db.execute('COMMIT');
      return result;
    } catch (e) {
      await db.execute('ROLLBACK');
      throw e;
    }
  });
}

export async function setSkin(
  childId: number,
  skin: string
): Promise<{ ok: boolean; message: string }> {
  const db = getDb();
  const isDefault = skin === 'default';
  const qty = Number(
    (
      await db.execute({
        sql: 'SELECT qty FROM inventory WHERE child_id = ? AND item_key = ?',
        args: [childId, skin],
      })
    ).rows[0]?.qty ?? 0
  );
  if (!isDefault && qty <= 0)
    return { ok: false, message: '还没有这个皮肤哦，去星星币商城兑换吧！' };
  await db.execute({
    sql: 'UPDATE castle_state SET skin = ? WHERE child_id = ?',
    args: [skin, childId],
  });
  return { ok: true, message: '城堡皮肤已更新！' };
}
