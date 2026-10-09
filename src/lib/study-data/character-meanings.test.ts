// @vitest-environment node
/**
 * 识字卡释义不得「同义反复」。
 *
 * ## 缺陷
 * characters.ts 里有 81 条能力释义本身就是那个字（或只加了括注），例如
 * 牛=牛、你=你（第二人称）、当=当。听写题的讲解会渲染成
 * 「『你』意思是你（第二人称），你们好」—— 等于没解释。
 * 其中「就（靠近）」更是**释义有误**：就 没有「靠近」这个常用义。
 *
 * ## 判据
 * 去掉括注、取第一个义项与斜杠前部分后，若等于该字本身，即判为同义反复。
 * 注意：**不**要求释义不含该字 —— 「天=天空」「石=石头」是正常定义。
 */
import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../study-data';

const firstSense = (s: string) =>
  s
    .replace(/（[^）]*）/g, '')
    .replace(/（[^）]*$/g, '')
    .split('，')[0]
    .split('/')[0]
    .trim();

describe('识字卡释义质量', () => {
  it('⚠️ 不得有「同义反复」的释义', () => {
    const bad = CHARACTERS.filter((c) => firstSense(c.meaning) === c.char).map((c) => c.char + '=' + c.meaning);
    expect(bad, '这些字的释义等于它自己，讲解会变成空话：' + JSON.stringify(bad)).toEqual([]);
  });

  it('释义不得为空、不得只有括注', () => {
    const bad = CHARACTERS.filter((c) => firstSense(c.meaning).length === 0).map((c) => c.char);
    expect(bad).toEqual([]);
  });

  it('释义不得含阿拉伯数字（面向一年级，用汉字表述）', () => {
    const bad = CHARACTERS.filter((c) => /[0-9]/.test(c.meaning)).map((c) => c.char + '=' + c.meaning);
    expect(bad, '释义里出现阿拉伯数字：' + JSON.stringify(bad)).toEqual([]);
  });
});
