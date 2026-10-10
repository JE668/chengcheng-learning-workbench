// @vitest-environment node
/**
 * 图鉴收集闭环的完整性护栏（重写版）。
 *
 * ## 为什么这个文件被重写过一次（教训）
 * 我上一版基于「捣蛋萌可不进 moko_owned」推断出"总数虚高 3、孩子集不满"，
 * 并把它们从名单里排除了 —— **这个结论是错的**。
 * 追查 capture 链路后发现：autoChapters 为图鉴里**每一只**（除主线 9 只外）
 * 都生成剧情章节，story/capture 只按 getChapter 校验、不看分类，
 * 所以捣蛋萌可**可以**被捕捉进 moko_owned。排除它们反而会让收集率超过 100%。
 * 错误提交已 revert；本文件钉住的是**真实**的不变量。
 *
 * ## 真正要防的两种不一致
 * A. 某只萌可有剧情章节（可捕捉、会进 owned），却不在总数名单里 → 进度 >100%
 * B. 名单里有的名字，图鉴/章节根本解析不到 → 进度永远到不了 100%
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mokoChars, troubleMokoKeys } from './moko';
import { mokoCollection, mokoCollectionByName, COLLECTIBLE_MOKO_NAMES } from './moko-collection';
import { storyChapters, HERO_CHAPTERS } from './story';

const PUB = join(process.cwd(), 'public');

/** 手写核心萌可里没有 artwork 的 12 个 key（渲染走 lemei.jpg 兜底，moko.ts 对 lulu 有注释说明） */
/**
 * 取证记录（2026-10，改不改名已查过）：
 * starping（星星萌可，S6 闪耀流星 / category star）不等于图鉴「星光萌可」
 * （01 皇室萌可文件夹 / category royal）—— 季与分类都不同，是两个角色，不能改名。
 * cakeping（蛋糕萌可）在图鉴有两个候选（蛋糕妹妹萌可 / 蛋糕弟弟萌可，另有合影），
 * 映射有歧义，不改名。若日后能确认身份，改 mokoChars 里的 name 让补图循环生效即可。
 */
const KNOWN_NO_ARTWORK = [
  'happyping',
  'wisejingping',
  'gentleping',
  'lockping',
  'boxping',
  'diamondping',
  'rubyping',
  'cakeping',
  'meteorping',
  'starping',
  'cometping',
  'lulu',
];

describe('图鉴收集闭环（总数 ↔ 可捕捉）', () => {
  it('⚠️ 名单必须等于图鉴全部去重角色名（排除任何一类都会让进度 >100%）', () => {
    const expected = new Set(mokoCollection.map((c) => c.name));
    const got = new Set(COLLECTIBLE_MOKO_NAMES);
    const missing = [...expected].filter((n) => !got.has(n));
    const extra = [...got].filter((n) => !expected.has(n));
    expect(missing, '图鉴里有、名单里没有：' + JSON.stringify(missing)).toEqual([]);
    expect(extra, '名单里有、图鉴里没有：' + JSON.stringify(extra)).toEqual([]);
    expect(COLLECTIBLE_MOKO_NAMES.length).toBe(new Set(COLLECTIBLE_MOKO_NAMES).size);
  });

  it('⚠️ 捣蛋萌可必须在名单里（它们有远征章节、可捕捉）', () => {
    const troubleNames = troubleMokoKeys.map((k) => mokoChars[k]?.name).filter(Boolean) as string[];
    const bad = troubleNames.filter((n) => !COLLECTIBLE_MOKO_NAMES.includes(n));
    expect(bad, '捣蛋萌可被排除出总数了：' + JSON.stringify(bad)).toEqual([]);
  });

  it('⚠️ 每个剧情章节的萌可都必须既解析得到、又在名单里（否则捕捉了却不计数）', () => {
    const bad: string[] = [];
    for (const c of storyChapters) {
      const entry = mokoCollectionByName[c.mokoName];
      if (!entry) {
        bad.push(c.id + ' 的 ' + c.mokoName + ' 不在图鉴');
        continue;
      }
      if (c.mokoKey && c.mokoKey !== entry.key) bad.push(c.id + ' 的 mokoKey 与图鉴不一致');
      if (!COLLECTIBLE_MOKO_NAMES.includes(c.mokoName))
        bad.push(c.id + ' 的 ' + c.mokoName + ' 不在收集名单');
    }
    expect([...new Set(bad)].slice(0, 6), JSON.stringify([...new Set(bad)].slice(0, 6))).toEqual(
      []
    );
  });
});

describe('图片路径与生成表一致性', () => {
  it('⚠️ 图鉴全部图片路径必须真实存在', () => {
    const bad = mokoCollection
      .filter((c) => !c.img || !existsSync(join(PUB, c.img)))
      .map((c) => c.key);
    expect(bad, JSON.stringify(bad.slice(0, 5))).toEqual([]);
  });

  it('⚠️ 核心萌可：有图必须存在；无图必须就是这份已知名单', () => {
    const broken: string[] = [];
    const noImg: string[] = [];
    for (const c of Object.values(mokoChars)) {
      if (c.img) {
        if (!existsSync(join(PUB, c.img))) broken.push(c.key);
      } else noImg.push(c.key);
    }
    expect(broken).toEqual([]);
    expect([...noImg].sort()).toEqual([...KNOWN_NO_ARTWORK].sort());
  });

  it('by-name 记录键 === name 字段；图鉴 key/名字不重复', () => {
    const bad = Object.entries(mokoCollectionByName)
      .filter(([n, v]) => v.name !== n)
      .map(([n]) => n);
    expect(bad.slice(0, 3)).toEqual([]);
    const keys = mokoCollection.map((c) => c.key);
    const names = mokoCollection.map((c) => c.name);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('剧情章节', () => {
  it('⚠️ 主线每集的 quiz：答案下标合法、选项互不相同', () => {
    const bad: string[] = [];
    for (const c of HERO_CHAPTERS) {
      if (!c.quiz) {
        bad.push(c.id + ' 没有 quiz');
        continue;
      }
      const { options, answer } = c.quiz;
      if (answer < 0 || answer >= options.length) bad.push(c.id + ' 答案越界');
      if (new Set(options).size !== options.length) bad.push(c.id + ' 选项重复');
      if (options.some((o) => !o.trim())) bad.push(c.id + ' 有空选项');
    }
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });

  it('⚠️ 洗牌后的章节必须保持答案内容不变（只挪位置）', () => {
    const byId = new Map(storyChapters.map((c) => [c.id, c]));
    const bad: string[] = [];
    for (const c of HERO_CHAPTERS) {
      if (!c.quiz) continue;
      const after = byId.get(c.id)?.quiz;
      if (!after) {
        bad.push(c.id + ' 洗牌后丢了');
        continue;
      }
      const beforeAns = c.quiz.options[c.quiz.answer];
      const afterAns = after.options[after.answer];
      if (beforeAns !== afterAns)
        bad.push(c.id + ' 答案内容变了: ' + beforeAns + ' -> ' + afterAns);
      if (
        JSON.stringify([...c.quiz.options].sort()) !== JSON.stringify([...after.options].sort())
      ) {
        bad.push(c.id + ' 选项集合变了');
      }
    }
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });

  it('全部章节 id 唯一、段落非空', () => {
    const ids = storyChapters.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(
      storyChapters.every((c) => c.paragraphs.length > 0 && c.paragraphs.every((p) => p.trim()))
    ).toBe(true);
  });
});
