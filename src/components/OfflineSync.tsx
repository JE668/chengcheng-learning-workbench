'use client';

import { useEffect, useState } from 'react';
import { useOfflineStore } from '@/lib/stores';
import { flushOfflineQueue } from '@/lib/offline-sync';

/**
 * 离线同步触发器：监听 online/offline，联网时重放本地暂存的打卡队列。
 * 同时把在线状态同步进 useOfflineStore（供其它组件/逻辑读取）。
 *
 * 2026-10-17：不再渲染 null——重放若发生**丢弃**（超限/4xx，打卡彻底没
 * 同步上），这里给孩子一条可见的提示横幅。静默丢弃会让孩子以为已打卡而
 * 实际没有，是最伤信任的失败形态。横幅可关闭；下次重放再丢弃会再出现。
 */
export default function OfflineSync() {
  const [droppedInfo, setDroppedInfo] = useState<{ n: number; at: number } | null>(null);

  useEffect(() => {
    const { setOnline } = useOfflineStore.getState();

    const sync = async () => {
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      setOnline(online);
      if (!online) return;
      const { dropped } = await flushOfflineQueue();
      if (dropped > 0) setDroppedInfo({ n: dropped, at: Date.now() });
    };

    // 启动即同步一次（例如上次离线时暂存、本次打开页面已联网）
    void sync();

    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  if (!droppedInfo) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] w-fit"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-moko-rose text-white px-4 py-3 shadow-lg font-bold text-sm">
        <span>⚠️</span>
        <span>有 {droppedInfo.n} 条离线打卡没能同步上，记得重新做一次哦</span>
        <button
          onClick={() => setDroppedInfo(null)}
          className="ml-1 rounded-full bg-white/25 hover:bg-white/40 transition w-7 h-7 flex items-center justify-center shrink-0"
          aria-label="知道了，关闭提示"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
