/* ============================================================
   程程学习工作台 — 自主学习内容数据
   结合人教版一年级上册 + RAZ AA + 幼小衔接
   拼音已按「单韵母 / 声母 / 复韵母 / 前后鼻韵母 / 整体认读」系统补全，
   声调与例词均经校对。
   ============================================================ */

export type Subject = '语文' | '数学' | '英语';

/* -------------------- 语文 · 拼音 -------------------- */
export interface PinyinItem {
  pinyin: string;
  tone: number; // 1-4, 0 为轻声 / 声母 / 整体认读
  examples: string[];
}

export const PINYIN_GROUPS: { group: string; sub?: string; items: PinyinItem[] }[] = [
  {
    group: '单韵母',
    sub: 'a o e i u ü',
    items: [
      { pinyin: 'a', tone: 1, examples: ['阿姨 ā yí', '啊 ā'] },
      { pinyin: 'o', tone: 1, examples: ['喔 ō', '哦 ó'] },
      { pinyin: 'e', tone: 1, examples: ['鹅 é', '饿 è'] },
      { pinyin: 'i', tone: 1, examples: ['衣服 yī fu', '一 yī'] },
      { pinyin: 'u', tone: 1, examples: ['乌龟 wū guī', '五 wǔ'] },
      { pinyin: 'ü', tone: 2, examples: ['鱼 yú', '雨 yǔ'] },
    ],
  },
  {
    group: '声母',
    sub: 'b p m f d t n l g k h j q x zh ch sh r z c s y w',
    items: [
      { pinyin: 'b', tone: 0, examples: ['爸爸 bà ba', '笔 bǐ'] },
      { pinyin: 'p', tone: 0, examples: ['苹果 píng guǒ', '跑 pǎo'] },
      { pinyin: 'm', tone: 0, examples: ['妈妈 mā ma', '猫 māo'] },
      { pinyin: 'f', tone: 0, examples: ['飞机 fēi jī', '风 fēng'] },
      { pinyin: 'd', tone: 0, examples: ['大象 dà xiàng', '大 dà'] },
      { pinyin: 't', tone: 0, examples: ['兔子 tù zi', '踢 tī'] },
      { pinyin: 'n', tone: 0, examples: ['牛奶 niú nǎi', '鸟 niǎo'] },
      { pinyin: 'l', tone: 0, examples: ['老虎 lǎo hǔ', '来 lái'] },
      { pinyin: 'g', tone: 0, examples: ['鸽子 gē zi', '狗 gǒu'] },
      { pinyin: 'k', tone: 0, examples: ['卡车 kǎ chē', '看 kàn'] },
      { pinyin: 'h', tone: 0, examples: ['荷花 hé huā', '红 hóng'] },
      { pinyin: 'j', tone: 0, examples: ['积木 jī mù', '鸡 jī'] },
      { pinyin: 'q', tone: 0, examples: ['气球 qì qiú', '七 qī'] },
      { pinyin: 'x', tone: 0, examples: ['西瓜 xī guā', '笑 xiào'] },
      { pinyin: 'zh', tone: 0, examples: ['蜘蛛 zhī zhū', '中 zhōng'] },
      { pinyin: 'ch', tone: 0, examples: ['吃饭 chī fàn', '虫 chóng'] },
      { pinyin: 'sh', tone: 0, examples: ['狮子 shī zi', '水 shuǐ'] },
      { pinyin: 'r', tone: 0, examples: ['日历 rì lì', '日 rì'] },
      { pinyin: 'z', tone: 0, examples: ['自行车 zì xíng chē', '走 zǒu'] },
      { pinyin: 'c', tone: 0, examples: ['草帽 cǎo mào', '草 cǎo'] },
      { pinyin: 's', tone: 0, examples: ['雨伞 yǔ sǎn', '三 sān'] },
      { pinyin: 'y', tone: 0, examples: ['衣服 yī fu', '鸭 yā'] },
      { pinyin: 'w', tone: 0, examples: ['乌龟 wū guī', '我 wǒ'] },
    ],
  },
  {
    group: '复韵母',
    sub: 'ai ei ui ao ou iu ie üe er',
    items: [
      { pinyin: 'ai', tone: 0, examples: ['爱 ài', '白菜 bái cài'] },
      { pinyin: 'ei', tone: 0, examples: ['杯 bēi', '飞机 fēi jī'] },
      { pinyin: 'ui', tone: 0, examples: ['水 shuǐ', '妹妹 mèi mei'] },
      { pinyin: 'ao', tone: 0, examples: ['猫 māo', '泡泡 pào pao'] },
      { pinyin: 'ou', tone: 0, examples: ['藕 ǒu', '猴 hóu'] },
      { pinyin: 'iu', tone: 0, examples: ['球 qiú', '牛 niú'] },
      { pinyin: 'ie', tone: 0, examples: ['树叶 shù yè', '鞋 xié'] },
      { pinyin: 'üe', tone: 0, examples: ['月 yuè', '雪 xuě'] },
      { pinyin: 'er', tone: 0, examples: ['耳 ěr', '二 èr'] },
    ],
  },
  {
    group: '前鼻韵母',
    sub: 'an en in un ün',
    items: [
      { pinyin: 'an', tone: 0, examples: ['天安门 ān', '晚 wǎn'] },
      { pinyin: 'en', tone: 0, examples: ['恩 ēn', '本 běn'] },
      { pinyin: 'in', tone: 0, examples: ['音乐 yīn yuè', '进 jìn'] },
      { pinyin: 'un', tone: 0, examples: ['温 wēn', '蚊子 wén zi'] },
      { pinyin: 'ün', tone: 0, examples: ['云 yún', '裙子 qún zi'] },
    ],
  },
  {
    group: '后鼻韵母',
    sub: 'ang eng ing ong',
    items: [
      { pinyin: 'ang', tone: 0, examples: ['昂 áng', '帮 bāng'] },
      { pinyin: 'eng', tone: 0, examples: ['灯 dēng', '风 fēng'] },
      { pinyin: 'ing', tone: 0, examples: ['鹰 yīng', '星 xīng'] },
      { pinyin: 'ong', tone: 0, examples: ['钟 zhōng', '红 hóng'] },
    ],
  },
  {
    group: '整体认读音节',
    sub: '不用拼，直接读',
    items: [
      { pinyin: 'zhi', tone: 0, examples: ['知 zhī', '蜘蛛 zhī zhū'] },
      { pinyin: 'chi', tone: 0, examples: ['吃 chī', '牙齿 yá chǐ'] },
      { pinyin: 'shi', tone: 0, examples: ['狮 shī', '老师 lǎo shī'] },
      { pinyin: 'ri', tone: 0, examples: ['日 rì', '日历 rì lì'] },
      { pinyin: 'zi', tone: 0, examples: ['字 zì', '自己 zì jǐ'] },
      { pinyin: 'ci', tone: 0, examples: ['词 cí', '刺 cì'] },
      { pinyin: 'si', tone: 0, examples: ['丝 sī', '四 sì'] },
      { pinyin: 'yi', tone: 0, examples: ['衣 yī', '医生 yī shēng'] },
      { pinyin: 'wu', tone: 0, examples: ['乌 wū', '五 wǔ'] },
      { pinyin: 'yu', tone: 0, examples: ['鱼 yú', '雨 yǔ'] },
      { pinyin: 'ye', tone: 0, examples: ['叶 yè', '爷爷 yé ye'] },
      { pinyin: 'yue', tone: 0, examples: ['月 yuè', '音乐 yīn yuè'] },
      { pinyin: 'yuan', tone: 0, examples: ['圆 yuán', '元旦 yuán dàn'] },
      { pinyin: 'yin', tone: 0, examples: ['音 yīn', '音乐 yīn yuè'] },
      { pinyin: 'yun', tone: 0, examples: ['云 yún', '运气 yùn qì'] },
      { pinyin: 'ying', tone: 0, examples: ['鹰 yīng', '英雄 yīng xióng'] },
    ],
  },
];

