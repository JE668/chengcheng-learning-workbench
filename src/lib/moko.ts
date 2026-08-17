import { MokoChar, MokoCategoryKey, Subject } from './types';
import { mokoCollection, mokoCollectionByName } from './moko-collection';

export const appName = process.env.NEXT_PUBLIC_APP_NAME || '程程学习工作台';

/**
 * 学科 → 对应萌可 key（用于每日打卡奖励）。
 * 注意：必须与剧情捕捉写入的图鉴 key 一致（col_01_*_render），
 * 否则「爱心/正正/唱唱」会同时存在 heartping 与 col_ 两个 key，导致收集数重复计数。
 * mokoChars 已合并 mokoCollection，故 col_ key 在显示/奖状处也能正确解析。
 */
export const subjectMokoKey: Record<Subject, string> = {
  语文: 'col_01_爱心萌可_render',
  数学: 'col_01_正正萌可_render',
  英语: 'col_01_唱唱萌可_render',
};

export const subjects: { key: Subject; label: string; color: string; img: string; desc: string }[] = [
  { key: '语文', label: '语文城堡', color: 'bg-moko-pink', img: '/moko/heartping.jpg', desc: '爱心萌可陪你认字读诗' },
  { key: '数学', label: '数学星球', color: 'bg-moko-blue', img: '/moko/courageping.jpg', desc: '正正萌可挑战加减法' },
  { key: '英语', label: '英语乐园', color: 'bg-moko-yellow', img: '/moko/singping.jpg', desc: '唱唱萌可学字母单词' },
];

/**
 * 萌可图鉴（按系列分类，种类更丰富）
 * category 取值见 MokoCategoryKey：royal/key/jewel/sweetie/star/princess/guide/trouble
 */
export const MokoCategories: { key: MokoCategoryKey; label: string; emoji: string; color: string; desc: string }[] = [
  { key: 'royal', label: '皇室萌可', emoji: '👑', color: 'text-moko-rose', desc: '守护魔法萌可王国的小公主们' },
  { key: 'mo', label: '魔方萌可', emoji: '🧊', color: 'text-moko-cyan', desc: '第一、二季的魔法萌可' },
  { key: 'key', label: '钥匙萌可', emoji: '🔑', color: 'text-moko-violet', desc: '掌管知识宝盒的钥匙精灵' },
  { key: 'jewel', label: '闪亮宝石萌可', emoji: '💎', color: 'text-moko-purple', desc: '住在宝石矿洞里的闪亮一族' },
  { key: 'sweetie', label: '魔法甜心萌可', emoji: '🍬', color: 'text-moko-pink', desc: '甜甜圈工厂里的糖果精灵' },
  { key: 'star', label: '闪耀流星萌可', emoji: '☄️', color: 'text-moko-cyan', desc: '追逐流星的天文萌可' },
  { key: 'princess', label: '闪亮公主萌可', emoji: '🌟', color: 'text-moko-gold', desc: '王国里最受宠爱的小公主' },
  { key: 'prince', label: '王子萌可', emoji: '🤴', color: 'text-moko-blue', desc: '守护王国的王子们' },
  { key: 'villain', label: '反派萌可', emoji: '😈', color: 'text-slate-500', desc: '搞怪的反派与神秘角色' },
  { key: 'legend', label: '传奇萌可', emoji: '🌟', color: 'text-moko-gold', desc: '传说中的特别萌可' },
  { key: 'guide', label: '引导萌可', emoji: '🧭', color: 'text-moko-rose', desc: '带着爱心魔杖的领航员' },
  { key: 'trouble', label: '捣蛋萌可', emoji: '😈', color: 'text-slate-500', desc: '最爱搞恶作剧的小淘气，帮乐美把它们捉回去吧！' },
];

