// 从 moko-collection.ts 抽取「name -> img」精简子集，供客户端(story 页)使用，
// 避免把 3351 行全量萌可数据打进浏览器 JS。
// 运行：node scripts/gen-moko-imgs.js
const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'src', 'lib', 'moko-collection.ts');
const outPath = path.join(__dirname, '..', 'src', 'lib', 'moko-imgs.ts');
const src = fs.readFileSync(srcPath, 'utf8');

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
