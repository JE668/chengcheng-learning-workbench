#!/usr/bin/env node
/**
 * 笔顺数据提取（2026-10-21 ⑥号内容升级）。
 * 从 hanzi-writer-data（Make Me a Hanzi 项目，字型数据源于文鼎字库）
 * 提取 CHARACTERS 全部字的笔划数据 → src/lib/study-data/strokes-data.generated.ts。
 *
 * 许可合规：数据以 APL/ARPHICPL 分发——生成文件头部保留许可声明，
 * 与依赖包内 LICENSE 文件构成完整合规链（APL 允许免费商用/修改/再分发，
 * 唯义务为随数据附许可文本）。
 *
 * 重新生成：node scripts/gen-strokes-data.mjs
 * CI 门禁：git diff --exit-code（与 moko-collection 同模式）
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const charsSrc = readFileSync(join(ROOT, 'src/lib/study-data/characters.ts'), 'utf8');
const chars = [...charsSrc.matchAll(/char: '([^']+)'/g)].map((m) => m[1]);

const out = {};
const missing = [];
for (const ch of chars) {
  const p = join(ROOT, 'node_modules/hanzi-writer-data', `${ch}.json`);
  if (!existsSync(p)) {
    missing.push(ch);
    continue;
  }
  out[ch] = JSON.parse(readFileSync(p, 'utf8'));
}

const body = `/**
 * ⚠️ 自动生成（scripts/gen-strokes-data.mjs）——不要手改。
 * 笔顺数据（strokes SVG path + medians 笔顺中线），消费方：StrokePlayer。
 * 覆盖 CHARACTERS 全部 ${Object.keys(out).length} 字${missing.length ? `（缺 ${missing.join('')}）` : ''}。
 *
 * 许可声明：字型数据来自 Make Me a Hanzi 项目 / hanzi-writer-data，
 * 原始字型版权属 Arphic Technology Co. Ltd，依 Arphic Public License
 *（APL）分发——允许免费商用、修改与再分发，本文件即「随数据附许可」
 * 之义履。完整许可文本见 node_modules/hanzi-writer-data/ARPHICPL.TXT
 * 与仓库 docs/ARPHICPL.txt。详见 https://github.com/chanind/hanzi-writer-data
 */
export const STROKES_DATA: Record<string, { strokes: string[]; medians: number[][][]; radStrokes?: number[] }> = ${JSON.stringify(out)};
`;

const dest = join(ROOT, 'src/lib/study-data/strokes-data.generated.ts');
writeFileSync(dest, body);
console.log(`生成 ${dest}：${Object.keys(out).length} 字${missing.length ? `，缺 ${missing.join('')}` : ''}，体积 ${(body.length / 1024).toFixed(0)}KB`);
