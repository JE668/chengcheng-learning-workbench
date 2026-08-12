/**
 * 本地下日期工具：全仓唯一的「本地日」计算出口。
 *
 * 设计意图：之前 dateStr/addDays 在 castle.ts、daily-practice.ts、game-complete 路由、
 * 测试里各写一遍，且 SQL 里有的写 DATE(created_at)、有的写 DATE(created_at,'localtime')，
 * 导致时区 bug 反复出现（cert、reports 周报各踩一次）。统一到这里后：
 *   - JS 侧要本地 YYYY-MM-DD → 用 dateStr()
 *   - SQL 侧要按本地时区取「日」→ 用 LOCAL_DAY_COL 片段，绝不再手写裸 DATE(created_at)
 */

/** 本地 YYYY-MM-DD（基于运行环境的本地时区）。 */
export function dateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 在 YYYY-MM-DD 字符串上加减天数，返回本地日字符串。 */
export function addDays(s: string, n: number): string {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return dateStr(d);
}

/** 取某日期所在周的周一 00:00（本地），用于「本周」统计。 */
export function mondayOf(d: Date = new Date()): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

/**
 * SQL 片段：把 UTC 的 created_at 按服务器本地时区取整到「日」。
 * 全仓所有按 created_at 聚合/判重的查询都必须用这个，绝不能写裸 DATE(created_at)，
 * 否则东八区午夜前后（本地日 vs UTC 日错位）会算错天。
 */
export const LOCAL_DAY_COL = "DATE(created_at, 'localtime')";
