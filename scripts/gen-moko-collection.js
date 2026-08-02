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

// 个别文件名修正：磁盘文件名沿用官方导出名，映射成正确角色名
// （乐美/查尔斯 是人类角色，不是萌可，故改名；乐美归 guide 类）
const NAME_FIX = { '乐美萌可': '乐美公主', '查尔斯萌可': '查尔斯王子' };

// 官方没有的角色（占位符/错别字/未找到出处），扫描时直接跳过，避免重新生成时复活
// - extra(神秘萌可)、其他萌可：纯占位符，非具体角色
// - 波荡萌可：官方无此名，疑似错别字
// - 士兵萌可、铃铛萌可、黑暗萌可：未找到官方出处
const EXCLUDE_NAMES = new Set(['神秘萌可', '其他萌可', '波荡萌可', '士兵萌可', '铃铛萌可', '黑暗萌可']);

// 个别图片覆盖：用指定图片替换扫描到的默认图。
// 乐美公主用头像 /moko/lemei.jpg（而非全身照「乐美萌可_render.webp」，否则登录页/奖状显示成腿）。
const IMG_OVERRIDE = {
  '乐美公主': '/moko/lemei.jpg',
};

// 个别分类/emoji/台词覆盖（人类角色，非萌可）
const CAT_OVERRIDE = { '乐美公主': 'guide' };
const EMOJI_OVERRIDE = { '乐美公主': '👑' };
const LINE_OVERRIDE = { '乐美公主': '一起捕捉萌可吧！' };

// —— 萌可「说话方式」：每只萌可句尾带独特语气词（参考《奇妙萌可》资料，每个角色口癖不同）——
// 已知角色的官方口癖台词（命中即用，最贴合原作）
const NAME_LINE = {
  '爱心萌可': '啾~ 我是爱心萌可，爱心光波！',
  '正正萌可': '敬礼！我是正正萌可，无所畏惧！',
  '勇气萌可': '哈哈，我是勇气萌可，冲呀！',
  '唱唱萌可': '啦啦~ 我是唱唱萌可，唱给世界听！',
  '幸福萌可': '幸福~ 我是幸福萌可，甜甜满满！',
  '盼盼萌可': '锵锵，我是盼盼萌可，希望满满！',
  '希望萌可': '锵锵，我是希望萌可，永远不放弃！',
  '星光萌可': '星星~ 我是星光萌可，闪亮登场！',
  '月光萌可': '月光~ 我是月光萌可，明朗皎洁！',
  '银光萌可': '耀耀~ 我是银光萌可，柔柔发光！',
  '软软萌可': '软软~ 我是软软萌可，弹弹果冻！',
  '闪闪萌可': '闪闪~ 我是闪闪萌可，元气满满！',
  '甜心萌可': '甜甜~ 我是甜心萌可，甜蜜蜜！',
  '绵绵萌可': '绵绵~ 我是绵绵萌可，软乎乎！',
  '糖糖萌可': '糖糖~ 我是糖糖萌可，甜滋滋！',
  '亲亲萌可': '亲亲~ 我是亲亲萌可，mua！',
  '呼啦萌可': '呼啦~ 我是呼啦萌可，转圈圈！',
  '叮咚萌可': '叮咚~ 我是叮咚萌可，门铃响啦！',
  '兔兔萌可': '跳跳~ 我是兔兔萌可，蹦蹦跳！',
  '熊熊萌可': '熊熊~ 我是熊熊萌可，抱抱你！',
  '狐狐萌可': '狐狐~ 我是狐狐萌可，狡黠一笑！',
  '歌谣萌可': '歌谣~ 我是歌谣萌可，唱起来！',
  '悄悄萌可': '悄悄~ 我是悄悄萌可，别出声～',
  '光明萌可': '光明~ 我是光明萌可，照亮你！',
  '极光萌可': '极光~ 我是极光萌可，绚丽登场！',
  '动动萌可': '动动~ 我是动动萌可，动起来！',
  '贴贴萌可': '贴贴~ 我是贴贴萌可，贴贴你！',
  '绵羊萌可': '咩咩~ 我是绵羊萌可，软软的！',
  '透明萌可': '玻璃~ 我是透明萌可，看不见啦！',
  '共共萌可': '共共~ 我是共共萌可，一起分享！',
  '跳舞萌可': '跳舞~ 我是跳舞萌可，转个圈！',
  '缤缤萌可': '缤缤~ 我是缤缤萌可，五彩缤纷！',
  '纷纷萌可': '纷纷~ 我是纷纷萌可，飘呀飘！',
  '王子萌可': '我是王子萌可，我来守护大家！',
};

