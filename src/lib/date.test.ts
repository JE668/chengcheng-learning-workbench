import { beforeAll, describe, expect, it } from 'vitest';
import { getDb, ensureSchema } from '@/lib/db';
import { dateStr, addDays, mondayOf, LOCAL_DAY_COL } from '@/lib/date';

describe('date 工具：本地日计算', () => {
  it('dateStr 返回本地 YYYY-MM-DD（不依赖 UTC）', () => {
    // 用确定时区构造 Date，验证取的是「本地」的年月日
    const d = new Date(2026, 7, 12, 23, 30, 0); // 2026-08-12 23:30 本地（月份 0-based=7）
    expect(dateStr(d)).toBe('2026-08-12');
  });

  it('addDays 跨月/跨年正确', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28'); // 非闰年
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29'); // 闰年
  });

  it('mondayOf 返回所在周的周一（本地）', () => {
    // 2026-08-12 是周三 → 周一应为 2026-08-10
    expect(dateStr(mondayOf(new Date(2026, 7, 12)))).toBe('2026-08-10');
    // 周日(2026-08-16)属于下一周的周一之前 → 回到本周一 2026-08-10
    expect(dateStr(mondayOf(new Date(2026, 7, 16)))).toBe('2026-08-10');
    // 周一(2026-08-10)本身
    expect(dateStr(mondayOf(new Date(2026, 7, 10)))).toBe('2026-08-10');
  });

  it('LOCAL_DAY_COL 是带 localtime 的 SQL 片段（杜绝裸 DATE(created_at) 时区 bug）', () => {
    expect(LOCAL_DAY_COL).toBe("DATE(created_at, 'localtime')");
  });
});

describe('DATE 时区聚合（防 cert/reports 同类 bug 复发）', () => {
  beforeAll(async () => {
    await ensureSchema();
  });

  it('completions 按 LOCAL_DAY_COL 聚合到「本地日」，与 JS 本地日一致', async () => {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM completions', args: [] });
    const ts = '2026-08-11 18:30:00'; // SQLite 视为 UTC 时间戳
    await db.execute({
      sql: 'INSERT INTO completions (child_id, points, source, created_at) VALUES (?, 5, ?, ?)',
      args: [1, 't', ts],
    });
    const res = await db.execute({ sql: `SELECT ${LOCAL_DAY_COL} as day FROM completions`, args: [] });
    // 与 JS 本地日对齐：无论 CI/部署在什么时区，SQL localtime 必须与 JS 本地解释一致。
    // 若有人把 LOCAL_DAY_COL 改回裸 DATE(created_at)（UTC），在非 UTC 环境此断言会失败。
    const expected = dateStr(new Date(ts.replace(' ', 'T') + 'Z'));
    expect(String(res.rows[0].day)).toBe(expected);
  });
});
