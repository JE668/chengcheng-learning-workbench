#!/usr/bin/env node
/**
 * 笔顺数据覆盖校验（2026-11-09 性能优化）。
 * 数据已外置为 public/hanzi/*.json，来源仍是 hanzi-writer-data
 *（Make Me a Hanzi 项目，字型数据源于文鼎字库）。
 * 校验 public/hanzi/ 是否覆盖 CHARACTERS 全部字的笔划数据。
 *
 * 许可合规：数据以 APL/ARPHICPL 分发——生成文件头部保留许可声明，
 * 与依赖包内 LICENSE 文件构成完整合规链（APL 允许免费商用/修改/再分发，
 * 唯义务为随数据附许可文本）。
 *
 * 生成基础数据：pnpm prepare-hanzi
 * 校验覆盖：node scripts/gen-strokes-data.mjs
 * CI 门禁：任何 CHARACTERS 缺数据都会 fail-closed。
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const charsSrc = readFileSync(join(ROOT, 'src/lib/study-data/characters.ts'), 'utf8');
const chars = [...charsSrc.matchAll(/char: '([^']+)'/g)].map((m) => m[1]);
const missing = chars.filter(
  (ch) => !existsSync(join(ROOT, 'public/hanzi', `${ch}.json`))
);

if (missing.length) {
  console.error(`❌ public/hanzi 缺 ${missing.length} 字：${missing.join('')}`);
  process.exit(1);
}

console.log(`✅ public/hanzi 覆盖 CHARACTERS 全部 ${chars.length} 字`);
