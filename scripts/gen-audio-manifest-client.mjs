#!/usr/bin/env node
/**
 * 生成客户端预热清单 src/lib/audio-manifest-client.generated.ts（2026-10-20）。
 *
 * 从构建期数据源（audio-manifest.mjs 的教材静态集 = 汉字+英语单词）
 * 生成 URL 数组，供 warm-audio.ts 空闲预热使用。
 * 与 speak.ts 的 localAudioUrl 同一编码算法（encodeURIComponent + 特殊字符替换）。
 *
 * 重新生成：node scripts/gen-audio-manifest-client.mjs
 * CI 门禁：本脚本输出与提交版本 diff 即红（与 gen-moko-collection 同模式）。
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractAudioManifest } from './audio-manifest.mjs';
import { extractMokoPhrases } from './moko-phrases-manifest.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/lib/audio-manifest-client.generated.ts');

const ENC_RE = /[()*!']/g;
const ENC_MAP = { '(': '%28', ')': '%29', '*': '%2A', '!': '%21', "'": '%27' };

function audioUrl(text, lang) {
  const src = lang === 'en' ? text.toLowerCase() : text;
  const enc = encodeURIComponent(src).replace(ENC_RE, (c) => ENC_MAP[c] || c);
  return `/audio/${lang}/${enc}.mp3`;
}

const manifest = extractAudioManifest();
const mokoPhrases = extractMokoPhrases();
const urls = [
  ...manifest.zh.map((t) => audioUrl(t, 'zh')),
  ...manifest.en.map((t) => audioUrl(t, 'en')),
  // 萌可台词（45 条高频表扬/提示——网络差最先播不出的那批）
  ...mokoPhrases.map((t) => audioUrl(t, 'zh')),
];

const body = `/**
 * ⚠️ 自动生成（scripts/gen-audio-manifest-client.mjs）——不要手改。
 * 客户端空闲预热清单：教材静态内容（${manifest.zh.length} 汉字 + ${manifest.en.length} 英语单词）
 * + 萌可台词（${mokoPhrases.length} 条表扬/提示）的 MP3 URL。
 * 由 warm-audio.ts 消费；CI 校验与生成器输出一致。
 */
export const AUDIO_MANIFEST_URLS: string[] = ${JSON.stringify(urls)};
`;

writeFileSync(OUT, body);
console.log(`生成 ${OUT}：${urls.length} 条（zh ${manifest.zh.length} + en ${manifest.en.length}）`);