export const mokoChars: Record<string, MokoChar> = {
  // —— 皇室萌可（核心三科 + 伙伴）——
  heartping: { key: 'heartping', name: '爱心萌可', color: 'text-moko-rose', img: '/moko/heartping.jpg', emoji: '💗', season: 'S1 魔方萌可', item: '爱心镜子', line: '啾~ 爱心光波！', category: 'royal', subject: '语文' },
  courageping: { key: 'courageping', name: '正正萌可', color: 'text-moko-blue', img: '/moko/courageping.jpg', emoji: '💪', season: 'S1 魔方萌可', item: '勇气相机', line: '敬礼！正正萌可，无所畏惧！', category: 'royal', subject: '数学' },
  singping: { key: 'singping', name: '唱唱萌可', color: 'text-moko-yellow', img: '/moko/singping.jpg', emoji: '🎵', season: 'S1 魔方萌可', item: '甜心铃铛', line: '啦啦啦，唱给世界听！', category: 'royal', subject: '英语' },
  curiousping: { key: 'curiousping', name: '好奇萌可', color: 'text-moko-cyan', emoji: '🔍', season: 'S1 魔方萌可', item: '放大镜', line: '咦？这是什么呢？', category: 'royal' },
  happyping: { key: 'happyping', name: '欢欢萌可', color: 'text-moko-pink', emoji: '😄', season: 'S1 魔方萌可', item: '欢乐喇叭', line: '笑一个嘛，嘿嘿！', category: 'royal' },
  wisejingping: { key: 'wisejingping', name: '睿智萌可', color: 'text-moko-purple', emoji: '📘', season: 'S1 魔方萌可', item: '智慧书', line: '知识就是力量！', category: 'royal' },
  gentleping: { key: 'gentleping', name: '温柔萌可', color: 'text-moko-mint', emoji: '🌸', season: 'S1 魔方萌可', item: '柔软羽毛', line: '轻轻的，慢慢来～', category: 'royal' },

  // —— 钥匙萌可 ——
  keyping: { key: 'keyping', name: '钥匙萌可', color: 'text-moko-violet', img: '/moko/keyping.jpg', emoji: '🔑', season: 'S4 魔法钥匙', item: '万能钥匙', line: '万能钥匙，打开知识！', category: 'key', subject: '英语' },
  lockping: { key: 'lockping', name: '锁锁萌可', color: 'text-moko-violet', emoji: '🔒', season: 'S4 魔法钥匙', item: '小金锁', line: '咔嚓，锁好啦！', category: 'key' },
  boxping: { key: 'boxping', name: '宝盒萌可', color: 'text-moko-violet', emoji: '🎁', season: 'S4 魔法钥匙', item: '神秘宝盒', line: '猜猜里面有什么？', category: 'key' },

  // —— 闪亮宝石萌可 ——
  gemsping: { key: 'gemsping', name: '宝石萌可', color: 'text-moko-purple', img: '/moko/gemsping.jpg', emoji: '💎', season: 'S3 闪亮宝石', item: '闪亮宝石', line: '闪闪发光的宝石！', category: 'jewel', subject: '数学' },
  auroraping: { key: 'auroraping', name: '极光萌可', color: 'text-moko-cyan', img: '/moko/auroraping.jpg', emoji: '🌌', season: 'S6 闪耀流星', item: '流星弓箭', line: '流星划过，角度正好！', category: 'jewel', subject: '数学' },
  diamondping: { key: 'diamondping', name: '钻石萌可', color: 'text-moko-cyan', emoji: '💠', season: 'S3 闪亮宝石', item: '钻石权杖', line: 'bling bling 闪瞎眼！', category: 'jewel' },
  rubyping: { key: 'rubyping', name: '红宝石萌可', color: 'text-moko-rose', emoji: '❤️', season: 'S3 闪亮宝石', item: '红宝石', line: '红红火火惹人爱！', category: 'jewel' },

  // —— 魔法甜心萌可 ——
  sweetsping: { key: 'sweetsping', name: '甜心萌可', color: 'text-moko-pink', img: '/moko/sweetsping.jpg', emoji: '🍬', season: 'S5 魔法甜心', item: '甜心棒棒糖', line: '甜蜜蜜，字母糖！', category: 'sweetie', subject: '英语' },
  cottonping: { key: 'cottonping', name: '棉花糖萌可', color: 'text-moko-pink', emoji: '🍭', season: 'S5 魔法甜心', item: '棉花糖', line: '软软的，甜甜的！', category: 'sweetie' },
  chocoping: { key: 'chocoping', name: '巧克力萌可', color: 'text-moko-yellow', emoji: '🍫', season: 'S5 魔法甜心', item: '巧克力', line: '苦中带甜才好吃！', category: 'sweetie' },
  cakeping: { key: 'cakeping', name: '蛋糕萌可', color: 'text-moko-rose', emoji: '🍰', season: 'S5 魔法甜心', item: '草莓蛋糕', line: '生日快乐呀！', category: 'sweetie' },

  // —— 闪耀流星萌可 ——
  meteorping: { key: 'meteorping', name: '流星萌可', color: 'text-moko-cyan', emoji: '☄️', season: 'S6 闪耀流星', item: '流星灯', line: '快许个愿吧！', category: 'star' },
  starping: { key: 'starping', name: '星星萌可', color: 'text-moko-gold', emoji: '⭐', season: 'S6 闪耀流星', item: '小星星', line: '一闪一闪亮晶晶！', category: 'star' },
  cometping: { key: 'cometping', name: '彗星萌可', color: 'text-moko-violet', emoji: '🌠', season: 'S6 闪耀流星', item: '彗星扫把', line: '划过夜空啦！', category: 'star' },

  // —— 闪亮公主萌可 ——
  moonping: { key: 'moonping', name: '月光萌可', color: 'text-moko-violet', img: '/moko/moonping.jpg', emoji: '🌙', season: 'S7 闪亮公主', item: '月光皇冠', line: '月光之下，数到一百！', category: 'princess', subject: '数学' },
  hopeping: { key: 'hopeping', name: '希望萌可', color: 'text-moko-mint', img: '/moko/hopeping.jpg', emoji: '🌟', season: 'S7 闪亮公主', item: '希望之星', line: '永远不要放弃希望！', category: 'princess', subject: '语文' },
  princeping: { key: 'princeping', name: '王子萌可', color: 'text-moko-blue', emoji: '🤴', season: 'S7 闪亮公主', item: '黄金剑', line: '我来保护大家！', category: 'princess' },
  princessping: { key: 'princessping', name: '公主萌可', color: 'text-moko-rose', emoji: '👸', season: 'S7 闪亮公主', item: '公主裙', line: '今天也是小公主！', category: 'princess' },

  // —— 引导萌可 ——
  lemei: { key: 'lemei', name: '乐美公主', color: 'text-moko-rose', img: '/moko/lemei.jpg', emoji: '👑', season: '全季', item: '爱心魔杖', line: '一起捕捉萌可吧！', category: 'guide' },

  // —— 捣蛋萌可：未完成打卡时溜进城堡捣乱 ——
  naonao: { key: 'naonao', name: '闹闹萌可', color: 'text-slate-500', img: '/moko/transform_courage.jpg', emoji: '🤪', season: '捣蛋萌可', item: '吵闹喇叭', line: '嘻嘻，我来捣乱啦！', category: 'trouble' },
  mihu: { key: 'mihu', name: '迷糊萌可', color: 'text-slate-500', img: '/moko/transform_gem.jpg', emoji: '😵', season: '捣蛋萌可', item: '迷糊口袋', line: '唔…我的币呢？', category: 'trouble' },
  lulu: { key: 'lulu', name: '噜噜萌可', color: 'text-slate-500', img: '/moko/transform_music.jpg', emoji: '🫧', season: '捣蛋萌可', item: '噜噜泡泡', line: '噜噜噜~ 溜走啦！', category: 'trouble' },
  taopiping: { key: 'taopiping', name: '淘气萌可', color: 'text-slate-500', img: '/moko/transform_love.jpg', emoji: '😈', season: '捣蛋萌可', item: '捣蛋锤', line: '嘿嘿，看我的！', category: 'trouble' },
};

