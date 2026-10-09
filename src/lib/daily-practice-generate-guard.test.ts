// @vitest-environment node
/**
 * 语文题型的 kind 必须与「是否朗读 han」严格对应。
 *
 * ## 真实缺陷（本次修的）
 * 生成器 genChineseQuizQ（识字）/ genAntonymQ（反义词）/ genProverbQ（谚语）/
 * genRiddleQ（谜语）**全都把 kind 写成了 'dictation'**。后果两条：
 *
 *  1. 页面 KIND_META 里没有这几类，于是它们一律显示成「语文 · 听写」，
 *     反义词题顶着「听写」的招牌。
 *  2. **更严重**：autoPlay 对 kind === 'dictation' 会朗读 q.han，而
 *     · 识字题的 han 就是正确选项本身（han === options[answer]）
 *     · 谜语题的 han 就是谜底（同样 === options[answer]）
 *     于是孩子一进题，还没选就被把答案念了出来。
 *
 * 修法是给这四类各自独立的 kind；只要 kind 不再落在朗读分支里，泄漏自动消失。
 * 本文件把「kind ↔ 朗读」这条对应关系钉住。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb, ensureSchema } from '@/lib/db';
import { generateQuestions } from '@/lib/daily-practice';

const YUWEN_KINDS = ['pinyin', 'dictation', 'poem', 'chinese-quiz', 'antonym', 'proverb', 'riddle'];
/** 这四类的 han 是答案（或无需朗读），**绝不能**被 autoPlay 朗读 */
const NO_SPEAK_KINDS = ['chinese-quiz', 'antonym', 'proverb', 'riddle'];

const CHILD = 6302;

type Q = {
  kind: string;
  subject: string;
  prompt: string;
  han?: string;
  options?: string[];
  answer?: number;
  audioText?: string;
  word?: string;
  speakText?: string;
};

async function collect(rounds: number): Promise<Q[]> {
  const seen = new Map<string, Q>();
  for (let i = 0; i < rounds; i++) {
    for (const raw of await generateQuestions(CHILD)) {
      const q = raw as unknown as Q;
      const sig = JSON.stringify([
        q.kind,
        q.prompt,
        q.options,
        q.answer,
        q.han,
        q.audioText,
        q.word,
      ]);
      if (!seen.has(sig)) seen.set(sig, q);
    }
  }
  return [...seen.values()];
}

beforeEach(async () => {
  await ensureSchema();
  const d = getDb();
  await d.execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name) VALUES (6301,'g-p','x','parent','p')",
    args: [],
  });
  await d.execute({
    sql: "INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, parent_id) VALUES (?,?,'x','child','c',6301)",
    args: [CHILD, 'g-c' + CHILD],
  });
});

describe('daily-practice 语文题型 · kind 与朗读的对应关系', () => {
  it('语文只使用这 7 种 kind（不再有类别借用 dictation）', async () => {
    const qs = (await collect(120)).filter((q) => q.subject === '语文');
    expect(qs.length).toBeGreaterThan(100);
    const kinds = [...new Set(qs.map((q) => q.kind))].sort();
    const unexpected = kinds.filter((k) => !YUWEN_KINDS.includes(k));
    expect(unexpected, '出现了预期外的语文 kind：' + JSON.stringify(unexpected)).toEqual([]);
  });

  it('⚠️ kind === dictation 必须就是听写题（反之亦然）', async () => {
    const qs = (await collect(120)).filter((q) => q.subject === '语文');
    const asDictation = qs.filter((q) => q.kind === 'dictation');
    const realDictation = qs.filter((q) => q.prompt.startsWith('听写：'));
    // 曾经这里会把识字/反义词/谚语/谜语全算进来
    const wrongKind = asDictation.filter((q) => !q.prompt.startsWith('听写：'));
    expect(
      wrongKind.length,
      '有非听写题被标成 dictation（如识字/谜语），会被朗读 han：' +
        JSON.stringify(wrongKind.slice(0, 3).map((q) => q.prompt))
    ).toBe(0);
    expect(asDictation.length).toBeGreaterThan(0);
    expect(realDictation.length).toBeGreaterThan(0);
  });

  it('⚠️ 识字/谜语题的 han 就是正确选项 —— 所以它们绝不能是 dictation', async () => {
    const qs = (await collect(120)).filter((q) => q.subject === '语文');
    for (const kind of ['chinese-quiz', 'riddle']) {
      const lane = qs.filter((q) => q.kind === kind);
      expect(lane.length, kind + ' 没有出题').toBeGreaterThan(0);
      for (const q of lane) {
        // 记录这条事实：han 是答案本身（这正是「不能朗读」的原因）
        expect(
          q.options?.[q.answer as number],
          kind + ' 的 han 不再等于正确选项，请复核护栏前提'
        ).toBe(q.han);
        // 因此它绝不能被归到会被朗读的 kind
        expect(q.kind, 'han 是答案却被标成 dictation，会被念出来').not.toBe('dictation');
      }
    }
  });

  it('⚠️ 源码护栏：page.tsx 的 autoPlay 不得朗读这四类', async () => {
    const src = readFileSync(
      join(process.cwd(), 'src/app/(child)/daily-practice/page.tsx'),
      'utf8'
    );
    const start = src.indexOf('async function autoPlay');
    expect(start, '找不到 autoPlay').toBeGreaterThan(-1);
    const end = src.indexOf('export default function', start);
    const body = src.slice(start, end === -1 ? start + 2000 : end);
    for (const kind of NO_SPEAK_KINDS) {
      expect(
        body.includes("'" + kind + "'"),
        'autoPlay 里出现了 ' + kind + ' —— 它的 han 是答案，会被念出来'
      ).toBe(false);
    }
    // 反向：真听写必须仍在朗读分支里（否则听写题就没声音了）
    expect(body.includes("q.kind === 'dictation'"), '听写题的朗读分支被删了').toBe(true);
  });

  it('五条语文赛道都还在出题（修 kind 时不得整条丢失）', async () => {
    const qs = (await collect(120)).filter((q) => q.subject === '语文');
    for (const kind of ['dictation', 'pinyin', 'poem', ...NO_SPEAK_KINDS]) {
      expect(qs.filter((q) => q.kind === kind).length, kind + ' 一条题都没有').toBeGreaterThan(0);
    }
  });
});
