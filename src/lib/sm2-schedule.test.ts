// @vitest-environment jsdom
/**
 * SM-2 纯调度辅助函数回归测试。
 *
 * 此前 calculateSM2Next 有 sm2-consistency / mistakes-review-sm2 两套测试锁死，
 * 但「下次复习展示 / 批量信息 / 未来负载预测 / 掌握度进度」这批纯函数 0 覆盖，
 * 是错题复习 UI（逾期红字、今天到期、未来 N 天负载）的数据源，重构易静默坏掉。
 * 用固定日期构造状态，避免 new Date() 漂移导致 flaky。
 */
import { describe, expect, it } from 'vitest';
import { today, formatDate, addDaysToDate } from './sm2';
import {
  INITIAL_SM2_STATE,
  getNextReviewInfo,
  getBatchReviewInfo,
  predictReviewLoad,
  calculateReviewProgress,
  binaryToQuality,
  type SM2State,
} from './sm2';

const T = today(); // 固定基准日（这些纯函数内部都调 today()）

function state(nextReview: string, over: Partial<SM2State> = {}): SM2State {
  return { ...INITIAL_SM2_STATE, nextReview, ...over };
}

describe('sm2 纯调度辅助函数', () => {
  describe('getNextReviewInfo（下次复习展示）', () => {
    it('nextReview 在过去 → overdue，label 带逾期天数', () => {
      const past = addDaysToDate(T, -3);
      const info = getNextReviewInfo(state(past));
      expect(info.isOverdue).toBe(true);
      expect(info.urgency).toBe('overdue');
      expect(info.daysUntilReview).toBe(-3);
      expect(info.label).toContain('逾期 3 天');
    });

    it('nextReview 就是今天 → due-today，非 overdue', () => {
      const info = getNextReviewInfo(state(T));
      expect(info.isOverdue).toBe(false);
      expect(info.urgency).toBe('due-today');
      expect(info.daysUntilReview).toBe(0);
      expect(info.label).toBe('今天到期');
    });

    it('nextReview 在 1~3 天内 → due-soon', () => {
      const info = getNextReviewInfo(state(addDaysToDate(T, 2)));
      expect(info.urgency).toBe('due-soon');
      expect(info.daysUntilReview).toBe(2);
      expect(info.label).toBe('2 天后到期');
    });

    it('nextReview 超过 3 天 → later', () => {
      const info = getNextReviewInfo(state(addDaysToDate(T, 10)));
      expect(info.urgency).toBe('later');
      expect(info.daysUntilReview).toBe(10);
      expect(info.label).toBe('10 天后复习');
    });
  });

  describe('getBatchReviewInfo（批量信息）', () => {
    it('按卡片 id 归集各自的复习信息', () => {
      const map = getBatchReviewInfo([
        { id: 'a', state: state(T) },
        { id: 'b', state: state(addDaysToDate(T, -1)) },
      ]);
      expect(map.size).toBe(2);
      expect(map.get('a')?.urgency).toBe('due-today');
      expect(map.get('b')?.urgency).toBe('overdue');
    });

    it('空列表返回空 Map', () => {
      expect(getBatchReviewInfo([]).size).toBe(0);
    });
  });

  describe('predictReviewLoad（未来负载预测）', () => {
    it('默认 14 天，未来每天的到期卡数统计正确', () => {
      const d3 = addDaysToDate(T, 3);
      const cards = [
        { state: state(d3) },
        { state: state(d3) }, // 同一天两张
        { state: state(T) }, // 今天一张
      ];
      const load = predictReviewLoad(cards);
      expect(load.size).toBe(14);
      expect(load.get(d3)).toBe(2);
      expect(load.get(T)).toBe(1);
      // 未来第 5 天没有卡 → 0
      expect(load.get(addDaysToDate(T, 5))).toBe(0);
    });

    it('nextReview 超出预测窗口的卡不计入任何一天', () => {
      const far = addDaysToDate(T, 100);
      const load = predictReviewLoad([{ state: state(far) }], 14);
      let sum = 0;
      for (const v of load.values()) sum += v;
      expect(sum).toBe(0);
    });

    it('自定义天数窗口', () => {
      const load = predictReviewLoad([], 7);
      expect(load.size).toBe(7);
    });
  });

  describe('calculateReviewProgress（掌握度进度）', () => {
    it('统计到期数 / 成熟数 / 学习中数 / 平均间隔', () => {
      const cards = [
        { state: state(T, { isMature: true, interval: 10, easinessFactor: 2.5 }) },
        {
          state: state(addDaysToDate(T, -1), { isMature: false, interval: 1, easinessFactor: 2.5 }),
        },
        {
          state: state(addDaysToDate(T, 30), { isMature: true, interval: 30, easinessFactor: 2.5 }),
        },
      ];
      const p = calculateReviewProgress(cards, new Map());

      expect(p.totalCards).toBe(3);
      expect(p.dueToday).toBe(2); // 今天 + 昨天（≤今天都算到期）
      expect(p.matureCards).toBe(2);
      expect(p.learningCards).toBe(1);
      expect(p.averageInterval).toBeCloseTo((10 + 1 + 30) / 3);
      expect(p.averageEasiness).toBeCloseTo(2.5);
    });

    it('空卡片列表 → 平均值走兜底（easiness 2.5 / interval 0），不 NaN', () => {
      const p = calculateReviewProgress([], new Map());
      expect(p.totalCards).toBe(0);
      expect(p.averageEasiness).toBe(2.5);
      expect(p.averageInterval).toBe(0);
      expect(p.dueToday).toBe(0);
    });

    it('连续复习天数：今天有记录 → streak 至少 1', () => {
      const cards = [{ state: state(T) }];
      const history = new Map<string, { date: string }[]>();
      history.set('c1', [{ date: T }]);
      const p = calculateReviewProgress(cards, history as any);
      expect(p.streakDays).toBeGreaterThanOrEqual(1);
    });
  });

  describe('binaryToQuality（对错 → SM2 质量）', () => {
    it('答对 → 4（成功阈值 ≥3），答错 → 1（<3 触发重置）', () => {
      expect(binaryToQuality(true)).toBe(4);
      expect(binaryToQuality(false)).toBe(1);
    });
  });

  describe('formatDate / today 往返一致', () => {
    it('formatDate 产出的串能被 today()/addDaysToDate 消费（YYYY-MM-DD）', () => {
      const s = formatDate(new Date(2026, 0, 2)); // 2026-01-02，注意补零
      expect(s).toBe('2026-01-02');
      expect(addDaysToDate(s, 1)).toBe('2026-01-03');
    });
  });
});
