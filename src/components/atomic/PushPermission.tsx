// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/atomic';

interface PushPermissionState {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
}

export function usePushPermission() {
  const [state, setState] = useState<PushPermissionState>({
    supported: false,
    permission: 'default',
    subscribed: false,
  });

  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'pushManager' in navigator.serviceWorker;
      setState((s) => ({ ...s, supported }));

      if (!supported) return;

      const permission = Notification.permission;
      setState((s) => ({ ...s, permission }));

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setState((s) => ({ ...s, subscribed: !!subscription }));
    };

    checkSupport();
  }, []);

  const requestPermission = async () => {
    if (!state.supported) return false;

    try {
      const permission = await Notification.requestPermission();
      setState((s) => ({ ...s, permission }));
      
      if (permission === 'granted') {
        await subscribeToPush();
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Push permission request failed:', error);
      return false;
    }
  };

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('pushManager' in navigator.serviceWorker)) {
      return false;
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
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (!response.ok) {
        throw new Error('订阅保存失败');
      }

      return true;
    } catch (error) {
      console.warn('Push subscription failed:', error);
      return false;
    }
  };

  return { ...state, requestPermission, subscribeToPush };
}

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

/** 推送权限请求按钮组件 */
export function PushPermissionButton() {
  const { supported, permission, subscribed, requestPermission, subscribeToPush } = usePushPermission();
  const { showToast } = useToast();

  if (!supported) return null;

  if (permission === 'granted' && subscribed) {
    return (
      <button
        className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg"
        disabled
      >
        ✅ 推送通知已开启
      </button>
    );
  }

  if (permission === 'granted' && !subscribed) {
    return (
      <button
        onClick={async () => {
          const ok = await subscribeToPush();
          if (ok) {
            showToast({ title: '订阅成功', description: '您将收到学习提醒和奖励通知', variant: 'success' });
          } else {
            showToast({ title: '订阅失败', description: '请稍后重试', variant: 'danger' });
          }
        }}
        className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors"
      >
        🔔 开启推送通知
      </button>
    );
  }

  return (
    <button
      onClick={async () => {
        const granted = await requestPermission();
        if (granted) {
          showToast({ title: '权限已授予', description: '正在为您订阅推送通知...', variant: 'info' });
        } else {
          showToast({ title: '权限被拒绝', description: '您可以在浏览器设置中手动开启', variant: 'warning' });
        }
      }}
      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-moko-pink to-moko-rose rounded-lg hover:opacity-90 transition-colors"
    >
      🔔 启用推送通知
    </button>
  );
}

export function PushPermissionProvider({ children }: { children: React.ReactNode }) {
  // 这个组件用于在应用中提供推送权限上下文
  // 实际的权限状态通过 usePushPermission hook 获取
  return <>{children}</>;
}