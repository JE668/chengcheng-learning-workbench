// ESLint 9 flat config。
//
// 背景：`next lint` 已废弃，并会在 Next.js 16 中被移除。改用官方推荐的 ESLint CLI
//（迁移命令：npx @next/codemod@canary next-lint-to-eslint-cli .）。
//
// 过渡期说明：`eslint-config-next@15.5.x` 仍是 eslintrc 格式，没有导出 flat
// 入口，所以用 @eslint/eslintrc 的 FlatCompat 桥接。等 Next 16 的配置提供原生
// flat 入口后删掉 compat 这层即可 —— 直接升 Next 16 会连带改路由约定。
//
// ⚠️ pnpm 严格依赖布局：eslint-config-next 的传递依赖不在仓库 node_modules
// 顶层，不能直接 import，必须由 FlatCompat 解析。
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

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
  ...tseslint.configs.recommended,
  {
    rules: {
      // 未使用变量。
      //
      // `args: 'none'` —— Next 的 route handler 签名是框架约定的
      //（export async function POST(req: Request)），参数即使当前实现用不到也必须
      // 保留在签名里，这类不是死代码。
      //
      // `caughtErrors: 'none'` —— TS 的 useUnknownInCatchVariables 下 catch 里的
      // error 一律会被报，与 tsc 的实际判断不一致，纯噪音。
      //
      // ⚠️ 这条规则**不做自动修复**是刻意的：仓库里存在「变量看似未用、实则带副作用」
      // 的表达式（`const r = await db.execute({ sql: 'INSERT ...' })` 靠 await 产生副作用，
      // `const poor = await insertCastle2(cid)` 用来把阳光清零）。批量删除这类代码会
      // 静默改变行为 —— 清理过程中就曾因此挂掉 4 个测试。所以存量靠人工逐条判定，
      // 判定为「有意保留」的在本文件下方单独列出。
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'none',
          caughtErrors: 'none',
          ignoreRestSiblings: true,
        },
      ],
      // `any` 在本仓库有大量既有使用（主要是 db 行与第三方库的动态数据）。
      // 一次性收紧会把 CI 卡住，而 strict tsc 已在类型层面把关。待存量清零后再启用。
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // 测试文件：断言里用 any 常见；E2E 用 _ 前缀作占位参数。
    files: ['**/*.test.ts', '**/*.test.tsx', 'tests/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // ── 人工判定为「有意保留」的未使用符号 ──
    // 每一组都写明理由。新增豁免时请一并写清楚为什么不能删。
    files: [
      // ① 写了一半的功能：setter 已调用，但值从未被读取，UI 尚未接上。
      'src/components/study/ChildTaskList.tsx', // finishing
      'src/components/study/ChineseModules.tsx', // reciteText
      'src/components/study/StudyQuiz.tsx', // displayStars / initialRounds / initialLastPlayed
      'src/lib/module-progress.ts', // loaded
      'src/app/api/tts-edge/route.ts', // pause
      'src/app/tts-diag/page.tsx', // isMobile
      'src/app/(child)/home/page.tsx', // ownedCount
      'src/app/(child)/record/page.tsx', // todayKey
      'src/app/(child)/study/StudyClient.tsx', // ReviewBadge / textColor
      'src/app/(child)/algorithm/page.tsx', // Link
      'src/app/(child)/algorithm/**/practice/**/page.tsx', // stars / finalStars
      // ② 接口契约：入参已接收但逻辑尚未使用（该路由目前也无 UI 调用方）。
      'src/app/api/ai/generate/route.ts', // subject / excludeIds 未拼进 prompt
      'src/app/api/castle/use-item/route.ts', // subject
      'src/app/api/push/test/route.ts', // 调试参数
      // ③ 可读性：先取出当前值便于与后续计算对比，保留。
      'src/lib/sm2.ts', // repetitions / interval / nextReview
      'src/lib/mistakes.ts', // currentEasiness / currentReps / currentInterval
      'src/lib/daily-practice/gen-english.ts', // answer
      'src/lib/daily-practice/gen-math.ts', // answer
      'src/lib/castle.ts', // row
      'src/components/study/Idiom.tsx', // displayIdiom
      'src/app/(child)/study/page.tsx', // Rec（旧结构，已被 STUDY_MODULES 取代）
      // ④ 测试文件里刻意「执行但不留变量」的写法：靠 await/调用的副作用就是要的。
      //    典型如 `const r = await db.execute(INSERT ...)`（靠 await 产生副作用）、
      //    `const before = await db.execute(...)`（先取旧值做对比但断言里没直接用）。
      //    删掉会让测试失去本来的效果 —— 清理时曾因此挂掉 4 个测试。
      'src/lib/approve-timeglass-date.test.ts',
      'src/lib/castle.test.ts',
      'src/lib/csrf-middleware.test.ts',
      'src/lib/daily-practice/english.test.ts',
      'src/lib/progress-store.test.ts',
      'src/lib/reward.test.ts',
      'src/lib/story.test.ts',
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
