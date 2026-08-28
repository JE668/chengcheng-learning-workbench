'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/atomic';

export default function PwaRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    const onLoad = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js');
        
        // 检查推送支持
        setPushSupported('pushManager' in registration);

        // 监听更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration?.installing;
          if (!newWorker) return;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
              showToast({
                title: '发现新版本',
                description: '点击刷新获取最新功能',
                variant: 'info',
                action: (
                  <button
                    onClick={() => {
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                      window.location.reload();
                    }}
                    className="px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    立即刷新
                  </button>
                ),
              });
            }
          });
        });

        // 监听控制器变化（新版本激活）
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });

        // 监听同步完成
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SYNC_COMPLETE') {
            showToast({
              title: '同步完成',
              description: '离线数据已同步到服务器',
              variant: 'success',
            });
          }
        });

        // 监听在线/离线状态
        window.addEventListener('online', () => {
          showToast({ title: '网络已恢复', variant: 'success' });
          // 触发同步
          if (registration) {
            registration.sync?.register('sync-offline-actions');
          }
        });

        window.addEventListener('offline', () => {
          showToast({ title: '已离线', description: '数据将在本地保存，联网后自动同步', variant: 'warning' });
        });

      } catch (error) {
        console.warn('Service Worker 注册失败:', error);
      }
    };

    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  // 请求推送通知权限并订阅
  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('pushManager' in navigator.serviceWorker)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'BHU9tTbTawhmhx2UimosgY5OzQu5dw_X6K2YFrg1yemiNPb6LJ2NJEJi4u8FFoAlXtpPlboFOA9bMSTEIGWvKEM'
        ),
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