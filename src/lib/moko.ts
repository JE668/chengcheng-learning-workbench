import { MokoChar, MokoCategoryKey, Subject } from './types';

export const appName = process.env.NEXT_PUBLIC_APP_NAME || '程程学习工作台';

/** 学科 → 对应萌可 key（用于每日打卡奖励） */
export const subjectMokoKey: Record<Subject, string> = {
  语文: 'heartping',
  数学: 'courageping',
  英语: 'singping',
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
export const MOko_CATEGORIES: { key: MokoCategoryKey; label: string; emoji: string; color: string; desc: string }[] = [
  { key: 'royal', label: '皇室萌可', emoji: '👑', color: 'text-moko-rose', desc: '守护魔法萌可王国的小公主们' },
  { key: 'key', label: '钥匙萌可', emoji: '🔑', color: 'text-moko-violet', desc: '掌管知识宝盒的钥匙精灵' },
  { key: 'jewel', label: '闪亮宝石萌可', emoji: '💎', color: 'text-moko-purple', desc: '住在宝石矿洞里的闪亮一族' },
  { key: 'sweetie', label: '魔法甜心萌可', emoji: '🍬', color: 'text-moko-pink', desc: '甜甜圈工厂里的糖果精灵' },
  { key: 'star', label: '闪耀流星萌可', emoji: '☄️', color: 'text-moko-cyan', desc: '追逐流星的天文萌可' },
  { key: 'princess', label: '闪亮公主萌可', emoji: '🌟', color: 'text-moko-gold', desc: '王国里最受宠爱的小公主' },
  { key: 'guide', label: '引导萌可', emoji: '🧭', color: 'text-moko-rose', desc: '带着爱心魔杖的领航员' },
  { key: 'trouble', label: '捣蛋萌可', emoji: '😈', color: 'text-slate-500', desc: '最爱搞恶作剧的小淘气' },
];

export const mokoChars: Record<string, MokoChar> = {
  // —— 皇室萌可（核心三科 + 伙伴）——
  heartping: { key: 'heartping', name: '爱心萌可', color: 'text-moko-rose', img: '/moko/heartping.jpg', emoji: '💗', season: 'S1 魔方萌可', item: '爱心镜子', line: '啾~ 爱心光波！', category: 'royal', subject: '语文' },
  courageping: { key: 'courageping', name: '正正萌可', color: 'text-moko-blue', img: '/moko/courageping.jpg', emoji: '💪', season: 'S1 魔方萌可', item: '勇气相机', line: '哈哈，无所畏惧！', category: 'royal', subject: '数学' },
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

  // —— 捣蛋萌可：未完成打卡时入侵城堡 ——
  naonao: { key: 'naonao', name: '闹闹萌可', color: 'text-slate-500', img: '/moko/transform_courage.jpg', emoji: '🤪', season: '捣蛋萌可', item: '吵闹喇叭', line: '嘻嘻，我来捣乱啦！', category: 'trouble' },
  mihu: { key: 'mihu', name: '迷糊萌可', color: 'text-slate-500', img: '/moko/transform_gem.jpg', emoji: '😵', season: '捣蛋萌可', item: '迷糊口袋', line: '唔…我的币呢？', category: 'trouble' },
  lulu: { key: 'lulu', name: '噜噜萌可', color: 'text-slate-500', img: '/moko/transform_music.jpg', emoji: '🫧', season: '捣蛋萌可', item: '噜噜泡泡', line: '噜噜噜~ 偷走啦！', category: 'trouble' },
  taopiping: { key: 'taopiping', name: '淘气萌可', color: 'text-slate-500', emoji: '😈', season: '捣蛋萌可', item: '捣蛋锤', line: '嘿嘿，看我的！', category: 'trouble' },
};

/** 捣蛋萌可池（结算时随机挑选入侵） */
export const troubleMokoKeys = ['naonao', 'mihu', 'lulu'];

export const games: { id: string; title: string; mokoKey: string; subject: string; desc: string; difficulty: string }[] = [
  { id: 'pinyin-eliminate', title: '拼音消消乐', mokoKey: 'heartping', subject: '语文', desc: '把相同的拼音卡用爱心魔法配对消除', difficulty: '限时+连击' },
  { id: 'character-match', title: '识字配对', mokoKey: 'heartping', subject: '语文', desc: '汉字和图卡配对，帮爱心萌可捕捉生字', difficulty: '卡池递增' },
  { id: 'math-challenge', title: '计算挑战', mokoKey: 'courageping', subject: '数学', desc: '正正闯关，加减法越快分越高', difficulty: '速度与进位' },
  { id: 'compare-balance', title: '大小比较天平', mokoKey: 'gemsping', subject: '数学', desc: '宝石天平比较数字与数量，找出轻重', difficulty: '多量比较' },
  { id: 'word-match', title: '单词配对', mokoKey: 'keyping', subject: '英语', desc: '用万能钥匙解锁英文单词与中文意思', difficulty: '混淆项' },
  { id: 'letter-adventure', title: '字母冒险', mokoKey: 'singping', subject: '英语', desc: '唱唱糖果收集字母，完成字母表', difficulty: '大小写混合' },
  { id: 'angle-magic', title: '角度魔法', mokoKey: 'auroraping', subject: '数学', desc: '转动流星弓箭对准目标角度', difficulty: '限时精确' },
  { id: 'count-challenge', title: '数数挑战', mokoKey: 'moonping', subject: '数学', desc: '跟着月光萌可数星星到 100', difficulty: '跳数与倒序' },
];

export const builtInLessons: Record<string, { title: string; points: number }[]> = {
  语文: [
    { title: '认字：一、二、三', points: 3 },
    { title: '认字：大、小、人', points: 3 },
    { title: '拼音：a o e', points: 4 },
    { title: '拼音：b p m f', points: 4 },
    { title: '古诗：静夜思', points: 5 },
  ],
  数学: [
    { title: '数数 1-20', points: 3 },
    { title: '比大小', points: 3 },
    { title: '10 以内加法', points: 4 },
    { title: '10 以内减法', points: 4 },
    { title: '认识形状', points: 3 },
  ],
  英语: [
    { title: '字母 A-G', points: 3 },
    { title: '字母 H-N', points: 3 },
    { title: '常见动物单词', points: 4 },
    { title: '常见水果单词', points: 4 },
    { title: '颜色单词', points: 3 },
  ],
};

/** 萌可成长时长（分钟级，便于孩子体验，可在设置里调整） */
export const GROWTH_MIN = { settled: 10, playing: 30, friend: 60 };
/** 成为好朋友后每日可收获的星星币 */
export const STAR_PER_FRIEND = 5;
/** 单科打卡奖励 */
export const SUN_PER_SUBJECT = 1;
/** 集齐三科额外繁荣度 */
export const PROSPERITY_BONUS = 5;
/** 护盾兑换所需连续打卡天数 */
export const SHIELD_STREAK_REQ = 3;

/** 魔法商店（阳光能量消费） */
export const magicShop = [
  { key: 'spray', name: '魔法喷雾', cost: 5, icon: '🧴', desc: '驱散所有捣蛋萌可 + 恢复全体心情至满格 + 返还被偷星星币的 50%' },
  { key: 'shield', name: '护盾', cost: 10, icon: '🛡️', desc: `抵挡一次捣蛋萌可攻击（需连续打卡 ${SHIELD_STREAK_REQ} 天才能兑换，兑换后自动装备）` },
];

/** 星星币商城（长期激励） */
export const starShop = [
  { key: 'cert', name: '🏆 虚拟奖状', cost: 30, icon: '🏆', desc: '可下载打印的专属成就奖状' },
  { key: 'frame', name: '🖼️ 萌可头像框', cost: 50, icon: '🖼️', desc: '装饰个人中心头像的萌可边框' },
  { key: 'outfit', name: '🎀 专属萌可装扮', cost: 60, icon: '🎀', desc: '给喜欢的萌可换上可爱装扮' },
  { key: 'skin_star', name: '🏰 星空城堡皮肤', cost: 80, icon: '🌌', desc: '把城堡变成梦幻星空主题' },
  { key: 'skin_candy', name: '🍬 糖果城堡皮肤', cost: 80, icon: '🍬', desc: '把城堡变成甜甜蜜糖主题' },
];
