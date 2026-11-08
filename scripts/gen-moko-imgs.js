// 从 moko-collection.ts 抽取「name -> img」精简子集，供客户端(story 页)使用，
// 避免把 3351 行全量萌可数据打进浏览器 JS。
// 运行：node scripts/gen-moko-imgs.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const srcDir = path.join(__dirname, '..', 'src', 'lib', 'moko-collection', 'by-season');
const outPath = path.join(__dirname, '..', 'src', 'lib', 'moko-imgs.ts');
const src = fs
  .readdirSync(srcDir)
  .filter((f) => f.endsWith('.ts'))
  .sort()
  .map((f) => fs.readFileSync(path.join(srcDir, f), 'utf8'))
  .join('\n');

// 每个萌可对象结构固定：先 "name"，后在同对象内出现 "img"
const re = /"name":\s*"([^"]+)"[\s\S]*?"img":\s*"([^"]+)"/g;
const map = {};
let m;
while ((m = re.exec(src))) {
  map[m[1]] = m[2];
}

const entries = Object.entries(map)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`)
  .join(',\n');

const out = `// 自动生成：由 moko-collection.ts 抽取 name->img 的精简子集，供客户端(story 页)使用，
// 避免把全量萌可数据打进浏览器 JS。请勿手改，重新生成：node scripts/gen-moko-imgs.js
export const mokoImgByName: Record<string, string> = {
${entries}
};
`;

fs.writeFileSync(outPath, out);
console.log(`[gen-moko-imgs] wrote ${Object.keys(map).length} entries -> src/lib/moko-imgs.ts`);
