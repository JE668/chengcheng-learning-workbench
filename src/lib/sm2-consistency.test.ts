/**
 * SM-2 实现的单一真源回归测试。
 *
 * ## 缺陷
 * 错题复习（lib/mistakes.ts）曾**重写了一遍** SM-2 递推，与 lib/sm2.ts
 * 的标准实现不一致：
 *  ① 它算出了 `actualInterval`（reps=0→1、reps=1→6，否则 interval*EF），
 *     但**算完从未使用**（死变量）；
 *  ② 实际写库用的是裸公式 `round(interval_days * EF)`，忽略了 reps 特殊
 *     规则 → 第 1 次复习存进 interval_days=3（标准应为 1）、第 2 次存 8
 *     （标准应为 6），字段与算法定义不符；
 *  ③ EF 增量硬编码 +0.02，而标准公式在 q=4 时恰为 +0.000
 *     （EF' = EF + (0.1-(5-q)(0.08+(5-q)*0.02))），
 *     两条路径的排期会随复习次数逐渐分叉。
 *
 * 另修复：calculateSM2Next 接收 `today` 参数却两条分支都写死 `new Date()`，
 * 使该参数形同虚设（也无法在单测里注入固定日期做时区回归）。
 *
 * 这些断言在修复前必然失败。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => ({ id: 1, username: 'x', role: 'child', displayName: 'w' })),
  resolveChildId: vi.fn(async () => 1),
  requireParent: vi.fn(() => null),
  requireChild: vi.fn((u: unknown) => u),
}));

import { getDb, ensureSchema } from '@/lib/db';
import { reviewMistake } from '@/lib/mistakes';
import { calculateSM2Next, INITIAL_SM2_STATE, type SM2State } from '@/lib/sm2';

const CHILD = 1;

async function seedMistake(nextReview: string): Promise<number> {
  await ensureSchema();
  await getDb().execute({
    sql: `INSERT OR REPLACE INTO users (id, username, password_hash, role, display_name)
          VALUES (1, 'x', '', 'child', 'w')`,
    args: [],
  });
  await getDb().execute({ sql: 'DELETE FROM mistakes WHERE child_id = ?', args: [CHILD] });
  const ins = await getDb().execute({
    sql: `INSERT INTO mistakes
          (child_id, subject, kind, prompt, answer, wrong, next_review, interval_days, reps, easiness_factor, resolved)
          VALUES (?, '数学', 'basic', '1+1', '2', '3', ?, 1, 0, 2.5, 0)`,
    args: [CHILD, nextReview],
  });
  return Number(ins.lastInsertRowid);
}

async function readMistake(id: number) {
  const r = (
    await getDb().execute({
      sql: 'SELECT interval_days, reps, easiness_factor, next_review FROM mistakes WHERE id = ?',
      args: [id],
    })
  ).rows[0];
  return {
    interval: Number(r?.interval_days ?? 0),
    reps: Number(r?.reps ?? 0),
    ef: Number(r?.easiness_factor ?? 0),
    nextReview: String(r?.next_review ?? ''),
  };
}

function localToday(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 按标准公式推演 n 次答对后的状态。 */
function stdAfter(n: number): SM2State {
  let st: SM2State = { ...INITIAL_SM2_STATE };
  for (let i = 0; i < n; i++) st = calculateSM2Next(st, 4, localToday());
  return st;
}

