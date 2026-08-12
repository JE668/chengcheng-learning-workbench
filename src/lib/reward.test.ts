import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getDb } from '@/lib/db';
import { ensureSchema } from '@/lib/db';
import { confirm, buy } from '@/lib/castle';
import { submitPractice } from '@/lib/daily-practice';
import { subjectMokoKey } from '@/lib/moko';
import { dateStr, addDays } from '@/lib/date';
import {
  SUN_PER_SUBJECT,
  PROSPERITY_BONUS,
  TICKET_PER_SUBJECT,
  COST_SPRAY,
  COST_SHIELD,
  SHIELD_STREAK_REQ,
} from '@/lib/economy';
import type { Subject } from '@/lib/types';

const SUBJECTS: Subject[] = ['语文', '数学', '英语'];

let childSeq = 7000;
function nextChild(): number {
  return ++childSeq;
}

async function insertChild(id: number) {
  await getDb().execute({
    sql: `INSERT INTO users (id, username, password_hash, role, display_name) VALUES (?, ?, '', 'child', '测试娃')`,
    args: [id, `rc${id}`],
  });
}
async function insertCastle(cid: number, lastSettled: string, sunlight = 0, starCoins = 0) {
  await getDb().execute({
    sql: `INSERT INTO castle_state (child_id, sunlight, star_coins, prosperity, streak_days, last_settled_day) VALUES (?, ?, ?, 0, 0, ?)`,
    args: [cid, sunlight, starCoins, lastSettled],
  });
}
async function confirmSubject(cid: number, day: string, subject: string) {
  await getDb().execute({
    sql: `INSERT INTO daily_checkins (child_id, day, subject, status, confirmed_at) VALUES (?, ?, ?, 'confirmed', CURRENT_TIMESTAMP) ON CONFLICT(child_id, day, subject) DO UPDATE SET status='confirmed'`,
    args: [cid, day, subject],
  });
}
async function readCastle(cid: number) {
  const r = (await getDb().execute({ sql: 'SELECT * FROM castle_state WHERE child_id = ?', args: [cid] })).rows[0];
  return {
    sunlight: Number(r?.sunlight ?? 0),
    starCoins: Number(r?.star_coins ?? 0),
    prosperity: Number(r?.prosperity ?? 0),
  };
}
async function readTickets(cid: number): Promise<number> {
  const r = await getDb().execute({ sql: 'SELECT total, used FROM capture_tickets WHERE child_id = ?', args: [cid] });
  if (!r.rows.length) return 0;
  return Number(r.rows[0].total) - Number(r.rows[0].used);
}

