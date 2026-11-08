// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  MISTAKE_ERROR_TYPES,
  MISTAKE_ERROR_TYPE_VALUES,
  isMistakeErrorType,
  mistakeErrorTypeLabel,
} from './mistake-error-types';

describe('mistake error types', () => {
  it('只提供一年级家长和孩子能理解的三个结构化标签', () => {
    expect(MISTAKE_ERROR_TYPES).toEqual({
      careless: '粗心',
      concept: '概念不清',
      reading: '审题错误',
    });
    expect(MISTAKE_ERROR_TYPE_VALUES).toHaveLength(3);
  });

  it('标签不重复且非空，避免前端出现两个同义按钮', () => {
    const labels = Object.values(MISTAKE_ERROR_TYPES);
    expect(new Set(labels).size).toBe(labels.length);
    for (const label of labels) expect(label.length).toBeGreaterThan(0);
  });

  it('未知/历史空值不会渲染成标签', () => {
    expect(isMistakeErrorType('unknown')).toBe(false);
    expect(isMistakeErrorType(null)).toBe(false);
    expect(mistakeErrorTypeLabel('careless')).toBe('粗心');
    expect(mistakeErrorTypeLabel('')).toBe('');
  });
});
