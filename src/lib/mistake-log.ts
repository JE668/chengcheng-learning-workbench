'use client';

// 孩子端记录一次错题 / 错词（失败静默，不影响答题体验）
export async function logMistake(m: {
  subject: string;
  kind: string;
  prompt: string;
  answer: string;
  wrong: string;
  sourceModule?: string;
  chapter?: string;
}) {
  try {
    await fetch('/api/mistakes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(m),
    });
  } catch {
    /* 忽略网络/鉴权异常 */
  }
}