// 把核心萌可的图片重映射到真实图片集（同名首图更清晰、风格统一）
for (const k of Object.keys(mokoChars)) {
  const hit = mokoCollectionByName[mokoChars[k].name];
  if (hit?.img) mokoChars[k] = { ...mokoChars[k], img: hit.img };
}

// 乐美公主保持原来的头像照（/moko/lemei.jpg），不接入全身图「乐美萌可_render.webp」，
// 否则在孩子端/奖状/登录页里会显示成腿而不是头。

// 并入真实图片集（157 张，key 以 col_ 前缀），图鉴/奖状均可直接使用
for (const c of mokoCollection) mokoChars[c.key] = c;

/** 捣蛋萌可池（结算时随机挑选出场捣乱） */
export const troubleMokoKeys = ['naonao', 'mihu', 'lulu'];

export const games: {
  id: string;
  title: string;
  mokoKey: string;
  subject: string;
  desc: string;
  difficulty: string;
  levels: { name: string; tag: string }[];
}[] = [
  {
    id: 'pinyin-eliminate',
    title: '拼音消消乐',
    mokoKey: 'heartping',
    subject: '语文',
    desc: '把相同的拼音卡用爱心魔法配对消除',
    difficulty: '3 关递进',
    levels: [
      { name: '入门', tag: '6 对 · 基础拼音' },
      { name: '进阶', tag: '8 对 · 常见拼音' },
      { name: '高手', tag: '10 对 · 易混拼音' },
    ],
  },
  {
    id: 'character-match',
    title: '识字配对',
    mokoKey: 'curiousping',
    subject: '语文',
    desc: '汉字和图卡配对，帮好奇萌可捕捉生字',
    difficulty: '3 关递进',
    levels: [
      { name: '入门', tag: '6 字 · 形象字' },
      { name: '进阶', tag: '8 字 · 常用字' },
      { name: '高手', tag: '10 字 · 易混字' },
    ],
  },
  {
    id: 'math-challenge',
    title: '计算挑战',
    mokoKey: 'courageping',
    subject: '数学',
    desc: '正正闯关，加减法越快分越高',
    difficulty: '3 关递进',
    levels: [
      { name: '入门', tag: '1~10 加法' },
      { name: '进阶', tag: '1~20 加减' },
      { name: '高手', tag: '1~50 加减' },
    ],
  },
  {
    id: 'compare-balance',
    title: '大小比较天平',
    mokoKey: 'gemsping',
    subject: '数学',
    desc: '宝石天平比较数字与数量，找出轻重',
    difficulty: '3 关递进',
    levels: [
      { name: '入门', tag: '1~20 比较' },
      { name: '进阶', tag: '1~50 比较' },
      { name: '高手', tag: '1~100 比较' },
    ],
  },
  {
    id: 'word-match',
    title: '单词配对',
    mokoKey: 'keyping',
    subject: '英语',
    desc: '用万能钥匙解锁英文单词与中文意思',
    difficulty: '3 关递进',
    levels: [
      { name: '入门', tag: '6 对 · 基础词' },
      { name: '进阶', tag: '7 对 · 常用词' },
      { name: '高手', tag: '8 对 · 挑战词' },
    ],
  },
  {
    id: 'letter-adventure',
    title: '字母冒险',
    mokoKey: 'singping',
    subject: '英语',
    desc: '唱唱糖果收集字母，完成字母表',
    difficulty: '3 关递进',
    levels: [
      { name: '入门', tag: '大写字母' },
      { name: '进阶', tag: '小写字母' },
      { name: '高手', tag: '大小写混合' },
    ],
  },
  {
    id: 'angle-magic',
    title: '角度魔法',
    mokoKey: 'auroraping',
    subject: '数学',
    desc: '转动流星弓箭对准目标角度',
    difficulty: '3 关递进',
    levels: [
      { name: '入门', tag: '5 题 · 宽松' },
      { name: '进阶', tag: '7 题 · 中等' },
      { name: '高手', tag: '10 题 · 严格' },
    ],
  },
  {
    id: 'count-challenge',
    title: '数数挑战',
    mokoKey: 'moonping',
    subject: '数学',
    desc: '跟着月光萌可数星星到 100',
    difficulty: '3 关递进',
    levels: [
      { name: '入门', tag: '1~20 数数' },
      { name: '进阶', tag: '跳数练习' },
      { name: '高手', tag: '1~70 数数' },
    ],
  },
  {
    id: 'make-ten',
    title: '十格阵魔法屋',
    mokoKey: 'diamondping',
    subject: '数学',
    desc: '凑十·破十·进位，用十格阵玩转 20 以内加减',
    difficulty: '3 关递进',
    levels: [
      { name: '入门', tag: '凑十法' },
      { name: '进阶', tag: '破十法' },
      { name: '高手', tag: '进位加法' },
    ],
  },
  {
    id: 'pinyin-spell',
    title: '拼音拼拼拼',
    mokoKey: 'heartping',
    subject: '语文',
    desc: '声母＋韵母＋声调，拼出一个完整音节',
    difficulty: '3 关递进',
    levels: [
      { name: '入门', tag: '基础拼读' },
      { name: '进阶', tag: '易混韵母' },
      { name: '高手', tag: '快速拼读' },
    ],
  },
  {
    id: 'tone-detective',
    title: '声调小侦探',
    mokoKey: 'mihu',
    subject: '语文',
    desc: '听拼音，找出它是第几声',
    difficulty: '3 关递进',
    levels: [
      { name: '入门', tag: '基础四声' },
      { name: '进阶', tag: '同音辨调' },
      { name: '高手', tag: '快速辨调' },
    ],
  },
  {
    id: 'word-chain',
    title: '词语接龙',
    mokoKey: 'wisejingping',
    subject: '语文',
    desc: '看词语，接出下一个以尾字开头的新词',
    difficulty: '3 关递进',
    levels: [
      { name: '入门', tag: '常见词' },
      { name: '进阶', tag: '易混词' },
      { name: '高手', tag: '挑战词' },
    ],
  },
  {
    id: 'schulte',
    title: '舒尔特方格',
    mokoKey: 'cometping',
    subject: '专注',
    desc: '按顺序点出 1→N，训练专注力',
    difficulty: '3 关递进',
    levels: [
      { name: '入门', tag: '3×3' },
      { name: '进阶', tag: '4×4' },
      { name: '高手', tag: '5×5' },
    ],
  },
  {
    id: 'spot-difference',
    title: '火眼金睛找不同',
    mokoKey: 'curiousping',
    subject: '专注',
    desc: '左右两幅图只有一处不一样，圈出它',
    difficulty: '3 关递进',
    levels: [
      { name: '入门', tag: '4×3 · 12 格' },
      { name: '进阶', tag: '5×4 · 20 格' },
      { name: '高手', tag: '6×5 · 30 格' },
    ],
  },
  {
    id: 'sound-memory',
    title: '听觉记忆大挑战',
    mokoKey: 'wisejingping',
    subject: '专注',
    desc: '听一串数字，按顺序复述出来',
    difficulty: '3 关递进',
    levels: [
      { name: '入门', tag: '3 位数字' },
      { name: '进阶', tag: '4 位数字' },
      { name: '高手', tag: '5 位数字' },
    ],
  },
];

