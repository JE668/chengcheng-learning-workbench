import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 说明：本文件此前还有 useAuthStore / useChildPreferencesStore / useTTSStore /
// useCaptureStore 四个 store，经全仓检索确认**零引用**（src 与 tests 里都没有 import），
// 已删除。认证与偏好实际由服务端 session + 各处局部 state 承担；TTS 队列与萌可收集
// 动画也已有各自的实现，不再走这里。
//
// 如果将来要恢复它们，请先确认真的会用 —— 曾经「定义了但没人用」正是它们变成死代码的原因。

/** 离线队列 Store（用于 PWA 离线同步） */
interface OfflineAction {
  id: string;
  type: 'completion' | 'checkin' | 'task' | 'redemption' | 'harvest' | 'capture' | 'mistake';
  payload: Record<string, any>;
  timestamp: number;
  retries: number;
}

interface OfflineState {
  queue: OfflineAction[];
  isOnline: boolean;
  lastSync: number | null;

  addAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries'>) => void;
  removeAction: (id: string) => void;
  incrementRetry: (id: string) => void;
  setOnline: (online: boolean) => void;
  setLastSync: (time: number) => void;
  clearSynced: () => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      queue: [],
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      lastSync: null,

      addAction: (action) => {
        const id = `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        set((s) => ({ queue: [...s.queue, { ...action, id, timestamp: Date.now(), retries: 0 }] }));
      },

      removeAction: (id) => set((s) => ({ queue: s.queue.filter((a) => a.id !== id) })),

      incrementRetry: (id) =>
        set((s) => ({
          queue: s.queue.map((a) => (a.id === id ? { ...a, retries: a.retries + 1 } : a)),
        })),

      setOnline: (online) => set({ isOnline: online }),

      setLastSync: (time) => set({ lastSync: time }),

      clearSynced: () =>
        set((s) => ({
          queue: s.queue.filter((a) => a.retries < 5), // 保留重试次数 < 5 的
        })),
    }),
    {
      name: 'offline-queue',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/** UI 状态 Store（全局 loading、toast 等） */
interface UIState {
  globalLoading: number;
  showGlobalLoading: (show: boolean) => void;

  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;

  modals: Record<string, boolean>;
  openModal: (key: string) => void;
  closeModal: (key: string) => void;
}

let toastId = 0;
export const useUIStore = create<UIState>((set) => ({
  globalLoading: 0,
  showGlobalLoading: (show) =>
    set((s) => ({ globalLoading: show ? s.globalLoading + 1 : Math.max(0, s.globalLoading - 1) })),

  toasts: [],
  showToast: (message, type = 'info') => {
    const id = `toast-${++toastId}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    // 自动消失
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3000);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  modals: {},
  openModal: (key) => set((s) => ({ modals: { ...s.modals, [key]: true } })),
  closeModal: (key) => set((s) => ({ modals: { ...s.modals, [key]: false } })),
}));
