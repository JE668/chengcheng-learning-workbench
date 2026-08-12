import { describe, expect, it } from 'vitest';
import {
  SUN_PER_SUBJECT,
  PROSPERITY_BONUS,
  STAR_PER_FRIEND,
  SHIELD_STREAK_REQ,
  TICKET_PER_SUBJECT,
  COST_SPRAY,
  COST_SHIELD,
  MILESTONE_DAYS,
  STAR_SHOP_SKINS,
} from './economy';

/**
 * 经济常量「单一事实来源」的护栏测试。
 * 这些数值曾在 moko.ts / castle.ts / daily-practice.ts 多处散落硬编码，
 * 集中到 economy.ts 后，这里锁定其不变量，防止误改导致奖励失衡。
 */
describe('economy 常量护栏', () => {
  it('奖励/消耗均为正整数，且护盾比喷雾贵', () => {
    for (const v of [SUN_PER_SUBJECT, PROSPERITY_BONUS, STAR_PER_FRIEND, SHIELD_STREAK_REQ, TICKET_PER_SUBJECT, COST_SPRAY, COST_SHIELD]) {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThan(0);
    }
    expect(COST_SHIELD).toBeGreaterThan(COST_SPRAY);
  });

  it('MILESTONE_DAYS 严格递增、无重复，且包含关键天数', () => {
    expect(MILESTONE_DAYS.length).toBeGreaterThan(0);
    for (let i = 1; i < MILESTONE_DAYS.length; i++) {
      expect(MILESTONE_DAYS[i]).toBeGreaterThan(MILESTONE_DAYS[i - 1]);
    }
    const uniq = new Set(MILESTONE_DAYS);
    expect(uniq.size).toBe(MILESTONE_DAYS.length);
    // 前期密集奖励曲线：第 2~7 天几乎每天一个里程碑
    for (const d of [2, 3, 4, 5, 6, 7]) expect(MILESTONE_DAYS).toContain(d);
    expect(MILESTONE_DAYS).toContain(90); // 长线目标
  });

  it('护盾兑换要求连续打卡天数合理（>=2 且 <=7）', () => {
    expect(SHIELD_STREAK_REQ).toBeGreaterThanOrEqual(2);
    expect(SHIELD_STREAK_REQ).toBeLessThanOrEqual(7);
  });

  it('星星币商城皮肤列表为已知 key', () => {
    expect(STAR_SHOP_SKINS.length).toBeGreaterThan(0);
    for (const s of STAR_SHOP_SKINS) expect(s.startsWith('skin_')).toBe(true);
  });
});
