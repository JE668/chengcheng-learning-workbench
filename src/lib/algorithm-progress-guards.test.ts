// @vitest-environment node
/**
 * algorithm-progress 的服务端防伪造与星级单调性（真实 DB）。
 *
 * 这个 POST 的**所有数字都来自客户端**（correctCount / totalCount / mistakes），
 * 因此路由里有一整套逐项约束。源码注释记着其中两条是**已修掉的伪造漏洞**：
 *
 *   ① 星级曾直接用客户端的 totalCount 算比例 —— 报 totalCount=0 会让 ratio 变成
 *      Infinity，**直接拿 3 星**。现在题量以服务端 genPracticeSet 生成为准。
 *   ② correctCount 未上限 —— 报 999 就能压出 3 星。现在被压回
 *      「总题量 − 错题数」。
 *
 * 另外 UPSERT 里 correct_count / best_stars 都是**取较大值**（单调不回退），
 * 这一条也得钉住：一次手滑的低分提交不该抹掉已有星级。
 *
 * 不 mock 数据层。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  user: { id: 4102, role: 'child' } as null | { id: number; role: string },
  childId: 4102 as number | null,
}));

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(async () => h.user),
  resolveChildId: vi.fn(async () => h.childId),
}));

import { GET, POST } from '@/app/api/algorithm-progress/route';
import { genPracticeSet } from '@/lib/algorithm/generators';
import { getDb, ensureSchema } from '@/lib/db';

const ME = 4102;
const TOPIC = 'commutative';
const LV = 1;
const SERVER_TOTAL = Math.max(genPracticeSet(TOPIC, LV).length, 1);

function req(body: unknown): Request {
  return new Request('http://l/api/algorithm-progress', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
const db = () => getDb();

async function row() {
  const r = await db().execute({
    sql: 'SELECT correct_count, total_count, best_stars FROM algorithm_progress WHERE child_id = ? AND topic_id = ? AND level = ?',
    args: [ME, TOPIC, LV],
  });
  if (!r.rows.length) return null;
  return {
    correct: Number(r.rows[0].correct_count),
    total: Number(r.rows[0].total_count),
    stars: Number(r.rows[0].best_stars),
  };
}

beforeEach(async () => {
  await ensureSchema();
  h.user = { id: ME, role: 'child' };
  h.childId = ME;
  await db().execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name) VALUES (4101,'ag-p','x','parent','p')",
    args: [],
  });
  await db().execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (?,?,'x','child','c',4101)",
    args: [ME, 'ag-c' + ME],
  });
  await db().execute({ sql: 'DELETE FROM algorithm_progress WHERE child_id = ?', args: [ME] });
  await db().execute({ sql: 'DELETE FROM algorithm_mistakes WHERE child_id = ?', args: [ME] });
});

describe('algorithm-progress · 鉴权与入参', () => {
  it('未登录 → 401；没有孩子 → 404', async () => {
    h.user = null;
    expect((await POST(req({ topicId: TOPIC, level: LV, correctCount: 1 }))).status).toBe(401);
    h.user = { id: ME, role: 'child' };
    h.childId = null;
    expect((await POST(req({ topicId: TOPIC, level: LV, correctCount: 1 }))).status).toBe(404);
  });

  it('缺必要参数 → 400', async () => {
    for (const b of [{}, { topicId: TOPIC }, { topicId: TOPIC, level: LV }]) {
      expect((await POST(req(b))).status, JSON.stringify(b)).toBe(400);
    }
  });

  it('未知主题 → 400（白名单）', async () => {
    expect((await POST(req({ topicId: 'not-a-topic', level: 1, correctCount: 1 }))).status).toBe(
      400
    );
  });

  it('关卡越界或非整数 → 400', async () => {
    for (const lv of [0, 11, -1, 1.5, NaN]) {
      const res = await POST(req({ topicId: TOPIC, level: lv, correctCount: 1 }));
      expect(res.status, 'level=' + lv).toBe(400);
    }
  });

  it('负数/非法 correctCount → 400', async () => {
    for (const c of [-1, -100]) {
      expect(
        (await POST(req({ topicId: TOPIC, level: LV, correctCount: c }))).status,
        'c=' + c
      ).toBe(400);
    }
  });
});

describe('algorithm-progress · 防伪造（两条已修漏洞的回归）', () => {
  it('⚠️ 报 totalCount=0 不能换到 3 星（题量以服务端为准）', async () => {
    // 原实现 ratio = correct / 客户端 totalCount → 0 会变成 Infinity → 3 星
    const res = await POST(req({ topicId: TOPIC, level: LV, correctCount: 0, totalCount: 0 }));
    const body = await res.json();
    console.log('  total=0 -> ' + JSON.stringify(body));
    expect(res.status).toBe(200);
    expect(body.stars, '报 totalCount=0 竟然拿到星星').toBe(0);
    expect(body.totalCount, '题量没有以服务端为准').toBe(SERVER_TOTAL);
  });

  it('⚠️ 报 totalCount=1 也不能拿 3 星', async () => {
    const res = await POST(req({ topicId: TOPIC, level: LV, correctCount: 1, totalCount: 1 }));
    expect((await res.json()).stars).toBeLessThan(3);
  });

  it('报 correctCount=999 被压回「本关题量」，不会溢出', async () => {
    const res = await POST(req({ topicId: TOPIC, level: LV, correctCount: 999 }));
    const body = await res.json();
    console.log('  correct=999 -> ' + JSON.stringify(body));
    expect(body.correctCount).toBe(SERVER_TOTAL);
    expect(body.totalCount).toBe(SERVER_TOTAL);
    expect(body.stars).toBeGreaterThanOrEqual(0);
    expect(body.stars).toBeLessThanOrEqual(3);
    // 说明：这里**没有**、也无法断言「拿不到 3 星」—— 压下 999 得到的就是满分 10，
    // 3 星是正确结果。本接口的答对数本质上由客户端上报（判分在客户端做），
    // 路由只能做「上下界 + 单调性」约束，不能验证「孩子真的答对了」。
    //
    // 影响面可控：algorithm_progress 只有本文件的 GET 与 algorithm-mistakes 读，
    // **不挂任何积分/星星币/捕捉券/成就**（仅 parent/reset 会清它），
    // 所以「自报满分」最多影响孩子自己的算法星级显示，不产生跨用户或奖励问题。
  });

  it('全对（正确数 = 服务端题量）→ 3 星', async () => {
    const res = await POST(req({ topicId: TOPIC, level: LV, correctCount: SERVER_TOTAL }));
    expect((await res.json()).stars).toBe(3);
  });
});

describe('algorithm-progress · 星级单调性与错题掌握', () => {
  it('⚠️ 低分提交不得抹掉已有星级（best_stars 取较大值）', async () => {
    await POST(req({ topicId: TOPIC, level: LV, correctCount: SERVER_TOTAL })); // 3 星
    expect((await row())?.stars).toBe(3);
    await POST(req({ topicId: TOPIC, level: LV, correctCount: 0 })); // 0 星
    const r = await row();
    expect(r?.stars, '一次低分提交抹掉了已有星级').toBe(3);
    expect(r?.correct, '正确数也应取较大值').toBe(SERVER_TOTAL);
  });

  it('错题按 question_id 累计，重复答错会累加 wrong_count', async () => {
    await POST(req({ topicId: TOPIC, level: LV, correctCount: 1, mistakes: ['q-a'] }));
    await POST(req({ topicId: TOPIC, level: LV, correctCount: 1, mistakes: ['q-a'] }));
    const r = await db().execute({
      sql: 'SELECT wrong_count, is_mastered FROM algorithm_mistakes WHERE child_id = ? AND topic_id = ? AND level = ? AND question_id = ?',
      args: [ME, TOPIC, LV, 'q-a'],
    });
    expect(Number(r.rows[0].wrong_count)).toBe(2);
    expect(Number(r.rows[0].is_mastered)).toBe(0);
  });

  it('之前错过、这次答对的题会被标记为已掌握（wrong_count 归零）', async () => {
    await POST(req({ topicId: TOPIC, level: LV, correctCount: 1, mistakes: ['q-a'] }));
    // 这次不再提交 q-a（即答对了）
    await POST(req({ topicId: TOPIC, level: LV, correctCount: 2, mistakes: [] }));
    const r = await db().execute({
      sql: 'SELECT wrong_count, is_mastered FROM algorithm_mistakes WHERE child_id = ? AND question_id = ?',
      args: [ME, 'q-a'],
    });
    expect(Number(r.rows[0].is_mastered)).toBe(1);
    expect(Number(r.rows[0].wrong_count)).toBe(0);
  });

  it('GET 按主题分组返回进度', async () => {
    await POST(req({ topicId: TOPIC, level: LV, correctCount: SERVER_TOTAL }));
    const body = await (await GET()).json();
    expect(Array.isArray(body.progress[TOPIC])).toBe(true);
    expect(body.progress[TOPIC][0].bestStars).toBe(3);
  });
});
