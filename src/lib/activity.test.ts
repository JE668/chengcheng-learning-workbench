// @vitest-environment jsdom
/**
 * 活动计数（lib/activity.ts）回归测试。
 *
 * 这是「学科徽章进度」的数据源：trackActivity 累加、getActivity 读取，
 * 全部走 localStorage（无需后端）。此前 0% 覆盖，容易在重构 storage 逻辑时
 * 静默坏掉（比如 key 改了、解析抛错没兜住），故锁死行为。
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { trackActivity, getActivity, type ActivityKey } from './activity';

const KEY = 'cc_activity_v1';

describe('activity 计数（学科徽章进度数据源）', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('首次 trackActivity 建立计数为 1', () => {
    trackActivity('pinyin');
    expect(getActivity()).toEqual({ pinyin: 1 });
  });

  it('同一模块多次 trackActivity 累加', () => {
    trackActivity('math');
    trackActivity('math');
    trackActivity('math');
    expect(getActivity().math).toBe(3);
  });

  it('不同模块互不干扰', () => {
    trackActivity('pinyin');
    trackActivity('pinyin');
    trackActivity('poem');
    expect(getActivity()).toEqual({ pinyin: 2, poem: 1 });
  });

  it('所有合法 ActivityKey 都能被跟踪', () => {
    const keys: ActivityKey[] = ['pinyin', 'trace', 'picto', 'poem', 'talk', 'math', 'quiz'];
    for (const k of keys) trackActivity(k);
    const c = getActivity();
    for (const k of keys) expect(c[k]).toBe(1);
  });

  it('从 localStorage 持久化读取（跨「页面」一致）', () => {
    trackActivity('quiz');
    trackActivity('quiz');
    // 直接读底层存储确认写入
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    expect(raw.quiz).toBe(2);
    // getActivity 与底层存储一致
    expect(getActivity().quiz).toBe(2);
  });

  it('localStorage 里是脏数据（非法 JSON）时不抛错，返回空', () => {
    localStorage.setItem(KEY, '{not valid json');
    expect(getActivity()).toEqual({});
    // 脏数据下继续 track 也不抛：解析失败被 catch 兜住，本次不写入（不会用脏数据覆盖）
    expect(() => trackActivity('math')).not.toThrow();
    // 仍读不到合法数据 → 计数保持空，绝不会因为坏存储把页面打挂
    expect(getActivity()).toEqual({});
  });

  it('localStorage 里是合法但非对象 JSON 时不抛错', () => {
    localStorage.setItem(KEY, '123');
    expect(() => getActivity()).not.toThrow();
    expect(() => trackActivity('pinyin')).not.toThrow();
  });
});
