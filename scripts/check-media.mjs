/**
 * 媒体登记-落盘一致性校验。
 *
 * 背景：NAS 部署把镜像里的 public/textbooks 用宿主机 media/ 挂载覆盖，
 * 新加过课本 PDF 但忘了同步 NAS 目录，就会出现「页面正常、PDF 404」。
 * 本脚本读取 src/lib/textbooks.ts 登记的全部章节文件 + 封面图，
 * 检查它们在给定媒体根目录下真实存在。
 *
 * 用法：
 *   node scripts/check-media.mjs                 # 校验仓库内 public/
 *   node scripts/check-media.mjs <媒体根目录>     # 校验 NAS 挂载目录（含 raz/、textbooks/）
 *   pnpm check-media
 *
 * 建议：push 到 NAS 前先在本地对仓库跑一次；在 NAS 上换媒体后对 media/ 跑一次。
 */
import { existsSync, statSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const mediaRoot = process.argv[2] ? process.argv[2].replace(/\/+$/, '') : join(ROOT, 'public');

const textbooksSrc = readFileSync(join(ROOT, 'src/lib/textbooks.ts'), 'utf8');

/** 从 textbooks.ts 抽出 file: '/textbooks/...' 与 img: '/moko/...' 引用 */
const files = [...textbooksSrc.matchAll(/file:\s*'([^']+)'/g)].map((m) => m[1]);
const imgs = [...textbooksSrc.matchAll(/img:\s*'([^']+)'/g)].map((m) => m[1]);

let missing = 0;
let totalSize = 0;

for (const rel of [...files, ...imgs]) {
  // 挂载目录模式下 /textbooks/... 直接落在媒体根；镜像内路径是 <root>/public/textbooks/...
  const onDisk = join(mediaRoot, rel);
  if (!existsSync(onDisk)) {
    console.error(`❌ 缺失：${rel}（期望在 ${onDisk}）`);
    missing++;
    continue;
  }
  totalSize += statSync(onDisk).size;
}

if (missing > 0) {
  console.error(`\n💥 共 ${missing} 个登记媒体文件缺失`);
  console.error('   NAS 部署常见原因：media/textbooks 挂载目录没同步新文件，见 DEPLOY-NAS.md「媒体 404」一节。');
  process.exit(1);
}

console.log(
  `✅ 课本媒体齐全：${files.length} 个章节 PDF + ${imgs.length} 个封面图，共 ${(totalSize / 1024 / 1024).toFixed(1)}MB（${mediaRoot}）`,
);