/** 萌可成长时长（分钟级，便于孩子体验，可在设置里调整） */
export const GROWTH_MIN = { settled: 10, playing: 30, friend: 60 };
// 经济常量已统一收口到 src/lib/economy.ts（单一事实来源），此处 import 供本文件使用，
// 并再导出以保持兼容（其他模块仍可从 moko 导入这些常量，无循环依赖）。
import {
  STAR_PER_FRIEND,
  SUN_PER_SUBJECT,
  PROSPERITY_BONUS,
  SHIELD_STREAK_REQ,
  COST_SPRAY,
  COST_SHIELD,
} from './economy';
export {
  STAR_PER_FRIEND,
  SUN_PER_SUBJECT,
  PROSPERITY_BONUS,
  SHIELD_STREAK_REQ,
};

/** 魔法商店（阳光能量消费） */
export const magicShop = [
  { key: 'spray', name: '魔法喷雾', cost: COST_SPRAY, icon: '🧴', desc: '帮乐美捉回所有捣蛋萌可 + 安抚全体萌可至满格心情 + 找回被藏星星币的 50%' },
  { key: 'shield', name: '护盾', cost: COST_SHIELD, icon: '🛡️', desc: `帮乐美挡住一次捣蛋萌可（需连续打卡 ${SHIELD_STREAK_REQ} 天才能兑换，兑换后自动装备）` },
];

