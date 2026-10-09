// @vitest-environment node
/**
 * 每日一练出题必须**永不抛错**（真实缺陷的回归测试）。
 *
 * ## 现场
 * CI 上 business-flows 的「每日一练」三次重试全挂，页面显示 HTTP 500。
 * 上传 dev server 日志后拿到真实堆栈：
 *
 *   [api/daily-practice] GET 失败: TypeError: gen is not a function
 *
 * ## 根因
 * src/lib/daily-practice/index.ts 构造数学生成器池时：
 *
 *   ...ALGORITHM_TOPICS.map((topic) => () => {
 *     const gen = ALGORITHM_GENERATORS[topic.id];
 *     const algoQ = gen(1);          // ← 没有判空
 *
 * 而 `ALGORITHM_TOPICS` 里有 **adding-parens**，`ALGORITHM_GENERATORS` 里没有它
 * （那边多出来的是 misc）—— 两者是对不上的两个清单。
 *
 * 之所以「偶发」：数学题池会 shuffle 后 `slice(0, 10)`，只有抽到那个缺生成器的
 * 主题才会炸。所以本地常常过、CI 偶发红，且重试可能再次抽中。
 *
 * 对比参照：src/lib/algorithm/generators.ts 的 genPracticeSet() 是**有判空**的
 * （`if (!gen) return []`）——同一个数据不一致，只有这里漏了防卫。
 *
 * ## 本文件怎么钉
 * 1. 行为：反复出题多次，必须**一次都不抛**且始终 ≥10 题 —— 这能真正复现
 *    「抽中坏主题」的情形（单次调用可能恰好避开）。
 * 2. 数据：两个清单的对账。缺生成器的主题必须显式登记在已知缺口里，
 *    逼后来的人做决定（补生成器 / 补 skip），而不是静默崩。
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb, ensureSchema } from '@/lib/db';
import { generateQuestions } from '@/lib/daily-practice';
import { ALGORITHM_TOPICS } from '@/lib/algorithm/topics';
import { ALGORITHM_GENERATORS } from '@/lib/algorithm/generators';

const CHILD = 3302;

beforeEach(async () => {
  await ensureSchema();
  const d = getDb();
  await d.execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name) VALUES (3301,'dq-p','x','parent','p')",
    args: [],
  });
  await d.execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (?,?,'x','child','c',3301)",
    args: [CHILD, 'dq-c' + CHILD],
  });
});

describe('generateQuestions · 出题不得因数据不一致而抛错', () => {
  it('⚠️ 反复出题 200 次，必须一次都不抛且始终 ≥10 题', async () => {
    const failures: string[] = [];
    let minLen = Infinity;
    for (let i = 0; i < 200; i++) {
      try {
        const qs = await generateQuestions(CHILD);
        minLen = Math.min(minLen, qs.length);
      } catch (e) {
        failures.push(i + ': ' + (e instanceof Error ? e.message : String(e)));
        if (failures.length >= 3) break;
      }
    }
    console.log('  最少题数 = ' + minLen);
    expect(failures, '出题抛错（数学题池抽到没有生成器的主题）：\n' + failures.join('\n')).toEqual(
      []
    );
    expect(minLen).toBeGreaterThanOrEqual(10);
  });

  it('数据对账：缺生成器的主题必须被显式跳过（不能静默崩）', () => {
    // 当前已知缺口：adding-parens 在主题表里有，生成器表里没有。
    // 若有人新增了主题却没加生成器，这里会红，逼他做决定。
    const KNOWN_MISSING = new Set(['adding-parens']);
    const missing = ALGORITHM_TOPICS.map((t) => t.id).filter(
      (id) => !ALGORITHM_GENERATORS[id] && !KNOWN_MISSING.has(id)
    );
    expect(
      missing,
      '这些主题没有生成器，出题时会炸。要么补生成器，要么加进 KNOWN_MISSING 并确保出题端跳过：\n  ' +
        missing.join('\n  ')
    ).toEqual([]);
  });
});
