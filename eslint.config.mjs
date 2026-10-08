// ESLint 9 flat config。
//
// 背景：`next lint` 已废弃，并会在 Next.js 16 中被移除。这里改用官方推荐的
// ESLint CLI（迁移命令：npx @next/codemod@canary next-lint-to-eslint-cli .）。
//
// 过渡期说明：`eslint-config-next@15.5.x` 仍是 eslintrc 格式，没有导出 flat
// 入口，所以用 @eslint/eslintrc 的 FlatCompat 桥接。等 Next 16 的配置提供原生
// flat 入口后删掉 compat 这层即可 —— 直接升 Next 16 会连带改路由约定。
//
// ⚠️ pnpm 严格依赖布局：eslint-config-next 的传递依赖不在仓库 node_modules
// 顶层，不能直接 import，必须由 FlatCompat 解析。
//
// 规则覆盖面说明：`next/core-web-vitals` 只含 next/react/react-hooks 规则，
// **不含任何 @typescript-eslint 规则**（原先 .eslintrc.json 只 extends 了它，
// 所以 TS 代码此前一直只被 tsc 而非 ESLint 检查）。这里保持等价，不额外引入
// TS 规则 —— 要加的话应连同 eslint-config-next 的 TypeScript preset 一起评估。
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'public/**',
      'next-env.d.ts',
      'test-results/**',
      'playwright-report/**',
      'scripts/**',
      '*.config.{js,mjs,mts,ts}',
    ],
  },
  ...compat.extends('next/core-web-vitals'),
];