/** 星星币商城（长期激励） */
export const starShop = [
  { key: 'cert', name: '🏆 虚拟奖状', cost: 30, icon: '🏆', desc: '可下载打印的专属成就奖状' },
  { key: 'frame', name: '🖼️ 萌可头像框', cost: 50, icon: '🖼️', desc: '装饰个人中心头像的萌可边框' },
  { key: 'outfit', name: '🎀 专属萌可装扮', cost: 60, icon: '🎀', desc: '给喜欢的萌可换上可爱装扮' },
  { key: 'skin_star', name: '🏰 星空城堡皮肤', cost: 80, icon: '🌌', desc: '把城堡变成梦幻星空主题' },
  { key: 'skin_candy', name: '🍬 糖果城堡皮肤', cost: 80, icon: '🍬', desc: '把城堡变成甜甜蜜糖主题' },
];

/**
 * 预设奖励模板（真实生活奖励，用「积分」兑换）。
 * 家长在「兑换管理」里可以一键套用这些模板快速给孩子发奖励，
 * 也方便孩子理解「攒积分能换到什么」。cost 为建议积分值，可改。
 */
export const REWARD_TEMPLATES = [
  { name: '去公园玩一小时', cost: 30 },
  { name: '多看一集动画片', cost: 20 },
  { name: '吃一个冰淇淋', cost: 15 },
  { name: '周末去游乐园', cost: 100 },
  { name: '和爸爸妈妈做手工', cost: 25 },
  { name: '晚睡 15 分钟', cost: 40 },
  { name: '邀请好朋友来玩', cost: 60 },
  { name: '买一本喜欢的书', cost: 50 },
  { name: '多玩 20 分钟游戏', cost: 35 },
  { name: '点一份喜欢的晚餐', cost: 45 },
];
