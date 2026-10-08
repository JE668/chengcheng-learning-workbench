import { addDays, dateStr } from './date';

/**
 * 补打卡日期校验（家长确认 / 时光沙漏 / 家长审批三条路径共用）。
 *
 * ## 为什么抽出来
 * 历史上这三条路径各自复制了一份校验，结果**各自漏掉不同的洞**：
 *   · castle/confirm              —— 格式 + 非未来 + 30 天上限
 *   · castle/use-item             —— 格式 + 严格早于今天 + 30 天上限
 *   · castle/approve-timeglass    —— ❌ 原本**一个校验都没有**，直接从申请文案里
 *     正则抠出 `MM月DD日` 盖上当前年份就调 restoreDay。孩子完全控制那段文案，
 *     于是可以补任意日期（含未来、含任意久远），拿积分/阳光/萌可，
 *     还会把 castle_state.last_settled_day 游标回拨。
 * 三份近乎重复的代码是这类「修了一半」的根源，所以这里收敛成唯一实现。
 *
 * ## 口径
 * 只允许补**已经过去**、且在最近 MAX_BACKFILL_DAYS 天内的日期。
 * 今天当天能否补由调用方决定（confirm 允许确认今天，use-item 不允许），
 * 故用 `allowToday` 开关表达差异，而不是各写各的。
 */
export const MAX_BACKFILL_DAYS = 30;

export interface BackfillDayCheck {
  ok: boolean;
  /** 归一化后的 YYYY-MM-DD，仅 ok 为 true 时有值 */
  day?: string;
  /** ok 为 false 时可直接回给用户的中文原因 */
  reason?: string;
}

/**
 * 校验补打卡日期。
 *
 * @param raw       外部传入的日期（通常是请求体里的 day）
 * @param options.allowToday true = 允许 day === 今天（家长「确认今天」用）；
 *                          false = 必须严格早于今天（用道具补打卡用）
 */
export function validateBackfillDay(
  raw: unknown,
  options: { allowToday: boolean } = { allowToday: false }
): BackfillDayCheck {
  const dayStr = typeof raw === 'string' ? raw.trim() : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayStr)) {
    return { ok: false, reason: '请选择要补打卡的日期' };
  }
  const today = dateStr();
  // 允许 today 也不允许任何未来日期；文案按调用方角色区分：
  // 家长侧说「确认」（castle/confirm），孩子侧说「补」（castle/use-item）。
  const futureReason = options.allowToday ? '不能确认今天之后的日期' : '只能补今天之前的日期';
  if (dayStr > today) {
    return { ok: false, reason: futureReason };
  }
  if (dayStr === today && !options.allowToday) {
    return { ok: false, reason: futureReason };
  }
  if (dayStr < addDays(today, -MAX_BACKFILL_DAYS)) {
    return { ok: false, reason: '只能补最近 ' + MAX_BACKFILL_DAYS + ' 天内的日期' };
  }
  return { ok: true, day: dayStr };
}

/**
 * 把「补 08月18日」这类申请文案解析成 YYYY-MM-DD。
 *
 * ⚠️ 解析结果**必须**再过 validateBackfillDay 才能使用：这里只负责取出月日，
 * 年份是调用方（或本函数）按「今年」补的，而孩子完全能控制这段文案。
 * 曾因 approve-timeglass 直接使用本函数的结果而不做后续校验，可无限刷分。
 *
 * @param text   申请文案，如「⏳ 申请时光沙漏（补 08月18日）」
 * @param today  当天（YYYY-MM-DD），可注入便于测试
 * @returns 解析出的 YYYY-MM-DD，或 null（文案里没有日期）
 */
export function parseBackfillDateFromWish(text: string, today: string = dateStr()): string | null {
  const m = text.match(/补\s*(\d{2})月(\d{2})日/);
  if (!m) return null;
  const year = today.slice(0, 4);
  return year + '-' + m[1] + '-' + m[2];
}

/**
 * 把 `YYYY-MM-DD` 格式化成给孩子/家长看的「MM月DD日」。
 *
 * ⚠️ 抽出来是因为这里踩过一次：原先是就地拼字符串，
 *
 *   day.slice(5).replace('-', '月') + '月' + day.slice(8) + '日'
 *
 * 而 `day.slice(5).replace('-','月')` 本身**已经是**「09月26」，后面又拼了一次
 * 「月 + day.slice(8) + 日」，于是批准时光沙漏后家长端显示成
 *
 *   ✅ 已批准！**09月26月26日** 补打卡成功…
 *
 * 用固定下标取值（5,7 与 8,10）而不是 replace，语义明确也不受分隔符变化影响。
 */
export function formatBackfillDayLabel(day: string): string {
  return `${day.slice(5, 7)}月${day.slice(8, 10)}日`;
}
