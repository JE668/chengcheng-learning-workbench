// @vitest-environment node
/**
 * cert.ts 的奖状统计回归测试（本文件此前 12.8% 覆盖）。
 *
 * ## 为什么值得测
 * 奖状是「孩子一周努力」的门面输出，而且孩子端预览与家长端审批共用
 * getCertData()（刻意共用，避免两边口径不一致 → 孩子看到的和家長批的不一样）。
 * 它的正确性全靠几条 SQL 的日期边界与状态过滤，改一行就静默算错，
 * 而错了不会报错，只会「奖状上的积分比实际少一半」这种孩子看得见的错。
 *
 * ## 锁住的四条契约
 *   1. 统计窗口是「本地周一 ~ 周日」，上周的分数一分都不能算进来；
 *   2. 满勤天 = 当天恰好 3 科 confirmed（语文/数学/英语，schema 上有
 *      UNIQUE(child_id, day, subject)，所以一天最多 3 行）；pending 不算；
 *   3. 跨孩子隔离：A 的奖状里不能出现 B 的积分/打卡/错题（页面直接传
 *      childId，越权风险由调用方的 resolveChildId 兜，这里兜住查询本身串号）；
 *   4. users.cert_pref 是 JSON 文本，脏数据（非法 JSON、空 name）必须回落到
 *      账号显示名，而不是让整张奖状 500。
 *
 * getBadges 被 mock 掉：徽章判定属于 castle 的领域（那边有自己的测试），
 * 本文件只管「cert 有没有只挑出 earned 的、有没有把 emoji/name 之外的字段漏出去」。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const badgeState = vi.hoisted(() => ({
  badges: [] as Array<{ emoji: string; name: string; earned: boolean; hint: string }>,
}));

vi.mock('./castle', () => ({
  // 只对主角返回徽章：若 cert.ts 把 childId 传错，断言会直接变空而不是假通过。
  getBadges: async (childId: number) => (childId === CHILD ? badgeState.badges : []),
}));

import { getDb, ensureSchema } from '@/lib/db';
import { dateStr, mondayOf } from '@/lib/date';
import { getCertData, getCertRequestStatus, getCertRequests } from './cert';

const CHILD = 7301; // 主角（vi.mock 工厂在调用时才读它，不受 import 提升影响）
const OTHER = 7302; // 另一个孩子，用于跨孩子隔离断言
const PARENT = 7300;

const db = () => getDb();

/** 本周周一 / 周日（与 cert.ts 同源的 mondayOf，避免两套周定义）。 */
function weekWindow() {
  const ws = mondayOf(new Date());
  const we = new Date(ws);
  we.setDate(ws.getDate() + 6);
  return { ws: dateStr(ws), we: dateStr(we), monday: ws };
}

/** 相对本周某一天：offset 从周一算起（-1 = 上周日）。 */
function dayOfWeek(offset: number): string {
  const d = mondayOf(new Date());
  d.setDate(d.getDate() + offset);
  return dateStr(d);
}

async function putUser(
  id: number,
  role: 'parent' | 'child',
  name: string,
  parentId: number | null
) {
  await db().execute({
    sql: `INSERT OR REPLACE INTO users (id, username, password_hash, role, display_name, parent_id)
          VALUES (?, ?, 'h', ?, ?, ?)`,
    args: [id, `cert-u${id}`, role, name, parentId],
  });
}

/** 写一条打卡。created_at 用 day 当天正午，避开 localtime 的跨天抖动。 */
async function checkin(childId: number, day: string, subject: string, status: string) {
  await db().execute({
    sql: `INSERT OR REPLACE INTO daily_checkins (child_id, day, subject, status, confirmed_at)
          VALUES (?, ?, ?, ?, datetime(?))`,
    args: [childId, day, subject, status, `${day} 12:00:00`],
  });
}

async function complete(childId: number, day: string, points: number) {
  await db().execute({
    sql: `INSERT INTO completions (task_id, child_id, points, source, created_at)
          VALUES (NULL, ?, ?, 'test', datetime(?))`,
    args: [childId, points, `${day} 12:00:00`],
  });
}

async function setCertPref(childId: number, raw: string | null) {
  await db().execute({ sql: 'UPDATE users SET cert_pref = ? WHERE id = ?', args: [raw, childId] });
}

async function requestCert(childId: number, status: string) {
  await db().execute({
    sql: 'INSERT INTO cert_requests (child_id, status) VALUES (?, ?)',
    args: [childId, status],
  });
}

