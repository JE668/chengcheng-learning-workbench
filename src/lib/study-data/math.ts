/**
 * 本文件由 study-data.ts 拆分而来（数据内容未改动，仅移动位置）。
 * 对外统一入口仍是 @/lib/study-data，见 src/lib/study-data.ts 的聚合 re-export。
 */

/* -------------------- 数学 -------------------- */
export const NUMBER_SENSE = Array.from({ length: 10 }, (_, i) => ({
  num: i + 1,
  finger: '👆'.repeat(i + 1),
  dots: i + 1,
}));

export interface CompareItem {
  left: number;
  right: number;
  type: 'quantity';
  leftIcon: string;
  rightIcon: string;
}

// 比较用的可爱图标池（左右随机取不同图标，避免混淆）
const COMPARE_ICONS = [
  '🍎', '🍊', '🐰', '🥕', '⭐', '🌟', '🍰', '🍭', '🚗', '🚕',
  '🍓', '🫐', '🌸', '🌻', '🐱', '🐶', '🍇', '🍉', '🦋', '🐝',
  '🍌', '🐻', '🍩', '🐥', '🌈', '🍒', '🐸', '🍑', '🐢', '🐟',
];

/**
 * 随机生成一道「比多少」题：左右各 1~10 个、图标随机且不重复。
 * 替代原先写死的 10 题（循环几轮就重复），每次点开/答对都换新的。
 */
export function makeCompareQuestion(): CompareItem {
  const pool = [...COMPARE_ICONS];
  const li = Math.floor(Math.random() * pool.length);
  const leftIcon = pool.splice(li, 1)[0];
  const ri = Math.floor(Math.random() * pool.length);
  const rightIcon = pool.splice(ri, 1)[0];
  const left = Math.floor(Math.random() * 10) + 1;
  const right = Math.floor(Math.random() * 10) + 1;
  return { left, right, type: 'quantity', leftIcon, rightIcon };
}

export interface ShapeItem {
  name: string;
  emoji: string;
  sides: number; // 边数（曲线记为 0）
  desc: string;
}

export const SHAPES: ShapeItem[] = [
  { name: '圆形', emoji: '⭕', sides: 0, desc: '没有角，圆滚滚像太阳' },
  { name: '正方形', emoji: '🟪', sides: 4, desc: '四条边一样长，方方正正' },
  { name: '长方形', emoji: '🟫', sides: 4, desc: '两条长两条短' },
  { name: '三角形', emoji: '🔺', sides: 3, desc: '三个尖尖的角' },
  { name: '椭圆形', emoji: '⬭', sides: 0, desc: '竖起来的圆，像鸡蛋' },
  { name: '半圆形', emoji: '🌓', sides: 0, desc: '圆的一半，像月亮船' },
  { name: '五角星', emoji: '⭐', sides: 5, desc: '五个角，闪亮亮' },
];

export interface AngleItem {
  name: '锐角' | '直角' | '钝角';
  desc: string;
  emoji: string;
  deg: number;
}

export const ANGLES: AngleItem[] = [
  { name: '锐角', desc: '比直角小，尖尖的', emoji: '🔺', deg: 45 },
  { name: '直角', desc: '方方正正，像书本的角', emoji: '📐', deg: 90 },
  { name: '钝角', desc: '比直角大，张得开开的', emoji: '😮', deg: 120 },
];

export interface MathQuestion {
  a: number;
  b: number;
  op: '+' | '-';
}

export function makeMathQuestions(level: 'easy' | 'medium' | 'hard' | 'carry' = 'easy'): MathQuestion[] {
  // 🎚️ 难度自适应：不同等级使用不同数字范围
  if (level === 'carry') {
    // 20 以内进位加法：两个一位数，个位相加满十（和 10~18）
    const qs: MathQuestion[] = [];
    for (let i = 0; i < 10; i++) {
      const a = Math.floor(Math.random() * 5) + 5; // 5~9
      const b = Math.floor(Math.random() * (10 - a)) + (10 - a); // 使 a+b >= 10
      qs.push({ a, b, op: '+' });
    }
    return qs;
  }
  const range = level === 'easy' ? 10 : level === 'medium' ? 20 : 30;
  const maxSum = level === 'easy' ? 10 : level === 'medium' ? 20 : 30;
  const qs: MathQuestion[] = [];
  for (let i = 0; i < 10; i++) {
    const op = Math.random() > 0.5 ? '+' : '-';
    let a = Math.floor(Math.random() * range) + 1;
    let b = Math.floor(Math.random() * range) + 1;
    if (op === '-') {
      if (a < b) [a, b] = [b, a];
    } else {
      if (a + b > maxSum) a = Math.max(1, maxSum - b);
    }
    qs.push({ a, b, op });
  }
  return qs;
}



