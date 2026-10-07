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
        'vitest.config.ts',
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        // E2E 由 Playwright 跑（node 环境、无 jsdom），被 v8 provider 扫到会
        // 以 0% 计入统计，纯属噪音 —— 它们本来就不该出现在单测覆盖率里。
        'tests/**',
        'src/app/**',
        'src/components/**',
        'src/middleware.ts',
        'src/lib/design-tokens.ts',
        'src/lib/stores/**',
      ],
      /**
       * 阈值贴近当前真实覆盖率（实测 statements 61.9% / functions 62.9% /
       * branches 74.9%），略微下调留出余量。
       *
       * 原先的 35/30/50 比实测值低一大截 —— 几乎任何改动都不会触发失败，
       * 等于没有守门能力。
       *
       * 注意：`src/app/**`（含全部 API 路由）仍被排除在外，因此这个数字
       * **不代表**路由层的覆盖率。路由层的回归保障靠下面这些针对性测试
       * （api-reward-guard / economy-guards / backup-credentials 等直接调用
       * 路由导出的 handler）。
       */
      thresholds: {
        lines: 58,
        functions: 58,
        branches: 70,
        statements: 58,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
