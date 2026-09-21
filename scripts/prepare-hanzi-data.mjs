/**
 * 生成 hanzi-writer 本地笔顺数据（public/hanzi/*.json）。
 *
 * 背景：hanzi-writer 默认从 https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/<字>.json
 * 拉取笔画数据；该 CDN 在国内网络下经常不可达，表现为「点笔顺没反应」。
 * 本脚本把学习数据里用到的汉字对应的 json 从 hanzi-writer-data 包拷到 public/hanzi/，
 * 运行时同源加载，离网 / 内网 NAS 部署也可用。
 *
 * 用法：pnpm run prepare-hanzi（新增生字后重跑一次即可）
 */
import { readdirSync, readFileSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'node_modules/hanzi-writer-data');
const OUT_DIR = join(ROOT, 'public/hanzi');

// 收集学习数据里出现的所有汉字（含多音字、组词里的字，宁多勿漏）
const SRC_FILES = [
  join(ROOT, 'src/lib/study-data.ts'),
  ...readdirSync(join(ROOT, 'src/lib/study-data'))
    .filter((f) => f.endsWith('.ts'))
    .map((f) => join(ROOT, 'src/lib/study-data', f)),
];

const chars = new Set();
const CJK = /[㐀-鿿豈-﫿]/g;
for (const file of SRC_FILES) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(CJK)) chars.add(m[0]);
}

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

let copied = 0;
let missing = 0;
for (const ch of chars) {
  const src = join(DATA_DIR, `${ch}.json`);
  if (!existsSync(src)) {
    missing++;
    console.warn(`⚠️  hanzi-writer-data 无此字笔画数据：${ch}`);
    continue;
  }
  writeFileSync(join(OUT_DIR, `${ch}.json`), readFileSync(src));
  copied++;
}

// 清理已不在学习数据里的旧文件
for (const f of readdirSync(OUT_DIR)) {
  if (f.endsWith('.json') && !chars.has(f.slice(0, -5))) {
    rmSync(join(OUT_DIR, f));
  }
}

console.log(`✅ 已生成 ${copied} 个笔顺数据文件 → public/hanzi/${missing ? `（${missing} 字无数据，见上方警告）` : ''}`);
