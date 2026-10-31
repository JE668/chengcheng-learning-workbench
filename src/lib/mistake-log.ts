'use client';

import { useOfflineStore } from './stores';

export interface MistakePayload {
  subject: string;
  kind: string;
  prompt: string;
  answer: string;
  wrong: string;
  sourceModule?: string;
  chapter?: string;
}

/**
 * 孩子端记录一次错题 / 错词。
 *
 * ⚠️ 失败时**入离线队列**，不再静默丢弃。
 *
 * 背景：这里原先只有 `try { fetch } catch {}` —— 网络一断，这条错题就永久消失，
 * 而孩子端文案明明写着「写错的小题会自动进复习本」「复习本会帮你记着」。
 * 孩子的平板 WiFi 本来就不稳（这也是离线队列存在的理由），于是「断网写错」= 白写。
 *
 * 现在失败即入队（localStorage 持久化），联网后由 OfflineSync → flushOfflineQueue 重放。
 * 服务端以 (child_id, subject, prompt, answer, resolved=0) 去重，重放不会重复堆积。
 *
 * 返回是否已**直接送达**，便于调用方给出诚实反馈
 *（「已记入复习本」vs「网络不稳，稍后自动补记」）。
 */
export async function logMistake(m: MistakePayload): Promise<boolean> {
  try {
    const res = await fetch('/api/mistakes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(m),
    });
    if (res.ok) return true;
    // ⚠️ 只丢**真正永久失败**的 4xx：400 参数非法 / 404 / 409 前置不满足。
    // 401（会话过期）、403（CSRF 软闸误判）、429（限流）都值得入队重试——
    // 与 offline-sync.ts 的 DISCARD_STATUSES 保持同一口径，否则孩子登录态过期
    // 那会儿写错的题会被永久丢弃（曾按「所有 4xx」判丢，误杀了过期会话的记录）。
    if (res.status === 400 || res.status === 404 || res.status === 409) return false;
  } catch {
    /* 网络异常 → 走下面的入队 */
  }
  // 入队。不抛错：记录错题不该阻塞孩子的答题流程。
  try {
    useOfflineStore.getState().addAction({ type: 'mistake', payload: { ...m } });
  } catch {
    /* localStorage 不可用（隐私模式等）时仍然静默，不打断答题 */
  }
  return false;
}
