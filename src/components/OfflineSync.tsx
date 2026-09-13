'use client';

import { useEffect } from 'react';
import { useOfflineStore } from '@/lib/stores';
import { flushOfflineQueue } from '@/lib/offline-sync';

/**
 * 离线同步触发器：监听 online/offline，联网时重放本地暂存的打卡队列。
 * 同时把在线状态同步进 useOfflineStore（供其它组件/逻辑读取）。
 * 渲染为 null，纯副作用组件。
 */
export default function OfflineSync() {
  useEffect(() => {
    const { setOnline } = useOfflineStore.getState();

    const sync = () => {
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      setOnline(online);
      if (online) void flushOfflineQueue();
    };

    // 启动即同步一次（例如上次离线时暂存、本次打开页面已联网）
    sync();

    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  return null;
}