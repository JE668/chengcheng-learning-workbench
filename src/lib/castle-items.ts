/** 城堡道具链路：喷雾修复、资源赠送、时光沙漏补签与星星币收获。 */

import { getDb, withWriteLock } from './db';
import { dateStr, addDays } from './date';
import { formatBackfillDayLabel } from './backfill-date';
import { STAR_PER_FRIEND } from './moko';
import type { Subject } from './types';
import { ensureCastle, getRow, logGrowthEvent, SUBJECTS } from './castle-core';
import { confirmRewardsTx } from './castle-rewards';

export async function castSpray(childId: number) {
  return withWriteLock(async () => {
    const db = getDb();
    await ensureCastle(childId);
    const inv = await db.execute({
      sql: 'SELECT qty FROM inventory WHERE child_id = ? AND item_key = ?',
      args: [childId, 'spray'],
    });
    if (!inv.rows.length || Number(inv.rows[0].qty) <= 0)
      return { ok: false, message: '没有魔法喷雾' };
    const row = await getRow(childId);
    // 只清除最近一天的捣蛋萌可（而非全部历史），避免一次喷雾清掉多天惩罚
    const latestTrouble = await db.execute({
      sql: 'SELECT day FROM troublemakers WHERE child_id = ? AND resolved = 0 ORDER BY day DESC LIMIT 1',
      args: [childId],
    });
    // ⚠️ 「无可修理对象」时**不扣喷雾**直接返回 —— 离线重放护栏 + 防手滑白扣。
    //
    // 本函数入离线队列：孩子按喷雾时若「服务端已执行、响应丢在网络上」，客户端
    // 会当作失败入队，联网后再执行一次。原实现在这一步之前没有任何判断，于是
    // 重放会**再扣一瓶喷雾**换一堆 no-op（捣蛋已 resolved、心情已满、
    // last_stolen 已清零所以找回 0 币）—— 白亏一件道具。
    //
    // 判据是「这次按下去到底有没有东西要修」，三者全无才算白按：
    //   · 未解决的捣蛋萌可
    //   · 被藏起来、可找回的星星币（last_stolen）
    //   · 心情未满或已逃亡的萌可
    // 注意不能只看捣蛋萌可：漏卡第 1 天的惩罚只有心情 -1、**不产生捣蛋萌可**，
    // 只看 troublemakers 会把这种合法用法一起挡掉。
    //
    // 这条守卫同时修掉另一个既有缺口：/api/castle/use-item **没有**限流
    //（对比 /api/castle/buy 有 IP 级限流），在线连点两下也会白扣一瓶。
    const needRepair = await db.execute({
      sql: `SELECT
              (SELECT COUNT(*) FROM troublemakers WHERE child_id = ? AND resolved = 0) AS trouble,
              (SELECT COUNT(*) FROM moko_owned WHERE child_id = ? AND (mood < 3 OR status <> 'resident')) AS hurt`,
      args: [childId, childId],
    });
    const troubleN = Number(needRepair.rows[0]?.trouble ?? 0);
    const hurtN = Number(needRepair.rows[0]?.hurt ?? 0);
    if (troubleN === 0 && hurtN === 0 && Number(row?.last_stolen ?? 0) === 0) {
      return { ok: false, message: '城堡现在很干净，没有需要帮助的萌可，喷雾先留着吧～' };
    }
    const returnCoins = Math.ceil(Number(row?.last_stolen ?? 0) * 0.5);
    const today = dateStr();
    const yesterday = addDays(today, -1);
    // ⚠️ 多步写包进事务：清捣蛋 → 恢复心情 → 还币 → 推游标 → 扣道具共 5 步，
    // 只靠 withWriteLock 挡不住崩溃（断电/docker 重启）——最坏组合是
    // 「捣蛋清了但喷雾没扣」（白嫖）或「币加了但游标没推进」（重复找回）。
    await db.execute('BEGIN IMMEDIATE');
    try {
      if (latestTrouble.rows.length) {
        await db.execute({
          sql: 'UPDATE troublemakers SET resolved = 1 WHERE child_id = ? AND resolved = 0 AND day = ?',
          args: [childId, String(latestTrouble.rows[0].day)],
        });
      }
      await db.execute({
        sql: "UPDATE moko_owned SET mood = 3, status = 'resident' WHERE child_id = ?",
        args: [childId],
      });
      await db.execute({
        sql: 'UPDATE castle_state SET star_coins = star_coins + ?, last_stolen = 0 WHERE child_id = ?',
        args: [returnCoins, childId],
      });
      await db.execute({
        sql: 'UPDATE castle_state SET last_settled_day = ? WHERE child_id = ?',
        args: [yesterday, childId],
      });
      await db.execute({
        sql: 'UPDATE inventory SET qty = qty - 1 WHERE child_id = ? AND item_key = ?',
        args: [childId, 'spray'],
      });
      await logGrowthEvent(
        childId,
        'repair',
        '🧼',
        '捉回捣蛋萌可，城堡恢复欢乐！',
        '和乐美一起捉回捣蛋萌可，萌可们心情全满，找回 ' + returnCoins + ' 星星币'
      );
      await db.execute('COMMIT');
    } catch (e) {
      await db.execute('ROLLBACK');
      throw e;
    }
    return {
      ok: true,
      message: '太棒了！和乐美一起捉回捣蛋萌可，找回 ' + returnCoins + ' 星星币～',
    };
  });
}

