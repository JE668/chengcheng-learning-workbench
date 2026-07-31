const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../public/moko/collection');
const OUT = path.resolve(__dirname, '../src/lib/moko-collection.ts');

// 文件夹前缀(2位) -> 分类 key
const FOLDER_CAT = {
  '01': 'royal',
  '02': 'mo',
  '03': 'jewel',
  '04': 'key',
  '05': 'sweetie',
  '06': 'star',
  '07': 'princess',
  '08': 'prince',
  '09': 'villain',
  '10': 'legend',
};

// 分类元数据（含已有分类，便于统一 season 标签；newCats 是本次新增、需要并入 MOko_CATEGORIES 的）
const CAT_META = {
  royal:    { label: '皇室萌可', emoji: '👑', color: 'text-moko-rose',   desc: '守护魔法萌可王国的小公主们' },
  mo:       { label: '魔方萌可', emoji: '🧊', color: 'text-moko-cyan',   desc: '第一、二季的魔法萌可' },
  jewel:    { label: '宝石萌可', emoji: '💎', color: 'text-moko-purple', desc: '住在宝石矿洞里的闪亮一族' },
  key:      { label: '钥匙萌可', emoji: '🔑', color: 'text-moko-violet', desc: '掌管知识宝盒的钥匙精灵' },
  sweetie:  { label: '甜心萌可', emoji: '🍬', color: 'text-moko-pink',   desc: '甜甜圈工厂里的糖果精灵' },
  star:     { label: '星星萌可', emoji: '☄️', color: 'text-moko-cyan',   desc: '追逐流星的天文萌可' },
  princess: { label: '公主萌可', emoji: '🌟', color: 'text-moko-gold',   desc: '王国里最受宠爱的小公主' },
  prince:   { label: '王子萌可', emoji: '🤴', color: 'text-moko-blue',   desc: '守护王国的王子们' },
  villain:  { label: '反派萌可', emoji: '😈', color: 'text-slate-500',   desc: '搞怪的反派与神秘角色' },
  legend:   { label: '传奇萌可', emoji: '🌟', color: 'text-moko-gold',   desc: '传说中的特别萌可' },
};

// 个别文件名修正
const NAME_FIX = { extra: '神秘萌可' };

function parseName(fileBase) {
  // 先剥离官网导出的 _render 标记（如 幸运萌可_render）
  let base = fileBase.replace(/_render$/i, '');
  const parts = base.split('_');
  let suffix = '';
  if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) {
    suffix = parts.pop();
  }
  let name = parts.join('·');
  if (NAME_FIX[name]) name = NAME_FIX[name];
  return { name, suffix };
}

const entries = [];
const folders = fs.readdirSync(ROOT).filter((d) => fs.statSync(path.join(ROOT, d)).isDirectory());
folders.sort();

for (const folder of folders) {
  const digits = folder.slice(0, 2);
  const cat = FOLDER_CAT[digits];
  if (!cat) continue;
  const meta = CAT_META[cat];
  const season = folder.replace(/^\d+_/, '');
  const fdir = path.join(ROOT, folder);
  const files = fs.readdirSync(fdir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
  for (const f of files) {
    const base = f.replace(/\.(jpe?g|png|webp)$/i, '');
    const { name, suffix } = parseName(base);
    const key = `col_${digits}_${base}`;
    entries.push({
      key,
      name,
      category: cat,
      season,
      img: `/moko/collection/${folder}/${f}`,
      emoji: meta.emoji,
      color: meta.color,
      item: '✨ 魔法道具',
      line: `啾~ 我是${name}！`,
    });
  }
}

// 每个名字取第一张，用于重映射核心萌可
const byName = {};
for (const e of entries) {
  if (!byName[e.name]) byName[e.name] = e;
}

const newCats = ['mo', 'prince', 'villain', 'legend'].map((k) => ({ key: k, ...CAT_META[k] }));

const ts = `// 自动生成：由 scripts 扫描 public/moko/collection/ 生成，请勿手改。
// 重新生成：node scripts/gen-moko-collection.js
import type { MokoChar, MokoCategoryKey } from './types';

export interface MokoCollectionCat {
  key: MokoCategoryKey;
  label: string;
  emoji: string;
  color: string;
  desc: string;
}

/** 本次新增的季分类（需并入 MOko_CATEGORIES） */
export const COLLECTION_CATEGORIES: MokoCollectionCat[] = ${JSON.stringify(newCats, null, 2)};

/** 全部萌可图片（170 张），key 以 col_ 前缀，category 见上 */
export const mokoCollection: MokoChar[] = ${JSON.stringify(entries, null, 2)};

/** 同名首图（用于把核心萌可的 img 重映射到真实图片） */
export const mokoCollectionByName: Record<string, MokoChar> = ${JSON.stringify(byName, null, 2)};
`;

fs.writeFileSync(OUT, ts);
console.log(`写入 ${OUT}`);
console.log(`总图片: ${entries.length}，分类数: ${Object.keys(FOLDER_CAT).length}，同名去重后: ${Object.keys(byName).length}`);