/* -------------------- 语文 · 识字（按类别） -------------------- */
export interface CharacterItem {
  char: string;
  strokeCount: number;
  meaning: string;
  phrase: string;
  category: string;
}

export const CHARACTER_CATEGORIES = ['数字', '自然', '人体', '家庭', '方位', '动作', '颜色', '动物', '植物', '物品'];

export const CHARACTERS: CharacterItem[] = [
  // 数字
  { char: '一', strokeCount: 1, meaning: '数字 1', phrase: '一个苹果', category: '数字' },
  { char: '二', strokeCount: 2, meaning: '数字 2', phrase: '二只小鸟', category: '数字' },
  { char: '三', strokeCount: 3, meaning: '数字 3', phrase: '三只兔子', category: '数字' },
  { char: '四', strokeCount: 5, meaning: '数字 4', phrase: '四个气球', category: '数字' },
  { char: '五', strokeCount: 4, meaning: '数字 5', phrase: '五颗星星', category: '数字' },
  { char: '六', strokeCount: 4, meaning: '数字 6', phrase: '六个雪人', category: '数字' },
  { char: '七', strokeCount: 2, meaning: '数字 7', phrase: '七朵花', category: '数字' },
  { char: '八', strokeCount: 2, meaning: '数字 8', phrase: '八只狗', category: '数字' },
  { char: '九', strokeCount: 2, meaning: '数字 9', phrase: '九片叶', category: '数字' },
  { char: '十', strokeCount: 2, meaning: '数字 10', phrase: '十个小朋友', category: '数字' },
  // 自然
  { char: '天', strokeCount: 4, meaning: '天空', phrase: '今天天气好', category: '自然' },
  { char: '地', strokeCount: 6, meaning: '大地', phrase: '大地是绿色的', category: '自然' },
  { char: '日', strokeCount: 4, meaning: '太阳 / 日子', phrase: '红日东升', category: '自然' },
  { char: '月', strokeCount: 4, meaning: '月亮', phrase: '弯弯的月儿', category: '自然' },
  { char: '水', strokeCount: 4, meaning: '水流', phrase: '清水哗哗流', category: '自然' },
  { char: '火', strokeCount: 4, meaning: '火焰', phrase: '红红火火', category: '自然' },
  { char: '山', strokeCount: 3, meaning: '高山', phrase: '大山高高', category: '自然' },
  { char: '石', strokeCount: 5, meaning: '石头', phrase: '一块石头', category: '自然' },
  { char: '田', strokeCount: 5, meaning: '田地', phrase: '种田真辛苦', category: '自然' },
  { char: '土', strokeCount: 3, meaning: '泥土', phrase: '泥土香喷喷', category: '自然' },
  // 人体
  { char: '人', strokeCount: 2, meaning: '人们', phrase: '大人小孩', category: '人体' },
  { char: '口', strokeCount: 3, meaning: '嘴巴', phrase: '一口水', category: '人体' },
  { char: '耳', strokeCount: 6, meaning: '耳朵', phrase: '竖起耳朵', category: '人体' },
  { char: '目', strokeCount: 5, meaning: '眼睛', phrase: '目不转睛', category: '人体' },
  { char: '手', strokeCount: 4, meaning: '手掌', phrase: '小手真能干', category: '人体' },
  { char: '足', strokeCount: 7, meaning: '脚', phrase: '足球真好玩', category: '人体' },
  { char: '头', strokeCount: 5, meaning: '脑袋', phrase: '洗头洗澡', category: '人体' },
  { char: '心', strokeCount: 4, meaning: '心脏', phrase: '心情真好', category: '人体' },
  // 家庭
  { char: '父', strokeCount: 4, meaning: '爸爸', phrase: '父爱如山', category: '家庭' },
  { char: '母', strokeCount: 5, meaning: '妈妈', phrase: '母爱温暖', category: '家庭' },
  { char: '儿', strokeCount: 2, meaning: '孩子', phrase: '儿童节快乐', category: '家庭' },
  { char: '女', strokeCount: 3, meaning: '女孩', phrase: '女孩子', category: '家庭' },
  { char: '子', strokeCount: 3, meaning: '小孩', phrase: '子儿满地跑', category: '家庭' },
  // 方位
  { char: '上', strokeCount: 3, meaning: '上面', phrase: '天上飞', category: '方位' },
  { char: '下', strokeCount: 3, meaning: '下面', phrase: '树下坐', category: '方位' },
  { char: '左', strokeCount: 5, meaning: '左边', phrase: '左手拿笔', category: '方位' },
  { char: '右', strokeCount: 5, meaning: '右边', phrase: '右手举手', category: '方位' },
  { char: '中', strokeCount: 4, meaning: '中间', phrase: '水中月', category: '方位' },
  // 动作
  { char: '来', strokeCount: 7, meaning: '过来', phrase: '快来玩', category: '动作' },
  { char: '去', strokeCount: 5, meaning: '离开', phrase: '去上学', category: '动作' },
  { char: '坐', strokeCount: 7, meaning: '坐下', phrase: '坐端正', category: '动作' },
  { char: '立', strokeCount: 5, meaning: '站立', phrase: '立正', category: '动作' },
  { char: '走', strokeCount: 7, meaning: '步行', phrase: '走一走', category: '动作' },
  { char: '飞', strokeCount: 3, meaning: '飞翔', phrase: '小鸟飞', category: '动作' },
  // 颜色
  { char: '红', strokeCount: 6, meaning: '红色', phrase: '红花朵朵', category: '颜色' },
  { char: '白', strokeCount: 5, meaning: '白色', phrase: '白云飘飘', category: '颜色' },
  { char: '黑', strokeCount: 12, meaning: '黑色', phrase: '黑夜来了', category: '颜色' },
  // 动物
  { char: '马', strokeCount: 3, meaning: '马儿', phrase: '小马快跑', category: '动物' },
  { char: '牛', strokeCount: 4, meaning: '牛', phrase: '老牛耕田', category: '动物' },
  { char: '羊', strokeCount: 6, meaning: '羊', phrase: '小羊咩咩', category: '动物' },
  { char: '鸟', strokeCount: 5, meaning: '鸟儿', phrase: '小鸟唱歌', category: '动物' },
  { char: '鱼', strokeCount: 8, meaning: '鱼类', phrase: '小鱼游水', category: '动物' },
  { char: '虫', strokeCount: 6, meaning: '虫子', phrase: '小虫爬爬', category: '动物' },
  // 植物
  { char: '花', strokeCount: 7, meaning: '花朵', phrase: '花儿香', category: '植物' },
  { char: '木', strokeCount: 4, meaning: '树木', phrase: '木头桌子', category: '植物' },
  { char: '草', strokeCount: 9, meaning: '青草', phrase: '小草绿', category: '植物' },
  { char: '叶', strokeCount: 5, meaning: '叶子', phrase: '树叶黄', category: '植物' },
  // 物品
  { char: '书', strokeCount: 4, meaning: '书本', phrase: '读书啦', category: '物品' },
  { char: '笔', strokeCount: 10, meaning: '笔', phrase: '铅笔写字', category: '物品' },
  { char: '刀', strokeCount: 2, meaning: '小刀', phrase: '水果刀', category: '物品' },
  { char: '门', strokeCount: 3, meaning: '门', phrase: '开门请进', category: '物品' },
];

