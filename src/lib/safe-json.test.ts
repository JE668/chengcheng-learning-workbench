import { describe, expect, it } from 'vitest';
import { safeJsonParse, safeJson } from './safe-json';

describe('safeJsonParse 防御性解析', () => {
  it('解析损坏/非字符串时返回兜底值', () => {
    expect(safeJsonParse(null, [])).toEqual([]);
    expect(safeJsonParse(undefined, 0)).toBe(0);
    expect(safeJsonParse('不是 json', [1, 2])).toEqual([1, 2]);
    expect(safeJsonParse(123, 'fallback')).toBe('fallback'); // 非字符串直接兜底
  });

  it('正常 JSON 解析为对应类型', () => {
    expect(safeJsonParse('{"a":1}', { a: 0 })).toEqual({ a: 1 });
    expect(safeJsonParse('[1,2,3]', [] as number[])).toEqual([1, 2, 3]);
  });
});

describe('safeJson 请求体解析兜底', () => {
  it('合法 JSON 正常解析', async () => {
    const req = new Request('http://t', { method: 'POST', body: JSON.stringify({ a: 1 }) });
    expect(await safeJson(req, {})).toEqual({ a: 1 });
  });

  it('非法/空 body 兜底为 {} 而非抛错', async () => {
    const bad = new Request('http://t', { method: 'POST', body: 'not json' });
    expect(await safeJson(bad, {})).toEqual({});
    const empty = new Request('http://t', { method: 'POST' });
    expect(await safeJson(empty, {})).toEqual({});
  });
});
