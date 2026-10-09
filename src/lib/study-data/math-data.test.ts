// @vitest-environment node
/**
 * 数学题库的机械验算。
 *
 * ## 已修的真实错误
 * NUMBERS_1120（11~20 数卡）里 tens 被写死成 1 —— 但 **20 是「2 个十」**。
 * 于是 20 显示成「十位 1、个位 0」，compose 也成了不成立的「10 + 0」。
 *
 * 数学数据的答案**可以算**，所以下面全部用机械验算，而不是靠肉眼。
 */
import { describe, expect, it } from 'vitest';
import {
  NUMBERS_1120,
  WORD_PROBLEMS,
  ORDINALS,
  SPLITS,
  CLOCKS,
  CLOCK_HALF,
  ANGLES,
  SHAPES,
  SOLID_SHAPES,
  POSITIONS,
  COMPARE_MORE,
  WEEK_CALENDAR,
} from '../study-data';

describe('数卡 11~20', () => {
  it('⚠️ tens*10 + ones 必须等于 num（20 的十位是 2）', () => {
    const bad = NUMBERS_1120.filter((n) => n.tens * 10 + n.ones !== n.num).map(
      (n) => n.num + ' 被写成 ' + n.tens + ' 个十 + ' + n.ones
    );
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });

  it('⚠️ compose 必须能算出 num', () => {
    const bad: string[] = [];
    for (const n of NUMBERS_1120) {
      const m = /^(\d+)\s*\+\s*(\d+)$/.exec(n.compose);
      if (!m) {
        bad.push(n.num + ' 的 compose 格式不对：' + n.compose);
      } else if (Number(m[1]) + Number(m[2]) !== n.num) {
        bad.push(n.num + ' 的 compose「' + n.compose + '」不等于本身');
      }
    }
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });

  it('覆盖 11~20 且不重复', () => {
    const nums = NUMBERS_1120.map((n) => n.num).sort((a, b) => a - b);
    expect(nums).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  });
});

describe('应用题', () => {
  it('⚠️ answer 必须在 options 里、三个选项互不相同且都是数字', () => {
    const bad: string[] = [];
    for (const w of WORD_PROBLEMS) {
      if (!w.options.includes(w.answer)) bad.push('「' + w.text.slice(0, 12) + '…」答案不在选项里');
      if (new Set(w.options).size !== 3) bad.push('「' + w.text.slice(0, 12) + '…」选项有重复');
      if (w.options.some((o) => !/^\d+$/.test(o))) bad.push('「' + w.text.slice(0, 12) + '…」选项不是纯数字');
      if (!/^\d+$/.test(w.answer)) bad.push('「' + w.text.slice(0, 12) + '…」答案不是纯数字');
    }
    expect(bad, JSON.stringify(bad.slice(0, 5))).toEqual([]);
  });

  it('三个选项必须两两不同且跨度合理（不能三个都一样大）', () => {
    const bad = WORD_PROBLEMS.filter((w) => {
      const nums = w.options.map(Number).sort((a, b) => a - b);
      return nums[0] === nums[2];
    }).map((w) => w.text.slice(0, 12));
    expect(bad).toEqual([]);
  });
});

describe('序数题', () => {
  it('⚠️ row[ask] 必须出现在题干里，且 answer = 第 ask+1', () => {
    const bad: string[] = [];
    for (const o of ORDINALS) {
      const target = o.row[o.ask];
      if (!target) bad.push('ask 越界：' + o.question);
      else if (!o.question.includes(target)) {
        bad.push('题干里的对象与 row[ask] 不符：' + o.question + '（row[ask]=' + target + '）');
      }
      if (o.answer !== '第' + (o.ask + 1)) {
        bad.push(o.question + ' 的答案应为 第' + (o.ask + 1) + '，却写成 ' + o.answer);
      }
    }
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });
});

