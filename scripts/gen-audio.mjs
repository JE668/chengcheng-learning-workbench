#!/usr/bin/env node
/**
 * 预生成 TTS 音频（2026-10-18 B0 方案）。
 *
 * 把静态学习内容（汉字/拼音例字/古诗句/英语单词，见 audio-manifest.mjs）
 * 用 edge-tts（与运行时第 3 层完全相同的 XiaoxiaoNeural/AriaNeural 嗓音）
 * 一次性合成为本地 MP3 → public/audio/{zh,en}/。
 *
 * 用法：
 *   node scripts/gen-audio.mjs              # 增量生成（已存在且非空则跳过）
 *   node scripts/gen-audio.mjs --force      # 全量重新生成
 *
 * 产出后 git add public/audio 提交；CI 的 check-audio.mjs 校验清单-落盘一致。
 * 嗓音与 scripts/tts-server.py 保持一致：zh=zh-CN-XiaoxiaoNeural, en=en-US-AriaNeural。
 */
import { mkdirSync, existsSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { extractAudioManifest, audioFileName } from './audio-manifest.mjs';
import { extractStoryAudioList } from './story-audio-manifest.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'audio');
const FORCE = process.argv.includes('--force');

const VOICE = { zh: 'zh-CN-XiaoxiaoNeural', en: 'en-US-AriaNeural' };

/** 用 edge_tts Python 包合成一条（子进程方式与 tts-server.py 相同引擎） */
function synthesize(text, lang) {
  return new Promise((resolve, reject) => {
    // edge_tts 的 CLI：edge-tts --text ... --voice ... --write-media out.mp3
    // 走 CLI 而不是 import：批量场景下每条独立进程，内存干净且天然并行可控
    const out = join(OUT, lang, audioFileName(text));
    const args = [
      '-m', 'edge_tts', '--text', text,
      '--voice', VOICE[lang],
      '--write-media', out,
    ];
    const p = spawn('/usr/bin/python3', args);
    let err = '';
    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('error', reject);
    p.on('exit', (code) => (code === 0 ? resolve(out) : reject(new Error(err || `exit ${code}`))));
  });
}

async function main() {
  // 两个清单源：教材静态内容（正则抽取）+ 故事全文（esbuild 真实运行抽取，
  // 含 autoChapters 模板拼接产物——正则拿不到，见 story-audio-manifest.mjs）
  const manifest = extractAudioManifest();
  const story = await extractStoryAudioList();
  // 故事文本并入 zh 清单（去重交给 dedupeSorted）
  const zhList = [...manifest.zh, ...story.zh].sort((a, b) => a.localeCompare(b));
  const seen = new Set();
  const zhDedup = zhList.filter((t) => (seen.has(t) ? false : (seen.add(t), true)));
  manifest.zh = zhDedup;
  let generated = 0;
  let skipped = 0;
  let failed = 0;
  const failures = [];

  for (const lang of ['zh', 'en']) {
    mkdirSync(join(OUT, lang), { recursive: true });
  }

  const total = manifest.zh.length + manifest.en.length;
  console.log(`清单：zh ${manifest.zh.length} 条（含故事），en ${manifest.en.length} 条，共 ${total} 条`);

  // 顺序生成 + 限并发（edge-tts 上游是 WebSocket，并发太高会被限流）。
  // 3 路并发是实测安全值（同 tts-server 单进程串行的语义）。
  const CONCURRENCY = 3;
  const tasks = [
    ...manifest.zh.map((t) => ({ text: t, lang: 'zh' })),
    ...manifest.en.map((t) => ({ text: t, lang: 'en' })),
  ];

  let cursor = 0;
  async function worker() {
    while (cursor < tasks.length) {
      const i = cursor++;
      const { text, lang } = tasks[i];
      const file = join(OUT, lang, audioFileName(text));
      if (!FORCE && existsSync(file) && statSync(file).size > 1024) {
        skipped++;
        continue;
      }
      try {
        await synthesize(text, lang);
        generated++;
        if (generated % 50 === 0) console.log(`进度：已生成 ${generated}（skip ${skipped} / fail ${failed}）/ ${total}`);
      } catch (e) {
        failed++;
        failures.push(`${lang}: ${text} → ${(e instanceof Error ? e.message : e).slice(0, 120)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`\n完成：生成 ${generated}，跳过 ${skipped}，失败 ${failed}`);
  if (failures.length) {
    console.log('失败明细（前 20 条）：');
    failures.slice(0, 20).forEach((f) => console.log('  ' + f));
    process.exitCode = 1;
  }
}

main();
