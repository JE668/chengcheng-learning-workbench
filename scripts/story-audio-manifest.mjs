#!/usr/bin/env node
/**
 * 故事音频清单提取（2026-10-19 · 捕捉萌可预生成）。
 *
 * 为什么不用正则抽 story.ts：autoChapters 是**模板拼接**（`${m.name}笑眯眯
 * 地说：「${m.line}」…`），正则拿不到拼接结果，硬解析必然与运行时漂移。
 * 这里用 esbuild 把数据链（story.ts ← moko-collection）转译成 mjs 后
 * **真实运行**，导出与前端逐字一致的文本清单——生成与播放永不漂移。
 *
 * 输出：src/lib/study-data/ 之外不落盘；gen-audio.mjs import 本模块拿清单。
 * 全部 zh 文本 = paragraphs[] + tip + quiz.q + quiz.explain + quiz.options。
 */
import { mkdtempSync, writeFileSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** 去重 + 排序（清单稳定，顺序变化不触发重生成） */
function dedupeSorted(arr) {
  return [...new Set(arr)].filter(Boolean).sort((a, b) => a.localeCompare(b));
}

/** 定位 esbuild 二进制：pnpm 严格布局下 esbuild 不是顶层依赖，
 *  按 .pnpm 目录扫描版本目录里的 bin/esbuild。 */
function findEsbuildBin() {
  const pnpmDir = join(ROOT, 'node_modules', '.pnpm');
  if (!existsSync(pnpmDir)) return null;
  const dirs = readdirSync(pnpmDir).filter((d) => d.startsWith('esbuild@')).sort().reverse();
  for (const d of dirs) {
    for (const p of [
      join(pnpmDir, d, 'node_modules', 'esbuild', 'bin', 'esbuild'),
      join(pnpmDir, d, 'node_modules', '.bin', 'esbuild'),
    ]) {
      if (existsSync(p)) return p;
    }
  }
  return null;
}

export async function extractStoryAudioList() {
  const tmp = mkdtempSync(join(tmpdir(), 'story-audio-'));
  try {
    // esbuild 打包 story.ts（含依赖 moko-collection）成自包含 ESM
    const outfile = join(tmp, 'story-bundle.mjs');
    const bin = findEsbuildBin();
    if (!bin) throw new Error('esbuild binary not found (node_modules/.pnpm/esbuild@*/bin)');
    // bundle：story.ts + 依赖 → 自包含 ESM（platform=node，纯数据模块零障碍）
    const r = spawnSync(bin, [
      join(ROOT, 'src/lib/story.ts'),
      '--bundle', '--format=esm', '--platform=node', '--target=node18',
      `--outfile=${outfile}`,
    ], { stdio: 'pipe' });
    if (r.status !== 0) throw new Error(`esbuild failed: ${r.stderr?.toString().slice(0, 300)}`);
    // 追加导出器：把 storyChapters 摊平成文本数组
    const exporter = join(tmp, 'export.mjs');
    writeFileSync(
      exporter,
      `import { storyChapters } from ${JSON.stringify(pathToFileURL(outfile).href)};\n` +
        `const texts = [];\n` +
        `for (const c of storyChapters) {\n` +
        `  for (const p of c.paragraphs ?? []) texts.push(p);\n` +
        `  if (c.tip) texts.push(c.tip);\n` +
        `  if (c.quiz) {\n` +
        `    if (c.quiz.q) texts.push(c.quiz.q);\n` +
        `    for (const o of c.quiz.options ?? []) texts.push(o);\n` +
        `    if (c.quiz.explain) texts.push(c.quiz.explain);\n` +
        `  }\n` +
        `}\n` +
        `export const list = texts;\n`
    );
    const mod = await import(pathToFileURL(exporter).href);
    const texts = mod.list.filter(
      (t) => typeof t === 'string' && t.trim().length >= 1 && t.length <= 200
    );
    return { zh: dedupeSorted(texts) };
  } finally {
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* 清理失败不阻塞 */
    }
  }
}

// 直接执行时打印统计
if (process.argv[1] && process.argv[1].endsWith('story-audio-manifest.mjs')) {
  extractStoryAudioList().then((m) => {
    console.log(`story zh: ${m.zh.length} 条`);
    if (process.argv.includes('--sample')) {
      for (const t of m.zh.slice(0, 8)) console.log(' ', t.slice(0, 40));
    }
  });
}