/* ============================================================
   人教版（部编版）小学一年级上册 · 拓展内容
   ============================================================ */

/* -------------------- 数学 · 位置（上下前后左右） -------------------- */
export interface PositionItem {
  word: string;
  emoji: string;
  desc: string;
  example: string;
}
export const POSITIONS: PositionItem[] = [
  { word: '上', emoji: '⬆️', desc: '在……的上面', example: '小鸟在树上' },
  { word: '下', emoji: '⬇️', desc: '在……的下面', example: '小猫在桌下' },
  { word: '前', emoji: '🙆', desc: '面对的方向', example: '小狗在前面' },
  { word: '后', emoji: '🙅', desc: '背对的方向', example: '小兔在后面' },
  { word: '左', emoji: '👈', desc: '写字手的另一边', example: '铅笔在左边' },
  { word: '右', emoji: '👉', desc: '拿筷子的手那边', example: '杯子在右边' },
];

/* -------------------- 数学 · 认识图形（立体图形） -------------------- */
export interface SolidShapeItem {
  name: string;
  emoji: string;
  desc: string;
  roll: string;
}
export const SOLID_SHAPES: SolidShapeItem[] = [
  { name: '长方体', emoji: '📦', desc: '长长的，有 6 个平平的面（像纸巾盒）', roll: '不能滚' },
  { name: '正方体', emoji: '⬛', desc: '6 个面都一样大（像骰子）', roll: '不能滚' },
  { name: '圆柱', emoji: '🥫', desc: '上下两个圆圆的面，能立着（像罐头）', roll: '能躺着滚' },
  { name: '球', emoji: '⚽', desc: '圆滚滚的，到处都能滚（像皮球）', roll: '到处滚' },
];

/* -------------------- 数学 · 11~20 各数的认识 -------------------- */
export interface Number1120Item {
  num: number;
  tens: number;
  ones: number;
  compose: string;
}
export const NUMBERS_1120: Number1120Item[] = Array.from({ length: 10 }, (_, i) => {
  const num = i + 11;
  const ones = num % 10;
  return { num, tens: 1, ones, compose: `10 + ${ones}` };
});

/* -------------------- 数学 · 认识钟表（整时） -------------------- */
export interface ClockItem {
  hour: number;
  label: string;
}
export const CLOCKS: ClockItem[] = [
  { hour: 1, label: '1时' },
  { hour: 2, label: '2时' },
  { hour: 3, label: '3时' },
  { hour: 4, label: '4时' },
  { hour: 5, label: '5时' },
  { hour: 6, label: '6时' },
  { hour: 7, label: '7时' },
  { hour: 8, label: '8时' },
  { hour: 9, label: '9时' },
  { hour: 10, label: '10时' },
  { hour: 11, label: '11时' },
  { hour: 12, label: '12时' },
];

/* -------------------- 数学 · 分与合（2~10，一年级上册核心） -------------------- */
export interface SplitItem {
  num: number;
  pairs: [number, number][];
}
export const SPLITS: SplitItem[] = [
  { num: 2, pairs: [[1, 1]] },
  { num: 3, pairs: [[1, 2]] },
  { num: 4, pairs: [[1, 3], [2, 2]] },
  { num: 5, pairs: [[1, 4], [2, 3]] },
  { num: 6, pairs: [[1, 5], [2, 4], [3, 3]] },
  { num: 7, pairs: [[1, 6], [2, 5], [3, 4]] },
  { num: 8, pairs: [[1, 7], [2, 6], [3, 5], [4, 4]] },
  { num: 9, pairs: [[1, 8], [2, 7], [3, 6], [4, 5]] },
  { num: 10, pairs: [[1, 9], [2, 8], [3, 7], [4, 6], [5, 5]] },
];