/* -------------------- 语文 · 古诗词（小学必背） -------------------- */
export interface PoemItem {
  title: string;
  author: string;
  lines: string[];
}

export const POEMS: PoemItem[] = [
  { title: '咏鹅', author: '骆宾王', lines: ['鹅，鹅，鹅，', '曲项向天歌。', '白毛浮绿水，', '红掌拨清波。'] },
  { title: '悯农（其二）', author: '李绅', lines: ['锄禾日当午，', '汗滴禾下土。', '谁知盘中餐，', '粒粒皆辛苦。'] },
  { title: '静夜思', author: '李白', lines: ['床前明月光，', '疑是地上霜。', '举头望明月，', '低头思故乡。'] },
  { title: '江南', author: '汉乐府', lines: ['江南可采莲，', '莲叶何田田。', '鱼戏莲叶间。', '鱼戏莲叶东，', '鱼戏莲叶西。'] },
  { title: '春晓', author: '孟浩然', lines: ['春眠不觉晓，', '处处闻啼鸟。', '夜来风雨声，', '花落知多少。'] },
  { title: '村居', author: '高鼎', lines: ['草长莺飞二月天，', '拂堤杨柳醉春烟。', '儿童散学归来早，', '忙趁东风放纸鸢。'] },
  { title: '咏柳', author: '贺知章', lines: ['碧玉妆成一树高，', '万条垂下绿丝绦。', '不知细叶谁裁出，', '二月春风似剪刀。'] },
  { title: '登鹳雀楼', author: '王之涣', lines: ['白日依山尽，', '黄河入海流。', '欲穷千里目，', '更上一层楼。'] },
  { title: '敕勒歌', author: '北朝民歌', lines: ['敕勒川，阴山下。', '天似穹庐，笼盖四野。', '天苍苍，野茫茫，', '风吹草低见牛羊。'] },
  { title: '池上', author: '白居易', lines: ['小娃撑小艇，', '偷采白莲回。', '不解藏踪迹，', '浮萍一道开。'] },
  { title: '小池', author: '杨万里', lines: ['泉眼无声惜细流，', '树阴照水爱晴柔。', '小荷才露尖尖角，', '早有蜻蜓立上头。'] },
  { title: '画', author: '王维', lines: ['远看山有色，', '近听水无声。', '春去花还在，', '人来鸟不惊。'] },
];

