'use client';

import { useEffect } from 'react';
import { reportWebVitals } from '@/lib/web-vitals';

/**
 * Web Vitals 上报。
 *
 * 此前它是写在根布局里的一个**普通函数组件**（没有 'use client'），
 * 而根布局是 Server Component —— 服务端渲染时 `typeof window === 'undefined'` 恒为真，
 * 所以 `reportWebVitals()` **从来没有执行过**，整条性能上报链路是死的。
 *
 * 现在抽成独立的客户端组件，在 useEffect 里执行一次。
 */
export default function WebVitalsReporter() {
  useEffect(() => {
    reportWebVitals();
  }, []);
  return null;
}