/* =========================================================================
 * 以下为「幼小衔接 + 一年级」新增内容数据集（12 个拓展模块共用）
 * ========================================================================= */

/* -------------------- 数学 · 应用题（20 以内加减） -------------------- */
export interface WordProblemItem {
  text: string;
  options: string[]; // 含正确答案的数字字符串
  answer: string;
  emoji: string;
}
export const WORD_PROBLEMS: WordProblemItem[] = [
  { text: '小明有 3 颗糖，妈妈又给了 5 颗，现在有几颗？', options: ['7', '8', '9'], answer: '8', emoji: '🍬' },
  { text: '池塘里有 8 只鸭子，游走 3 只，还剩几只？', options: ['5', '6', '4'], answer: '5', emoji: '🦆' },
  { text: '树上原有 6 只鸟，又飞来 4 只，一共有几只？', options: ['10', '9', '11'], answer: '10', emoji: '🐦' },
  { text: '程程有 10 块饼干，吃了 2 块，还剩几块？', options: ['8', '7', '9'], answer: '8', emoji: '🍪' },
  { text: '停车场有 5 辆汽车，又开进 4 辆，现在有几辆？', options: ['9', '10', '8'], answer: '9', emoji: '🚗' },
  { text: '书包里有 7 本书，借给同学 2 本，还剩几本？', options: ['5', '6', '4'], answer: '5', emoji: '📚' },
  { text: '草地上有 4 头牛，又来了 5 头，一共几头？', options: ['9', '8', '10'], answer: '9', emoji: '🐮' },
  { text: '花丛里有 12 朵花，采了 3 朵，还剩几朵？', options: ['9', '8', '10'], answer: '9', emoji: '🌸' },
  { text: '鱼缸里有 9 条鱼，死了 1 条，还剩几条？', options: ['8', '7', '9'], answer: '8', emoji: '🐟' },
  { text: '弟弟有 6 个气球，破了 2 个，还剩几个？', options: ['4', '5', '3'], answer: '4', emoji: '🎈' },
  { text: '教室有 11 把椅子，搬走 4 把，还剩几把？', options: ['7', '6', '8'], answer: '7', emoji: '🪑' },
  { text: '水果盘有 5 个苹果，妈妈又放进 5 个，现在有几个？', options: ['10', '9', '11'], answer: '10', emoji: '🍎' },

  // —— 2025 新增：萌可主题应用题（正正萌可 & 伙伴们的冒险）——
  { text: '爱心萌可收到 6 朵小花，又收到 4 朵，一共有几朵？', options: ['9', '10', '11'], answer: '10', emoji: '💗' },
  { text: '宝石萌可找到 7 颗红宝石，又找到 5 颗蓝宝石，一共有几颗？', options: ['11', '12', '13'], answer: '12', emoji: '💎' },
  { text: '正正萌可救了 5 只小动物，又救了 6 只，一共救了多少只？', options: ['10', '11', '12'], answer: '11', emoji: '💪' },
  { text: '甜心萌可有 9 颗棒棒糖，分给唱唱萌可 3 颗，还剩几颗？', options: ['5', '6', '7'], answer: '6', emoji: '🍭' },
  { text: '淘气萌可藏了 8 个星星币，被找到 3 个，还有几个没找到？', options: ['4', '5', '6'], answer: '5', emoji: '😈' },
  { text: '唱唱萌可唱了 4 首歌，又唱了 5 首，一共唱了几首？', options: ['8', '9', '10'], answer: '9', emoji: '🎵' },
  { text: '宝盒萌可的宝盒里有 10 颗宝石，跳出去 2 颗，还有几颗？', options: ['7', '8', '9'], answer: '8', emoji: '🎁' },
  { text: '好奇萌可数了 6 只蝴蝶，又飞来 7 只，一共有几只？', options: ['12', '13', '14'], answer: '13', emoji: '🦋' },
  { text: '欢欢萌可吹了 8 个泡泡，破了 2 个，还有几个？', options: ['5', '6', '7'], answer: '6', emoji: '🫧' },
  { text: '月光萌可数到 11 颗星星，又亮起 3 颗，一共有几颗？', options: ['13', '14', '15'], answer: '14', emoji: '🌙' },
  { text: '温柔萌可叠了 7 件衣服，又叠了 4 件，一共叠了几件？', options: ['10', '11', '12'], answer: '11', emoji: '🌸' },
  { text: '乐美公主捉回 6 只捣蛋萌可，又捉回 5 只，一共捉回几只？', options: ['10', '11', '12'], answer: '11', emoji: '👑' },
  { text: '巧克力萌可做了 8 块小蛋糕，分给朋友 5 块，还剩几块？', options: ['2', '3', '4'], answer: '3', emoji: '🍰' },
  { text: '极光萌可画了 5 道彩虹，又画了 6 道，一共画了几道？', options: ['10', '11', '12'], answer: '11', emoji: '🌈' },
  { text: '钥匙萌可打开 3 个宝箱，又打开 4 个，一共打开了几个？', options: ['6', '7', '8'], answer: '7', emoji: '🔑' },
  { text: '星星萌可许了 6 个愿望，又许了 5 个，一共许了几个？', options: ['10', '11', '12'], answer: '11', emoji: '⭐' },
  { text: '公主萌可有 12 颗珍珠，掉了 4 颗，还剩几颗？', options: ['7', '8', '9'], answer: '8', emoji: '👸' },
  { text: '彗星萌可数到 4 道流星，又数到 7 道，一共数到几道？', options: ['10', '11', '12'], answer: '11', emoji: '🌠' },
  { text: '王子萌可修好 6 个玩具，又修好 5 个，一共修好几个？', options: ['10', '11', '12'], answer: '11', emoji: '🤴' },
  { text: '水果店有 9 串葡萄，卖了 4 串，还剩几串？', options: ['4', '5', '6'], answer: '5', emoji: '🍇' },

  // —— 2025 新增：稍难应用题（20~50 范围，含凑十/破十思维）——
  { text: '程程有 25 块积木，搭房子用了 8 块，还剩几块？', options: ['17', '16', '18'], answer: '17', emoji: '🧱' },
  { text: '爱心萌可收到 34 朵红花，送给温柔萌可 9 朵，还剩几朵？', options: ['25', '24', '26'], answer: '25', emoji: '🌹' },
  { text: '正正萌可做了 28 道口算题，又做了 15 道，一共做了几道？', options: ['43', '42', '44'], answer: '43', emoji: '📝' },
  { text: '唱唱萌可唱了 16 首歌，又唱了 19 首，一共唱了几首？', options: ['35', '34', '36'], answer: '35', emoji: '🎤' },
  { text: '宝石萌可找到 47 颗宝石，分给朋友 29 颗，还剩几颗？', options: ['18', '17', '19'], answer: '18', emoji: '💎' },
  { text: '好奇萌可数了 33 只蝴蝶，又飞来 18 只，一共有几只？', options: ['51', '50', '52'], answer: '51', emoji: '🦋' },
  { text: '程程有 52 颗星星币，买了一个 35 币的皮肤，还剩几币？', options: ['17', '16', '18'], answer: '17', emoji: '⭐' },
  { text: '乐美公主捉回 44 只捣蛋萌可，又捉回 27 只，一共捉回几只？', options: ['71', '70', '72'], answer: '71', emoji: '👑' },
  { text: '月光萌可数星星，第一晚数了 56 颗，第二晚数了 38 颗，两晚一共数了几颗？', options: ['94', '93', '95'], answer: '94', emoji: '🌙' },
  { text: '糖果店有 65 颗棒棒糖，卖出了 28 颗，还剩几颗？', options: ['37', '36', '38'], answer: '37', emoji: '🍭' },

  // —— 2025 新增：更多萌可主题应用题 ——
  { text: '爱心萌可做了 15 朵小红花，又做了 22 朵，一共做了几朵？', options: ['37', '36', '38'], answer: '37', emoji: '💗' },
  { text: '正正萌可跑了 28 米，又跑了 34 米，一共跑了多少米？', options: ['62', '61', '63'], answer: '62', emoji: '💪' },
  { text: '唱唱萌可唱了 18 首歌，又唱了 25 首，一共唱了几首？', options: ['43', '42', '44'], answer: '43', emoji: '🎵' },
  { text: '宝石萌可找到 36 颗红宝石、23 颗蓝宝石，一共有几颗宝石？', options: ['59', '58', '60'], answer: '59', emoji: '💎' },
  { text: '好奇萌可数了 42 只蚂蚁，又数了 19 只，一共数了几只？', options: ['61', '60', '62'], answer: '61', emoji: '🔍' },
  { text: '甜心萌可做了 24 块饼干，分给朋友 15 块，还剩几块？', options: ['9', '8', '10'], answer: '9', emoji: '🍪' },
  { text: '月光萌可数了 55 颗星星，云遮住了 27 颗，还能看到几颗？', options: ['28', '27', '29'], answer: '28', emoji: '🌙' },
  { text: '欢欢萌可吹了 33 个泡泡，破了 16 个，还有几个泡泡？', options: ['17', '16', '18'], answer: '17', emoji: '🫧' },
  { text: '温柔萌可叠了 46 件衣服，叠好 28 件，还剩几件没叠？', options: ['18', '17', '19'], answer: '18', emoji: '🌸' },
  { text: '钥匙萌可打开 31 个宝箱，里面 19 个有宝石，几个是空的？', options: ['12', '11', '13'], answer: '12', emoji: '🔑' },
];