// 各系列口癖词池（未知角色按系列取，保证同系列内不重复）
const QUIRKS = {
  royal: ['啾', '敬礼', '哈哈', '啦啦', '幸福', '锵锵', '星星', '月光', '耀耀', '软软', '闪闪', '甜甜', '绵绵', '华丽', '自信', '浪漫', '温柔', '好奇', '欢乐', '智慧', '优雅', '元气', '闪亮', '暖暖', '悄悄', '甜美', '乖乖', '灵灵', '美美', '婷婷'],
  mo: ['魔法', '噗噗', '叮叮', '咻咻', '呼呼', '变变', '灵灵', '飘飘', '晶晶', '咕噜', '喵喵', '闪闪', '噗通', '叮咚', '转转', '咔咔'],
  key: ['咔嚓', '钥匙', '猜猜', '打开', '锁好', '叮当', '探索', '解密', '知识', '咔哒', '秘密', '寻寻', '智慧', '明白', '哒哒'],
  jewel: ['bling', '闪闪', '亮晶晶', '璀璨', '红红', '透透', '宝气', '熠熠', '烁烁', '晶晶', '绚绚', '耀耀', '珠珠', '光光'],
  sweetie: ['软软', '闪闪', '甜甜', '绵绵', '呼呼', '香香', '巧巧', '糖糖', '圈圈', '华夫', '棒棒', '夹心', '奶油', '泡泡', '薄薄', '糯糯', '蜜蜜', '凉凉', '乖乖'],
  star: ['耀耀', '星星', '月光', '流星', '愿愿', '许愿', '嗖嗖', '闪亮', '亮亮', '星河', '辰辰', '转转', '望望'],
  princess: ['月光', '希望', '华丽', '自信', '浪漫', '优雅', '温柔', '高贵', '婷婷', '盈盈', '冉冉', '皎皎', '甜甜', '美美', '灵灵', '俏俏'],
  prince: ['守护', '骑士', '勇勇', '剑剑', '护护', '英英', '帅帅', '铮铮', '昂昂', '凛凛', '忠实', '威威'],
  villain: ['嘻嘻', '嘿嘿', '看我的', '坏笑', '捣捣', '闹闹', '哗啦', '咯咯', '阴阴', '悠悠', '调皮', '鬼鬼'],
  legend: ['奇迹', '幸运', '传说', '闪耀', '熠熠', '祥祥', '瑞瑞', '圣圣', '辉辉', '灿灿', '奇奇', '运运'],
};

// 句式模板（与口癖交叉，保证每只台词不同）
const TEMPLATES = [
  (n, q) => `${q}~ 我是${n}！`,
  (n, q) => `${q}！${n}来啦！`,
  (n, q) => `${n}登场，${q}~`,
  (n, q) => `跟我一起玩吧，${q}~`,
  (n, q) => `今天也要开心哦，${q}~`,
  (n, q) => `呼呼，${n}在这里，${q}~`,
];

// 生成独特台词：命中官方口癖的用精准台词；否则按「系列 + 系列内序号」交叉生成，同系列内绝不重复
function makeLine(name, cat, ci) {
  if (NAME_LINE[name]) return NAME_LINE[name];
  const quirks = QUIRKS[cat] || QUIRKS.royal;
  const q = quirks[(ci - 1) % quirks.length];
  const t = TEMPLATES[(ci - 1) % TEMPLATES.length];
  return t(name, q);
}

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
const catCount = {};
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
  // 按文件名去重（一张图可能同时有 .png 与 .webp），优先用体积更小的 webp
  const bases = [...new Set(files.map((f) => f.replace(/\.(jpe?g|png|webp)$/i, '')))];
  for (const base of bases) {
    const ext = fs.existsSync(path.join(fdir, `${base}.webp`))
      ? '.webp'
      : fs.existsSync(path.join(fdir, `${base}.png`))
        ? '.png'
        : '.jpg';
    const f = `${base}${ext}`;
    const { name, suffix } = parseName(base);
    if (EXCLUDE_NAMES.has(name)) continue; // 跳过官方没有的角色
    const key = `col_${digits}_${base}`;
    entries.push({
      key,
      name,
      category: CAT_OVERRIDE[name] || cat,
      season,
      img: IMG_OVERRIDE[name] || `/moko/collection/${folder}/${f}`,
      emoji: EMOJI_OVERRIDE[name] || meta.emoji,
      color: meta.color,
      item: '✨ 魔法道具',
      line: LINE_OVERRIDE[name] || makeLine(name, cat, (catCount[cat] = (catCount[cat] || 0) + 1)),
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

/** 全部萌可图片（由 public/moko/collection 扫描生成，key 以 col_ 前缀，category 见上） */
export const mokoCollection: MokoChar[] = ${JSON.stringify(entries, null, 2)};

/** 同名首图（用于把核心萌可的 img 重映射到真实图片） */
export const mokoCollectionByName: Record<string, MokoChar> = ${JSON.stringify(byName, null, 2)};
`;

fs.writeFileSync(OUT, ts);
console.log(`写入 ${OUT}`);
console.log(`总图片: ${entries.length}，分类数: ${Object.keys(FOLDER_CAT).length}，同名去重后: ${Object.keys(byName).length}`);
