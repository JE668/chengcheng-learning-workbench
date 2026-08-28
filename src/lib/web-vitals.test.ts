import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { reportWebVitals, sendToSentry, sendToConsole } from './web-vitals';

// Mock web-vitals with hoisted spies
const onCLS = vi.hoisted(() => vi.fn((cb) => cb({ name: 'CLS', value: 0.1, rating: 'good', delta: 0.1, id: '1', navigationType: 'navigate' })));
const onFCP = vi.hoisted(() => vi.fn((cb) => cb({ name: 'FCP', value: 1800, rating: 'good', delta: 1800, id: '2', navigationType: 'navigate' })));
const onLCP = vi.hoisted(() => vi.fn((cb) => cb({ name: 'LCP', value: 2500, rating: 'needs-improvement', delta: 2500, id: '3', navigationType: 'navigate' })));
const onTTFB = vi.hoisted(() => vi.fn((cb) => cb({ name: 'TTFB', value: 800, rating: 'poor', delta: 800, id: '4', navigationType: 'navigate' })));
const onINP = vi.hoisted(() => vi.fn((cb) => cb({ name: 'INP', value: 200, rating: 'good', delta: 200, id: '5', navigationType: 'navigate' })));

vi.mock('web-vitals', () => ({
  onCLS,
  onFCP,
  onLCP,
  onTTFB,
  onINP,
}));

// Mock Sentry
const mockScope = { setTag: vi.fn() };
const getCurrentScope = vi.hoisted(() => vi.fn(() => mockScope));
const addBreadcrumb = vi.hoisted(() => vi.fn());

vi.mock('@sentry/nextjs', () => ({
  getCurrentScope,
  addBreadcrumb,
}));

// Mock logger
const loggerDebugSpy = vi.hoisted(() => vi.fn());
const loggerInfoSpy = vi.hoisted(() => vi.fn());
const loggerWarnSpy = vi.hoisted(() => vi.fn());
const loggerErrorSpy = vi.hoisted(() => vi.fn());

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: loggerDebugSpy,
    info: loggerInfoSpy,
    warn: loggerWarnSpy,
    error: loggerErrorSpy,
  },
}));

describe('web-vitals', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    mockScope.setTag.mockClear();
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('sendToConsole', () => {
    it('logs good rating with checkmark', () => {
      sendToConsole({ name: 'CLS', value: 0.1, rating: 'good', delta: 0.1, id: '1', navigationType: 'navigate' });
      expect(loggerInfoSpy).toHaveBeenCalledWith(expect.stringContaining('✅'));
      expect(loggerInfoSpy).toHaveBeenCalledWith(expect.stringContaining('CLS'));
    });

    it('logs needs-improvement rating with warning', () => {
      sendToConsole({ name: 'LCP', value: 2500, rating: 'needs-improvement', delta: 2500, id: '2', navigationType: 'navigate' });
      expect(loggerInfoSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️'));
    });

    it('logs poor rating with error', () => {
      sendToConsole({ name: 'TTFB', value: 800, rating: 'poor', delta: 800, id: '3', navigationType: 'navigate' });
      expect(loggerInfoSpy).toHaveBeenCalledWith(expect.stringContaining('❌'));
    });
  });

  describe('sendToSentry', () => {
    it('logs to logger in development', () => {
      process.env.NODE_ENV = 'development';
      
      sendToSentry({ name: 'CLS', value: 0.1, rating: 'good', delta: 0.1, id: '1', navigationType: 'navigate' });
      
      expect(loggerDebugSpy).toHaveBeenCalledWith('[Web Vitals]', expect.objectContaining({ name: 'CLS' }));
      expect(getCurrentScope).not.toHaveBeenCalled();
      expect(addBreadcrumb).not.toHaveBeenCalled();
    });

    it('sends to Sentry in production', () => {
      process.env.NODE_ENV = 'production';
      
      sendToSentry({ name: 'LCP', value: 2500, rating: 'needs-improvement', delta: 2500, id: '2', navigationType: 'navigate' });
      
      expect(mockScope.setTag).toHaveBeenCalledWith('web_vitals_lcp', '2500.00');
      expect(mockScope.setTag).toHaveBeenCalledWith('web_vitals_lcp_rating', 'needs-improvement');
      expect(addBreadcrumb).toHaveBeenCalledWith(expect.objectContaining({
        category: 'web-vitals',
        level: 'info', // 'needs-improvement' uses 'info' level (only 'poor' uses 'warning')
      }));
    });
  });

  describe('reportWebVitals', () => {
    it('calls all web-vitals callbacks', () => {
      const customReport = vi.fn();
      
      reportWebVitals(customReport);
      
      expect(onCLS).toHaveBeenCalled();
      expect(onFCP).toHaveBeenCalled();
      expect(onLCP).toHaveBeenCalled();
      expect(onTTFB).toHaveBeenCalled();
      expect(onINP).toHaveBeenCalled();
      expect(customReport).toHaveBeenCalledTimes(5);
    });

    it('uses default reporter when none provided', () => {
      reportWebVitals();
      
      expect(onCLS).toHaveBeenCalled();
      expect(loggerInfoSpy).toHaveBeenCalled();
    });
  });
});