describe('奖励/经济逻辑：confirm / buy / submitPractice', () => {
  beforeAll(async () => {
    await ensureSchema();
  });

  beforeEach(async () => {
    const db = getDb();
    for (const t of ['daily_checkins', 'castle_state', 'moko_owned', 'troublemakers', 'growth_events', 'capture_tickets', 'daily_practice', 'inventory']) {
      await db.execute({ sql: `DELETE FROM ${t}`, args: [] });
    }
    await db.execute({ sql: "UPDATE users SET selected_child_id = NULL, parent_id = NULL", args: [] });
    await db.execute({ sql: "DELETE FROM users WHERE role IN ('child','parent')", args: [] });
  });

  it('confirm 单科 → 阳光 +SUN_PER_SUBJECT、发 1 张捕捉券、召唤对应萌可', async () => {
    const cid = nextChild();
    await insertChild(cid);
    await insertCastle(cid, dateStr());
    const today = dateStr();

    const res = await confirm(cid, today, '语文');
    expect(res.ok).toBe(true);

    const c = await readCastle(cid);
    expect(c.sunlight).toBe(SUN_PER_SUBJECT);
    expect(await readTickets(cid)).toBe(TICKET_PER_SUBJECT);

    const owned = await getDb().execute({
      sql: 'SELECT COUNT(*) AS n FROM moko_owned WHERE child_id = ? AND moko_key = ?',
      args: [cid, subjectMokoKey['语文']],
    });
    expect(Number(owned.rows[0]?.n)).toBe(1);
  });

  it('confirm 三科 → 繁荣度 +PROSPERITY_BONUS（阳光累计 3 份）', async () => {
    const cid = nextChild();
    await insertChild(cid);
    await insertCastle(cid, dateStr());
    const today = dateStr();

    for (const s of SUBJECTS) await confirm(cid, today, s);

    const c = await readCastle(cid);
    expect(c.sunlight).toBe(SUN_PER_SUBJECT * 3);
    expect(c.prosperity).toBe(PROSPERITY_BONUS);
    expect(await readTickets(cid)).toBe(TICKET_PER_SUBJECT * 3);
  });

  it('buy 喷雾：阳光充足扣 COST_SPRAY，不足则失败且不扣', async () => {
    const cid = nextChild();
    await insertChild(cid);
    await insertCastle(cid, dateStr(), COST_SPRAY + 2);

    const ok = await buy(cid, 'spray');
    expect(ok.ok).toBe(true);
    expect((await readCastle(cid)).sunlight).toBe(2);

    const inv = await getDb().execute({ sql: 'SELECT qty FROM inventory WHERE child_id = ? AND item_key = ?', args: [cid, 'spray'] });
    expect(Number(inv.rows[0]?.qty)).toBe(1);

    const poor = await insertCastle2(cid); // 把阳光清零
    const fail = await buy(cid, 'spray');
    expect(fail.ok).toBe(false);
    expect((await readCastle(cid)).sunlight).toBe(0);
  });

  it('buy 护盾：连续打卡不足 SHIELD_STREAK_REQ 天则失败', async () => {
    const cid = nextChild();
    await insertChild(cid);
    await insertCastle(cid, dateStr(), COST_SHIELD + 5);

    const fail = await buy(cid, 'shield');
    expect(fail.ok).toBe(false);
    expect(fail.message).toContain('连续打卡');
    expect((await readCastle(cid)).sunlight).toBe(COST_SHIELD + 5); // 未扣款
  });

  it('buy 护盾：连续打卡达标 → 扣 COST_SHIELD 并装备', async () => {
    const cid = nextChild();
    await insertChild(cid);
    const today = dateStr();
    // last_settled 设在今天之前，让结算不干扰；预置最近 3 天三科全勤
    await insertCastle(cid, addDays(today, -4), COST_SHIELD + 5);
    for (const off of [2, 1, 0]) {
      for (const s of SUBJECTS) await confirmSubject(cid, addDays(today, -off), s);
    }

    const ok = await buy(cid, 'shield');
    expect(ok.ok).toBe(true);
    // 初始 COST_SHIELD+5，三次 confirm 各 +SUN_PER_SUBJECT，buy 扣 COST_SHIELD
    expect((await readCastle(cid)).sunlight).toBe(COST_SHIELD + 5 + SUN_PER_SUBJECT * 3 - COST_SHIELD);
  });

  it('submitPractice 里程碑（第 2 天连续一练）→ 额外 +10 星星币且只发一次', async () => {
    const cid = nextChild();
    await insertChild(cid);
    const today = dateStr();
    await insertCastle(cid, today, 0, 0);
    // 预置「昨天」三科全勤 → 今日完成后连续天数 = 2（命中里程碑）
    for (const s of SUBJECTS) await confirmSubject(cid, addDays(today, -1), s);

    // 构造今日一练：每科 3 题，答案均为 0
    const questions = SUBJECTS.flatMap((subj) =>
      Array.from({ length: 3 }, (_, i) => ({ id: `${subj}-${i}`, kind: 'math', subject: subj, prompt: '1+1=?', options: ['2'], answer: 0, explain: '' })),
    );
    await getDb().execute({
      sql: 'INSERT INTO daily_practice (child_id, day, completed, correct, total, questions) VALUES (?, ?, 0, 0, ?, ?)',
      args: [cid, today, 0, 0, questions.length, JSON.stringify(questions)],
    });

    const r1 = await submitPractice(cid, questions.map(() => 0));
    expect(r1.ok).toBe(true);
    expect(r1.completed).toBe(true);
    expect((await readCastle(cid)).starCoins).toBe(10); // 里程碑 +10

    // 重复提交：streak_rewarded 已置 1，不应再 +10
    await getDb().execute({
      sql: 'UPDATE daily_practice SET completed = 0, correct = 0 WHERE child_id = ? AND day = ?',
      args: [cid, today],
    });
    const r2 = await submitPractice(cid, questions.map(() => 0));
    expect(r2.completed).toBe(true);
    expect((await readCastle(cid)).starCoins).toBe(10); // 仍是 10，未重复发放
  });
});

// 辅助：把城堡阳光清零（复用同一行，避免重复插入冲突）
async function insertCastle2(cid: number) {
  await getDb().execute({ sql: 'UPDATE castle_state SET sunlight = 0 WHERE child_id = ?', args: [cid] });
}