describe('reviewMistake · 与标准 SM-2 保持一致', () => {
  beforeEach(async () => {
    await ensureSchema();
  });

  it('第 1 次答对：interval_days 应为 1（修复前存 3）', async () => {
    const id = await seedMistake(localToday());
    await reviewMistake(CHILD, id, true);
    const row = await readMistake(id);
    expect(row.interval, `interval_days=${row.interval}，标准应为 1`).toBe(1);
    expect(row.reps).toBe(1);
  });

  it('EF 在 q=4 时不应增长（标准公式增量为 +0.000，修复前硬编码 +0.02）', async () => {
    const id = await seedMistake(localToday());
    await reviewMistake(CHILD, id, true);
    const row = await readMistake(id);
    expect(row.ef, `EF=${row.ef}，q=4 时标准公式应保持 2.5`).toBeCloseTo(2.5, 5);
  });

  it('连续答对时 interval_days 与标准公式逐次吻合', async () => {
    // 因为幂等守卫会跳过后续复习，这里直接对每次「到期」的复习做一轮：
    // 把 next_review 改回今天，模拟第二天再复习。
    const id = await seedMistake(localToday());
    for (let round = 1; round <= 4; round++) {
      await reviewMistake(CHILD, id, true);
      const row = await readMistake(id);
      const std = stdAfter(round);
      expect(
        row.interval,
        `第 ${round} 次：interval_days=${row.interval}，标准=${std.interval}`
      ).toBe(std.interval);
      expect(row.reps, `第 ${round} 次：reps 不符`).toBe(std.repetitions);
      expect(
        row.ef,
        `第 ${round} 次：EF=${row.ef}，标准=${std.easinessFactor.toFixed(3)}`
      ).toBeCloseTo(std.easinessFactor, 5);

      // 把到期日改回今天，模拟「下一次复习」
      await getDb().execute({
        sql: 'UPDATE mistakes SET next_review = ? WHERE id = ?',
        args: [localToday(), id],
      });
    }
  });

  it('答错时按 SM-2 重置（reps=0、interval=1、EF-0.2）', async () => {
    const id = await seedMistake(localToday());
    // 先答对一次把 EF/reps 提上去
    await reviewMistake(CHILD, id, true);
    await getDb().execute({
      sql: 'UPDATE mistakes SET next_review = ? WHERE id = ?',
      args: [localToday(), id],
    });

    await reviewMistake(CHILD, id, false);
    const row = await readMistake(id);
    expect(row.reps, '答错后 reps 应归零').toBe(0);
    expect(row.interval, '答错后间隔应为 1 天').toBe(1);
    expect(row.ef, '答错后 EF 应减 0.2').toBeCloseTo(2.3, 5);
  });

  it('间隔上限 365 天生效', async () => {
    const id = await seedMistake(localToday());
    // 直接把 reps/interval 推到很高的状态，验证封顶
    await getDb().execute({
      sql: 'UPDATE mistakes SET reps = 6, interval_days = 300, easiness_factor = 2.5, next_review = ? WHERE id = ?',
      args: [localToday(), id],
    });
    await reviewMistake(CHILD, id, true);
    const row = await readMistake(id);
    expect(row.interval, `interval=${row.interval} 应被封顶在 365`).toBeLessThanOrEqual(365);
  });
});

describe('calculateSM2Next · 真正使用 today 参数', () => {
  it('传入历史基准日时，nextReview 相对该基准日计算（而非机器当前时间）', () => {
    const st = calculateSM2Next({ ...INITIAL_SM2_STATE }, 4, '2020-06-15');
    // 第 1 次成功 → 间隔 1 天 → 应为 2020-06-16
    expect(st.nextReview, `nextReview=${st.nextReview}，期望 2020-06-16`).toBe('2020-06-16');
  });

  it('quality < 3 的失败分支同样尊重 today', () => {
    const st = calculateSM2Next(
      { ...INITIAL_SM2_STATE, repetitions: 3, interval: 10 },
      1,
      '2020-06-15'
    );
    expect(st.nextReview).toBe('2020-06-16');
  });

  it('跨月/跨年边界正确', () => {
    expect(calculateSM2Next({ ...INITIAL_SM2_STATE }, 4, '2020-06-30').nextReview).toBe(
      '2020-07-01'
    );
    expect(calculateSM2Next({ ...INITIAL_SM2_STATE }, 4, '2020-12-31').nextReview).toBe(
      '2021-01-01'
    );
  });
});
