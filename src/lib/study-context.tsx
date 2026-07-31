'use client';

import { createContext, useContext, type ReactNode } from 'react';

export interface StudyContextValue {
  subject: string; // 学科 key：chinese / math / english
  moduleKey: string; // 模块 key，如 compare / words
}

const StudyContext = createContext<StudyContextValue | null>(null);

export function StudyModuleProvider({
  subject,
  moduleKey,
  children,
}: {
  subject: string;
  moduleKey: string;
  children: ReactNode;
}) {
  return <StudyContext.Provider value={{ subject, moduleKey }}>{children}</StudyContext.Provider>;
}

export function useStudyContext(): StudyContextValue | null {
  return useContext(StudyContext);
}
