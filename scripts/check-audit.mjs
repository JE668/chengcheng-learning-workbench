#!/usr/bin/env node
/**
 * 依赖安全门禁：解析 `pnpm audit --json` 的输出，阻断 high/critical 漏洞。
 *
 * 用法：node scripts/check-audit.mjs [audit-report.json]
 *
 * 为什么用 Node 而不是 jq：
 *   1) 原实现依赖 runner 上的 jq；换成 Node（CI 里 setup-node 已就绪）少一个隐式依赖，
 *      而且可以在本地精确复现同一段判定逻辑。
 *   2) **fail-closed**：报告缺失 / 解析失败 / 结构变化一律判为失败。
 *      原 jq 版是 fail-open —— 报告坏掉时 jq 报错 → 变量为空 → 比较失败 → 走 else 静默通过，
 *      等于「门禁自己坏掉时自动失效」。
 */
import { readFileSync } from 'node:fs';

/**
 * 已知豁免：**最新版本就带 high/critical、且没有任何可用修复版本**的包。
 * 每条都必须写清「为什么没有修复版本」与「何时重新评估」，避免变成无脑放行。
 */
const ACCEPTED = new Map([
  [
    'next',
    '14.x 分支的全部 advisory，补丁只在 15.5.x+ 发布；升级需同步 React 18→19。重新评估：升级 Next 15 后。',
  ],
  [
    'braces',
    '最新版即 3.0.3，advisory 覆盖 <=3.0.3 且 patched_versions 为空；它只出现在 devDependencies（tailwindcss / lint-staged / fast-glob），不进生产镜像。重新评估：braces 发布 3.0.4+ 后。',
  ],
]);

const file = process.argv[2] || 'audit-report.json';

let report;
try {
  report = JSON.parse(readFileSync(file, 'utf8'));
} catch (e) {
  console.error('❌ 无法读取/解析 audit 报告（' + file + '）：' + (e instanceof Error ? e.message : e));
  console.error('   按 fail-closed 处理：判为失败。');
  process.exit(1);
}

const advisories = report?.advisories;
if (!advisories || typeof advisories !== 'object') {
  console.error('❌ audit 报告缺少 advisories 字段（pnpm 输出格式可能已变化），按 fail-closed 判为失败。');
  process.exit(1);
}

const all = Object.values(advisories).filter(
  (a) => a && (a.severity === 'high' || a.severity === 'critical')
);
const accepted = all.filter((a) => ACCEPTED.has(a.module_name));
const actionable = all.filter((a) => !ACCEPTED.has(a.module_name));

console.log('high/critical 漏洞：待修复 ' + actionable.length + ' 个，已知豁免 ' + accepted.length + ' 个');
for (const name of new Set(accepted.map((a) => a.module_name))) {
  console.log('  · 豁免 ' + name + ' —— ' + ACCEPTED.get(name));
}

if (actionable.length > 0) {
  console.error('❌ Found ' + actionable.length + ' high/critical vulnerabilities (excl. accepted advisories)');
  for (const a of actionable) {
    console.error('  - ' + a.module_name + ' [' + a.severity + '] ' + a.title + ' ' + (a.url ?? ''));
  }
  process.exit(1);
}

console.log('✅ No actionable high/critical vulnerabilities');
