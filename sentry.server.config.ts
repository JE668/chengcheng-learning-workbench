import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  debug: process.env.NODE_ENV !== 'production',

  // Server-only: capture unhandled rejections
  integrations: [
    Sentry.onUnhandledRejectionIntegration(),
    Sentry.onUncaughtExceptionIntegration(),
  ],

  ignoreErrors: [
    'NetworkError',
    'Network request failed',
    'NEXT_REDIRECT',
    'NEXT_NOT_FOUND',
  ],

  beforeSend(event, hint) {
    // Filter out health check noise
    if (event.request?.url?.includes('/api/health') || event.request?.url?.includes('/api/cron/')) {
      return null;
    }
    return event;
  },

  initialScope: {
    tags: {
      app: 'chengcheng-learning-workbench',
      environment: process.env.NODE_ENV || 'development',
      component: 'server',
    },
  },
});