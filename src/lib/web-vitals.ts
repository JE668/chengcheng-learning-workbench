'use client';

import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

function sendToSentry(metric: WebVitalsMetric) {
  // Only send in production or when explicitly enabled
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_SEND_WEB_VITALS !== 'true') {
    // Log in development for debugging
    logger.debug('[Web Vitals]', { 
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    });
    return;
  }

  // Send to Sentry using custom measurement
  // Sentry.metrics is not available in browser SDK, use custom transaction/span
  const scope = Sentry.getCurrentScope();
  
  // Set metrics as tags for trace correlation
  scope.setTag(`web_vitals_${metric.name.toLowerCase()}`, metric.value.toFixed(2));
  scope.setTag(`web_vitals_${metric.name.toLowerCase()}_rating`, metric.rating);
  
  // Add as breadcrumb for context
  Sentry.addBreadcrumb({
    category: 'web-vitals',
    message: `${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
    level: metric.rating === 'poor' ? 'warning' : 'info',
    data: {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating,
      metric_delta: metric.delta,
      metric_id: metric.id,
    },
  });
}

function sendToConsole(metric: WebVitalsMetric) {
  const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
  logger.info(`${emoji} [Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
}

export function reportWebVitals(onPerfEntry?: (metric: WebVitalsMetric) => void) {
  // Use the default Sentry + console reporting
  const report = onPerfEntry || ((metric) => {
    sendToSentry(metric);
    sendToConsole(metric);
  });

  onCLS(report);
  onFCP(report);
  onLCP(report);
  onTTFB(report);
  onINP(report);
}

// Export for manual usage if needed
export { sendToSentry, sendToConsole };