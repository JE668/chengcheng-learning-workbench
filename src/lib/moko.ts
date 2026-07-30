import { MokoChar, Subject } from './types';

export const appName = process.env.NEXT_PUBLIC_APP_NAME || '程程学习工作台';

export const subjects: { key: Subject; label: string; color: string; img: string; desc: string }[] = [
  { key: '语文', label: '语文城堡', color: 'bg-moko-pink', img: '/moko/heartping.jpg', desc: '爱心萌可陪你认字读诗' },
  { key: '数学', label: '数学星球', color: 'bg-moko-blue', img: '/moko/courageping.jpg', desc: '勇气萌可挑战加减法' },
  { key: '英语', label: '英语乐园', color: 'bg-moko-yellow', img: '/moko/sweetsping.jpg', desc: '甜心萌可学字母单词' },
];

export const mokoChars: Record<string, MokoChar> = {
  heartping: { key: 'heartping', name: '爱心萌可', color: 'text-moko-rose', img: '/moko/heartping.jpg', season: 'S1-S2 魔方萌可', item: '爱心镜子', line: '啾~ 爱心光波！' },
  courageping: { key: 'courageping', name: '勇气萌可', color: 'text-moko-blue', img: '/moko/courageping.jpg', season: 'S2 勇气萌可', item: '勇气相机', line: '哈哈，无所畏惧！' },
  gemsping: { key: 'gemsping', name: '宝石萌可', color: 'text-moko-purple', img: '/moko/gemsping.jpg', season: 'S3 闪亮宝石', item: '闪亮宝石', line: '闪闪发光的宝石！' },
  keyping: { key: 'keyping', name: '钥匙萌可', color: 'text-moko-violet', img: '/moko/keyping.jpg', season: 'S4 魔法钥匙', item: '万能钥匙', line: '万能钥匙，打开知识！' },
  sweetsping: { key: 'sweetsping', name: '甜心萌可', color: 'text-moko-pink', img: '/moko/sweetsping.jpg', season: 'S5 魔法甜心', item: '甜心铃铛', line: '甜蜜蜜，字母糖！' },
  auroraping: { key: 'auroraping', name: '极光萌可', color: 'text-moko-cyan', img: '/moko/auroraping.jpg', season: 'S6 闪耀流星', item: '流星弓箭', line: '流星划过，角度正好！' },
  moonping: { key: 'moonping', name: '月神萌可', color: 'text-moko-violet', img: '/moko/moonping.jpg', season: 'S7 闪亮公主', item: '月光皇冠', line: '月光之下，数到一百！' },
  lemei: { key: 'lemei', name: '乐美公主', color: 'text-moko-rose', img: '/moko/lemei.jpg', season: '全季', item: '爱心魔杖', line: '一起捕捉萌可吧！' },
};

export const games: { id: string; title: string; mokoKey: string; subject: string; desc: string; difficulty: string }[] = [
  { id: 'pinyin-eliminate', title: '拼音消消乐', mokoKey: 'heartping', subject: '语文', desc: '把相同的拼音卡用爱心魔法配对消除', difficulty: '限时+连击' },
  { id: 'character-match', title: '识字配对', mokoKey: 'heartping', subject: '语文', desc: '汉字和图卡配对，帮爱心萌可捕捉生字', difficulty: '卡池递增' },
  { id: 'math-challenge', title: '计算挑战', mokoKey: 'courageping', subject: '数学', desc: '勇气闯关，加减法越快分越高', difficulty: '速度与进位' },
  { id: 'compare-balance', title: '大小比较天平', mokoKey: 'gemsping', subject: '数学', desc: '宝石天平比较数字与数量，找出轻重', difficulty: '多量比较' },
  { id: 'word-match', title: '单词配对', mokoKey: 'keyping', subject: '英语', desc: '用万能钥匙解锁英文单词与中文意思', difficulty: '混淆项' },
  { id: 'letter-adventure', title: '字母冒险', mokoKey: 'sweetsping', subject: '英语', desc: '甜心糖果收集字母，完成字母表', difficulty: '大小写混合' },
  { id: 'angle-magic', title: '角度魔法', mokoKey: 'auroraping', subject: '数学', desc: '转动流星弓箭对准目标角度', difficulty: '限时精确' },
  { id: 'count-challenge', title: '数数挑战', mokoKey: 'moonping', subject: '数学', desc: '跟着月神萌可数星星到 100', difficulty: '跳数与倒序' },
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
