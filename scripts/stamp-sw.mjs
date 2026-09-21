/**
 * 构建期给 Service Worker 注入版本号：
 * 把 public/sw.js 里的 __SW_BUILD_ID__ 占位符替换为
 *   v<package.json version>+<git short sha>（无 git 环境时退回时间戳）
 * 保证每次发布 SW 的缓存空间名变化 → 旧缓存被清理、新代码立刻生效。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SW = join(ROOT, 'public/sw.js');

const { version = '0.0.0' } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
let sha = '';
try {
  sha = execSync('git rev-parse --short HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
} catch {
  sha = Date.now().toString(36); // Docker 构建无 .git 时的兜底
}

const src = readFileSync(SW, 'utf8');
const stamped = src.replace(/__SW_BUILD_ID__/g, `v${version}-${sha}`);
if (stamped === src) {
  console.log('ℹ️  sw.js 已是打戳后内容，跳过');
} else {
  writeFileSync(SW, stamped);
  console.log(`✅ sw.js 打戳：v${version}-${sha}`);
}
