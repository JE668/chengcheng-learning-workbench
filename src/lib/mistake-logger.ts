'use client';

import { useCallback } from 'react';
import { useStudyContext } from './study-context';
import { logMistake } from './mistake-log';

export interface MistakeInput {
  subject: string;
  kind: string;
  prompt: string;
  answer: string;
  wrong: string;
  chapter?: string;
}

/**
 * 在学科模块页里调用：自动把当前「学科 + 模块」作为来源（sourceModule）带上，
 * 这样错题才能在家长端错题本里精准「去练习」回到对应模块。
 * chapter（章节/单元）为可选项，仅课文/单元类模块会传。
 */
export function useMistakeLogger() {
  const ctx = useStudyContext();
  return useCallback(
    (m: MistakeInput) => {
      logMistake({ ...m, sourceModule: ctx?.moduleKey });
    },
    [ctx?.moduleKey],
  );
}
