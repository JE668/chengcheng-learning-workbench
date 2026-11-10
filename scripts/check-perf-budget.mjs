#!/usr/bin/env node
/**
 * 首屏 JS 预算门禁。
 *
 * ## 为什么不再只看「全部 chunk 体积之和」
 * 旧实现是 `find .next/static/chunks -name '*.js' | sum`。
 * 这个数字把**所有**懒加载 chunk（游戏、图表、动态导入的模块）都加进来，
 * 任何一个孩子可能永远不打开的模块变大，都会让门禁变红；反过来，
 * 首屏真变重 200KB、但某个懒加载模块同时变小 200KB 时，它却是绿的。
 * 它和「用户打开页面要下载多少 JS」几乎不相关。
 *
 * 现在改成两层：
 *   1. **按路由首屏**：从 Next 的 app path 清单和路由客户端引用清单中
 *      还原该路由的 page / layout chunk，对核心路由逐个设上限。这是真回归信号。
 *   2. **总量兜底**：把所有 chunk 加总，只防「代码量失控翻倍」，阈值给得宽。
 *
 * ## 口径说明
 * 用的是 **uncompressed** 字节（Next 自己给出的口径），不是传输字节。
 * 它不是一个绝对性能指标，而是一条**棘轮**：只允许相对基线小幅波动，
 * 不允许悄悄变大。压缩后大小的相对变化与它基本同向。
 *
 * ## 失败策略
 * - 构建清单缺失 → 失败（fail-closed）。旧脚本在没有任何 chunk 时会算出 0 并通过，
 *   构建产物路径一变就等于门禁消失。
 * - 预算里登记的路由没出现在产物里 → 失败（路由被删/改名要显式改预算）。
 * - 清单引用的 chunk 不存在 → 失败（不把坏产物当成 0 字节）。
 * - 任何路由超预算 → 失败，并打印超出的路由与差额。
 *
 * 基线更新：确认增长是功能需要后，改 ROUTE_BUDGET_KB / STUDY_BUDGET_KB，
 * 并在提交信息里写明原因。
 *
 * Next 16 的 `route-bundle-stats.json` 只在 Turbopack 构建时写入；本项目
 * 使用 `next build --webpack`。因此这里直接读取 webpack 清单，既不会依赖
 * 诊断文件，也不会误读上一次构建留下的陈旧统计。
 */
import { statSync } from 'node:fs';
import { collectRouteStats, evaluateBudgets, walkJsFiles } from './perf-budget-lib.mjs';

const CHUNKS_DIR = '.next/static/chunks';

/**
 * 核心路由首屏预算（KB，uncompressed）。
 * 2026-11-09 笔顺数据外置后重测 + 约 4% 余量，向上取整。
 */
const ROUTE_BUDGET_KB = {
  '/': 575,
  '/home': 940,
  '/daily-practice': 830,
  '/castle': 950,
  '/login': 585,
  '/mistakes': 995,
};

/** 学习 Hub 与三科页共用同一套大体积模块（实测 1697~1703）。 */
const STUDY_BUDGET_KB = 1190;
const STUDY_ROUTES = ['/study', '/study/chinese', '/study/math', '/study/english'];

/** 所有 chunk 之和的兜底（2026-11-09 外置后重测）。 */
const TOTAL_BUDGET_KB = 4790;

function fail(lines) {
  for (const line of lines) console.error(line);
  process.exit(1);
}

const chunkFiles = walkJsFiles(CHUNKS_DIR);
if (chunkFiles.length === 0) {
  fail([`❌ ${CHUNKS_DIR} 下一个 JS chunk 都没有，构建产物不完整，按 fail-closed 判失败。`]);
}
const totalKb = chunkFiles.reduce((sum, filePath) => sum + statSync(filePath).size, 0) / 1024;

const budgets = { ...ROUTE_BUDGET_KB };
for (const route of STUDY_ROUTES) budgets[route] = STUDY_BUDGET_KB;

let result;
try {
  const stats = collectRouteStats({
    distDir: '.next',
    routes: Object.keys(budgets),
  });
  result = evaluateBudgets({
    stats,
    budgets,
    totalKb,
    totalBudgetKb: TOTAL_BUDGET_KB,
  });
} catch (error) {
  fail([
    `❌ 性能预算无法计算：${error instanceof Error ? error.message : String(error)}`,
    '   按 fail-closed 处理，不把缺失或损坏的构建清单当成通过。',
  ]);
}

console.log('核心路由首屏 JS（uncompressed）：');
console.log('  route'.padEnd(22) + 'actual'.padStart(9) + 'budget'.padStart(9) + '  headroom');
for (const r of result.rows) {
  const mark = r.kb > r.budgetKb ? '❌' : '✅';
  console.log(
    `  ${r.route.padEnd(20)}${r.kb.toFixed(0).padStart(7)}KB${r.budgetKb.toFixed(0).padStart(7)}KB  ` +
      `${(r.budgetKb - r.kb).toFixed(0).padStart(5)}KB ${mark}`
  );
}
console.log(
  `\n全部 chunk 合计：${totalKb.toFixed(0)}KB / ${TOTAL_BUDGET_KB}KB ` +
    `(${chunkFiles.length} 个文件，仅兜底，不代表首屏)`
);

const problems = [];
if (result.missing.length) {
  problems.push(
    ...result.missing.map(
      (item) => `❌ 预算登记的路由在产物中缺失：${item.route}（预算 ${item.budgetKb}KB）`
    )
  );
}
if (result.over.length) {
  problems.push(
    ...result.over.map(
      (o) =>
        `❌ ${o.route} 首屏超预算 ${o.delta.toFixed(0)}KB（${o.kb.toFixed(0)} > ${o.budgetKb}KB）`
    )
  );
}
if (result.totalOverKb > 0) {
  problems.push(
    `❌ chunk 总量超兜底预算 ${result.totalOverKb.toFixed(0)}KB` +
      `（${totalKb.toFixed(0)} > ${TOTAL_BUDGET_KB}KB）`
  );
}

if (problems.length) {
  console.error('\n' + problems.join('\n'));
  console.error(
    '\n确实需要变大时，改 scripts/check-perf-budget.mjs 的预算并在提交信息里写明原因。'
  );
  process.exit(1);
}

console.log('\n✅ 首屏 JS 预算通过');