/* -------------------- 数学 · 序数（第1~第N / 排队） -------------------- */
export interface OrdinalItem {
  row: string[]; // 一排 emoji
  ask: number; // 从左边数，第几个（0 基）
  question: string;
  answer: string; // 如 第3
}
export const ORDINALS: OrdinalItem[] = [
  { row: ['🐱', '🐶', '🐰', '🐯', '🐼'], ask: 2, question: '从左边数，🐰排第几？', answer: '第3' },
  { row: ['🍎', '🍌', '🍊', '🍇'], ask: 0, question: '从左边数，🍎排第几？', answer: '第1' },
  { row: ['🚌', '🚗', '🚕', '🚙', '🚎'], ask: 4, question: '从左边数，🚎排第几？', answer: '第5' },
  { row: ['🐟', '🐠', '🐡', '🦈'], ask: 1, question: '从左边数，🐠排第几？', answer: '第2' },
  { row: ['🌹', '🌻', '🌷', '🌼', '🌺'], ask: 2, question: '从左边数，🌷排第几？', answer: '第3' },
  { row: ['🍓', '🍉', '🍇', '🍒', '🍑'], ask: 3, question: '从左边数，🍒排第几？', answer: '第4' },
  { row: ['🦁', '🐯', '🐻', '🐼', '🐨'], ask: 4, question: '从左边数，🐨排第几？', answer: '第5' },
  { row: ['⭐', '🌙', '☁️', '⚡', '❄️'], ask: 3, question: '从左边数，⚡排第几？', answer: '第4' },
  // 新增：扩充到 15 道，减少重复
  { row: ['🐷', '🐮', '🐔', '🐴', '🐑'], ask: 1, question: '从左边数，🐮排第几？', answer: '第2' },
  { row: ['🚁', '✈️', '🚀', '🛸', '🛩️'], ask: 2, question: '从左边数，🚀排第几？', answer: '第3' },
  { row: ['🍞', '🥐', '🥖', '🍩', '🍪'], ask: 4, question: '从左边数，🍪排第几？', answer: '第5' },
  { row: ['🌈', '☔', '⛄', '☀️', '🌪️'], ask: 0, question: '从左边数，🌈排第几？', answer: '第1' },
  { row: ['🎃', '👻', '🧛', '🧟', '🧙'], ask: 3, question: '从左边数，🧟排第几？', answer: '第4' },
  { row: ['🎁', '🎀', '🎈', '🎊', '🎉'], ask: 2, question: '从左边数，🎈排第几？', answer: '第3' },
  { row: ['🧱', '🧲', '🔧', '🔨', '⚙️'], ask: 1, question: '从左边数，🔧排第几？', answer: '第2' },
  { row: ['🥕', '🥔', '🥦', '🌽', '🍅'], ask: 4, question: '从左边数，🍅排第几？', answer: '第5' },
];

