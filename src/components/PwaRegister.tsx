'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUIStore } from '@/lib/stores';

/**
 * Service Worker 注册 + PWA 运行时能力。
 *
 * 三件事：
 *  1. 注册 SW，提供离线可用与「新版本」检测；
 *  2. 监听到新版本时在**顶部弹出提示条**，由用户点「立即更新」才刷新；
 *  3. 网络恢复/离线时给 toast，并尝试触发后台同步。
 *
 * ⚠️ 关于刷新时机：此前 `controllerchange` 里直接 `location.reload()`，
 * 而提示是同时发出的 —— 页面会在用户看清之前就被刷掉，提示条永远来不及显示。
 * 现在改为「提示条 + 用户确认」，避免打断孩子正在做的题。
 */
export default function PwaRegister() {
  const [updateReady, setUpdateReady] = useState(false);
  const showToast = useUIStore((s) => s.showToast);

  // 交给用户点击后才刷新（放在这里以便按钮直接调用）
  const applyUpdate = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    // 「本页最初是否已有 SW 控制」原本用于区分「首次安装」与「版本更新」，
    // 配合 controllerchange 里的自动 reload 使用。改成提示条 + 用户确认后不再需要，
    // 因为是否首装已由 onUpdateFound 里的 `navigator.serviceWorker.controller` 判断。
    let registration: ServiceWorkerRegistration | null = null;

    const onUpdateFound = () => {
      const newWorker = registration?.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          setUpdateReady(true);
        }
      });
    };

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        showToast('离线数据已同步到服务器', 'success');
      }
    };

    const onOnline = () => {
      showToast('网络已恢复', 'success');
      if (registration && 'sync' in registration) {
        (
          registration as ServiceWorkerRegistration & {
            sync?: { register: (t: string) => Promise<void> };
          }
        ).sync
          ?.register('sync-offline-actions')
          .catch(() => {});
      }
    };

    const onOffline = () => {
      showToast('已离线，数据将在本地保存，联网后自动同步', 'info');
    };

    // 所有注册过的监听器都登记在这里，卸载时统一移除。
    // 此前只移除了 load，其余会随组件重挂载不断累积（开发期热更新尤其明显）。
    const cleanups: Array<() => void> = [];

    const onLoad = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js');

        registration.addEventListener('updatefound', onUpdateFound);
        navigator.serviceWorker.addEventListener('message', onMessage);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        cleanups.push(
          () => registration?.removeEventListener('updatefound', onUpdateFound),
          () => navigator.serviceWorker.removeEventListener('message', onMessage),
          () => window.removeEventListener('online', onOnline),
          () => window.removeEventListener('offline', onOffline)
        );
      } catch (error) {
        console.warn('Service Worker 注册失败:', error);
      }
    };

    // ⚠️ 不能无条件等 'load'：若 effect 执行时 load 已经触发过（快速设备、或热更新后
    // 重新挂载），addEventListener('load') 永远不会回调 → **SW 永远不注册**，
    // 离线与推送静默失效。这里按 readyState 兜底。
    let waitingForLoad = false;
    if (document.readyState === 'complete') {
      void onLoad();
    } else {
      window.addEventListener('load', onLoad, { once: true });
      waitingForLoad = true;
    }

    return () => {
      if (waitingForLoad) window.removeEventListener('load', onLoad);
      cleanups.forEach((fn) => fn());
    };
  }, [showToast]);

  if (!updateReady) return null;

  // 顶部提示条。z-[70] 与 OfflineIndicator 同层：两者不会同时出现（一个要求 SW 控制，
  // 一个要求断网），且都高于常规内容。
  return (
    <div className="fixed top-0 inset-x-0 z-[70] bg-slate-800 text-white shadow-lg">
      <div className="max-w-3xl mx-auto px-3 py-2 flex items-center gap-3 text-sm">
        <span className="font-bold shrink-0">✨ 有新版本</span>
        <span className="text-white/90 truncate">更新已就绪，点「立即更新」生效</span>
        <button
          onClick={applyUpdate}
          className="ml-auto shrink-0 bg-white text-slate-800 font-bold px-3 py-1 rounded-full active:scale-95 transition"
        >
          立即更新
        </button>
        <button
          onClick={() => setUpdateReady(false)}
          className="shrink-0 text-white/80 hover:text-white px-1"
          aria-label="稍后再说"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