beforeEach(async () => {
  await ensureSchema();
  badgeState.badges = [];
  await db().execute({
    sql: 'DELETE FROM cert_requests WHERE child_id IN (?, ?)',
    args: [CHILD, OTHER],
  });
  await db().execute({
    sql: 'DELETE FROM daily_checkins WHERE child_id IN (?, ?)',
    args: [CHILD, OTHER],
  });
  await db().execute({
    sql: 'DELETE FROM completions WHERE child_id IN (?, ?)',
    args: [CHILD, OTHER],
  });
  await db().execute({
    sql: 'DELETE FROM mistakes WHERE child_id IN (?, ?)',
    args: [CHILD, OTHER],
  });
  await db().execute({
    sql: 'DELETE FROM moko_owned WHERE child_id IN (?, ?)',
    args: [CHILD, OTHER],
  });
  await putUser(PARENT, 'parent', '家長', null);
  await putUser(CHILD, 'child', '成成', PARENT);
  await putUser(OTHER, 'child', '别人家娃', PARENT);
  await setCertPref(CHILD, null);
});

describe('getCertData · 统计窗口', () => {
  it('weekLabel 是「本地周一 ~ 周日」，与 mondayOf 同源', async () => {
    const { ws, we } = weekWindow();
    const data = await getCertData(CHILD, '成成');
    expect(data.weekLabel).toBe(`${ws} ~ ${we}`);
    expect(data.date).toBe(dateStr(new Date()));
  });

  it('pointsWeek 只加本周，上周的分一分都不算', async () => {
    await complete(CHILD, dayOfWeek(0), 5);
    await complete(CHILD, dayOfWeek(2), 7);
    await complete(CHILD, dayOfWeek(-1), 99); // 上周日：越界一分都不能要
    await complete(CHILD, dayOfWeek(7), 50); // 下周一：同样越界
    const data = await getCertData(CHILD, '成成');
    expect(data.pointsWeek).toBe(12);
  });

  it('本周日（窗口最后一天）仍算本周 —— 别写成开区间', async () => {
    await complete(CHILD, dayOfWeek(6), 8);
    expect((await getCertData(CHILD, '成成')).pointsWeek).toBe(8);
  });

  it('一天零分也不报错，返回 0 而不是 undefined/null', async () => {
    const data = await getCertData(CHILD, '成成');
    expect(data.pointsWeek).toBe(0);
    expect(data.fullDays).toBe(0);
    expect(data.activeDays).toBe(0);
  });
});

describe('getCertData · 满勤天与活跃天', () => {
  it('当天 3 科 confirmed 记 1 个满勤天', async () => {
    const d = dayOfWeek(0);
    for (const s of ['语文', '数学', '英语']) await checkin(CHILD, d, s, 'confirmed');
    const data = await getCertData(CHILD, '成成');
    expect(data.fullDays).toBe(1);
    expect(data.activeDays).toBe(1);
  });

  it('只打卡 2 科不算满勤，但仍算活跃天', async () => {
    const d = dayOfWeek(0);
    await checkin(CHILD, d, '语文', 'confirmed');
    await checkin(CHILD, d, '数学', 'confirmed');
    const data = await getCertData(CHILD, '成成');
    expect(data.fullDays).toBe(0);
    expect(data.activeDays).toBe(1);
  });

  it('pending（家长还没确认）既不满勤也不活跃', async () => {
    const d = dayOfWeek(0);
    for (const s of ['语文', '数学', '英语']) await checkin(CHILD, d, s, 'pending');
    const data = await getCertData(CHILD, '成成');
    expect(data.fullDays).toBe(0);
    expect(data.activeDays).toBe(0);
  });

  it('跨周只数本周：上周满勤 + 本周满勤各一天，只算本周那天', async () => {
    for (const s of ['语文', '数学', '英语']) {
      await checkin(CHILD, dayOfWeek(-1), s, 'confirmed');
      await checkin(CHILD, dayOfWeek(1), s, 'confirmed');
    }
    expect((await getCertData(CHILD, '成成')).fullDays).toBe(1);
  });
});

describe('getCertData · 名字定制（脏数据必须回落）', () => {
  it('cert_pref.name 有值时优先用它', async () => {
    await setCertPref(CHILD, JSON.stringify({ name: '小朵朵', mokoKey: 'm1' }));
    expect((await getCertData(CHILD, '成成')).childName).toBe('小朵朵');
  });

  it('name 是空白串时回落到账号显示名（不能发一张空白奖状）', async () => {
    await setCertPref(CHILD, JSON.stringify({ name: '   ' }));
    expect((await getCertData(CHILD, '成成')).childName).toBe('成成');
  });

  it('cert_pref 是非法 JSON 时回落而不是抛错', async () => {
    await setCertPref(CHILD, '{不是 JSON');
    expect((await getCertData(CHILD, '成成')).childName).toBe('成成');
  });

  it('cert_pref 存了合法 JSON 但 name 不是字符串时回落', async () => {
    await setCertPref(CHILD, JSON.stringify({ name: 12345 }));
    expect((await getCertData(CHILD, '成成')).childName).toBe('成成');
  });
});