/* -------------------- 数学 · 钟表半时（分针指 6） -------------------- */
export interface ClockHalfItem {
  hour: number;
  label: string;
}
export const CLOCK_HALF: ClockHalfItem[] = [
  { hour: 1, label: '1时半' },
  { hour: 2, label: '2时半' },
  { hour: 3, label: '3时半' },
  { hour: 4, label: '4时半' },
  { hour: 5, label: '5时半' },
  { hour: 6, label: '6时半' },
  { hour: 7, label: '7时半' },
  { hour: 8, label: '8时半' },
  { hour: 9, label: '9时半' },
  { hour: 10, label: '10时半' },
  { hour: 11, label: '11时半' },
  { hour: 12, label: '12时半' },
];

/* -------------------- 数学 · 比轻重 / 比长短 -------------------- */
export interface CompareMoreItem {
  a: string; // emoji
  b: string; // emoji
  question: string;
  options: string[];
  answer: string;
}
export const COMPARE_MORE: CompareMoreItem[] = [
  { a: '🐘', b: '🐭', question: '谁更重？', options: ['大象', '老鼠'], answer: '大象' },
  { a: '🚚', b: '🚲', question: '谁更重？', options: ['卡车', '自行车'], answer: '卡车' },
  { a: '🪨', b: '🪶', question: '谁更轻？', options: ['羽毛', '石头'], answer: '羽毛' },
  { a: '🍎', b: '🍒', question: '谁更重？', options: ['苹果', '樱桃'], answer: '苹果' },
  { a: '🐳', b: '🐟', question: '谁更重？', options: ['鲸鱼', '小鱼'], answer: '鲸鱼' },
  { a: '🪢', b: '✏️', question: '谁更长？', options: ['绳子', '铅笔'], answer: '绳子' },
  { a: '🚌', b: '🚗', question: '谁更长？', options: ['公交车', '小汽车'], answer: '公交车' },
  { a: '🐍', b: '🐛', question: '谁更长？', options: ['蛇', '毛毛虫'], answer: '蛇' },
  { a: '🏠', b: '⛺', question: '谁占的地方更大？', options: ['房子', '帐篷'], answer: '房子' },
  { a: '📕', b: '🪶', question: '谁更轻？', options: ['羽毛', '书'], answer: '羽毛' },
];

