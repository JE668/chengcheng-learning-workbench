// @vitest-environment node
/**
 * 补打卡日期校验回归测试。
 *
 * 背景（真实缺陷）：castle/approve-timeglass 原先**完全没有日期校验** ——
 * 它从孩子自己填写的申请文案（`castle/request-timeglass`）里正则抠出 `MM月DD日`，
 * 直接盖上「今年」就调 restoreDay。于是孩子可以：
 *   · 补未来日期（today 之后的任何一天）
 *   · 补任意久远的日期（不受 30 天上限约束）
 * 从而反复拿积分/阳光/萌可，并把 castle_state.last_settled_day 游标回拨。
 *
 * 而同一份逻辑在 castle/confirm、castle/use-item 里是有的 —— 三条路径各写各的，
 * 第三处被漏掉。现在收敛为 backfill-date.ts 的唯一实现。
 */
import { describe, expect, it } from 'vitest';
import {
  MAX_BACKFILL_DAYS,
  parseBackfillDateFromWish,
  validateBackfillDay,
} from '@/lib/backfill-date';
import { addDays, dateStr } from '@/lib/date';

const today = dateStr();

describe('validateBackfillDay · 三条补卡路径的共同口径', () => {
  it('合法日期（昨天）通过', () => {
    const r = validateBackfillDay(addDays(today, -1), { allowToday: true });
    expect(r.ok).toBe(true);
    expect(r.day).toBe(addDays(today, -1));
  });

  it('allowToday=true 时今天可过（家长「确认今天」）', () => {
    expect(validateBackfillDay(today, { allowToday: true }).ok).toBe(true);
  });

  it('allowToday=false 时今天被拒（道具只补过去）', () => {
    const r = validateBackfillDay(today, { allowToday: false });
    expect(r.ok).toBe(false);
  });

  it('未来日期一律拒绝 —— 修复前 approve-timeglass 正是漏了这层', () => {
    const r = validateBackfillDay(addDays(today, 1), { allowToday: true });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/今天之后/);
  });

  it('远期未来日期（9999-01-01）同样被拒', () => {
    expect(validateBackfillDay('9999-01-01', { allowToday: true }).ok).toBe(false);
  });

  it(`超过 ${MAX_BACKFILL_DAYS} 天的历史日期被拒（防伪造超长连胜）`, () => {
    const r = validateBackfillDay(addDays(today, -(MAX_BACKFILL_DAYS + 1)), {
      allowToday: true,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(new RegExp(String(MAX_BACKFILL_DAYS)));
  });

  it(`恰好第 ${MAX_BACKFILL_DAYS} 天仍然允许（边界）`, () => {
    expect(validateBackfillDay(addDays(today, -MAX_BACKFILL_DAYS), { allowToday: true }).ok).toBe(
      true
    );
  });

  it('格式非法一律拒绝', () => {
    for (const bad of ['', 'undefined', '2020/01/01', '20200101', '昨天', 'null']) {
      expect(validateBackfillDay(bad, { allowToday: true }).ok, bad).toBe(false);
    }
  });

  it('非字符串入参安全拒绝（undefined / null / number）', () => {
    for (const bad of [undefined, null, 20200101, {}, []]) {
      expect(validateBackfillDay(bad, { allowToday: true }).ok).toBe(false);
    }
  });
});

describe('parseBackfillDateFromWish · 从申请文案解析（解析结果必须再校验）', () => {
  it('解析「补 08月18日」为今年 08-18', () => {
    expect(parseBackfillDateFromWish('⏳ 申请时光沙漏（补 08月18日）', today)).toBe(
      today.slice(0, 4) + '-08-18'
    );
  });

  it('无日期的旧文案返回 null（走兼容分支：发沙漏而不是补卡）', () => {
    expect(parseBackfillDateFromWish('⏳ 申请时光沙漏', today)).toBeNull();
  });

  it('⚠️ 孩子可控：任何月日都能解析出来 —— 所以调用方必须校验', () => {
    // 这正是原缺陷的形状：解析成功 ≠ 日期合法。
    const evil = parseBackfillDateFromWish('补 12月31日', today);
    expect(evil).not.toBeNull();
    // 关键：解析出的值若在未来/超期，必须被 validateBackfillDay 拦下
    const check = validateBackfillDay(evil, { allowToday: true });
    expect(check.ok === false || check.day! <= today).toBe(true);
  });
});
