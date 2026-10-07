// 测试用环境变量：必须在任何 lib 模块（db-core 在 import 时读取 TURSO_URL）加载前设置好。
// 用内存库，保证每个测试进程隔离、不污染真实 local.db。
Object.assign(process.env, {
  TURSO_URL: 'file::memory:',
  NODE_ENV: 'test',
});

// Testing Library扩展匹配器
import '@testing-library/jest-dom';
import { vi } from 'vitest';

/**
 * 全局注入 React，供 JSX 在测试环境下使用。
 *
 * 背景：本项目组件**从不显式 `import React`** —— Next.js 的 JSX 转换会自动
 * 注入，因此源码本身没问题。但 vitest 直跑 esbuild 时没有这层自动注入，
 * 于是任何 `render(<Xxx />)` 都会抛 "React is not defined"。
 *
 * 在此统一兜底，比给上百个组件逐个加 import 更贴近真实使用方式
 * （源码保持与 Next 一致的写法，测试环境补齐缺失的运行时）。
 */
import React from 'react';
(globalThis as unknown as { React: typeof React }).React = React;

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js headers/cookies
vi.mock('next/headers', () => ({
  headers: () => new Map(),
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(),
  }),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock speechSynthesis
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn().mockReturnValue([
      { name: 'Google US English', lang: 'en-US', default: true },
      { name: 'Microsoft Xiaoxiao', lang: 'zh-CN', default: true },
    ]),
    speaking: false,
    pending: false,
    onvoiceschanged: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

// Mock AudioContext
global.AudioContext = vi.fn().mockImplementation(() => ({
  decodeAudioData: vi.fn().mockResolvedValue({}),
  createBufferSource: vi.fn().mockReturnValue({
    connect: vi.fn(),
    start: vi.fn(),
    onended: null,
  }),
  destination: {},
  close: vi.fn(),
})) as any;

// Mock fetch
global.fetch = vi.fn();

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn().mockReturnValue('test-uuid-' + Math.random().toString(36).slice(2)),
    subtle: {
      digest: vi.fn(),
    },
  },
});

/**
 * localStorage / sessionStorage 的**真实内存实现**。
 *
 * ⚠️ 原先是 `vi.fn()` 空壳：setItem/getItem/clear 全是空函数，
 * 于是任何依赖 localStorage 的测试都**测不出真实行为** ——
 * 写入的数据读不回来，组件测试还会「碰巧」因为读不到而走「无数据」分支通过，
 * 从而掩盖真实 bug（例：GameBestBadge 的「🏆 历史最佳」角标不显示）。
 * 这里用 Map 实现完整语义（含 key/length 遍历），让存储类逻辑可被真正验证。
 */
function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key(index: number): string | null {
      // 按插入顺序返回第 index 个键
      return [...map.keys()][index] ?? null;
    },
    getItem(key: string): string | null {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string): void {
      map.set(String(key), String(value));
    },
    removeItem(key: string): void {
      map.delete(key);
    },
    clear(): void {
      map.clear();
    },
  } as Storage;
}

Object.defineProperty(window, 'localStorage', {
  value: createMemoryStorage(),
  writable: true,
  configurable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: createMemoryStorage(),
  writable: true,
  configurable: true,
});

// 静默 console.error 在测试中（可选，调试时取消注释）
// const originalError = console.error;
// console.error = (...args) => {
//   if (args[0]?.includes?.('Warning: ReactDOM.render is no longer supported')) return;
//   originalError.apply(console, args);
// };

// 全局测试超时
vi.setConfig({ testTimeout: 10000 });
