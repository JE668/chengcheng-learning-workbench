'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/lib/stores';

export default function PwaRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const showToast = useUIStore((s) => s.showToast);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    // 记录「本页最初是否已有 SW 控制」：用于区分「首次安装」与「版本更新」。
    // 首次安装时 controller 为 null，而 sw.js 里的 clients.claim() 同样会触发
    // controllerchange —— 不加判断就会在首装时莫名其妙整页刷新（可能打断孩子正在做的题）。
    const hadController = !!navigator.serviceWorker.controller;

    let registration: ServiceWorkerRegistration | null = null;
    let refreshing = false;

    const onUpdateFound = () => {
      const newWorker = registration?.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          setUpdateAvailable(true);
          showToast('发现新版本，已自动更新', 'info');
        }
      });
    };

    const onControllerChange = () => {
      // 只有「本来就有 SW 控制」才说明这是版本更新，此时刷新一次拿到新资源
      if (!hadController || refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        showToast('离线数据已同步到服务器', 'success');
      }
    };

    const onOnline = () => {
      showToast('网络已恢复', 'success');
      if (registration && 'sync' in registration) {
        (registration as ServiceWorkerRegistration & { sync?: { register: (t: string) => Promise<void> } })
          .sync?.register('sync-offline-actions')
          .catch(() => {});
      }
    };

    const onOffline = () => {
      showToast('已离线，数据将在本地保存，联网后自动同步', 'info');
    };

    // 所有注册过的监听器都登记在这里，卸载时统一移除。
    // 此前只移除了 load，其余 5 个会随组件重挂载不断累积（开发期热更新尤其明显）。
    const cleanups: Array<() => void> = [];

    const onLoad = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js');
        setPushSupported('pushManager' in registration);

        registration.addEventListener('updatefound', onUpdateFound);
        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
        navigator.serviceWorker.addEventListener('message', onMessage);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        cleanups.push(
          () => registration?.removeEventListener('updatefound', onUpdateFound),
          () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange),
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

  // 请求推送通知权限并订阅
  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('pushManager' in navigator.serviceWorker)) {
      return;
    }

    try {
      // 公钥由服务端下发（不再硬编码：仓库是 public，任何密钥都不该进源码；
      // 服务端未配置 VAPID 时会返回 enabled:false，此时直接跳过订阅）。
      const keyRes = await fetch('/api/push/subscribe');
      const keyData = (await keyRes.json().catch(() => null)) as
        | { enabled?: boolean; publicKey?: string }
        | null;
      if (!keyRes.ok || !keyData?.enabled || !keyData.publicKey) {
        console.info('Web Push 未配置，跳过订阅');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });

      // 发送订阅到服务器
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      console.log('Push subscription successful');
    } catch (error) {
      console.warn('Push subscription failed:', error);
    }
  };

  // 将 base64 字符串转换为 Uint8Array
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(base64.length);
    for (let i = 0; i < base64.length; ++i) {
      outputArray[i] = base64.charCodeAt(i);
    }
    return outputArray;
  }

  return null;
}