#!/usr/bin/env node
/**
 * 音频清单-落盘一致性校验（对齐 check-media 模式，2026-10-18 B0）。
 *
 * 背景：speak.ts 的第 0 层按「清单文件名」直接播 /audio/zh|en/xxx.mp3，
 * 内容源更新（加汉字/单词/诗句）后忘了重跑 scripts/gen-audio.mjs，
 * 就会出现「页面正常、朗读静默降级」——不报错但体验回退，比 404 更隐蔽。
 * 本脚本以 audio-manifest.mjs 为唯一事实源校验 public/audio 落盘完整。
 *
 * 用法：
 *   node scripts/check-audio.mjs                # 校验仓库内 public/audio
 *   node scripts/check-audio.mjs <目录>         # 校验 NAS 挂载目录（含 audio/zh、audio/en）
 *   pnpm check-audio
 *
 * CI（precheck）与本脚本同源：内容一变清单变，校验自动红。
 */
import { existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractAudioManifest, audioFileName } from './audio-manifest.mjs';
import { extractStoryAudioList } from './story-audio-manifest.mjs';
import { extractMokoPhrases } from './moko-phrases-manifest.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const audioRoot = process.argv[2]
  ? join(process.argv[2].replace(/\/+$/, ''), 'audio')
  : join(ROOT, 'public', 'audio');
// 与 gen-audio 同源合并：教材静态清单 + 故事全文（esbuild 真实运行抽取）
const manifest = extractAudioManifest();
const story = await extractStoryAudioList();
const mokoPhrases = extractMokoPhrases();
const merged = [...manifest.zh, ...story.zh, ...mokoPhrases].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
const seen = new Set();
manifest.zh = merged.filter((t) => (seen.has(t) ? false : (seen.add(t), true)));
let missing = 0;
let empty = 0;
let totalSize = 0;
const misses = [];

for (const lang of ['zh', 'en']) {
  for (const text of manifest[lang]) {
    const file = join(audioRoot, lang, audioFileName(text));
    if (!existsSync(file)) {
      missing++;
      if (misses.length < 10) misses.push(`缺 ${lang}/${audioFileName(text)} ← "${text.slice(0, 20)}"`);
      continue;
    }
    const size = statSync(file).size;
    if (size < 1024) {
      empty++;
      if (misses.length < 10) misses.push(`疑空 ${lang}/${audioFileName(text)}（${size}B）`);
    }
    totalSize += size;
  }
}

// 落盘多余文件检测（清单外的孤儿）：不报错（旧内容残留无害），只提示
let orphans = 0;
for (const lang of ['zh', 'en']) {
  const dir = join(audioRoot, lang);
  if (!existsSync(dir)) continue;
  const expected = new Set(manifest[lang].map((t) => audioFileName(t)));
  for (const f of readdirSync(dir)) {
    if (!expected.has(f)) orphans++;
  }
}

console.log(`清单：zh ${manifest.zh.length} + en ${manifest.en.length} 条`);
console.log(`落盘目录：${audioRoot}`);
console.log(`总体积：${(totalSize / 1024 / 1024).toFixed(1)} MB`);
if (missing || empty) {
  console.log(`\n❌ 缺失 ${missing} 个，疑似空文件 ${empty} 个：`);
  misses.forEach((m) => console.log('  ' + m));
  console.log('\n修复：node scripts/gen-audio.mjs（增量只补缺失的）');
  process.exit(1);
}
if (orphans > 0) console.log(`提示：${orphans} 个清单外旧文件（无害，--force 重生成可清理）`);
console.log('✅ 音频资产完整');
