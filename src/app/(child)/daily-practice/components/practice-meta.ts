import type { PracticeQuestion } from '@/lib/daily-practice';
import type { Subject } from '@/lib/types';

export interface PracticeKindMeta {
  label: string;
  grad: string;
  icon: string;
  subject: Subject;
}

export const KIND_META: Record<string, PracticeKindMeta> = {
  pinyin: {
    label: '语文 · 拼音',
    grad: 'from-moko-pink to-moko-rose',
    icon: '🔤',
    subject: '语文',
  },
  dictation: {
    label: '语文 · 听写',
    grad: 'from-moko-pink to-moko-rose',
    icon: '✍️',
    subject: '语文',
  },
  math: {
    label: '数学 · 口算',
    grad: 'from-moko-blue to-sky-400',
    icon: '🔢',
    subject: '数学',
  },
  english: {
    label: '英语 · 听音',
    grad: 'from-moko-yellow to-amber-300',
    icon: '🔤',
    subject: '英语',
  },
  mistake: {
    label: '错题重练',
    grad: 'from-moko-violet to-purple-400',
    icon: '🔁',
    subject: '语文',
  },
  poem: {
    label: '语文 · 古诗',
    grad: 'from-moko-purple to-moko-violet',
    icon: '🌙',
    subject: '语文',
  },
  'chinese-quiz': {
    label: '语文 · 识字',
    grad: 'from-moko-pink to-moko-rose',
    icon: '💡',
    subject: '语文',
  },
  antonym: {
    label: '语文 · 反义词',
    grad: 'from-moko-pink to-moko-rose',
    icon: '🔄',
    subject: '语文',
  },
  proverb: {
    label: '语文 · 谚语',
    grad: 'from-moko-pink to-moko-rose',
    icon: '📜',
    subject: '语文',
  },
  riddle: {
    label: '语文 · 谜语',
    grad: 'from-moko-pink to-moko-rose',
    icon: '🧩',
    subject: '语文',
  },
};

export const FALLBACK_META: PracticeKindMeta = {
  label: '今日练习',
  grad: 'from-moko-violet to-moko-purple',
  icon: '📝',
  subject: '语文',
};

export function getQuestionMeta(question: PracticeQuestion): PracticeKindMeta {
  return KIND_META[question.kind] ?? FALLBACK_META;
}

export function getQuestionSubject(question: PracticeQuestion): Subject {
  return question.kind === 'mistake' ? question.subject : getQuestionMeta(question).subject;
}