/* -------------------- 数学 -------------------- */
export const NUMBER_SENSE = Array.from({ length: 10 }, (_, i) => ({
  num: i + 1,
  finger: '👆'.repeat(i + 1),
  dots: i + 1,
}));

export interface CompareItem {
  left: number;
  right: number;
  type: 'size' | 'quantity';
  leftIcon: string;
  rightIcon: string;
}

export const COMPARE_QUESTIONS: CompareItem[] = [
  { left: 3, right: 7, type: 'quantity', leftIcon: '🍎', rightIcon: '🍊' },
  { left: 5, right: 2, type: 'quantity', leftIcon: '🐰', rightIcon: '🥕' },
  { left: 6, right: 6, type: 'quantity', leftIcon: '⭐', rightIcon: '🌟' },
  { left: 4, right: 9, type: 'quantity', leftIcon: '🍰', rightIcon: '🍭' },
  { left: 8, right: 3, type: 'quantity', leftIcon: '🚗', rightIcon: '🚕' },
  { left: 10, right: 1, type: 'quantity', leftIcon: '🍓', rightIcon: '🫐' },
  { left: 2, right: 5, type: 'quantity', leftIcon: '🌸', rightIcon: '🌻' },
  { left: 7, right: 7, type: 'quantity', leftIcon: '🐱', rightIcon: '🐶' },
  { left: 9, right: 4, type: 'quantity', leftIcon: '🍇', rightIcon: '🍉' },
  { left: 1, right: 8, type: 'quantity', leftIcon: '🦋', rightIcon: '🐝' },
];

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