/* -------------------- 数学 · 星期 / 日历 / 天气 -------------------- */
export interface CalendarItem {
  question: string;
  options: string[];
  answer: string;
  emoji: string;
}
export const WEEK_CALENDAR: CalendarItem[] = [
  { question: '今天是星期一，明天是星期几？', options: ['星期二', '星期三', '星期日'], answer: '星期二', emoji: '📅' },
  { question: '今天是星期五，后天是星期几？', options: ['星期日', '星期六', '星期一'], answer: '星期日', emoji: '📆' },
  { question: '哪一天之后是星期六？', options: ['星期五', '星期日', '星期一'], answer: '星期五', emoji: '🗓️' },
  { question: '一个星期有几天？', options: ['7天', '5天', '6天'], answer: '7天', emoji: '🗓️' },
  { question: '晴天的时候，天上有什么？', options: ['太阳', '月亮', '星星'], answer: '太阳', emoji: '☀️' },
  { question: '下雨天出门要带什么？', options: ['雨伞', '墨镜', '扇子'], answer: '雨伞', emoji: '☔' },
  { question: '今天是星期三，昨天是星期几？', options: ['星期二', '星期四', '星期一'], answer: '星期二', emoji: '📅' },
  { question: '十二月过完，接着是几月？', options: ['一月', '十一月', '二月'], answer: '一月', emoji: '🎄' },
  { question: '哪个季节会下雪？', options: ['冬天', '夏天', '春天'], answer: '冬天', emoji: '❄️' },
  { question: '星期一的前一天是星期几？', options: ['星期日', '星期二', '星期六'], answer: '星期日', emoji: '📅' },
];