export async function grantResource(
  childId: number,
  resource: 'sunlight' | 'starCoins' | 'tickets',
  amount: number
): Promise<{ ok: boolean; message: string }> {
  const db = getDb();
  await ensureCastle(childId);
  const n = Math.max(0, Math.min(100, Math.floor(amount)));
  if (n <= 0) return { ok: false, message: '数量必须大于 0' };
  // ⚠️ 纳入全局写锁：单条 UPDATE 本身原子，但此前不持锁，与 withWriteLock 内
  // 的多步写（settleCastle 结算、castSpray 等）并发时会交错执行——尤其
  // 结算运行中家长送币，applyPenalty 的增量写回虽然已不覆盖别人（见其注释），
  // 两条 UPDATE 仍可能以相反顺序落到同一天的不同语义上。持锁统一「所有
  // 多步写路径互斥」的约定，消除这一整类交错，代价是家长端点按钮多排一次队。
  return withWriteLock(async () => {
    if (resource === 'sunlight') {
      await db.execute({
        sql: 'UPDATE castle_state SET sunlight = sunlight + ? WHERE child_id = ?',
        args: [n, childId],
      });
      await logGrowthEvent(childId, 'gift', '☀️', '爸爸妈妈送了阳光能量', '+' + n + ' 阳光能量');
      return { ok: true, message: '已送 ' + n + ' 阳光能量 ✅' };
    }
    if (resource === 'starCoins') {
      await db.execute({
        sql: 'UPDATE castle_state SET star_coins = star_coins + ? WHERE child_id = ?',
        args: [n, childId],
      });
      await logGrowthEvent(childId, 'gift', '⭐', '爸爸妈妈送了星星币', '+' + n + ' 星星币');
      return { ok: true, message: '已送 ' + n + ' 星星币 ✅' };
    }
    if (resource === 'tickets') {
      await db.execute({
        sql: 'INSERT INTO capture_tickets (child_id, total, used) VALUES (?, ?, 0) ON CONFLICT(child_id) DO UPDATE SET total = total + ?',
        args: [childId, n, n],
      });
      await logGrowthEvent(childId, 'gift', '🎟️', '爸爸妈妈送了捕捉券', '+' + n + ' 捕捉券');
      return { ok: true, message: '已送 ' + n + ' 捕捉券 ✅' };
    }
    return { ok: false, message: '未知资源类型' };
  });
}

