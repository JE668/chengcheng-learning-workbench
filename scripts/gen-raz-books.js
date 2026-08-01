// 扫描 public/raz/{books,videos} 生成 src/lib/raz-books.ts
// 改了 PDF/MP4 文件名或增删书目后，重跑：node scripts/gen-raz-books.js
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const base = path.join(root, 'public', 'raz');
const dest = path.join(root, 'src', 'lib', 'raz-books.ts');

const bookIds = new Set(
  fs.readdirSync(path.join(base, 'books'))
    .filter((f) => f.endsWith('.pdf'))
    .map((f) => f.replace(/\.pdf$/, ''))
);
const videoIds = fs.readdirSync(path.join(base, 'videos'))
  .filter((f) => f.endsWith('.mp4'))
  .map((f) => f.replace(/\.mp4$/, ''));

const ids = new Set([...bookIds, ...videoIds]);
const items = [...ids].sort().map((id) => ({
  id,
  title: id.replace(/^AA-\d+/, '').replace(/_/g, ' ').trim(),
  hasPdf: bookIds.has(id),
}));

const out =
`// 自动生成：扫描 public/raz/{books,videos} 得到。请勿手改——改文件名后重跑 scripts/gen-raz-books.js
export interface RazBook {
  id: string; // 文件名（不含扩展名），如 AA-01Farm_Animals
  title: string; // 展示标题，如 Farm Animals
  hasPdf: boolean; // 是否有配套 PDF 绘本
}

export const RAZ_BOOKS: RazBook[] = ${JSON.stringify(items, null, 2)};
`;

fs.writeFileSync(dest, out);
console.log(`wrote ${items.length} books (pdf: ${items.filter((b) => b.hasPdf).length}, video-only: ${items.filter((b) => !b.hasPdf).length}) -> ${dest}`);
