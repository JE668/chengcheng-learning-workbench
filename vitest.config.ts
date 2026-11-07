import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(process.cwd(), 'src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      /**
       * 显式声明统计范围。
       *
       * Vitest 4 移除了 `coverage.all`，**默认只统计测试运行期间加载过的文件**。
       * 不写 `include` 的话，报告范围取决于「哪个文件被 import 过」——
       * 同一个阈值在不同机器/不同执行顺序下会得到不同数字，失去守门意义。
       * 这里把范围钉死为 src 下的业务代码，与下面的 exclude 配合使用。
       */
      include: ['src/**/*.{ts,tsx}'],
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
       * 阈值贴近当前真实覆盖率，下调若干留出余量。
       * 2026-11-08 实测：statements 75.48 / branches 65.08 /
       * functions 62.54 / lines 80.87（补齐 auth / backup / cert /
       * daily-practice/gen-math / speak 的关键路径后整体上了 7~8 个点）。
       *
       * ## 为什么数字比 Vitest 3 时代低
       * 两处叠加，都不是代码退化：
       * ① **V8 provider 换成 AST 精确分析**（原先 v8-to-istanbul 重映射存在虚高）；
       * ② **统计范围显式钉死**：v3 没有 `coverage.all`，只统计「测试运行中被
       *    import 过的文件」；加上 include 后全部文件一并纳入统计，
       *    当时有 18 个文件 functions 覆盖率为 0%（auth / backup / cert 等），
       *    v3 的 functions 65.66% 之所以好看，是因为这些文件压根没被算进去。
       *    这几个 0% 的模块后来逐补上了直接单测，**阈值也随之抬到接近实测**，
       *    否则「阈值远低于现状」等于没有门禁 —— 覆盖率掉了十几个点照样绿。
       *
       * 显式 include 是刻意选择：不写的话，统计范围取决于「哪个文件被
       * import 过」，同一份阈值在不同执行顺序下会得到不同数字，守门意义
       * 尽失。宁可让数字难看且稳定。
       *
       * 历史沿革：最初 35/30/50 → 按 v3 实测收紧到 58/58/70 → 现按
       * v5 的 AST 口径重定为下列值 → 2026-11-07 按补齐关键路径后的实测整体上移。
       *
       * ## 怎么提升
       * 当前 src/app/**（含全部 58 个 API 路由）与 src/components/** 被排除
       * 在外，**不代表**它们的覆盖率。路由层靠针对性测试直接调用导出的
       * handler 来保障（api-reward-guard / economy-guards / backup-credentials /
       * children-validation 等）；组件层靠 quiz-options-stability 等渲染测试。
       * 想让数字反映全部代码，需先补这些层的直接单测，再考虑放宽 exclude。
       *
       * ## 抬阈值前先确认口径没变
       * 改 exclude / include 会让数字跳变（可能一夜之间"覆盖率暴跌"或虚高），
       * 那种跳变不是代码变好/变坏，先在新口径下重测再定阈值。
       */
      thresholds: {
        lines: 74,
        functions: 56,
        branches: 58,
        statements: 68,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
