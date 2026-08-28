import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV !== 'production',

  // Replay configuration
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.5,

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