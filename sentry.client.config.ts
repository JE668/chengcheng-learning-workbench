import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV !== 'production',

  // Replay configuration
  //
  // ⚠️ 2026-11-10 第三轮审查：Session Replay 关闭（0）。本项目是 NAS 自托管的家庭
  // 应用，replay 集成会带来 ~50KB 级客户端开销与运行时 DOM 记录成本，家庭场景
  // 里开发者自己就能看服务端日志，replay 的诊断价值撑不起这份成本。真需要时
  // 再按需打开 replaysOnErrorSampleRate（错误现场录制，与 session 采样独立）。
  replaysOnErrorSampleRate: 0,
  replaysSessionSampleRate: 0,

  // Ignore specific errors
  ignoreErrors: [
    // Ignore network errors
    'NetworkError',
    'Network request failed',
    // Ignore extension-related errors
    'Extension context invalidated',
    'The message port closed before a response was received',
    // Ignore specific Next.js errors
    'NEXT_REDIRECT',
    'NEXT_NOT_FOUND',
  ],

  // Before send hook to filter/modify events
  beforeSend(event, hint) {
    // Filter out specific errors
    if (event.exception) {
      for (const exception of event.exception.values || []) {
        if (exception.type === 'ChunkLoadError') {
          // Ignore chunk load errors (often due to network issues or old cached files)
          return null;
        }
      }
    }
    return event;
  },

  // Initial scope configuration
  initialScope: {
    tags: {
      app: 'chengcheng-learning-workbench',
      environment: process.env.NODE_ENV || 'development',
    },
  },
});
