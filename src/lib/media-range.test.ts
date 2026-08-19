import { describe, expect, it } from 'vitest';
import { parseByteRange } from './media-range';

describe('parseByteRange', () => {
  it('bytes=0- → 从头到尾', () => {
    expect(parseByteRange('bytes=0-', 100)).toEqual({ start: 0, end: 99, total: 100 });
  });
  it('bytes=10-20 → 闭区间', () => {
    expect(parseByteRange('bytes=10-20', 100)).toEqual({ start: 10, end: 20, total: 100 });
  });
  it('bytes=50- → 从 50 到尾', () => {
    expect(parseByteRange('bytes=50-', 100)).toEqual({ start: 50, end: 99, total: 100 });
  });
  it('bytes=-30 → 末尾 30 字节', () => {
    expect(parseByteRange('bytes=-30', 100)).toEqual({ start: 70, end: 99, total: 100 });
  });
  it('越界 end 被收敛到 total-1', () => {
    expect(parseByteRange('bytes=10-999', 100)).toEqual({ start: 10, end: 99, total: 100 });
  });
  it('无 Range 头 → null', () => {
    expect(parseByteRange(null, 100)).toBeNull();
  });
  it('多段 Range → null（不支持，回退整文件）', () => {
    expect(parseByteRange('bytes=0-10,20-30', 100)).toBeNull();
  });
  it('格式非法 → null', () => {
    expect(parseByteRange('items=0-10', 100)).toBeNull();
  });
});
