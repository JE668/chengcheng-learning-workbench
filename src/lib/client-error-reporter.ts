'use client';

import { useEffect } from 'react';

/**
 * 挂载在根 layout 的空渲染客户端组件（root layout 是 server component，
 * 不能直接调 hook，故包一层）。同时挂载时把捕获到的服务端可达错误
 * 一起镜像 —— Sentry 管云端细节，本地只留计数。
 */
export function ClientErrorReporter() {
  useClientErrorReporter();
  return null;
}

/**
 * 应用错误本地镜像：Sentry 之外的轻量回路。
 *
 * Sentry 把异常送云端，但家庭自部署的家长不会开后台看；这里把同一批
 * 全局异常聚合计数发到 /api/client-error 落本地库，周日周报能说一句
 * 「本周应用异常 N 次」。不替代 Sentry —— 两路并行，Sentry 留栈细节，
 * 本地只存首行消息（300 字符内）。
 *
 * 设计：
 *  - 30 秒窗口内相同消息去重（同一错误反复抛只记一次）；
 *  - 攒批 5 条或页面隐藏时统一上报，减少请求；
 *  - 发送失败静默放弃（错误上报自身不能变成新的错误源）。
 */
export function useClientErrorReporter() {
  useEffect(() => {
    const seen = new Map<string, number>();
    const queue: { source: 'client'; message: string }[] = [];
    let timer: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
      timer = null;
      if (queue.length === 0) return;
      const items = queue.splice(0, queue.length);
      void fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
        keepalive: true,
      }).catch(() => {
        /* 上报失败静默：不能让错误上报本身制造错误 */
      });
    };

    const record = (message: string) => {
      const key = message.slice(0, 300);
      const now = Date.now();
      const last = seen.get(key) ?? 0;
      if (now - last < 30_000) return; // 同一错误 30 秒内只记一次
      seen.set(key, now);
      if (seen.size > 50) {
        // 粗糙的内存上限：清最旧的一半，防长会话泄漏
        const entries = [...seen.entries()].sort((a, b) => a[1] - b[1]);
        for (const [k] of entries.slice(0, 25)) seen.delete(k);
      }
      queue.push({ source: 'client', message: key });
      if (queue.length >= 5) flush();
      else if (timer === null) timer = setTimeout(flush, 10_000);
    };

    const onError = (e: ErrorEvent) => {
      if (e.message) record(e.message);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const message =
        reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : '';
      if (message) record(`Unhandled rejection: ${message}`);
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      document.removeEventListener('visibilitychange', onHide);
      if (timer !== null) clearTimeout(timer);
    };
  }, []);
}
