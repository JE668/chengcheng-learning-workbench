// @vitest-environment node
/**
 * 两个「两处数据必须一致」的护栏 + 自适应难度逻辑的修复与验证。
 *
 * ## 已修 1：magicShop 冰冻徽章价格写死成 8
 * 实际扣费走 castle.ts 的 COST_FREEZE（economy.ts 单一事实来源），
 * 展示走 moko.ts magicShop 的 cost 字段。原先 freeze 的 cost 是**硬编码 8**，
 * spray/shield 却都用常量 —— 一旦有人调价，展示和扣费就会分叉。
 *
 * ## 已修 2：recommendDifficulty 取的是「最近几条里最旧」的关卡
 * computePerformance 把 recentLevels 按 completedAt **降序**（最近的在前），
 * 但 recommendDifficulty 取了 length-1（最旧那条）—— 用户打完 1~5 关，
 * currentLevel 会算成 1 而不是 5，升降级方向全反。这两个函数目前**没有任何调用方**
 * （潜伏缺陷），但它们是导出的工具函数，语义必须先修对。
 */
import { describe, expect, it } from 'vitest';
import { magicShop, games, mokoChars, subjectMokoKey } from './moko';
import { COST_SPRAY, COST_SHIELD, COST_FREEZE } from './economy';
import { recommendDifficulty, computePerformance } from './algorithm/adaptive';

describe('magicShop ↔ economy 单一事实来源', () => {
  it('⚠️ 展示价必须等于实际扣费价（economy 常量）', () => {
    const byKey = new Map(magicShop.map((i) => [i.key, i.cost]));
    expect(byKey.get('spray')).toBe(COST_SPRAY);
    expect(byKey.get('shield')).toBe(COST_SHIELD);
    expect(byKey.get('freeze')).toBe(COST_FREEZE);
  });

  it('三个商品 key 不重复', () => {
    const keys = magicShop.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('games ↔ mokoChars', () => {
  it('⚠️ 每个游戏的 mokoKey 都必须能解析到萌可', () => {
    const bad = games.filter((g) => !mokoChars[g.mokoKey]).map((g) => g.id + ' → ' + g.mokoKey);
    expect(bad, '解析不了的 mokoKey：' + JSON.stringify(bad)).toEqual([]);
  });

  it('⚠️ 学科萌可 key（subjectMokoKey）必须能解析 —— 否则收集数会重复计数', () => {
    // moko.ts 注释警告过：col_* 与 heartping 等双 key 会把同一只萌可算两次。
    // mokoChars 已合并 mokoCollection（含 col_*），所以这里必须全部命中。
    const bad = Object.values(subjectMokoKey).filter((k) => !mokoChars[k]);
    expect(bad, '解析不了的学科萌可：' + JSON.stringify(bad)).toEqual([]);
  });

  it('mokoChars 的记录键必须与内部 key 字段一致', () => {
    const bad = Object.entries(mokoChars)
      .filter(([k, v]) => v.key !== k)
      .map(([k]) => k);
    expect(bad.slice(0, 5), JSON.stringify(bad.slice(0, 5))).toEqual([]);
  });
});

describe('recommendDifficulty（自适应难度）', () => {
  const P = (accuracy: number, attempts: number, levels: number[]) => ({
    topicId: 't',
    avgAccuracy: accuracy,
    totalAttempts: attempts,
    recentLevels: levels,
  });

  it('⚠️ currentLevel 取的是最近玩的关卡（数组第一位），不是最旧的', () => {
    // 用户依次打完 1→5 关：computePerformance 生成 [5,4,3,2,1]（最近的在前）
    const r = recommendDifficulty(P(0.8, 10, [5, 4, 3, 2, 1]));
    expect(r.currentLevel).toBe(5); // 原实现会得到 1
  });

  it('数据不足（<3 次）：保持当前关，低置信', () => {
    const r = recommendDifficulty(P(0.95, 2, [3]));
    expect(r.suggestedLevel).toBe(3);
    expect(r.confidence).toBe('low');
  });

  it('正确率 ≥90%：升 1 级', () => {
    expect(recommendDifficulty(P(0.95, 10, [4])).suggestedLevel).toBe(5);
  });

  it('第 10 关封顶，不再往上', () => {
    const r = recommendDifficulty(P(0.95, 10, [10]));
    expect(r.suggestedLevel).toBe(10);
  });

  it('正确率 70~90%：保持', () => {
    const r = recommendDifficulty(P(0.8, 10, [5]));
    expect(r.suggestedLevel).toBe(5);
    expect(r.confidence).toBe('medium');
  });

  it('正确率 <70%：降 1 级，且不低于第 1 关', () => {
    expect(recommendDifficulty(P(0.5, 10, [5])).suggestedLevel).toBe(4);
    expect(recommendDifficulty(P(0.5, 10, [1])).suggestedLevel).toBe(1);
  });

  it('没有历史关卡时默认第 1 关', () => {
    expect(recommendDifficulty(P(0, 0, [])).currentLevel).toBe(1);
  });
});

describe('computePerformance', () => {
  it('recentLevels 必须按时间降序（最近的在前）—— recommendDifficulty 依赖这个约定', () => {
    const p = computePerformance([
      {
        level: 1,
        correctCount: 8,
        totalCount: 10,
        bestStars: 2,
        completedAt: '2026-01-01T00:00:00Z',
      },
      {
        level: 2,
        correctCount: 9,
        totalCount: 10,
        bestStars: 3,
        completedAt: '2026-01-02T00:00:00Z',
      },
      {
        level: 5,
        correctCount: 10,
        totalCount: 10,
        bestStars: 3,
        completedAt: '2026-01-05T00:00:00Z',
      },
    ]);
    expect(p.recentLevels[0]).toBe(5); // 最近玩的是第 5 关
    expect(p.avgAccuracy).toBeCloseTo(27 / 30, 5);
    expect(p.totalAttempts).toBe(30);
  });

  it('只统计已完成的关卡', () => {
    const p = computePerformance([
      { level: 1, correctCount: 8, totalCount: 10, bestStars: 0, completedAt: null },
      {
        level: 3,
        correctCount: 10,
        totalCount: 10,
        bestStars: 3,
        completedAt: '2026-01-03T00:00:00Z',
      },
    ]);
    expect(p.recentLevels).toEqual([3]);
  });
});
