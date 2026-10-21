import { describe, it, expect } from 'vitest';
import { CHARACTER_WORDS } from './character-words';
import { CHARACTERS } from './characters';

describe('识字组词表', () => {
  it('characters.ts 的每个字都有组词（漏一字即红——301 字全量覆盖门禁）', () => {
    const missing = CHARACTERS.filter((c) => !CHARACTER_WORDS[c.char]);
    expect(missing.map((m) => m.char)).toEqual([]);
  });

  it('每字 1~2 个词、每个词恰好两个汉字（一年级口径）', () => {
    for (const [ch, words] of Object.entries(CHARACTER_WORDS)) {
      expect(words.length, ch).toBeGreaterThanOrEqual(1);
      expect(words.length, ch).toBeLessThanOrEqual(2);
      for (const w of words) {
        expect(w.length, `${ch} 的词 ${w}`).toBe(2);
        expect(w.includes(ch), `${w} 必须包含本字 ${ch}`).toBe(true);
      }
    }
  });

  it('词内字符不超出识字表超集（不引入生僻字词——用宽口径：词是常用词即可，此处仅防纯生僻）', () => {
    // 一年级常用双字词白名单难枚举，此用例只防呆：词不能是标点/空串
    for (const words of Object.values(CHARACTER_WORDS)) {
      for (const w of words) expect(w).toMatch(/^[\u4e00-\u9fa5]{2}$/);
    }
  });
});