export function makeMathQuestions(level: 'easy' | 'medium' | 'hard' = 'easy'): MathQuestion[] {
  // 🎚️ 难度自适应：不同等级使用不同数字范围
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

/* -------------------- 英语 -------------------- */
export interface LetterItem {
  letter: string;
  word: string;
  emoji: string;
}

export const LETTERS: LetterItem[] = [
  { letter: 'A', word: 'Apple', emoji: '🍎' },
  { letter: 'B', word: 'Ball', emoji: '⚽' },
  { letter: 'C', word: 'Cat', emoji: '🐱' },
  { letter: 'D', word: 'Dog', emoji: '🐶' },
  { letter: 'E', word: 'Egg', emoji: '🥚' },
  { letter: 'F', word: 'Fish', emoji: '🐟' },
  { letter: 'G', word: 'Grapes', emoji: '🍇' },
  { letter: 'H', word: 'Hat', emoji: '🧢' },
  { letter: 'I', word: 'Ice cream', emoji: '🍦' },
  { letter: 'J', word: 'Juice', emoji: '🧃' },
  { letter: 'K', word: 'Kite', emoji: '🪁' },
  { letter: 'L', word: 'Lion', emoji: '🦁' },
  { letter: 'M', word: 'Moon', emoji: '🌙' },
  { letter: 'N', word: 'Nest', emoji: '🪺' },
  { letter: 'O', word: 'Orange', emoji: '🍊' },
  { letter: 'P', word: 'Pig', emoji: '🐷' },
  { letter: 'Q', word: 'Queen', emoji: '👑' },
  { letter: 'R', word: 'Rabbit', emoji: '🐰' },
  { letter: 'S', word: 'Sun', emoji: '☀️' },
  { letter: 'T', word: 'Tiger', emoji: '🐯' },
  { letter: 'U', word: 'Umbrella', emoji: '☂️' },
  { letter: 'V', word: 'Violin', emoji: '🎻' },
  { letter: 'W', word: 'Water', emoji: '💧' },
  { letter: 'X', word: 'Xylophone', emoji: '🎼' },
  { letter: 'Y', word: 'Yellow', emoji: '🟡' },
  { letter: 'Z', word: 'Zebra', emoji: '🦓' },
];

export interface WordItem {
  word: string;
  cn: string;
  emoji: string;
  sentence?: string;
}

// RAZ AA 级核心词 + 常见幼小词汇，按主题分类
export const EN_WORD_TOPICS: Record<string, WordItem[]> = {
  动物: [
    { word: 'cat', cn: '猫', emoji: '🐱', sentence: 'I see a cat.' },
    { word: 'dog', cn: '狗', emoji: '🐶', sentence: 'I see a dog.' },
    { word: 'pig', cn: '猪', emoji: '🐷', sentence: 'The pig is pink.' },
    { word: 'duck', cn: '鸭子', emoji: '🦆', sentence: 'The duck says quack.' },
    { word: 'cow', cn: '牛', emoji: '🐮', sentence: 'The cow is big.' },
    { word: 'sheep', cn: '羊', emoji: '🐑', sentence: 'The sheep is white.' },
    { word: 'bird', cn: '鸟', emoji: '🐦', sentence: 'The bird can fly.' },
    { word: 'fish', cn: '鱼', emoji: '🐟', sentence: 'The fish can swim.' },
    { word: 'rabbit', cn: '兔子', emoji: '🐰', sentence: 'The rabbit is cute.' },
    { word: 'tiger', cn: '老虎', emoji: '🐯', sentence: 'The tiger is strong.' },
    { word: 'lion', cn: '狮子', emoji: '🦁', sentence: 'The lion is king.' },
    { word: 'elephant', cn: '大象', emoji: '🐘', sentence: 'The elephant is huge.' },
    { word: 'monkey', cn: '猴子', emoji: '🐵', sentence: 'The monkey is funny.' },
    { word: 'panda', cn: '熊猫', emoji: '🐼', sentence: 'The panda is black and white.' },
    { word: 'bear', cn: '熊', emoji: '🐻', sentence: 'The bear is sleepy.' },
    { word: 'bee', cn: '蜜蜂', emoji: '🐝', sentence: 'The bee is busy.' },
  ],
  食物: [
    { word: 'apple', cn: '苹果', emoji: '🍎', sentence: 'I see an apple.' },
    { word: 'banana', cn: '香蕉', emoji: '🍌', sentence: 'I like bananas.' },
    { word: 'orange', cn: '橙子', emoji: '🍊', sentence: 'The orange is orange.' },
    { word: 'grape', cn: '葡萄', emoji: '🍇', sentence: 'The grapes are sweet.' },
    { word: 'pear', cn: '梨', emoji: '🍐', sentence: 'The pear is green.' },
    { word: 'watermelon', cn: '西瓜', emoji: '🍉', sentence: 'The watermelon is big.' },
    { word: 'egg', cn: '鸡蛋', emoji: '🥚', sentence: 'I eat an egg.' },
    { word: 'rice', cn: '米饭', emoji: '🍚', sentence: 'I eat rice.' },
    { word: 'bread', cn: '面包', emoji: '🍞', sentence: 'I like bread.' },
    { word: 'milk', cn: '牛奶', emoji: '🥛', sentence: 'I drink milk.' },
    { word: 'cake', cn: '蛋糕', emoji: '🍰', sentence: 'The cake is yummy.' },
  ],
  颜色: [
    { word: 'red', cn: '红色', emoji: '🔴', sentence: 'The apple is red.' },
    { word: 'orange', cn: '橙色', emoji: '🟠', sentence: 'The orange is orange.' },
    { word: 'yellow', cn: '黄色', emoji: '🟡', sentence: 'The sun is yellow.' },
    { word: 'green', cn: '绿色', emoji: '🟢', sentence: 'The tree is green.' },
    { word: 'blue', cn: '蓝色', emoji: '🔵', sentence: 'The sky is blue.' },
    { word: 'purple', cn: '紫色', emoji: '🟣', sentence: 'The grape is purple.' },
    { word: 'pink', cn: '粉色', emoji: '🩷', sentence: 'The pig is pink.' },
    { word: 'brown', cn: '棕色', emoji: '🤎', sentence: 'The bear is brown.' },
    { word: 'black', cn: '黑色', emoji: '⚫', sentence: 'The cat is black.' },
    { word: 'white', cn: '白色', emoji: '⚪', sentence: 'The cloud is white.' },
  ],
  数字: [
    { word: 'one', cn: '1', emoji: '1️⃣' },
    { word: 'two', cn: '2', emoji: '2️⃣' },
    { word: 'three', cn: '3', emoji: '3️⃣' },
    { word: 'four', cn: '4', emoji: '4️⃣' },
    { word: 'five', cn: '5', emoji: '5️⃣' },
    { word: 'six', cn: '6', emoji: '6️⃣' },
    { word: 'seven', cn: '7', emoji: '7️⃣' },
    { word: 'eight', cn: '8', emoji: '8️⃣' },
    { word: 'nine', cn: '9', emoji: '9️⃣' },
    { word: 'ten', cn: '10', emoji: '🔟' },
  ],
  身体: [
    { word: 'eye', cn: '眼睛', emoji: '👁️', sentence: 'I have two eyes.' },
    { word: 'ear', cn: '耳朵', emoji: '👂', sentence: 'I have two ears.' },
    { word: 'nose', cn: '鼻子', emoji: '👃', sentence: 'I smell with my nose.' },
    { word: 'mouth', cn: '嘴巴', emoji: '👄', sentence: 'I eat with my mouth.' },
    { word: 'hand', cn: '手', emoji: '✋', sentence: 'I write with my hand.' },
    { word: 'foot', cn: '脚', emoji: '🦶', sentence: 'I walk with my foot.' },
    { word: 'head', cn: '头', emoji: '🙆', sentence: 'I shake my head.' },
    { word: 'arm', cn: '手臂', emoji: '💪', sentence: 'I raise my arms.' },
    { word: 'leg', cn: '腿', emoji: '🦵', sentence: 'I have two legs.' },
  ],
  自然: [
    { word: 'sun', cn: '太阳', emoji: '☀️', sentence: 'I see the sun.' },
    { word: 'moon', cn: '月亮', emoji: '🌙', sentence: 'I see the moon.' },
    { word: 'star', cn: '星星', emoji: '⭐', sentence: 'I see a star.' },
    { word: 'tree', cn: '树', emoji: '🌳', sentence: 'The tree is tall.' },
    { word: 'flower', cn: '花', emoji: '🌸', sentence: 'The flower is pretty.' },
    { word: 'cloud', cn: '云', emoji: '☁️', sentence: 'The cloud is white.' },
    { word: 'rain', cn: '雨', emoji: '🌧️', sentence: 'The rain falls down.' },
    { word: 'snow', cn: '雪', emoji: '❄️', sentence: 'The snow is cold.' },
  ],
  动作: [
    { word: 'run', cn: '跑', emoji: '🏃', sentence: 'I can run.' },
    { word: 'jump', cn: '跳', emoji: '🦘', sentence: 'I can jump.' },
    { word: 'eat', cn: '吃', emoji: '🍽️', sentence: 'I like to eat.' },
    { word: 'sleep', cn: '睡觉', emoji: '😴', sentence: 'I go to sleep.' },
    { word: 'read', cn: '读', emoji: '📖', sentence: 'I read a book.' },
    { word: 'write', cn: '写', emoji: '✏️', sentence: 'I write a word.' },
    { word: 'sing', cn: '唱', emoji: '🎤', sentence: 'I like to sing.' },
    { word: 'swim', cn: '游泳', emoji: '🏊', sentence: 'I can swim.' },
  ],
  家人: [
    { word: 'dad', cn: '爸爸', emoji: '👨', sentence: 'I love my dad.' },
    { word: 'mom', cn: '妈妈', emoji: '👩', sentence: 'I love my mom.' },
    { word: 'baby', cn: '宝宝', emoji: '👶', sentence: 'The baby is small.' },
    { word: 'boy', cn: '男孩', emoji: '🧒', sentence: 'The boy is happy.' },
    { word: 'girl', cn: '女孩', emoji: '👧', sentence: 'The girl is cute.' },
  ],
  衣物: [
    { word: 'shirt', cn: '衬衫', emoji: '👕', sentence: 'I wear a shirt.' },
    { word: 'pants', cn: '裤子', emoji: '👖', sentence: 'I wear pants.' },
    { word: 'dress', cn: '连衣裙', emoji: '👗', sentence: 'The dress is pretty.' },
    { word: 'shoe', cn: '鞋', emoji: '👟', sentence: 'I put on my shoe.' },
    { word: 'hat', cn: '帽子', emoji: '🧢', sentence: 'I wear a hat.' },
  ],
};

/** 全部英语单词（用于听音选词、口语练习） */
export const ALL_EN_WORDS: WordItem[] = Object.values(EN_WORD_TOPICS).flat();
