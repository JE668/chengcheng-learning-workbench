'use client';

import { createContext, useContext, type ReactNode } from 'react';

export interface StudyContextValue {
  subject: string; // 学科 key：chinese / math / english
  moduleKey: string; // 模块 key，如 compare / words
  /** 初始进度数据（由 RSC 父组件直查库获取，避免客户端二次请求） */
  initialProgress?: {
    stars: number;
    rounds: number;
    lastPlayed: number;
  };
}

const StudyContext = createContext<StudyContextValue | null>(null);

export function StudyModuleProvider({
  subject,
  moduleKey,
  initialProgress,
  children,
}: {
  subject: string;
  moduleKey: string;
  initialProgress?: StudyContextValue['initialProgress'];
  children: ReactNode;
}) {
  return (
    <StudyContext.Provider value={{ subject, moduleKey, initialProgress }}>
      {children}
    </StudyContext.Provider>
  );
}

export function useStudyContext(): StudyContextValue | null {
  return useContext(StudyContext);
}