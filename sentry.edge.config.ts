import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  debug: process.env.NODE_ENV !== 'production',

  ignoreErrors: [
    'NetworkError',
    'Network request failed',
    'NEXT_REDIRECT',
    'NEXT_NOT_FOUND',
  ],

  initialScope: {
    tags: {
      app: 'chengcheng-learning-workbench',
      environment: process.env.NODE_ENV || 'development',
      component: 'edge',
    },
  },
});