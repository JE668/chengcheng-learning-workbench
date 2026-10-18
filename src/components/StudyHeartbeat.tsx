'use client';

import { useEffect, useRef } from 'react';
import { warmupVoices } from '@/lib/speak';

/**
 * 学习时长心跳（2026-10-17）：每 60 秒向后端报一次「页面在前台」。
 * - 用 document.visibilityState 判前台；切后台/锁屏不计时
 * - 页面隐藏时暂停 interval 逻辑（visibilitychange 里立即停报）
 * - 失败静默（时长是锦上添花），卸载时清定时器不泄漏
 *
 * 2026-10-18 B2：顺带做 TTS voices 启动预热——Chrome/WebView 的
 * getVoices() 异步加载，冷启动前几十秒严格嗓音判定恒 false。此处挂载
 * 即触发枚举+轮询，孩子端任何页面的首次朗读都能用上正确层。
 */
export default function StudyHeartbeat() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    warmupVoices();
    if (typeof window === 'undefined') return;

    const beat = () => {
      if (document.visibilityState !== 'visible') return;
      void fetch('/api/study-session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ minutes: 1 }),
        keepalive: true,
      }).catch(() => {});
    };

    const start = () => {
      if (timerRef.current) return;
      // 先报第一分钟，再起周期
      beat();
      timerRef.current = setInterval(beat, 60_000);
    };
    const stop = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    const onVis = () => (document.visibilityState === 'visible' ? start() : stop());
    document.addEventListener('visibilitychange', onVis);
    if (document.visibilityState === 'visible') start();

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return null;
}
