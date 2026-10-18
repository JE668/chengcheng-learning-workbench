#!/usr/bin/env node
/**
 * 音频清单提取（预生成 TTS 的唯一事实源）。
 *
 * 设计（与 check-media 同思路）：直接正则读 TS 数据源码，零运行时依赖，
 * Node 原生可跑——生成脚本（gen-audio.mjs）与校验脚本（check-audio.mjs）
 * 共用这一份，保证「生成的清单 == 校验的清单」永不漂移。
 *
 * 音频条目三类：
 *   zh: 汉字（听写/识字题的朗读内容 = CHARACTERS.char）
 *   zh: 拼音例字（拼音题的 audioText 是带调音节如 mā——edge-tts 念不准拼音，
 *       播放层已改为「念例字」，清单即 PINYIN_TONES 展开的四声代表字 + PINYIN_HAN 代表字）
 *   en: 英语单词（ALL_EN_WORDS.word，含 RAZ 词）
 *   zh: 古诗整句（PoemModule/genPoemQ 的朗读内容是 lines 单句）
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

/** 去重 + 排序，保证清单稳定（顺序变化不应触发全量重新生成） */
function dedupeSorted(arr) {
  return [...new Set(arr)].filter(Boolean).sort((a, b) => a.localeCompare(b));
}

export function extractAudioManifest() {
  const zh = [];
  const en = [];

  // ① 汉字：CHARACTERS 的 char 字段（听写题/识字题念的内容）
  const charsSrc = read('src/lib/study-data/characters.ts');
  for (const m of charsSrc.matchAll(/\{\s*char:\s*'([^']+)'/g)) zh.push(m[1]);

  // ② 拼音例字：PINYIN_TONES 的四声代表字（数组字面量 ['啊','啊','阿','啊']）
  //    + PINYIN_HAN 的代表字（'a': '啊' 的值侧）。
  //    ⚠️ 值必须限定 [\u4e00-\u9fa5]：pinyin.ts 里还有 applyTone 产物的拼音字符
  //    （à/á/é 之类）也会被 '...' 字面量匹配到——那些不是要合成的汉字。
  const pinyinSrc = read('src/lib/study-data/pinyin.ts');
  // PINYIN_TONES 的四声代表字：['啊','啊','阿','啊']。⚠️ 数组元素限定汉字——
  // pinyin.ts:184 还有一份「声调演示」a: ['ā','á','ǎ','à']（带调字母，非朗读内容，
  // 播放层从不 TTS 它们），同构数组字面量会撞上这个正则。
  for (const m of pinyinSrc.matchAll(/\[\s*'([\u4e00-\u9fa5]*)'\s*,\s*'([\u4e00-\u9fa5]*)'\s*,\s*'([\u4e00-\u9fa5]*)'\s*,\s*'([\u4e00-\u9fa5]*)'\s*\]/g)) {
    zh.push(m[1], m[2], m[3], m[4]);
  }
  const hanBlock = pinyinSrc.slice(pinyinSrc.indexOf('PINYIN_HAN: Record'));
  for (const m of hanBlock.matchAll(/:\s*'([\u4e00-\u9fa5]+)'/g)) zh.push(m[1]);
  // PINYIN_TIPS 的 example 例字（声调口诀里的 妈/麻/马/骂，拼音模块朗读用）
  for (const m of pinyinSrc.matchAll(/example:\s*\[([^\]]+)\]/g)) {
    for (const w of m[1].matchAll(/'([\u4e00-\u9fa5])'/g)) zh.push(w[1]);
  }

  // ③ 古诗：POEMS 的 lines 单句（朗读按句）
  const poemsSrc = read('src/lib/study-data/poems.ts');
  for (const m of poemsSrc.matchAll(/lines:\s*\[([^\]]+)\]/g)) {
    for (const line of m[1].matchAll(/'([^']+)'/g)) zh.push(line[1]);
  }

  // ④ 英语单词：ALL_EN_WORDS 由 EN_WORD_TOPICS 聚合，word 字段直接抓 study-data-en.ts
  const enSrc = read('src/lib/study-data-en.ts');
  for (const m of enSrc.matchAll(/word:\s*'([^']+)'/g)) en.push(m[1]);
  // LETTERS 的单词（Apple/Ball...首字母题朗读用）
  for (const m of enSrc.matchAll(/\{\s*letter:\s*'[A-Z]',\s*word:\s*'([^']+)'/g)) en.push(m[1]);

  return {
    zh: dedupeSorted(zh),
    en: dedupeSorted(en),
  };
}

/**
 * 文件名规则：URL 安全 + 稳定。中文/特殊字符 → encodeURIComponent 再把
 * 不安全字符替换掉（encodeURIComponent 的输出全是安全字符，直接当文件名）。
 * 与 speak.ts 的 localAudioUrl() 必须保持同一实现（那边同样算法拼 URL）。
 */
export function audioFileName(text) {
  const enc = encodeURIComponent(text).replace(/[()*!']/g, (c) =>
    ({ '(': '%28', ')': '%29', '*': '%2A', '!': '%21', "'": '%27' }[c] || c)
  );
  return `${enc}.mp3`;
}

// 直接执行时打印清单统计（生成/校验脚本 import 使用）
if (process.argv[1] && process.argv[1].endsWith('audio-manifest.mjs')) {
  const m = extractAudioManifest();
  console.log(`zh: ${m.zh.length} 条`);
  console.log(`en: ${m.en.length} 条`);
  console.log(`总计: ${m.zh.length + m.en.length} 条`);
}
