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
 *   1. **按路由首屏**：读 Next 构建产物 `.next/diagnostics/route-bundle-stats.json`
 *      的 `firstLoadUncompressedJsBytes`，对核心路由逐个设上限。这是真回归信号。
 *   2. **总量兜底**：把所有 chunk 加总，只防「代码量失控翻倍」，阈值给得宽。
 *
 * ## 口径说明
 * 用的是 **uncompressed** 字节（Next 自己给出的口径），不是传输字节。
 * 它不是一个绝对性能指标，而是一条**棘轮**：只允许相对基线小幅波动，
 * 不允许悄悄变大。压缩后大小的相对变化与它基本同向。
 *
 * ## 失败策略
 * - 统计文件缺失 → 失败（fail-closed）。旧脚本在没有任何 chunk 时会算出 0 并通过，
 *   构建产物路径一变就等于门禁消失。
 * - 预算里登记的路由没出现在产物里 → 失败（路由被删/改名要显式改预算）。
 * - 任何路由超预算 → 失败，并打印超出的路由与差额。
 *
 * 基线更新：确认增长是功能需要后，改 ROUTE_BUDGET_KB / STUDY_BUDGET_KB，
 * 并在提交信息里写明原因。
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CHUNKS_DIR = '.next/static/chunks';
const STATS_FILE = '.next/diagnostics/route-bundle-stats.json';

/**
 * 核心路由首屏预算（KB，uncompressed）。
 * 2026-11-08 实测值 + 约 5% 余量，取整：
 *   /                508
 *   /home            860
 *   /daily-practice  769
 *   /castle          870
 *   /login           549
 *   /mistakes       1493
 */
const ROUTE_BUDGET_KB = {
  '/': 560,
  '/home': 900,
  '/daily-practice': 810,
  '/castle': 915,
  '/login': 580,
  '/mistakes': 1570,
};

/** 学习 Hub 与三科页共用同一套大体积模块，单独留更宽的余量（实测 1664~1670）。 */
const STUDY_BUDGET_KB = 1755;
const STUDY_ROUTES = ['/study', '/study/chinese', '/study/math', '/study/english'];

/** 所有 chunk 之和的兜底（2026-11-08 实测 5097KB）。 */
const TOTAL_BUDGET_KB = 5300;

function fail(lines) {
  for (const line of lines) console.error(line);
  process.exit(1);
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (st.isFile() && p.endsWith('.js')) out.push({ path: p, bytes: st.size });
  }
  return out;
}

if (!existsSync(STATS_FILE)) {
  fail([
    `❌ 找不到 ${STATS_FILE}`,
    '   按 fail-closed 处理：没有统计数据就不算通过预算。',
    '   这通常意味着 Next 版本变了、产物布局变了，或 build 没跑成。',
    '   先确认构建成功，再按新产物路径修改本脚本（不要直接删掉这项检查）。',
  ]);
}

const chunks = walk(CHUNKS_DIR);
if (chunks.length === 0) {
  fail([`❌ ${CHUNKS_DIR} 下一个 JS chunk 都没有，构建产物不完整，按 fail-closed 判失败。`]);
}
const totalKb = chunks.reduce((s, f) => s + f.bytes, 0) / 1024;

const stats = JSON.parse(readFileSync(STATS_FILE, 'utf8'));
if (!Array.isArray(stats)) {
  fail([
    `❌ ${STATS_FILE} 结构变化：期望数组，实际 ${typeof stats}。`,
    '   按 fail-closed 判失败。',
  ]);
}

const budgets = [
  ...STUDY_ROUTES.map((r) => [r, STUDY_BUDGET_KB]),
  ...Object.entries(ROUTE_BUDGET_KB),
];
const rows = [];
const missing = [];
const over = [];

for (const [route, budgetKb] of budgets) {
  const hit = stats.find((r) => r.route === route);
  if (!hit || typeof hit.firstLoadUncompressedJsBytes !== 'number') {
    missing.push(`${route}（预算 ${budgetKb}KB）`);
    continue;
  }
  const kb = hit.firstLoadUncompressedJsBytes / 1024;
  rows.push({ route, kb, budgetKb });
  if (kb > budgetKb) over.push({ route, kb, budgetKb, delta: kb - budgetKb });
}

rows.sort((a, b) => b.kb - a.kb);
console.log('核心路由首屏 JS（uncompressed）：');
console.log('  route'.padEnd(22) + 'actual'.padStart(9) + 'budget'.padStart(9) + '  headroom');
for (const r of rows) {
  const mark = r.kb > r.budgetKb ? '❌' : '✅';
  console.log(
    `  ${r.route.padEnd(20)}${r.kb.toFixed(0).padStart(7)}KB${r.budgetKb.toFixed(0).padStart(7)}KB  ` +
      `${(r.budgetKb - r.kb).toFixed(0).padStart(5)}KB ${mark}`
  );
}
console.log(
  `\n全部 chunk 合计：${totalKb.toFixed(0)}KB / ${TOTAL_BUDGET_KB}KB ` +
    `(${chunks.length} 个文件，仅兜底，不代表首屏)`
);

const problems = [];
if (missing.length) {
  problems.push(...missing.map((m) => `❌ 预算登记的路由在产物中缺失：${m}`));
}
if (over.length) {
  problems.push(
    ...over.map(
      (o) =>
        `❌ ${o.route} 首屏超预算 ${o.delta.toFixed(0)}KB（${o.kb.toFixed(0)} > ${o.budgetKb}KB）`
    )
  );
}
if (totalKb > TOTAL_BUDGET_KB) {
  problems.push(
    `❌ chunk 总量超兜底预算 ${(totalKb - TOTAL_BUDGET_KB).toFixed(0)}KB` +
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