/**
 * 家长审批时光沙漏申请的入口（带库存校验）。
 * 孩子背包里必须有沙漏，扣减后调用 restoreDay 实际补打卡。
 *
 * 2026-10-17 重建（依赖 confirmRewardsTx 抽取）：**扣沙漏与补打卡收进
 * 同一事务**。此前是两段式（原子扣减 → restoreDay 内部各自开事务），
 * 两段之间的 SIGKILL/断电会「沙漏已扣但打卡没补」。锁不可重入的老约束
 * 已随 restoreDay 无锁化解除——现在 restoreDay 假定调用方持锁+开事务。
 * 崩溃 → ROLLBACK，沙漏和打卡状态都回到调用前，不再需要补偿 UPDATE。
 */
export async function applyTimeGlass(
  childId: number,
  day: string
): Promise<{ ok: boolean; message: string }> {
  const db = getDb();
  await ensureCastle(childId);
  const inv = await db.execute({
    sql: 'SELECT qty FROM inventory WHERE child_id = ? AND item_key = ?',
    args: [childId, 'timeglass'],
  });
  if (!inv.rows.length || Number(inv.rows[0].qty) <= 0) {
    return { ok: false, message: '没有时光沙漏，请爸爸妈妈在家长端送给你吧～' };
  }
  const existing = await db.execute({
    sql: "SELECT subject FROM daily_checkins WHERE child_id = ? AND day = ? AND status = 'confirmed'",
    args: [childId, day],
  });
  const doneSet = new Set(existing.rows.map((r) => String(r.subject)));
  const missing = SUBJECTS.filter((s) => !doneSet.has(s));
  if (missing.length === 0) {
    return { ok: false, message: formatBackfillDayLabel(day) + ' 三科都已经打卡过了，不用补～' };
  }
  return withWriteLock(async () => {
    await db.execute('BEGIN IMMEDIATE');
    try {
      // 原子扣减：UPDATE ... AND qty > 0 保证并发下只扣一次（qty=0 时第二个请求 rowsAffected=0）。
      const dec = await db.execute({
        sql: 'UPDATE inventory SET qty = qty - 1 WHERE child_id = ? AND item_key = ? AND qty > 0',
        args: [childId, 'timeglass'],
      });
      if (Number(dec.rowsAffected ?? 0) === 0) {
        throw new Error('__timeglass_depleted');
      }
      const restored = await restoreDay(childId, day, missing);
      if (!restored.ok || restored.restored.length === 0) {
        // confirm 都没成功：整个事务回滚（沙漏自动回来），不需要补偿 UPDATE
        throw new Error('__timeglass_noop');
      }
      await db.execute('COMMIT');
      const extraMsg = restored.coinsReturned > 0 ? '，还找回了被藏起来的星星币！' : '！';
      // 用「09月26日」而不是原始 ISO「2026-09-26」：家长端批准后的文案已是中文日期，
      // 同一件事在两处显示不同格式会让人以为是不同的日子。
      return {
        ok: true,
        message:
          '⏳ 时光沙漏生效！' +
          formatBackfillDayLabel(day) +
          ' 的 ' +
          restored.restored.join('、') +
          ' 补打卡成功，连续天数已恢复' +
          extraMsg,
      };
    } catch (e) {
      await db.execute('ROLLBACK');
      if (e instanceof Error && e.message === '__timeglass_depleted') {
        return { ok: false, message: '没有时光沙漏，请爸爸妈妈在家长端送给你吧～' };
      }
      if (e instanceof Error && e.message === '__timeglass_noop') {
        return {
          ok: false,
          message: formatBackfillDayLabel(day) + ' 三科都已经打卡过了，不用补～',
        };
      }
      throw e;
    }
  });
}

