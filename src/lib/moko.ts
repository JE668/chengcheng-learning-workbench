import { MokoChar, Subject } from './types';

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
 * 萌可图鉴（种类更丰富）
 * category: subject(学科萌可) | bonus(奖励萌可) | guide(引导萌可) | trouble(捣蛋萌可)
 */
export const mokoChars: Record<string, MokoChar> = {
  // —— 学科萌可：每日三科打卡解锁 ——
  heartping: { key: 'heartping', name: '爱心萌可', color: 'text-moko-rose', img: '/moko/heartping.jpg', season: 'S1-S2 魔方萌可', item: '爱心镜子', line: '啾~ 爱心光波！', category: 'subject', subject: '语文' },
  courageping: { key: 'courageping', name: '正正萌可', color: 'text-moko-blue', img: '/moko/courageping.jpg', season: 'S2 勇气萌可', item: '勇气相机', line: '哈哈，无所畏惧！', category: 'subject', subject: '数学' },
  singping: { key: 'singping', name: '唱唱萌可', color: 'text-moko-yellow', img: '/moko/singping.jpg', season: 'S5 魔法甜心', item: '甜心铃铛', line: '啦啦啦，唱给世界听！', category: 'subject', subject: '英语' },

  // —— 奖励萌可：通过游戏 / 连续打卡 / 特殊成就解锁 ——
  gemsping: { key: 'gemsping', name: '宝石萌可', color: 'text-moko-purple', img: '/moko/gemsping.jpg', season: 'S3 闪亮宝石', item: '闪亮宝石', line: '闪闪发光的宝石！', category: 'bonus', subject: '数学' },
  keyping: { key: 'keyping', name: '钥匙萌可', color: 'text-moko-violet', img: '/moko/keyping.jpg', season: 'S4 魔法钥匙', item: '万能钥匙', line: '万能钥匙，打开知识！', category: 'bonus', subject: '英语' },
  sweetsping: { key: 'sweetsping', name: '甜心萌可', color: 'text-moko-pink', img: '/moko/sweetsping.jpg', season: 'S5 魔法甜心', item: '甜心棒棒糖', line: '甜蜜蜜，字母糖！', category: 'bonus', subject: '英语' },
  auroraping: { key: 'auroraping', name: '极光萌可', color: 'text-moko-cyan', img: '/moko/auroraping.jpg', season: 'S6 闪耀流星', item: '流星弓箭', line: '流星划过，角度正好！', category: 'bonus', subject: '数学' },
  moonping: { key: 'moonping', name: '月光萌可', color: 'text-moko-violet', img: '/moko/moonping.jpg', season: 'S7 闪亮公主', item: '月光皇冠', line: '月光之下，数到一百！', category: 'bonus', subject: '数学' },
  hopeping: { key: 'hopeping', name: '希望萌可', color: 'text-moko-mint', img: '/moko/hopeping.jpg', season: 'S7 希望萌可', item: '希望之星', line: '永远不要放弃希望！', category: 'bonus', subject: '语文' },
  lemei: { key: 'lemei', name: '乐美公主', color: 'text-moko-rose', img: '/moko/lemei.jpg', season: '全季', item: '爱心魔杖', line: '一起捕捉萌可吧！', category: 'guide' },

  // —— 捣蛋萌可：未完成打卡时入侵城堡 ——
  naonao: { key: 'naonao', name: '闹闹萌可', color: 'text-slate-500', img: '/moko/transform_courage.jpg', season: '捣蛋萌可', item: '吵闹喇叭', line: '嘻嘻，我来捣乱啦！', category: 'trouble' },
  mihu: { key: 'mihu', name: '迷糊萌可', color: 'text-slate-500', img: '/moko/transform_gem.jpg', season: '捣蛋萌可', item: '迷糊口袋', line: '唔…我的币呢？', category: 'trouble' },
  lulu: { key: 'lulu', name: '噜噜萌可', color: 'text-slate-500', img: '/moko/transform_music.jpg', season: '捣蛋萌可', item: '噜噜泡泡', line: '噜噜噜~ 偷走啦！', category: 'trouble' },
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
