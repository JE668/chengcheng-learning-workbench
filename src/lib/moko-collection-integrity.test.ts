// @vitest-environment node
/**
 * 萌可图鉴（自动生成数据）与手写核心数据的完整性护栏。
 *
 * ## 已修的真实缺陷（本轮）
 * COLLECTIBLE_MOKO_NAMES 的注释写着「排除捣蛋萌可」，生成器也确实写了
 * category !== 'trouble' 的过滤 —— 但三只捣蛋萌可按**文件夹**落在了 villain / mo 分类，
 * 全表 0 条是 trouble，**排除逻辑一直空转**：
 *
 *   闹闹萌可  category=villain（第 9 季文件夹）
 *   迷糊萌可  category=mo
 *   淘气萌可  category=mo
 *
 * 后果：castle-core 的图鉴总数被虚高 3。而捣蛋萌可进的是 troublemakers 表
 * （漏卡惩罚时刷出、喷雾消解），**永远不会写进 moko_owned** ——
 * 孩子把所有剧情萌可集齐，图鉴也永远到不了 100%。
 *
 * 修法：生成器 CAT_OVERRIDE 把三只按官方身份归入 trouble（图鉴的「捣蛋萌可」
 * 分组本来就为它们留了位置），重新生成后名单恰好少了这 3 个名字。
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mokoChars, troubleMokoKeys } from './moko';
import { mokoCollection, mokoCollectionByName, COLLECTIBLE_MOKO_NAMES } from './moko-collection';

const PUB = join(process.cwd(), 'public');

/**
 * 手写核心萌可里**没有 artwork** 的 12 个 key。
 * 它们渲染时走各处的 lemei.jpg 兜底（moko.ts 里 lulu 的注释也写明「无真实角色图」）。
 * 名单存在的意义：新加的萌可若没有图，测试会失败，逼人做一次「补图 or 兜底」的决定。
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

const troubleNames = new Set(troubleMokoKeys.map((k) => mokoChars[k]?.name).filter(Boolean));

describe('图鉴可收集名单', () => {
  it('⚠️ 不得包含捣蛋萌可（它们不进 moko_owned，算进去孩子永远集不满）', () => {
    const bad = [...troubleNames].filter((n) => COLLECTIBLE_MOKO_NAMES.includes(n));
    expect(bad, '捣蛋萌可混进了可收集名单：' + JSON.stringify(bad)).toEqual([]);
  });

  it('名单里的每个名字都必须能在图鉴（by-name）里解析', () => {
    const bad = COLLECTIBLE_MOKO_NAMES.filter((n) => !mokoCollectionByName[n]);
    expect(bad, JSON.stringify(bad.slice(0, 5))).toEqual([]);
  });

  it('名单不得重复', () => {
    expect(new Set(COLLECTIBLE_MOKO_NAMES).size).toBe(COLLECTIBLE_MOKO_NAMES.length);
  });
});

describe('图片路径存在性', () => {
  it('⚠️ 图鉴 150 张图片路径必须真实存在（断图 = 孩子看到裂图）', () => {
    const bad = mokoCollection
      .filter((c) => !c.img || !existsSync(join(PUB, c.img)))
      .map((c) => c.key + ' -> ' + c.img);
    expect(bad, JSON.stringify(bad.slice(0, 6))).toEqual([]);
  });

  it('⚠️ 核心萌可：有 img 的必须存在；没 img 的必须就是这份已知名单', () => {
    const broken: string[] = [];
    const noImg: string[] = [];
    for (const c of Object.values(mokoChars)) {
      if (c.img) {
        if (!existsSync(join(PUB, c.img))) broken.push(c.key + ' -> ' + c.img);
      } else {
        noImg.push(c.key);
      }
    }
    expect(broken, JSON.stringify(broken.slice(0, 6))).toEqual([]);
    expect(
      [...noImg].sort(),
      '无图萌可名单变了，请人工决定：补 artwork 还是登记进 KNOWN_NO_ARTWORK'
    ).toEqual([...KNOWN_NO_ARTWORK].sort());
  });
});

describe('生成表内部一致性', () => {
  it('by-name 的记录键必须等于 name 字段', () => {
    const bad = Object.entries(mokoCollectionByName)
      .filter(([n, v]) => v.name !== n)
      .map(([n]) => n);
    expect(bad.slice(0, 5)).toEqual([]);
  });

  it('图鉴 key 与名字都不得重复', () => {
    const keys = mokoCollection.map((c) => c.key);
    const names = mokoCollection.map((c) => c.name);
    expect([...new Set(keys)].length, 'key 重复').toBe(keys.length);
    expect([...new Set(names)].length, '名字重复').toBe(names.length);
  });

  it('捣蛋萌可在图鉴里必须归 trouble 分组（这是排除逻辑生效的前提）', () => {
    const bad = [...troubleNames].filter((n) => {
      const hit = mokoCollection.find((c) => c.name === n);
      return !hit || hit.category !== 'trouble';
    });
    expect(bad, '这些捣蛋萌可不在 trouble 分组：' + JSON.stringify(bad)).toEqual([]);
  });
});