/**
 * 补打卡核心逻辑（不带库存校验），供 applyTimeGlass 和家长审批共用。
 * 将指定日期缺少的科目全部确认，同时处理捣蛋萌可、逃亡萌可、被藏星星币。
 *
 * ⚠️ 2026-10-17 无锁化：本函数**假定调用方已持有 withWriteLock 且已 BEGIN**——
 * 内部用幂等插卡 + confirmRewardsTx 直接在调用方的事务里写，不再自己开锁/事务
 *（旧版内部调 confirm，锁不可重入，迫使 applyTimeGlass 保持两段式、
 * 存在「沙漏已扣但打卡没补」的崩溃窗口）。公开调用方：
 *   - applyTimeGlass：扣沙漏 + restoreDay 同一事务 ✅
 *   - approve-timeglass 路由：restoreDay 持锁开事务包裹 ✅
 */
export async function restoreDay(
  childId: number,
  day: string,
  subjectsToConfirm?: Subject[]
): Promise<{ ok: boolean; message: string; restored: Subject[]; coinsReturned: number }> {
  const db = getDb();
  await ensureCastle(childId);

  // 确定需要补的科目
  let missing: Subject[];
  if (subjectsToConfirm) {
    missing = subjectsToConfirm;
  } else {
    const existing = await db.execute({
      sql: "SELECT subject FROM daily_checkins WHERE child_id = ? AND day = ? AND status = 'confirmed'",
      args: [childId, day],
    });
    const doneSet = new Set(existing.rows.map((r) => String(r.subject)));
    missing = SUBJECTS.filter((s) => !doneSet.has(s));
  }

  const restored: Subject[] = [];
  for (const subject of missing) {
    // 与 confirm 相同的两步（幂等插卡 → 新确认才发奖），但**不经过**
    // confirm 的 withWriteLock/BEGIN——restoreDayTx 版本运行在调用方的
    // 事务里（见 applyTimeGlass：扣沙漏+补打卡同一事务，锁在外层持一次）。
    const insertResult = await db.execute({
      sql: "INSERT INTO daily_checkins (child_id, day, subject, status, confirmed_at) VALUES (?, ?, ?, 'confirmed', CURRENT_TIMESTAMP) ON CONFLICT(child_id, day, subject) DO NOTHING",
      args: [childId, day, subject],
    });
    if (Number(insertResult.rowsAffected ?? 0) === 0) continue; // 已确认，跳过
    await confirmRewardsTx(db, childId, day, dateStr(), subject);
    restored.push(subject);
  }

  // 三科全补则标记每日一练完成
  const finalCheckins = await db.execute({
    sql: "SELECT COUNT(*) AS n FROM daily_checkins WHERE child_id = ? AND day = ? AND status = 'confirmed'",
    args: [childId, day],
  });
  if (Number(finalCheckins.rows[0]?.n) >= 3) {
    await db.execute({
      sql: "INSERT INTO daily_practice (child_id, day, completed, correct, total, questions) VALUES (?, ?, 1, 0, 0, '[]') ON CONFLICT(child_id, day) DO UPDATE SET completed = 1",
      args: [childId, day],
    });
  }

  // 解决该日捣蛋萌可
  await db.execute({
    sql: 'UPDATE troublemakers SET resolved = 1 WHERE child_id = ? AND day = ?',
    args: [childId, day],
  });
  // 召回逃亡萌可 + 恢复所有萌可的心情（时光沙漏补打卡后，城堡应该恢复欢乐状态）
  await db.execute({
    sql: "UPDATE moko_owned SET status = 'resident', mood = 3 WHERE child_id = ? AND status = 'fled'",
    args: [childId],
  });
  await db.execute({
    sql: 'UPDATE moko_owned SET mood = 3 WHERE child_id = ? AND mood < 3',
    args: [childId],
  });

  // 找回被藏起来的星星币
  let coinsReturned = 0;
  const row = await getRow(childId);
  const lastStolen = Number(row?.last_stolen ?? 0);
  if (lastStolen > 0) {
    coinsReturned = Math.ceil(lastStolen * 0.5);
    await db.execute({
      sql: 'UPDATE castle_state SET star_coins = star_coins + ?, last_stolen = 0 WHERE child_id = ?',
      args: [coinsReturned, childId],
    });
  }

  // 恢复连胜天数：往前找连续全勤天数（只统计到 `day` 为止）
  let newStreak = 1; // 至少恢复 1 天
  let checkCursor = addDays(day, -1);
  while (true) {
    const count = await db.execute({
      sql: "SELECT COUNT(*) AS n FROM daily_checkins WHERE child_id = ? AND day = ? AND status = 'confirmed'",
      args: [childId, checkCursor],
    });
    if (Number(count.rows[0]?.n) < 3) break;
    newStreak++;
    checkCursor = addDays(checkCursor, -1);
  }

  // ⚠️ **不能**把 last_settled_day 回写成 `day`。
  //
  // last_settled_day 是「已结算到哪一天」的游标，只应由 settleCastle 单向推进。
  // 原实现在这里写成 `day`，实测后果（B7）：
  //   连漏 5 天 → settleCastle 已结算到昨天（惩罚已施加）
  //   → 家长用时光沙漏补**最老**的一天 → last_settled 被回退到那一天
  //   → 中间这几天**永远不会被再次结算**，它们的惩罚被静默吞掉。
  //
  // 正确做法：只更新 streak_days，last_settled_day 保持不动；
  // 仅当它从未被设置过（空）时才用 `day` 兜底。
  const cur = await getRow(childId);
  const lastSettled = cur?.last_settled_day ? String(cur.last_settled_day) : day;
  // 只向前推进，绝不回退
  const nextSettled = lastSettled > day ? lastSettled : day;
  await db.execute({
    sql: 'UPDATE castle_state SET streak_days = ?, last_settled_day = ? WHERE child_id = ?',
    args: [newStreak, nextSettled, childId],
  });

  await logGrowthEvent(
    childId,
    'repair',
    '⏳',
    '用时光沙漏补打卡 ' + day,
    day + ' 补打卡 ' + restored.join('、') + '，连续天数已恢复！捣蛋萌可被赶走，萌可们全部回来啦～'
  );
  return { ok: true, message: '补打卡成功', restored, coinsReturned };
}

