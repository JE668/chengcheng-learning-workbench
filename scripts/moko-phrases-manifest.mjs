#!/usr/bin/env node
/**
 * 萌可语音静态清单（2026-10-20 弱网加固 · 萌可台词预生成）。
 *
 * 「萌可说的话」全部是写死在代码里的固定文案（四类来源）：
 *   1. speak.ts PRAISES（通用表扬 7 条）
 *   2. MokoPraise 三科 correct/wrong 台词（27 条 + 学科名等短串）
 *   3. MokoHelper DEFAULT_TIPS（三科默认提示 9 条）
 *   4. 各页面 tips={...} 内联提示（11 条）
 *
 * 网络稍差时这些台词走服务端合成就播不出来——全部预生成 MP3 后
 * 走本地文件（与故事段落同管线）。
 *
 * 提取方式：正则扫源码（都是简单 '...' 字面量，无模板拼接——与故事
 * 的 autoChapters 不同，这里不需要 esbuild 真实运行）。
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

function dedupeSorted(arr) {
  return [...new Set(arr)].filter(Boolean).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function extractMokoPhrases() {
  const out = [];

  // ① speak.ts PRAISES
  const speak = read('src/lib/speak.ts');
  const m1 = speak.match(/const PRAISES = \[([\s\S]*?)\];/);
  if (m1) out.push(...(m1[1].match(/'([^']+)'/g) ?? []).map((x) => x.slice(1, -1)));

  // ② MokoPraise：correct/wrong 数组（限定中文句长 6-40，滤掉类名/img 路径等噪声）
  const praise = read('src/components/study/MokoPraise.tsx');
  for (const m of praise.matchAll(/(?:correct|wrong):\s*\[([\s\S]*?)\]/g)) {
    for (const p of (m[1].match(/'([^']{6,40})'/g) ?? []).map((x) => x.slice(1, -1))) {
      if (/[\u4e00-\u9fa5]/.test(p)) out.push(p);
    }
  }

  // ③ MokoHelper DEFAULT_TIPS
  const helper = read('src/components/MokoHelper.tsx');
  const m3 = helper.match(/DEFAULT_TIPS[\s\S]*?\n\};/);
  if (m3) {
    for (const p of (m3[0].match(/'([^']{6,60})'/g) ?? []).map((x) => x.slice(1, -1))) {
      if (/[\u4e00-\u9fa5]/.test(p)) out.push(p);
    }
  }

  // ④ 页面内联 tips={[...]}
  for (const f of [
    'src/app/(child)/textbook/page.tsx',
    'src/app/(child)/study/eye/page.tsx',
    'src/app/(child)/study/StudyClient.tsx',
    'src/app/(child)/my-tasks/page.tsx',
  ]) {
    const s = read(f);
    const idx = s.indexOf('tips={');
    if (idx < 0) continue;
    const seg = s.slice(idx, idx + 600);
    for (const p of (seg.match(/'([^']{6,60})'/g) ?? []).map((x) => x.slice(1, -1))) {
      if (/[\u4e00-\u9fa5]/.test(p)) out.push(p);
    }
  }

  // ⑤b 错题重练的捣蛋叙事（daily-practice 写死的两句——同样走
  // 「萌可名说：」拼接模板，必须在 assembled 计算之前入列。
  // ⚠️ 首版把 push 写在 assembled 之后导致这两句没拼接进静态集——
  // check-audio 只校验清单本身，跨清单的组合缺口靠播放实测抓。）
  out.push('捣蛋萌可被送回家啦，这个知识点归你了！');
  out.push('哎呀，捣蛋萌可又溜回来了！再想一想，把它捉住！');

  // ⑤ 播放侧拼接模板的产物（与 daily-practice/StudyQuiz 的实际播放
  // 文本逐字一致——「萌可名说：台词 + 口头禅」）。预生成必须按
  // 最终播放文本生成，否则 L0 永远 miss（与故事 autoChapters 同理：
  // 生成物必须与播放物同源）。
  const NAMES = ['爱心萌可', '正正萌可', '唱唱萌可'];
  const SIGNS = { '爱心萌可': '啾～', '正正萌可': '哈哈！', '唱唱萌可': '啦啦啦～' };
  const assembled = [];
  for (const t of out) {
    for (const n of NAMES) {
      assembled.push(`${n}说：${t}`);
      assembled.push(`${n}说：${t} ${SIGNS[n]}`);
    }
  }

  return dedupeSorted([...out, ...assembled]);
}

if (process.argv[1] && process.argv[1].endsWith('moko-phrases-manifest.mjs')) {
  const list = extractMokoPhrases();
  console.log(`萌可语音静态集: ${list.length} 条`);
  if (process.argv.includes('--list')) list.forEach((t) => console.log(' ', t));
}