describe('分与合', () => {
  it('⚠️ 每一对相加必须等于 num', () => {
    const bad = SPLITS.filter((s) => s.pairs.some(([a, b]) => a + b !== s.num)).map((s) => String(s.num));
    expect(bad).toEqual([]);
  });

  it('对数正确（floor(num/2)）、每对不重复、不出现 0', () => {
    const bad: string[] = [];
    for (const s of SPLITS) {
      if (s.pairs.length !== Math.floor(s.num / 2)) bad.push(s.num + ' 的对数不对');
      const keys = s.pairs.map(([a, b]) => [a, b].sort().join('+'));
      if (new Set(keys).size !== keys.length) bad.push(s.num + ' 有重复的对');
      if (s.pairs.some(([a, b]) => a <= 0 || b <= 0)) bad.push(s.num + ' 出现了 0');
    }
    expect(bad).toEqual([]);
  });

  it('覆盖 2~10', () => {
    expect(SPLITS.map((s) => s.num).sort((a, b) => a - b)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

describe('钟表', () => {
  it('⚠️ label 必须与 hour 一致，且 1~12 不重复', () => {
    const bad: string[] = [];
    for (const [list, suffix, name] of [
      [CLOCKS, '时', '整时'],
      [CLOCK_HALF, '时半', '半时'],
    ] as const) {
      for (const c of list) {
        if (c.label !== String(c.hour) + suffix) bad.push(name + ' ' + c.hour + ' 的 label 是 ' + c.label);
      }
      const hours = list.map((c) => c.hour).sort((a, b) => a - b);
      if (JSON.stringify(hours) !== JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])) {
        bad.push(name + ' 的钟点不是 1~12');
      }
    }
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });
});

describe('角', () => {
  it('锐角 < 90 < 钝角，直角 = 90', () => {
    const by = new Map(ANGLES.map((a) => [a.name, a.deg]));
    expect(by.get('直角')).toBe(90);
    expect(by.get('锐角')!).toBeLessThan(90);
    expect(by.get('钝角')!).toBeGreaterThan(90);
  });
});

describe('图形 / 立体图形 / 位置', () => {
  it('平面图形：名称不重复、字段齐全、曲线图形 sides 为 0', () => {
    const bad: string[] = [];
    const seen = new Set<string>();
    for (const s of SHAPES) {
      if (!s.name?.trim() || !s.desc?.trim() || s.sides < 0) bad.push(s.name + ' 字段非法');
      if (seen.has(s.name)) bad.push('重复：' + s.name);
      seen.add(s.name);
      if ((s.name === '圆形' || s.name === '椭圆形' || s.name === '半圆形') && s.sides !== 0) {
        bad.push(s.name + ' 是曲线图形，sides 应为 0');
      }
    }
    expect(bad).toEqual([]);
  });

  it('立体图形：4 种齐全、字段完整、名称不重复', () => {
    const bad: string[] = [];
    const names = SOLID_SHAPES.map((s) => s.name);
    for (const n of ['长方体', '正方体', '圆柱', '球']) {
      if (!names.includes(n)) bad.push('缺少 ' + n);
    }
    for (const s of SOLID_SHAPES) {
      if (!s.desc?.trim() || !s.roll?.trim()) bad.push(s.name + ' 字段缺失');
    }
    if (new Set(names).size !== names.length) bad.push('名称重复');
    expect(bad).toEqual([]);
  });

  it('位置：上下前后左右六个方向齐全且不重复', () => {
    const words = POSITIONS.map((p) => p.word).sort();
    expect(words).toEqual(['上', '下', '前', '后', '左', '右'].sort());
    expect(POSITIONS.every((p) => p.desc?.trim() && p.example?.trim() && p.emoji?.trim())).toBe(true);
  });
});

describe('比多少 / 日历', () => {
  it('比多少：答案在选项里、题干与选项字段完整', () => {
    const bad = COMPARE_MORE.filter(
      (c) => !c.options.includes(c.answer) || !c.question?.trim() || !c.a?.trim() || !c.b?.trim()
    ).map((c) => c.question);
    expect(bad).toEqual([]);
  });

  it('日历：答案在选项里、三个选项不重复', () => {
    const bad: string[] = [];
    for (const c of WEEK_CALENDAR) {
      if (!c.options.includes(c.answer)) bad.push(c.question + ' 答案不在选项里');
      if (new Set(c.options).size !== c.options.length) bad.push(c.question + ' 选项重复');
      if (!c.emoji?.trim()) bad.push(c.question + ' 缺 emoji');
    }
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });
});
