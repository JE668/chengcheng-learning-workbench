// @vitest-environment node
/**
 * 拼音表（PINYIN_GROUPS）的结构与对应性护栏。
 *
 * 这张表是孩子点开就能看到的**参考表**（不是选择题），所以重点是：
 *   · 每个韵母/声母都要有例词
 *   · 例词的拼音标注必须**真的含这个音**
 *     （例词配错音，孩子照着读就错了）
 *
 * 判据：把例词里的拼音去掉声调后，必须含有该条目本身的音。
 * 零声母需归一化（鱼 yú ↔ ü、月 yuè ↔ üe、云 yún ↔ ün）。
 */
import { describe, expect, it } from 'vitest';
import { PINYIN_GROUPS } from '../study-data';

/** 去声调（保留 ü 的两点），并把零声母的 yu- 形式还原成 ü- */
function norm(s: string): string {
  const base = s
    .normalize('NFD')
    .replace(/[\u0300\u0301\u0304\u030c]/g, '')
    .normalize('NFC');
  return base.replace(/\byu/g, 'ü');
}

/** 从「阿姨 ā yí」里取出拼音部分（拉丁字母 + 声调符号 + 空格） */
function pinyinPart(example: string): string {
  return example.replace(/[^\u0041-\u007a\u00c0-\u024f\u0300-\u036f\s]/g, ' ').trim();
}

describe('拼音表', () => {
  it('每个分组都要有条目，每条都要有拼音与例词', () => {
    const bad: string[] = [];
    for (const g of PINYIN_GROUPS) {
      if (!g.group?.trim()) bad.push('分组缺名');
      if (!g.items?.length) bad.push(g.group + ' 没有条目');
      for (const it of g.items) {
        if (!it.pinyin?.trim()) bad.push(g.group + ' 有条目缺拼音');
        if (!it.examples?.length) bad.push(g.group + '/' + it.pinyin + ' 没有例词');
      }
    }
    expect(bad).toEqual([]);
  });

  /**
   * 已知的**零声母写法差异**：同一个韵母，零声母时拼法不同但读音相同。
   * 例：韵母 un，零声母写作 wen（温 wēn）—— 人教版正是用它举例。
   * 这里显式登记，避免把正确数据误判成错误。
   */
  const ZERO_INITIAL_OK: Record<string, string[]> = { un: ['wen'] };

  it('⚠️ 例词的拼音必须真的含该条目对应的音（至少一条例词对得上）', () => {
    const bad: string[] = [];
    for (const g of PINYIN_GROUPS) {
      for (const it of g.items) {
        const base = norm(it.pinyin);
        const hit = it.examples.some((ex) => norm(pinyinPart(ex)).replace(/\s+/g, '').includes(base));
        const ok2 = (ZERO_INITIAL_OK[it.pinyin] ?? []).some((v) =>
          it.examples.some((ex) => norm(pinyinPart(ex)).replace(/\s+/g, '').includes(v))
        );
        if (!hit && !ok2) bad.push(g.group + '/' + it.pinyin + ' 的例词都对不上：' + JSON.stringify(it.examples));
      }
    }
    expect(bad, '例词与拼音条目对不上：' + JSON.stringify(bad.slice(0, 8))).toEqual([]);
  });

  it('例词都要写成「汉字 拼音」两段（不能只有汉字或只有拼音）', () => {
    const bad: string[] = [];
    for (const g of PINYIN_GROUPS) {
      for (const it of g.items) {
        for (const ex of it.examples) {
          const hasHan = /[\u4e00-\u9fff]/.test(ex);
          const hasPy = /[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(ex);
          if (!hasHan || !hasPy) bad.push(g.group + '/' + it.pinyin + ' 的例词格式异常：' + ex);
        }
      }
    }
    expect(bad.slice(0, 6)).toEqual([]);
  });

  it('整体认读音节必须是 16 个（与 PINYIN_TIPS 里写的数目一致）', () => {
    const g = PINYIN_GROUPS.find((x) => x.group.includes('整体认读'));
    expect(g, '找不到整体认读分组').toBeTruthy();
    expect(g!.items.length).toBe(16);
  });

  it('声母 23 个、单韵母 6 个', () => {
    expect(PINYIN_GROUPS.find((x) => x.group === '声母')!.items.length).toBe(23);
    expect(PINYIN_GROUPS.find((x) => x.group === '单韵母')!.items.length).toBe(6);
  });

  it('同一分组内条目不得重复', () => {
    const bad: string[] = [];
    for (const g of PINYIN_GROUPS) {
      const ps = g.items.map((i) => i.pinyin);
      if (new Set(ps).size !== ps.length) bad.push(g.group);
    }
    expect(bad).toEqual([]);
  });
});
