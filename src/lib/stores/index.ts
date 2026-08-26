import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/lib/types';

/** 认证状态 Store */
interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isHydrated: boolean;
  setHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
      isHydrated: false,
      setHydrated: (v) => set({ isHydrated: v }),
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({ user: state.user }), // 只持久化 user
    }
  )
);

/** 孩子学习偏好 Store */
interface ChildPreferencesState {
  // 数学难度
  mathDiffLevel: 'easy' | 'medium' | 'hard';
  setMathDiffLevel: (level: 'easy' | 'medium' | 'hard') => void;

  // 语音设置
  ttsRate: number;
  setTtsRate: (rate: number) => void;
  ttsVoice: 'strict' | 'loose' | 'server';
  setTtsVoice: (v: 'strict' | 'loose' | 'server') => void;

  // 显示设置
  showPinyin: boolean;
  togglePinyin: () => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;

  // 游戏设置
  gameDifficulty: 'easy' | 'normal' | 'hard';
  setGameDifficulty: (d: 'easy' | 'normal' | 'hard') => void;

  // 最后访问的页面
  lastVisitedPage: string;
  setLastVisitedPage: (page: string) => void;
}

export const useChildPreferencesStore = create<ChildPreferencesState>()(
  persist(
    (set) => ({
      mathDiffLevel: 'easy',
      setMathDiffLevel: (level) => set({ mathDiffLevel: level }),

      ttsRate: 0.55,
      setTtsRate: (rate) => set({ ttsRate: rate }),
      ttsVoice: 'strict',
      setTtsVoice: (v) => set({ ttsVoice: v }),

      showPinyin: true,
      togglePinyin: () => set((s) => ({ showPinyin: !s.showPinyin })),
      reducedMotion: false,
      setReducedMotion: (v) => set({ reducedMotion: v }),

      gameDifficulty: 'normal',
      setGameDifficulty: (d) => set({ gameDifficulty: d }),

      lastVisitedPage: '/home',
      setLastVisitedPage: (page) => set({ lastVisitedPage: page }),
    }),
    {
      name: 'child-prefs',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/** TTS 播放队列 Store */
interface TTSQueueItem {
  id: string;
  text: string;
  lang: 'zh' | 'en';
  opts: { rate?: number; pitch?: number; pauseMs?: number; priority?: 'normal' | 'high' };
  resolve: (v: boolean) => void;
}

interface TTSState {
  queue: TTSQueueItem[];
  isPlaying: boolean;
  currentItem: TTSQueueItem | null;

  enqueue: (item: Omit<TTSQueueItem, 'id'>) => string;
  dequeue: () => TTSQueueItem | undefined;
  setPlaying: (playing: boolean, item?: TTSQueueItem) => void;
  clear: () => void;
  interrupt: () => void;
}

let ttsId = 0;
export const useTTSStore = create<TTSState>((set, get) => ({
  queue: [],
  isPlaying: false,
  currentItem: null,

  enqueue: (item) => {
    const id = `tts-${Date.now()}-${++ttsId}`;
    const newItem = { ...item, id };
    set((s) => ({ queue: [...s.queue, newItem].sort((a, b) => (b.opts.priority ?? 0) - (a.opts.priority ?? 0)) }));
    return id;
  },

  dequeue: () => {
    const item = get().queue[0];
    if (item) set((s) => ({ queue: s.queue.slice(1) }));
    return item;
  },

  setPlaying: (playing, item) => set({ isPlaying: playing, currentItem: item ?? null }),

  clear: () => set({ queue: [], isPlaying: false, currentItem: null }),

  interrupt: () => {
    set({ queue: [], isPlaying: false, currentItem: null });
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  },
}));

/** 萌可收集动画状态 Store */
interface CaptureState {
  pendingCapture: { mokoKey: string; name: string; img: string } | null;
  showCaptureModal: boolean;

  triggerCapture: (moko: { mokoKey: string; name: string; img: string }) => void;
  dismissCapture: () => void;
  setModalVisible: (visible: boolean) => void;
}

export const useCaptureStore = create<CaptureState>((set) => ({
  pendingCapture: null,
  showCaptureModal: false,

  triggerCapture: (moko) => set({ pendingCapture: moko, showCaptureModal: true }),
  dismissCapture: () => set({ pendingCapture: null, showCaptureModal: false }),
  setModalVisible: (visible) => set({ showCaptureModal: visible }),
}));

/** 离线队列 Store（用于 PWA 离线同步） */
interface OfflineAction {
  id: string;
  type: 'completion' | 'checkin' | 'task' | 'redemption' | 'harvest' | 'capture';
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
    (set, get) => ({
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
  showGlobalLoading: (show) => set((s) => ({ globalLoading: show ? s.globalLoading + 1 : Math.max(0, s.globalLoading - 1) })),

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