export async function harvest(childId: number) {
  return withWriteLock(async () => {
    const db = getDb();
    await ensureCastle(childId);
    const today = dateStr();
    const friends = (
      await db.execute({
        sql: "SELECT * FROM moko_owned WHERE child_id = ? AND status = 'resident' AND stage = 'friend' AND last_harvest_day != ?",
        args: [childId, today],
      })
    ).rows;
    if (!friends.length) return { ok: true, gained: 0, message: '今天还没有可收获的星星币～' };
    const gained = friends.length * STAR_PER_FRIEND;
    // ⚠️ 加币与逐只标记 last_harvest_day 是两步写：只靠 withWriteLock 挡不住崩溃。
    // 断电在两步之间 → 币已加、萌可未标记 → 重启后同批萌可**可重复收币**。
    // 单条 IN(...) 合并逐只 UPDATE，既是事务需求也把 N 次写合成 1 次。
    const ids = friends.map((r) => Number(r.id));
    await db.execute('BEGIN IMMEDIATE');
    try {
      await db.execute({
        sql: 'UPDATE castle_state SET star_coins = star_coins + ? WHERE child_id = ?',
        args: [gained, childId],
      });
      await db.execute({
        sql:
          'UPDATE moko_owned SET last_harvest_day = ? WHERE child_id = ? AND id IN (' +
          ids.map(() => '?').join(', ') +
          ')',
        args: [today, childId, ...ids],
      });
      await logGrowthEvent(
        childId,
        'harvest',
        '⭐',
        '收获星星币',
        '萌可朋友们产出了 ' + gained + ' 星星币'
      );
      await db.execute('COMMIT');
    } catch (e) {
      await db.execute('ROLLBACK');
      throw e;
    }
    return { ok: true, gained, message: '收获 ' + gained + ' 星星币！' };
  });
}
