import { describe, it, expect } from 'vitest';
import { localDate, addDaysToDate, toMistakeRow, MistakeRow } from './mistakes';

describe('localDate', () => {
  it('returns today when offset=0', () => {
    const today = localDate(0);
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns tomorrow when offset=1', () => {
    const tomorrow = localDate(1);
    expect(tomorrow).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('handles negative offset', () => {
    const yesterday = localDate(-1);
    expect(yesterday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('different offsets produce different dates', () => {
    const today = localDate(0);
    const tomorrow = localDate(1);
    expect(today).not.toBe(tomorrow);
  });
});

describe('addDaysToDate', () => {
  it('adds days to a date string', () => {
    const base = '2024-01-15';
    const result = addDaysToDate(base, 5);
    expect(result).toBe('2024-01-20');
  });

  it('handles month boundary', () => {
    const base = '2024-01-28';
    const result = addDaysToDate(base, 5);
    expect(result).toBe('2024-02-02');
  });

  it('handles year boundary', () => {
    const base = '2024-12-30';
    const result = addDaysToDate(base, 5);
    expect(result).toBe('2025-01-04');
  });

  it('handles negative days', () => {
    const base = '2024-01-10';
    const result = addDaysToDate(base, -3);
    expect(result).toBe('2024-01-07');
  });
});

describe('toMistakeRow', () => {
  it('converts raw DB row to MistakeRow', () => {
    const raw = {
      id: '1',
      child_id: '5',
      subject: '数学',
      kind: 'basic',
      prompt: '1+1=?',
      answer: '2',
      wrong: '3',
      next_review: '2024-01-20',
      interval_days: '3',
      reps: '2',
      easiness_factor: '2.7',
      resolved: '0',
    };
    const row = toMistakeRow(raw);
    expect(row.id).toBe(1);
    expect(row.child_id).toBe(5);
    expect(row.subject).toBe('数学');
    expect(row.kind).toBe('basic');
    expect(row.prompt).toBe('1+1=?');
    expect(row.answer).toBe('2');
    expect(row.wrong).toBe('3');
    expect(row.next_review).toBe('2024-01-20');
    expect(row.interval_days).toBe(3);
    expect(row.reps).toBe(2);
    expect(row.easiness_factor).toBe(2.7);
    expect(row.resolved).toBe(0);
  });

  it('handles null wrong', () => {
    const raw = {
      id: '1',
      child_id: '5',
      subject: '数学',
      kind: 'basic',
      prompt: '1+1=?',
      answer: '2',
      wrong: null,
      next_review: '2024-01-20',
      interval_days: '1',
      reps: '0',
      easiness_factor: '2.5',
      resolved: '0',
    };
    const row = toMistakeRow(raw);
    expect(row.wrong).toBeNull();
  });

  it('handles missing optional fields with defaults', () => {
    const raw = {
      id: '1',
      child_id: '5',
      subject: '英语',
      kind: 'listening',
      prompt: 'word',
      answer: 'apple',
      next_review: '2024-01-20',
    };
    const row = toMistakeRow(raw);
    expect(row.wrong).toBeNull();
    expect(row.interval_days).toBe(1);
    expect(row.reps).toBe(0);
    expect(row.easiness_factor).toBe(2.5);
    expect(row.resolved).toBe(0);
  });
});
