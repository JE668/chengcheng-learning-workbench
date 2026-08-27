import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(process.cwd(), 'src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '.next/**',
        'out/**',
        'storybook-static/**',
        'coverage/**',
        'test-results/**',
        '*.config.*',
        '*.config.ts',
        '*.config.mjs',
        '*.config.js',
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/app/**',
        'src/components/**',
        'src/middleware.ts',
        'src/lib/design-tokens.ts',
        'src/env.mjs',
        'src/lib/repos/**',
        'src/lib/stores/**',
        'src/lib/tts/**',
        'src/lib/db/**',
        'src/lib/dal/**',
      ],
      thresholds: {
        lines: 35,
        functions: 30,
        branches: 50,
        statements: 35,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
