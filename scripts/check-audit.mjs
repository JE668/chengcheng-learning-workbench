#!/usr/bin/env node
/**
 * 依赖安全门禁：解析 `pnpm audit --json` 的输出，阻断 high/critical 漏洞。
 *
 * 用法：node scripts/check-audit.mjs [audit-report.json]
 *
 * ## 判定规则（核心）
 *
 * 1. **只阻断「存在可用修复版本」的 high/critical**。
 *    没有补丁版本的 advisory，开发者**无论如何也修不了** —— 阻断流水线并不降低风险，
 *    只会让你连其它修复都发不出去（本项目已经因此两次停摆：next 卡了 4 天、braces 断了一次）。
 *    无补丁的仍会**显式打印**出来提醒，但不阻断。
 *    一旦上游发布补丁，该 advisory 会**自动**变成阻断项 —— 这正是我们想要的行为，
 *    不需要维护任何白名单。
 * 2. 白名单只用于「**有**补丁、但当前分支用不上」的包（例如 next 14.x：补丁只在 15.x）。
 * 3. **fail-closed**：报告缺失 / 解析失败 / 结构变化一律判为失败。
 *    （原 jq 实现是 fail-open —— 报告坏掉时 jq 报错 → 变量为空 → 静默通过。）
 */
import { readFileSync } from 'node:fs';

/**
 * 「有补丁但不适用于当前分支」的豁免。**只放这一种情况**，且必须写明重新评估时机。
 * 无补丁的包不需要写在这里（见判定规则 1）。
 */
const ACCEPTED = new Map([
  [
    'next',
    'next 14.x 的 advisory 有补丁，但补丁只在 15.5.x+ 发布；升级需同步 React 18→19，属独立任务。重新评估：升级 Next 15 后。',
  ],
]);

/** pnpm/npm 用 patched_versions 表示补丁范围；"<0.0.0" 表示「没有可用补丁」。 */
function hasFix(advisory) {
  const patched = String(advisory?.patched_versions ?? '').trim();
  return patched !== '' && patched !== '<0.0.0';
}

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

const highCritical = Object.values(advisories).filter(
  (a) => a && (a.severity === 'high' || a.severity === 'critical')
);
const noFix = highCritical.filter((a) => !hasFix(a));
const fixable = highCritical.filter(hasFix);
const accepted = fixable.filter((a) => ACCEPTED.has(a.module_name));
const actionable = fixable.filter((a) => !ACCEPTED.has(a.module_name));

console.log(
  'high/critical 漏洞：可修复待处理 ' + actionable.length + ' 个，' +
  '已知豁免 ' + accepted.length + ' 个，' +
  '无可用修复 ' + noFix.length + ' 个（仅告警，不阻断）'
);
for (const name of new Set(accepted.map((a) => a.module_name))) {
  console.log('  · 豁免 ' + name + ' —— ' + ACCEPTED.get(name));
}
for (const a of noFix) {
  console.log('  ! 无补丁：' + a.module_name + ' [' + a.severity + '] ' + a.title + ' ' + (a.url ?? ''));
}
if (noFix.length > 0) {
  console.log('  （上游一旦发布补丁，这些会自动变成阻断项，届时按提示升级即可）');
}

if (actionable.length > 0) {
  console.error('❌ Found ' + actionable.length + ' fixable high/critical vulnerabilities (excl. accepted)');
  for (const a of actionable) {
    console.error('  - ' + a.module_name + ' [' + a.severity + '] ' + a.title + ' ' + (a.url ?? ''));
    console.error('    可修复到：' + a.patched_versions);
  }
  process.exit(1);
}

console.log('✅ No actionable (fixable) high/critical vulnerabilities');