describe('getCertData · 累计量与徽章', () => {
  it('resolvedCount / mokoCount 是累计量，不受本周窗口限制', async () => {
    await db().execute({
      sql: `INSERT INTO mistakes (child_id, subject, kind, prompt, answer, wrong, next_review, resolved)
            VALUES (?, '数学', '口算', 'p', 'a', 'w', '2026-01-01', 1)`,
      args: [CHILD],
    });
    await db().execute({
      sql: `INSERT INTO mistakes (child_id, subject, kind, prompt, answer, wrong, next_review, resolved)
            VALUES (?, '数学', '口算', 'p2', 'a', 'w', '2026-01-01', 0)`,
      args: [CHILD],
    });
    await db().execute({
      sql: "INSERT INTO moko_owned (child_id, moko_key, subject) VALUES (?, 'mk1', '语文')",
      args: [CHILD],
    });
    const data = await getCertData(CHILD, '成成');
    expect(data.resolvedCount).toBe(1); // 只算已攻克
    expect(data.mokoCount).toBe(1);
  });

  it('只带出 earned 的徽章，且只暴露 emoji/name', async () => {
    badgeState.badges = [
      { emoji: '🏰', name: '城堡之主', earned: true, hint: '绝密提示' },
      { emoji: '🌱', name: '初学者', earned: false, hint: '未解锁' },
    ];
    const data = await getCertData(CHILD, '成成');
    expect(data.earnedBadges).toEqual([{ emoji: '🏰', name: '城堡之主' }]);
    expect(JSON.stringify(data.earnedBadges)).not.toContain('hint');
  });
});

describe('getCertData · 跨孩子隔离', () => {
  it('A 的奖状不含 B 的积分、打卡与萌可', async () => {
    const d = dayOfWeek(0);
    await complete(CHILD, d, 5);
    await complete(OTHER, d, 500);
    for (const s of ['语文', '数学', '英语']) {
      await checkin(OTHER, d, s, 'confirmed');
      await checkin(CHILD, d, s, 'confirmed');
    }
    await db().execute({
      sql: "INSERT INTO moko_owned (child_id, moko_key, subject) VALUES (?, 'mk-other', '语文')",
      args: [OTHER],
    });
    const mine = await getCertData(CHILD, '成成');
    expect(mine.pointsWeek).toBe(5);
    expect(mine.mokoCount).toBe(0);
    expect(mine.fullDays).toBe(1); // 仍是一天，不因 B 同日满勤变 2
  });
});

describe('奖状申请状态', () => {
  it('没有申请时返回 null（页面据此显示「申请奖状」按钮）', async () => {
    expect(await getCertRequestStatus(CHILD)).toBeNull();
    expect(await getCertRequests(CHILD)).toEqual([]);
  });

  it('多条申请时取最新一条（按 id 倒序，不是按状态优先级）', async () => {
    await requestCert(CHILD, 'approved');
    await requestCert(CHILD, 'rejected');
    await requestCert(CHILD, 'pending');
    expect(await getCertRequestStatus(CHILD)).toBe('pending');
  });

  it('最新状态被家长改成 approved 后立即生效', async () => {
    await requestCert(CHILD, 'pending');
    await db().execute({
      sql: "UPDATE cert_requests SET status = 'approved' WHERE child_id = ?",
      args: [CHILD],
    });
    expect(await getCertRequestStatus(CHILD)).toBe('approved');
  });

  it('列表按时间倒序并带 id / createdAt', async () => {
    await requestCert(CHILD, 'pending');
    await requestCert(CHILD, 'rejected');
    const list = await getCertRequests(CHILD);
    expect(list).toHaveLength(2);
    expect(list[0].status).toBe('rejected');
    expect(list[0].id).toBeGreaterThan(list[1].id);
    expect(typeof list[0].createdAt).toBe('string');
  });

  it('只返回本孩子的申请', async () => {
    await requestCert(OTHER, 'approved');
    expect(await getCertRequestStatus(CHILD)).toBeNull();
    expect(await getCertRequests(CHILD)).toEqual([]);
  });
});
