/* ============================================================
   程程学习工作台 — 自主学习内容数据
   结合人教版一年级上册 + RAZ AA + 幼小衔接
   拼音已按「单韵母 / 声母 / 复韵母 / 前后鼻韵母 / 整体认读」系统补全，
   声调与例词均经校对。

   ┌─ 内容索引（按学科找数据👇 行号随版本浮动，用 grep 定位更准）──┐
   │ 语文：拼音(10) / PINYIN_HAN·TONES(125) / 识字 CHARACTERS(246,557) │
   │       古诗 POEMS(568) / 课文 TEXTS(971) / 笔画 STROKES(1094)     │
   │       偏旁 RADICALS(1125) / 课文生字 TEXT_CHAR_LESSONS(1165)     │
   │       描红 TRACE_CHARS(1246) / 拼读 PINYIN_BLEND(1282)           │
   │       阅读 READING_PASSAGES(1385) / 组词 WORD_FORM(1534)         │
   │       指读 FINGER_READ(1565) / 诗图 POEM_PICTURE_Q(1590)         │
   │       MY_DAY(1628) / 生字单元 GRADE1_CHAR_UNITS(1656) 及派生      │
   │       【2025】谚语 PROVERBS / 儿歌 NURSERY_RHYMES / 反义词       │
   │       ANTONYMS / 量词 QUANTIFIERS / 谜语 RIDDLES / 安全 SAFETY_TIPS │
   │ 数学：NUMBER_SENSE(590) / SHAPES(632) / ANGLES(649)             │
   │       计算 makeMathQuestions(661) / 分合 SPLITS(1258)            │
   │       应用题 WORD_PROBLEMS(1316) / 序数 ORDINALS(1397)           │
   │       钟表 CLOCKS·HALF(1037,1417) / 比轻重 COMPARE_MORE(1434)    │
   │       日历 WEEK_CALENDAR(1454) / 单元 MATH_UNITS(1886)           │
   │ 英语：单词 EN_WORD_TOPICS(734) / ALL_EN_WORDS(958)              │
   │       单元 EN_UNITS(1065) / CVC(1333) / 句型 EN_SENTENCES(1496)  │
   │       单元词 UNIT_WORD(1825) / 【2025】儿歌 EN_SONGS             │
   │ 通用：Subject 类型(8) / applyTone(197) / 学校 SCHOOL_ITEMS(1473) │
   └──────────────────────────────────────────────────────────────┘
   ┌─ 加新年级约定 ────────────────────────────────────────────────┐
   │ 加一年级下/二年级数据时，请新建 src/lib/study-data-gradeN.ts，  │
   │ 在本文件末尾加 export * from './study-data-gradeN' 即可聚合。  │
   │ 不拆现有存量——git blame 历史不破，30 个 import 点零改动。    │
   └───────────────────────────────────────────────────────────────┘
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

/**
 * 每个拼音对应的「代表汉字」：用它来朗读，中文 TTS 才能发出正确的音节与声调。
 * 例词（examples）的首字往往不是该拼音的音（如「天安门」首字是「天/tiān」，
 * 但本音是「an」），所以单独维护这张表，确保朗读准确。
 * 表中汉字的读音尽量等于该拼音（零声母/整体认读取常规代表字）。
 */
export const PINYIN_HAN: Record<string, string> = {
  // 单韵母
  a: '啊', o: '喔', e: '鹅', i: '衣', u: '屋', ü: '鱼',
  // 声母
  b: '爸', p: '坡', m: '妈', f: '佛', d: '大', t: '特', n: '拿', l: '拉',
  g: '哥', k: '科', h: '喝', j: '鸡', q: '七', x: '西',
  zh: '知', ch: '吃', sh: '师', r: '日', z: '字', c: '词', s: '丝',
  y: '衣', w: '屋',
  // 复韵母
  ai: '爱', ei: '诶', ui: '威', ao: '奥', ou: '欧', iu: '优',
  ie: '叶', üe: '月', er: '耳',
  // 前后鼻韵母
  an: '安', en: '恩', in: '因', un: '温', ün: '云',
  ang: '昂', eng: '鞥', ing: '鹰', ong: '中',
  // 整体认读
  zhi: '知', chi: '吃', shi: '狮', ri: '日', zi: '字', ci: '词', si: '丝',
  yi: '衣', wu: '屋', yu: '鱼', ye: '叶', yue: '月', yuan: '圆', yin: '因', yun: '云', ying: '鹰',
};

/**
 * 四声切换：每个「能整齐发四声的音节」配 4 个代表汉字（按 1/2/3/4 声顺序）。
 * 空串 '' 表示该声调没有合适的零声母常用字（UI 会禁用该按钮）。
 * 只收录零声母能完整发四声的音节（单韵母、ai/ao/ie/ing、整体认读等）；
 * 声母、以及 ei/ui/ou/iu/üe/an/en/in/un/ün/ang/eng/ong 这类零声母无完整四声字的，
 * 不在此表，保持读 PINYIN_HAN 单个代表字即可（卡片不显示声调切换）。
 */
export const PINYIN_TONES: Record<string, [string, string, string, string]> = {
  // 单韵母
  a: ['啊', '啊', '阿', '啊'],
  o: ['喔', '哦', '噢', '哦'],
  e: ['阿', '鹅', '恶', '饿'],
  i: ['衣', '姨', '椅', '意'],
  u: ['屋', '无', '五', '物'],
  ü: ['迂', '鱼', '雨', '玉'],
  // 复韵母（零声母能完整四声的）
  ai: ['哀', '挨', '矮', '爱'],
  ao: ['凹', '熬', '袄', '傲'],
  ie: ['耶', '爷', '也', '叶'],
  // 后鼻韵母
  ing: ['英', '迎', '影', '硬'],
  // 整体认读
  zhi: ['知', '直', '纸', '制'],
  chi: ['吃', '迟', '齿', '赤'],
  shi: ['狮', '石', '史', '是'],
  ri: ['', '', '', '日'],
  zi: ['资', '', '子', '字'],
  ci: ['', '词', '此', '次'],
  si: ['丝', '', '死', '四'],
  yi: ['衣', '姨', '椅', '意'],
  wu: ['屋', '吴', '五', '物'],
  yu: ['迂', '鱼', '雨', '玉'],
  ye: ['耶', '爷', '也', '夜'],
  yue: ['约', '', '', '月'],
  yuan: ['冤', '圆', '远', '院'],
  yin: ['音', '银', '引', '印'],
  yun: ['晕', '云', '允', '运'],
  ying: ['英', '迎', '影', '硬'],
};

/**
 * 给一个拼音音节加上声调符号（用于「显示」带调拼音，如 a+4 → à）。
 * 标调规则：有 a 标 a，无 a 找 o/e；iu 标在后(u)、ui 标在后(i)；其余标 i/u/ü。
 */
const TONE_MARKS: Record<string, [string, string, string, string]> = {
  a: ['ā', 'á', 'ǎ', 'à'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

export function applyTone(syllable: string, tone: number): string {
  if (tone < 1 || tone > 4) return syllable;
  let target: string | undefined;
  if (syllable.includes('a')) target = 'a';
  else if (syllable.includes('o')) target = 'o';
  else if (syllable.includes('e')) target = 'e';
  else if (syllable.includes('iu')) target = 'u';
  else if (syllable.includes('ui')) target = 'i';
  else if (syllable.includes('i')) target = 'i';
  else if (syllable.includes('u')) target = 'u';
  else if (syllable.includes('ü')) target = 'ü';
  if (!target || !TONE_MARKS[target]) return syllable;
  return syllable.replace(target, TONE_MARKS[target][tone - 1]);
}

/* -------------------- 语文 · 识字（按类别） -------------------- */
export interface CharacterItem {
  char: string;
  pinyin: string; // 带声调拼音，识字卡 / 笔顺动画都靠它标音
  strokeCount: number;
  meaning: string;
  phrase: string;
  category: string;
  /** 多音字第二读音（可选），如 了 le/liǎo、着 zhe/zháo。识字卡会展示「又读 xxx」 */
  altPinyin?: string;
}

export const CHARACTER_CATEGORIES = ['数字', '自然', '人体', '家庭', '方位', '动作', '颜色', '动物', '植物', '物品'];

/** 明显的多音字第二读音（仅标一年级会遇到的常见多音字）。
 *  与 CHARACTERS 主读音拼接后派生到每项 altPinyin，避免改动 290 行数据块。 */
export const MULTI_READINGS: Record<string, string> = {
  了: 'liǎo', // le（来了）/ liǎo（了解）
  着: 'zháo', // zhe（笑着）/ zháo（着火）
  长: 'zhǎng', // cháng（长短）/ zhǎng（成长）
  地: 'de', // dì（天地）/ de（轻轻地）
  得: 'de', // dé（觉得）/ de（跑得快）
  还: 'huán', // hái（还有）/ huán（归还）
  只: 'zhǐ', // zhī（一只）/ zhǐ（只有）
  少: 'shào', // shǎo（多少）/ shào（少年）
  好: 'hào', // hǎo（好朋友）/ hào（爱好）
  中: 'zhòng', // zhōng（中国）/ zhòng（中奖）
  数: 'shǔ', // shù（数学）/ shǔ（数一数）
  空: 'kòng', // kōng（天空）/ kòng（空地）
  乐: 'yuè', // lè（快乐）/ yuè（音乐）
  发: 'fà', // fā（发芽）/ fà（头发）
  觉: 'jiào', // jué（觉得）/ jiào（睡觉）
};

const RAW_CHARACTERS: CharacterItem[] = [
  // 数字
  { char: '一', pinyin: 'yī', strokeCount: 1, meaning: '数字 1', phrase: '一个苹果', category: '数字' },
  { char: '二', pinyin: 'èr', strokeCount: 2, meaning: '数字 2', phrase: '二只小鸟', category: '数字' },
  { char: '三', pinyin: 'sān', strokeCount: 3, meaning: '数字 3', phrase: '三只兔子', category: '数字' },
  { char: '四', pinyin: 'sì', strokeCount: 5, meaning: '数字 4', phrase: '四个气球', category: '数字' },
  { char: '五', pinyin: 'wǔ', strokeCount: 4, meaning: '数字 5', phrase: '五颗星星', category: '数字' },
  { char: '六', pinyin: 'liù', strokeCount: 4, meaning: '数字 6', phrase: '六个雪人', category: '数字' },
  { char: '七', pinyin: 'qī', strokeCount: 2, meaning: '数字 7', phrase: '七朵花', category: '数字' },
  { char: '八', pinyin: 'bā', strokeCount: 2, meaning: '数字 8', phrase: '八只狗', category: '数字' },
  { char: '九', pinyin: 'jiǔ', strokeCount: 2, meaning: '数字 9', phrase: '九片叶', category: '数字' },
  { char: '十', pinyin: 'shí', strokeCount: 2, meaning: '数字 10', phrase: '十个小朋友', category: '数字' },
  // 自然
  { char: '天', pinyin: 'tiān', strokeCount: 4, meaning: '天空', phrase: '今天天气好', category: '自然' },
  { char: '地', pinyin: 'dì', strokeCount: 6, meaning: '大地', phrase: '大地是绿色的', category: '自然' },
  { char: '日', pinyin: 'rì', strokeCount: 4, meaning: '太阳 / 日子', phrase: '红日东升', category: '自然' },
  { char: '月', pinyin: 'yuè', strokeCount: 4, meaning: '月亮', phrase: '弯弯的月儿', category: '自然' },
  { char: '水', pinyin: 'shuǐ', strokeCount: 4, meaning: '水流', phrase: '清水哗哗流', category: '自然' },
  { char: '火', pinyin: 'huǒ', strokeCount: 4, meaning: '火焰', phrase: '红红火火', category: '自然' },
  { char: '山', pinyin: 'shān', strokeCount: 3, meaning: '高山', phrase: '大山高高', category: '自然' },
  { char: '石', pinyin: 'shí', strokeCount: 5, meaning: '石头', phrase: '一块石头', category: '自然' },
  { char: '田', pinyin: 'tián', strokeCount: 5, meaning: '田地', phrase: '种田真辛苦', category: '自然' },
  { char: '土', pinyin: 'tǔ', strokeCount: 3, meaning: '泥土', phrase: '泥土香喷喷', category: '自然' },
  // 人体
  { char: '人', pinyin: 'rén', strokeCount: 2, meaning: '人们', phrase: '大人小孩', category: '人体' },
  { char: '口', pinyin: 'kǒu', strokeCount: 3, meaning: '嘴巴', phrase: '一口水', category: '人体' },
  { char: '耳', pinyin: 'ěr', strokeCount: 6, meaning: '耳朵', phrase: '竖起耳朵', category: '人体' },
  { char: '目', pinyin: 'mù', strokeCount: 5, meaning: '眼睛', phrase: '目不转睛', category: '人体' },
  { char: '手', pinyin: 'shǒu', strokeCount: 4, meaning: '手掌', phrase: '小手真能干', category: '人体' },
  { char: '足', pinyin: 'zú', strokeCount: 7, meaning: '脚', phrase: '足球真好玩', category: '人体' },
  { char: '头', pinyin: 'tóu', strokeCount: 5, meaning: '脑袋', phrase: '洗头洗澡', category: '人体' },
  { char: '心', pinyin: 'xīn', strokeCount: 4, meaning: '心脏', phrase: '心情真好', category: '人体' },
  // 家庭
  { char: '父', pinyin: 'fù', strokeCount: 4, meaning: '爸爸', phrase: '父爱如山', category: '家庭' },
  { char: '母', pinyin: 'mǔ', strokeCount: 5, meaning: '妈妈', phrase: '母爱温暖', category: '家庭' },
  { char: '儿', pinyin: 'ér', strokeCount: 2, meaning: '孩子', phrase: '儿童节快乐', category: '家庭' },
  { char: '女', pinyin: 'nǚ', strokeCount: 3, meaning: '女孩', phrase: '女孩子', category: '家庭' },
  { char: '子', pinyin: 'zǐ', strokeCount: 3, meaning: '小孩', phrase: '子儿满地跑', category: '家庭' },
  // 方位
  { char: '上', pinyin: 'shàng', strokeCount: 3, meaning: '上面', phrase: '天上飞', category: '方位' },
  { char: '下', pinyin: 'xià', strokeCount: 3, meaning: '下面', phrase: '树下坐', category: '方位' },
  { char: '左', pinyin: 'zuǒ', strokeCount: 5, meaning: '左边', phrase: '左手拿笔', category: '方位' },
  { char: '右', pinyin: 'yòu', strokeCount: 5, meaning: '右边', phrase: '右手举手', category: '方位' },
  { char: '中', pinyin: 'zhōng', strokeCount: 4, meaning: '中间', phrase: '水中月', category: '方位' },
  // 动作
  { char: '来', pinyin: 'lái', strokeCount: 7, meaning: '过来', phrase: '快来玩', category: '动作' },
  { char: '去', pinyin: 'qù', strokeCount: 5, meaning: '离开', phrase: '去上学', category: '动作' },
  { char: '坐', pinyin: 'zuò', strokeCount: 7, meaning: '坐下', phrase: '坐端正', category: '动作' },
  { char: '立', pinyin: 'lì', strokeCount: 5, meaning: '站立', phrase: '立正', category: '动作' },
  { char: '走', pinyin: 'zǒu', strokeCount: 7, meaning: '步行', phrase: '走一走', category: '动作' },
  { char: '飞', pinyin: 'fēi', strokeCount: 3, meaning: '飞翔', phrase: '小鸟飞', category: '动作' },
  // 颜色
  { char: '红', pinyin: 'hóng', strokeCount: 6, meaning: '红色', phrase: '红花朵朵', category: '颜色' },
  { char: '白', pinyin: 'bái', strokeCount: 5, meaning: '白色', phrase: '白云飘飘', category: '颜色' },
  { char: '黑', pinyin: 'hēi', strokeCount: 12, meaning: '黑色', phrase: '黑夜来了', category: '颜色' },
  // 动物
  { char: '马', pinyin: 'mǎ', strokeCount: 3, meaning: '马儿', phrase: '小马快跑', category: '动物' },
  { char: '牛', pinyin: 'niú', strokeCount: 4, meaning: '牛', phrase: '老牛耕田', category: '动物' },
  { char: '羊', pinyin: 'yáng', strokeCount: 6, meaning: '羊', phrase: '小羊咩咩', category: '动物' },
  { char: '鸟', pinyin: 'niǎo', strokeCount: 5, meaning: '鸟儿', phrase: '小鸟唱歌', category: '动物' },
  { char: '鱼', pinyin: 'yú', strokeCount: 8, meaning: '鱼类', phrase: '小鱼游水', category: '动物' },
  { char: '虫', pinyin: 'chóng', strokeCount: 6, meaning: '虫子', phrase: '小虫爬爬', category: '动物' },
  // 植物
  { char: '花', pinyin: 'huā', strokeCount: 7, meaning: '花朵', phrase: '花儿香', category: '植物' },
  { char: '木', pinyin: 'mù', strokeCount: 4, meaning: '树木', phrase: '木头桌子', category: '植物' },
  { char: '草', pinyin: 'cǎo', strokeCount: 9, meaning: '青草', phrase: '小草绿', category: '植物' },
  { char: '叶', pinyin: 'yè', strokeCount: 5, meaning: '叶子', phrase: '树叶黄', category: '植物' },
  // 物品
  { char: '书', pinyin: 'shū', strokeCount: 4, meaning: '书本', phrase: '读书啦', category: '物品' },
  { char: '笔', pinyin: 'bǐ', strokeCount: 10, meaning: '笔', phrase: '铅笔写字', category: '物品' },
  { char: '刀', pinyin: 'dāo', strokeCount: 2, meaning: '小刀', phrase: '水果刀', category: '物品' },
  { char: '门', pinyin: 'mén', strokeCount: 3, meaning: '门', phrase: '开门请进', category: '物品' },
  { char: '机', pinyin: 'jī', strokeCount: 6, meaning: '机器 / 飞机', phrase: '飞机飞得高', category: '物品' },
  { char: '球', pinyin: 'qiú', strokeCount: 11, meaning: '皮球 / 球类', phrase: '皮球圆又圆', category: '物品' },
  { char: '壳', pinyin: 'ké', strokeCount: 7, meaning: '外壳（贝壳/蛋壳）', phrase: '贝壳亮晶晶', category: '物品' },

  // —— 一年级上册 识字课文补充 ——
  { char: '你', pinyin: 'nǐ', strokeCount: 7, meaning: '你（第二人称）', phrase: '你们好', category: '家庭' },
  { char: '我', pinyin: 'wǒ', strokeCount: 7, meaning: '我（自己）', phrase: '我们', category: '家庭' },
  { char: '他', pinyin: 'tā', strokeCount: 5, meaning: '他（第三人称）', phrase: '他们', category: '家庭' },
  { char: '金', pinyin: 'jīn', strokeCount: 8, meaning: '金子 / 金属', phrase: '金子闪闪', category: '自然' },
  { char: '川', pinyin: 'chuān', strokeCount: 3, meaning: '河流 / 山川', phrase: '山川壮美', category: '自然' },
  { char: '禾', pinyin: 'hé', strokeCount: 5, meaning: '禾苗（庄稼）', phrase: '禾苗青青', category: '植物' },
  { char: '站', pinyin: 'zhàn', strokeCount: 10, meaning: '站立', phrase: '站如松', category: '动作' },
  { char: '云', pinyin: 'yún', strokeCount: 4, meaning: '云朵', phrase: '白云飘飘', category: '自然' },
  { char: '雨', pinyin: 'yǔ', strokeCount: 8, meaning: '雨水', phrase: '下雨啦', category: '自然' },
  { char: '风', pinyin: 'fēng', strokeCount: 4, meaning: '风', phrase: '大风呼呼', category: '自然' },
  { char: '明', pinyin: 'míng', strokeCount: 8, meaning: '明亮 / 明白', phrase: '明亮灯光', category: '自然' },
  { char: '男', pinyin: 'nán', strokeCount: 7, meaning: '男孩 / 男人', phrase: '男孩勇敢', category: '家庭' },
  { char: '尖', pinyin: 'jiān', strokeCount: 6, meaning: '尖锐 / 笔尖', phrase: '笔尖尖尖', category: '物品' },
  { char: '尘', pinyin: 'chén', strokeCount: 6, meaning: '尘土', phrase: '尘土飞扬', category: '自然' },
  { char: '从', pinyin: 'cóng', strokeCount: 4, meaning: '跟从', phrase: '跟从老师', category: '家庭' },
  { char: '众', pinyin: 'zhòng', strokeCount: 6, meaning: '众人 / 许多', phrase: '众人拾柴', category: '家庭' },
  { char: '林', pinyin: 'lín', strokeCount: 8, meaning: '树林', phrase: '树林密密', category: '植物' },
  { char: '森', pinyin: 'sēn', strokeCount: 12, meaning: '森林', phrase: '森林深深', category: '植物' },
  { char: '包', pinyin: 'bāo', strokeCount: 5, meaning: '书包 / 包裹', phrase: '书包真神气', category: '物品' },
  { char: '尺', pinyin: 'chǐ', strokeCount: 4, meaning: '尺子', phrase: '一把尺子', category: '物品' },
  { char: '作', pinyin: 'zuò', strokeCount: 7, meaning: '作业 / 工作', phrase: '做作业', category: '物品' },
  { char: '业', pinyin: 'yè', strokeCount: 5, meaning: '作业 / 事业', phrase: '完成作业', category: '物品' },
  { char: '本', pinyin: 'běn', strokeCount: 5, meaning: '本子 / 书本', phrase: '一本本子', category: '物品' },
  { char: '课', pinyin: 'kè', strokeCount: 10, meaning: '上课 / 课程', phrase: '上课啦', category: '物品' },
  { char: '早', pinyin: 'zǎo', strokeCount: 6, meaning: '早晨 / 早', phrase: '早上好', category: '自然' },
  { char: '校', pinyin: 'xiào', strokeCount: 10, meaning: '学校', phrase: '学校真漂亮', category: '物品' },
  { char: '升', pinyin: 'shēng', strokeCount: 4, meaning: '升起', phrase: '升旗', category: '动作' },
  { char: '国', pinyin: 'guó', strokeCount: 8, meaning: '国家 / 中国', phrase: '我爱中国', category: '家庭' },
  { char: '旗', pinyin: 'qí', strokeCount: 14, meaning: '旗帜', phrase: '五星红旗', category: '物品' },
  { char: '起', pinyin: 'qǐ', strokeCount: 10, meaning: '起来 / 起立', phrase: '起立', category: '动作' },
  { char: '美', pinyin: 'měi', strokeCount: 9, meaning: '美丽', phrase: '美丽中国', category: '自然' },
  { char: '丽', pinyin: 'lì', strokeCount: 7, meaning: '美丽', phrase: '风和日丽', category: '自然' },
  { char: '歌', pinyin: 'gē', strokeCount: 14, meaning: '歌曲 / 唱歌', phrase: '唱歌', category: '动作' },
  { char: '午', pinyin: 'wǔ', strokeCount: 4, meaning: '中午 / 下午', phrase: '中午吃饭', category: '自然' },
  { char: '晚', pinyin: 'wǎn', strokeCount: 11, meaning: '晚上', phrase: '晚上好', category: '自然' },
  { char: '昨', pinyin: 'zuó', strokeCount: 9, meaning: '昨天', phrase: '昨天的事', category: '自然' },
  { char: '今', pinyin: 'jīn', strokeCount: 4, meaning: '今天', phrase: '今天开心', category: '自然' },
  { char: '年', pinyin: 'nián', strokeCount: 6, meaning: '年 / 新年', phrase: '过新年', category: '自然' },
  { char: '开', pinyin: 'kāi', strokeCount: 4, meaning: '打开 / 开心', phrase: '开门', category: '动作' },
  { char: '关', pinyin: 'guān', strokeCount: 6, meaning: '关上', phrase: '关上门', category: '动作' },
  { char: '牙', pinyin: 'yá', strokeCount: 4, meaning: '牙齿', phrase: '刷牙', category: '人体' },
  { char: '少', pinyin: 'shǎo', strokeCount: 4, meaning: '多少 / 少', phrase: '不少', category: '数字' },
  { char: '不', pinyin: 'bù', strokeCount: 4, meaning: '不（否定）', phrase: '不行', category: '动作' },

  // —— 一年级上册生字表补全（课本各单元会认字，按单元出现顺序补充） ——
  { char: '学', pinyin: 'xué', strokeCount: 8, meaning: '学习', phrase: '学校', category: '动作' },
  { char: '了', pinyin: 'le', strokeCount: 2, meaning: '了（完成）', phrase: '来了', category: '动作' },
  { char: '爱', pinyin: 'ài', strokeCount: 10, meaning: '喜爱', phrase: '爱心', category: '家庭' },
  { char: '们', pinyin: 'men', strokeCount: 5, meaning: '表示复数', phrase: '我们', category: '家庭' },
  { char: '对', pinyin: 'duì', strokeCount: 5, meaning: '正确 / 答对', phrase: '对了', category: '动作' },
  { char: '爸', pinyin: 'bà', strokeCount: 8, meaning: '爸爸', phrase: '爸爸', category: '家庭' },
  { char: '妈', pinyin: 'mā', strokeCount: 6, meaning: '妈妈', phrase: '妈妈', category: '家庭' },
  { char: '画', pinyin: 'huà', strokeCount: 8, meaning: '画画', phrase: '画图', category: '动作' },
  { char: '打', pinyin: 'dǎ', strokeCount: 5, meaning: '拍打 / 打球', phrase: '打球', category: '动作' },
  { char: '棋', pinyin: 'qí', strokeCount: 12, meaning: '棋子 / 下棋', phrase: '下棋', category: '物品' },
  { char: '鸡', pinyin: 'jī', strokeCount: 7, meaning: '小鸡', phrase: '公鸡', category: '动物' },
  { char: '字', pinyin: 'zì', strokeCount: 6, meaning: '汉字', phrase: '写字', category: '物品' },
  { char: '词', pinyin: 'cí', strokeCount: 7, meaning: '词语', phrase: '字词', category: '物品' },
  { char: '语', pinyin: 'yǔ', strokeCount: 9, meaning: '语言', phrase: '语文', category: '物品' },
  { char: '句', pinyin: 'jù', strokeCount: 5, meaning: '句子', phrase: '一句话', category: '物品' },
  { char: '桌', pinyin: 'zhuō', strokeCount: 10, meaning: '桌子', phrase: '书桌', category: '物品' },
  { char: '纸', pinyin: 'zhǐ', strokeCount: 7, meaning: '纸张', phrase: '白纸', category: '物品' },
  { char: '文', pinyin: 'wén', strokeCount: 4, meaning: '文字 / 语文', phrase: '文化', category: '物品' },
  { char: '数', pinyin: 'shù', strokeCount: 13, meaning: '数学 / 数字', phrase: '数数', category: '物品' },
  { char: '音', pinyin: 'yīn', strokeCount: 9, meaning: '声音', phrase: '音乐', category: '物品' },
  { char: '乐', pinyin: 'lè', strokeCount: 5, meaning: '快乐 / 音乐', phrase: '欢乐', category: '颜色' },
  { char: '妹', pinyin: 'mèi', strokeCount: 8, meaning: '妹妹', phrase: '妹妹', category: '家庭' },
  { char: '奶', pinyin: 'nǎi', strokeCount: 5, meaning: '奶奶', phrase: '牛奶', category: '家庭' },
  { char: '皮', pinyin: 'pí', strokeCount: 5, meaning: '皮 / 皮肤', phrase: '皮球', category: '人体' },
  { char: '桥', pinyin: 'qiáo', strokeCount: 10, meaning: '小桥', phrase: '木桥', category: '物品' },
  { char: '台', pinyin: 'tái', strokeCount: 5, meaning: '台子 / 台子', phrase: '台上', category: '物品' },
  { char: '雪', pinyin: 'xuě', strokeCount: 11, meaning: '雪花', phrase: '雪人', category: '自然' },
  { char: '家', pinyin: 'jiā', strokeCount: 10, meaning: '家庭', phrase: '大家', category: '家庭' },
  { char: '是', pinyin: 'shì', strokeCount: 9, meaning: '是（判断）', phrase: '也是', category: '动作' },
  { char: '车', pinyin: 'chē', strokeCount: 4, meaning: '车子', phrase: '马车', category: '物品' },
  { char: '也', pinyin: 'yě', strokeCount: 3, meaning: '也（同样）', phrase: '也是', category: '动作' },
  { char: '秋', pinyin: 'qiū', strokeCount: 9, meaning: '秋天', phrase: '秋天', category: '自然' },
  { char: '气', pinyin: 'qì', strokeCount: 4, meaning: '空气 / 天气', phrase: '生气', category: '自然' },
  { char: '树', pinyin: 'shù', strokeCount: 9, meaning: '大树', phrase: '树叶', category: '植物' },
  { char: '片', pinyin: 'piàn', strokeCount: 4, meaning: '一片', phrase: '卡片', category: '物品' },
  { char: '大', pinyin: 'dà', strokeCount: 3, meaning: '大小', phrase: '大人', category: '方位' },
  { char: '会', pinyin: 'huì', strokeCount: 6, meaning: '会 / 开会', phrase: '学会', category: '动作' },
  { char: '个', pinyin: 'gè', strokeCount: 3, meaning: '个（量词）', phrase: '一个', category: '物品' },
  { char: '的', pinyin: 'de', strokeCount: 8, meaning: '的（助词）', phrase: '我的书', category: '动作' },
  { char: '船', pinyin: 'chuán', strokeCount: 11, meaning: '小船', phrase: '飞船', category: '物品' },
  { char: '两', pinyin: 'liǎng', strokeCount: 7, meaning: '两个', phrase: '两天', category: '数字' },
  { char: '在', pinyin: 'zài', strokeCount: 6, meaning: '在（存在）', phrase: '在家', category: '方位' },
  { char: '里', pinyin: 'lǐ', strokeCount: 7, meaning: '里面', phrase: '家里', category: '方位' },
  { char: '看', pinyin: 'kàn', strokeCount: 9, meaning: '看见', phrase: '看书', category: '动作' },
  { char: '见', pinyin: 'jiàn', strokeCount: 4, meaning: '看见', phrase: '见面', category: '动作' },
  { char: '闪', pinyin: 'shǎn', strokeCount: 5, meaning: '闪亮', phrase: '闪电', category: '自然' },
  { char: '星', pinyin: 'xīng', strokeCount: 9, meaning: '星星', phrase: '星空', category: '自然' },
  { char: '江', pinyin: 'jiāng', strokeCount: 6, meaning: '长江', phrase: '江南', category: '自然' },
  { char: '南', pinyin: 'nán', strokeCount: 9, meaning: '南方', phrase: '江南', category: '方位' },
  { char: '可', pinyin: 'kě', strokeCount: 5, meaning: '可以', phrase: '可爱', category: '动作' },
  { char: '采', pinyin: 'cǎi', strokeCount: 8, meaning: '采 / 采摘', phrase: '采花', category: '动作' },
  { char: '莲', pinyin: 'lián', strokeCount: 10, meaning: '莲花', phrase: '莲叶', category: '植物' },
  { char: '东', pinyin: 'dōng', strokeCount: 5, meaning: '东边', phrase: '东西', category: '方位' },
  { char: '西', pinyin: 'xī', strokeCount: 6, meaning: '西边', phrase: '东西', category: '方位' },
  { char: '北', pinyin: 'běi', strokeCount: 5, meaning: '北方', phrase: '北方', category: '方位' },
  { char: '说', pinyin: 'shuō', strokeCount: 9, meaning: '说话', phrase: '小说', category: '动作' },
  { char: '春', pinyin: 'chūn', strokeCount: 9, meaning: '春天', phrase: '春风', category: '自然' },
  { char: '青', pinyin: 'qīng', strokeCount: 8, meaning: '青色', phrase: '青蛙', category: '颜色' },
  { char: '蛙', pinyin: 'wā', strokeCount: 12, meaning: '青蛙', phrase: '牛蛙', category: '动物' },
  { char: '夏', pinyin: 'xià', strokeCount: 10, meaning: '夏天', phrase: '夏夜', category: '自然' },
  { char: '弯', pinyin: 'wān', strokeCount: 9, meaning: '弯弯', phrase: '弯路', category: '动作' },
  { char: '就', pinyin: 'jiù', strokeCount: 12, meaning: '就（靠近）', phrase: '就是', category: '动作' },
  { char: '冬', pinyin: 'dōng', strokeCount: 5, meaning: '冬天', phrase: '过冬', category: '自然' },
  { char: '远', pinyin: 'yuǎn', strokeCount: 7, meaning: '远', phrase: '远方', category: '方位' },
  { char: '色', pinyin: 'sè', strokeCount: 6, meaning: '颜色', phrase: '色彩', category: '颜色' },
  { char: '近', pinyin: 'jìn', strokeCount: 7, meaning: '近', phrase: '靠近', category: '方位' },
  { char: '听', pinyin: 'tīng', strokeCount: 7, meaning: '听', phrase: '听见', category: '动作' },
  { char: '无', pinyin: 'wú', strokeCount: 4, meaning: '没有', phrase: '无力', category: '数字' },
  { char: '声', pinyin: 'shēng', strokeCount: 7, meaning: '声音', phrase: '笑声', category: '自然' },
  { char: '还', pinyin: 'hái', strokeCount: 7, meaning: '还（仍旧）', phrase: '还是', category: '动作' },
  { char: '多', pinyin: 'duō', strokeCount: 6, meaning: '多少', phrase: '很多', category: '数字' },
  { char: '黄', pinyin: 'huáng', strokeCount: 11, meaning: '黄色', phrase: '金黄', category: '颜色' },
  { char: '只', pinyin: 'zhī', strokeCount: 5, meaning: '只（量词）', phrase: '一只', category: '数字' },
  { char: '猫', pinyin: 'māo', strokeCount: 11, meaning: '小猫', phrase: '花猫', category: '动物' },
  { char: '边', pinyin: 'biān', strokeCount: 5, meaning: '旁边', phrase: '河边', category: '方位' },
  { char: '鸭', pinyin: 'yā', strokeCount: 10, meaning: '鸭子', phrase: '小鸭', category: '动物' },
  { char: '苹', pinyin: 'píng', strokeCount: 8, meaning: '苹果', phrase: '苹果', category: '植物' },
  { char: '果', pinyin: 'guǒ', strokeCount: 8, meaning: '水果', phrase: '果实', category: '植物' },
  { char: '杏', pinyin: 'xìng', strokeCount: 7, meaning: '杏子', phrase: '杏树', category: '植物' },
  { char: '桃', pinyin: 'táo', strokeCount: 10, meaning: '桃子', phrase: '桃树', category: '植物' },
  { char: '力', pinyin: 'lì', strokeCount: 2, meaning: '力气', phrase: '大力', category: '动作' },
  { char: '双', pinyin: 'shuāng', strokeCount: 4, meaning: '一双', phrase: '双手', category: '数字' },
  { char: '条', pinyin: 'tiáo', strokeCount: 7, meaning: '一条', phrase: '纸条', category: '数字' },
  { char: '么', pinyin: 'me', strokeCount: 3, meaning: '什么', phrase: '怎么', category: '动作' },
  { char: '影', pinyin: 'yǐng', strokeCount: 15, meaning: '影子', phrase: '身影', category: '自然' },
  { char: '前', pinyin: 'qián', strokeCount: 9, meaning: '前面', phrase: '前后', category: '方位' },
  { char: '后', pinyin: 'hòu', strokeCount: 6, meaning: '后面', phrase: '以后', category: '方位' },
  { char: '狗', pinyin: 'gǒu', strokeCount: 8, meaning: '小狗', phrase: '黑狗', category: '动物' },
  { char: '它', pinyin: 'tā', strokeCount: 5, meaning: '它（动物）', phrase: '它们', category: '家庭' },
  { char: '好', pinyin: 'hǎo', strokeCount: 6, meaning: '好', phrase: '好朋友', category: '家庭' },
  { char: '朋', pinyin: 'péng', strokeCount: 8, meaning: '朋友', phrase: '亲朋', category: '家庭' },
  { char: '友', pinyin: 'yǒu', strokeCount: 4, meaning: '朋友', phrase: '好友', category: '家庭' },
  { char: '尾', pinyin: 'wěi', strokeCount: 7, meaning: '尾巴', phrase: '尾羽', category: '动物' },
  { char: '巴', pinyin: 'bā', strokeCount: 4, meaning: '尾巴', phrase: '巴掌', category: '动物' },
  { char: '谁', pinyin: 'shuí', strokeCount: 10, meaning: '谁', phrase: '谁知', category: '动作' },
  { char: '长', pinyin: 'cháng', strokeCount: 4, meaning: '长短', phrase: '长高', category: '方位' },
  { char: '短', pinyin: 'duǎn', strokeCount: 12, meaning: '短', phrase: '短发', category: '方位' },
  { char: '把', pinyin: 'bǎ', strokeCount: 7, meaning: '一把', phrase: '把门', category: '动作' },
  { char: '伞', pinyin: 'sǎn', strokeCount: 6, meaning: '雨伞', phrase: '打伞', category: '物品' },
  { char: '兔', pinyin: 'tù', strokeCount: 8, meaning: '兔子', phrase: '白兔', category: '动物' },
  { char: '最', pinyin: 'zuì', strokeCount: 12, meaning: '最', phrase: '最好', category: '动作' },
  { char: '公', pinyin: 'gōng', strokeCount: 4, meaning: '公鸡', phrase: '公园', category: '动物' },
  { char: '写', pinyin: 'xiě', strokeCount: 5, meaning: '写', phrase: '写字', category: '动作' },
  { char: '诗', pinyin: 'shī', strokeCount: 8, meaning: '诗歌', phrase: '写诗', category: '物品' },
  { char: '点', pinyin: 'diǎn', strokeCount: 9, meaning: '一点', phrase: '点头', category: '数字' },
  { char: '要', pinyin: 'yào', strokeCount: 9, meaning: '要', phrase: '不要', category: '动作' },
  { char: '过', pinyin: 'guò', strokeCount: 6, meaning: '过', phrase: '过来', category: '动作' },
  { char: '给', pinyin: 'gěi', strokeCount: 9, meaning: '给', phrase: '送给', category: '动作' },
  { char: '当', pinyin: 'dāng', strokeCount: 6, meaning: '当', phrase: '当然', category: '动作' },
  { char: '串', pinyin: 'chuàn', strokeCount: 7, meaning: '一串', phrase: '串门', category: '数字' },
  { char: '以', pinyin: 'yǐ', strokeCount: 4, meaning: '以后', phrase: '以前', category: '动作' },
  { char: '成', pinyin: 'chéng', strokeCount: 6, meaning: '成 / 完成', phrase: '成功', category: '动作' },
  { char: '彩', pinyin: 'cǎi', strokeCount: 11, meaning: '彩色', phrase: '彩虹', category: '颜色' },
  { char: '半', pinyin: 'bàn', strokeCount: 5, meaning: '一半', phrase: '半个', category: '数字' },
  { char: '空', pinyin: 'kōng', strokeCount: 8, meaning: '天空', phrase: '空地', category: '自然' },
  { char: '问', pinyin: 'wèn', strokeCount: 6, meaning: '问', phrase: '提问', category: '动作' },
  { char: '到', pinyin: 'dào', strokeCount: 8, meaning: '到', phrase: '到了', category: '动作' },
  { char: '方', pinyin: 'fāng', strokeCount: 4, meaning: '方向', phrase: '地方', category: '方位' },
  { char: '没', pinyin: 'méi', strokeCount: 7, meaning: '没有', phrase: '没空', category: '数字' },
  { char: '更', pinyin: 'gèng', strokeCount: 7, meaning: '更', phrase: '更好', category: '动作' },
  { char: '绿', pinyin: 'lǜ', strokeCount: 11, meaning: '绿色', phrase: '绿叶', category: '颜色' },
  { char: '出', pinyin: 'chū', strokeCount: 5, meaning: '出 / 出去', phrase: '出来', category: '动作' },
  { char: '睡', pinyin: 'shuì', strokeCount: 13, meaning: '睡觉', phrase: '入睡', category: '动作' },
  { char: '那', pinyin: 'nà', strokeCount: 6, meaning: '那', phrase: '那里', category: '方位' },
  { char: '海', pinyin: 'hǎi', strokeCount: 10, meaning: '大海', phrase: '海边', category: '自然' },
  { char: '真', pinyin: 'zhēn', strokeCount: 10, meaning: '真 / 真的', phrase: '真心', category: '动作' },
  { char: '老', pinyin: 'lǎo', strokeCount: 6, meaning: '老', phrase: '老师', category: '家庭' },
  { char: '师', pinyin: 'shī', strokeCount: 6, meaning: '老师', phrase: '师徒', category: '家庭' },
  { char: '吗', pinyin: 'ma', strokeCount: 6, meaning: '吗（疑问）', phrase: '好吗', category: '动作' },
  { char: '同', pinyin: 'tóng', strokeCount: 6, meaning: '同 / 同学', phrase: '同心', category: '家庭' },
  { char: '什', pinyin: 'shén', strokeCount: 4, meaning: '什么', phrase: '干什么', category: '动作' },
  { char: '才', pinyin: 'cái', strokeCount: 3, meaning: '才', phrase: '刚才', category: '动作' },
  { char: '亮', pinyin: 'liàng', strokeCount: 9, meaning: '亮 / 明亮', phrase: '月亮', category: '自然' },
  { char: '时', pinyin: 'shí', strokeCount: 7, meaning: '时间', phrase: '时候', category: '自然' },
  { char: '候', pinyin: 'hòu', strokeCount: 10, meaning: '时候', phrase: '气候', category: '自然' },
  { char: '觉', pinyin: 'jué', strokeCount: 9, meaning: '觉得', phrase: '睡觉', category: '动作' },
  { char: '得', pinyin: 'dé', strokeCount: 11, meaning: '觉得', phrase: '得到', category: '动作' },
  { char: '自', pinyin: 'zì', strokeCount: 6, meaning: '自己', phrase: '自由', category: '家庭' },
  { char: '己', pinyin: 'jǐ', strokeCount: 3, meaning: '自己', phrase: '知己', category: '家庭' },
  { char: '很', pinyin: 'hěn', strokeCount: 9, meaning: '很 / 非常', phrase: '很好', category: '动作' },
  { char: '穿', pinyin: 'chuān', strokeCount: 9, meaning: '穿', phrase: '穿衣', category: '动作' },
  { char: '衣', pinyin: 'yī', strokeCount: 6, meaning: '衣服', phrase: '大衣', category: '物品' },
  { char: '服', pinyin: 'fú', strokeCount: 8, meaning: '衣服', phrase: '服从', category: '物品' },
  { char: '快', pinyin: 'kuài', strokeCount: 7, meaning: '快 / 快乐', phrase: '飞快', category: '动作' },
  { char: '蓝', pinyin: 'lán', strokeCount: 13, meaning: '蓝色', phrase: '蓝天', category: '颜色' },
  { char: '又', pinyin: 'yòu', strokeCount: 2, meaning: '又（再）', phrase: '又快', category: '动作' },
  { char: '笑', pinyin: 'xiào', strokeCount: 10, meaning: '笑', phrase: '笑话', category: '动作' },
  { char: '着', pinyin: 'zhe', strokeCount: 11, meaning: '着（状态）', phrase: '看着', category: '动作' },
  { char: '向', pinyin: 'xiàng', strokeCount: 6, meaning: '向 / 方向', phrase: '向前', category: '方位' },
  { char: '和', pinyin: 'hé', strokeCount: 8, meaning: '和', phrase: '和气', category: '动作' },
  { char: '贝', pinyin: 'bèi', strokeCount: 4, meaning: '贝壳', phrase: '宝贝', category: '物品' },
  { char: '娃', pinyin: 'wá', strokeCount: 9, meaning: '娃娃', phrase: '女娃', category: '家庭' },
  { char: '挂', pinyin: 'guà', strokeCount: 9, meaning: '挂', phrase: '挂上', category: '动作' },
  { char: '活', pinyin: 'huó', strokeCount: 9, meaning: '活 / 活动', phrase: '生活', category: '动作' },
  { char: '群', pinyin: 'qún', strokeCount: 13, meaning: '一群', phrase: '群众', category: '数字' },
  { char: '竹', pinyin: 'zhú', strokeCount: 6, meaning: '竹子', phrase: '竹林', category: '植物' },
  { char: '用', pinyin: 'yòng', strokeCount: 5, meaning: '用', phrase: '有用', category: '动作' },
  { char: '几', pinyin: 'jǐ', strokeCount: 2, meaning: '几 / 多少', phrase: '几个', category: '数字' },
  { char: '步', pinyin: 'bù', strokeCount: 7, meaning: '步 / 脚步', phrase: '一步', category: '动作' },
  { char: '为', pinyin: 'wèi', strokeCount: 4, meaning: '为 / 因为', phrase: '为什么', category: '动作' },
  { char: '参', pinyin: 'cān', strokeCount: 8, meaning: '参加', phrase: '参考', category: '动作' },
  { char: '加', pinyin: 'jiā', strokeCount: 5, meaning: '加 / 参加', phrase: '加法', category: '动作' },
  { char: '洞', pinyin: 'dòng', strokeCount: 9, meaning: '洞', phrase: '山洞', category: '自然' },
  { char: '乌', pinyin: 'wū', strokeCount: 4, meaning: '乌鸦', phrase: '乌黑', category: '动物' },
  { char: '鸦', pinyin: 'yā', strokeCount: 9, meaning: '乌鸦', phrase: '寒鸦', category: '动物' },
  { char: '处', pinyin: 'chù', strokeCount: 5, meaning: '处 / 到处', phrase: '处处', category: '方位' },
  { char: '找', pinyin: 'zhǎo', strokeCount: 7, meaning: '找', phrase: '寻找', category: '动作' },
  { char: '办', pinyin: 'bàn', strokeCount: 4, meaning: '办 / 办法', phrase: '办公', category: '动作' },
  { char: '许', pinyin: 'xǔ', strokeCount: 6, meaning: '许 / 许多', phrase: '许可', category: '动作' },
  { char: '法', pinyin: 'fǎ', strokeCount: 8, meaning: '办法', phrase: '方法', category: '动作' },
  { char: '放', pinyin: 'fàng', strokeCount: 8, meaning: '放', phrase: '放开', category: '动作' },
  { char: '进', pinyin: 'jìn', strokeCount: 7, meaning: '进 / 进来', phrase: '进步', category: '动作' },
  { char: '住', pinyin: 'zhù', strokeCount: 7, meaning: '住', phrase: '住房', category: '动作' },
  { char: '孩', pinyin: 'hái', strokeCount: 9, meaning: '孩子', phrase: '女孩', category: '家庭' },
  { char: '玩', pinyin: 'wán', strokeCount: 8, meaning: '玩', phrase: '玩耍', category: '动作' },
  { char: '吧', pinyin: 'ba', strokeCount: 7, meaning: '吧（语气）', phrase: '走吧', category: '动作' },
  { char: '发', pinyin: 'fā', strokeCount: 5, meaning: '发 / 头发', phrase: '发现', category: '人体' },
  { char: '芽', pinyin: 'yá', strokeCount: 7, meaning: '芽', phrase: '发芽', category: '植物' },
  { char: '爬', pinyin: 'pá', strokeCount: 8, meaning: '爬', phrase: '爬虫', category: '动作' },
  { char: '呀', pinyin: 'ya', strokeCount: 7, meaning: '呀（语气）', phrase: '好呀', category: '动作' },
  { char: '久', pinyin: 'jiǔ', strokeCount: 3, meaning: '久 / 很久', phrase: '不久', category: '时间' },
  { char: '回', pinyin: 'huí', strokeCount: 6, meaning: '回 / 回来', phrase: '回家', category: '动作' },
  { char: '全', pinyin: 'quán', strokeCount: 6, meaning: '全 / 全部', phrase: '安全', category: '数字' },
  { char: '变', pinyin: 'biàn', strokeCount: 8, meaning: '变 / 变化', phrase: '变大', category: '动作' },
  // —— 生字表补全中漏掉的两个字 ——
  { char: '小', pinyin: 'xiǎo', strokeCount: 3, meaning: '大小 / 小', phrase: '小猫小小', category: '动物' },
  { char: '高', pinyin: 'gāo', strokeCount: 10, meaning: '高 / 高大', phrase: '高高大树', category: '方位' },

];

/** 在 RAW_CHARACTERS 基础上，把多音字的第二读音（MULTI_READINGS）派生到 altPinyin。
 *  这样识字卡 / 识字闯关就能展示「又读 xxx」，而无需改动 290 行的原始数据块。 */
export const CHARACTERS: CharacterItem[] = RAW_CHARACTERS.map((c) =>
  MULTI_READINGS[c.char] ? { ...c, altPinyin: MULTI_READINGS[c.char] } : c
);

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
  { title: '江南', author: '汉乐府', lines: ['江南可采莲，', '莲叶何田田。', '鱼戏莲叶间。', '鱼戏莲叶东，', '鱼戏莲叶西，', '鱼戏莲叶南，', '鱼戏莲叶北。'] },
  { title: '春晓', author: '孟浩然', lines: ['春眠不觉晓，', '处处闻啼鸟。', '夜来风雨声，', '花落知多少。'] },
  { title: '村居', author: '高鼎', lines: ['草长莺飞二月天，', '拂堤杨柳醉春烟。', '儿童散学归来早，', '忙趁东风放纸鸢。'] },
  { title: '咏柳', author: '贺知章', lines: ['碧玉妆成一树高，', '万条垂下绿丝绦。', '不知细叶谁裁出，', '二月春风似剪刀。'] },
  { title: '登鹳雀楼', author: '王之涣', lines: ['白日依山尽，', '黄河入海流。', '欲穷千里目，', '更上一层楼。'] },
  { title: '敕勒歌', author: '北朝民歌', lines: ['敕勒川，阴山下。', '天似穹庐，笼盖四野。', '天苍苍，野茫茫，', '风吹草低见牛羊。'] },
  { title: '池上', author: '白居易', lines: ['小娃撑小艇，', '偷采白莲回。', '不解藏踪迹，', '浮萍一道开。'] },
  { title: '小池', author: '杨万里', lines: ['泉眼无声惜细流，', '树阴照水爱晴柔。', '小荷才露尖尖角，', '早有蜻蜓立上头。'] },
  { title: '画', author: '王维', lines: ['远看山有色，', '近听水无声。', '春去花还在，', '人来鸟不惊。'] },
  // —— 一年级上册 必背补充 ——
  { title: '赠汪伦', author: '李白', lines: ['李白乘舟将欲行，', '忽闻岸上踏歌声。', '桃花潭水深千尺，', '不及汪伦送我情。'] },
  { title: '寻隐者不遇', author: '贾岛', lines: ['松下问童子，', '言师采药去。', '只在此山中，', '云深不知处。'] },
  { title: '风', author: '李峤', lines: ['解落三秋叶，', '能开二月花。', '过江千尺浪，', '入竹万竿斜。'] },
  { title: '画鸡', author: '唐寅', lines: ['头上红冠不用裁，', '满身雪白走将来。', '平生不敢轻言语，', '一叫千门万户开。'] },
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


/* 英语基础数据已拆分到 study-data-en.ts（LetterItem / LETTERS / WordItem / EN_WORD_TOPICS / ALL_EN_WORDS），
   通过下面这行聚合回 '@/lib/study-data'，外部消费方无需改动 import 路径。 */
export * from './study-data-en';

/* ============================================================
   人教版（部编版）小学一年级上册 · 拓展内容
   ============================================================ */


/* -------------------- 语文 · 课文朗读（一年级上册） -------------------- */
export interface TextItem {
  title: string;
  emoji: string;
  lines: string[];
}
export const TEXTS: TextItem[] = [
  { title: '秋天', emoji: '🍂', lines: ['天气凉了，树叶黄了。', '一片片叶子从树上落下来。', '天空那么蓝，那么高。', '一群大雁往南飞，一会儿排成个“人”字，一会儿排成个“一”字。', '啊！秋天来了！'] },
  { title: '小小的船', emoji: '🌙', lines: ['弯弯的月儿小小的船，', '小小的船儿两头尖。', '我在小小的船里坐，', '只看见闪闪的星星蓝蓝的天。'] },
  { title: '江南', emoji: '🪷', lines: ['江南可采莲，', '莲叶何田田。', '鱼戏莲叶间。', '鱼戏莲叶东，鱼戏莲叶西，', '鱼戏莲叶南，鱼戏莲叶北。'] },
  { title: '四季', emoji: '🌸', lines: ['草芽尖尖，他对小鸟说：“我是春天。”', '荷叶圆圆，他对青蛙说：“我是夏天。”', '谷穗弯弯，他鞠着躬说：“我是秋天。”', '雪人大肚子一挺，他顽皮地说：“我就是冬天。”'] },
  { title: '影子', emoji: '👤', lines: ['影子在前，影子在后，', '影子常常跟着我，就像一条小黑狗。', '影子在左，影子在右，', '影子常常陪着我，它是我的好朋友。'] },
  { title: '比尾巴', emoji: '🐒', lines: ['谁的尾巴长？谁的尾巴短？谁的尾巴好像一把伞？', '猴子的尾巴长。兔子的尾巴短。松鼠的尾巴好像一把伞。', '谁的尾巴弯？谁的尾巴扁？谁的尾巴最好看？', '公鸡的尾巴弯。鸭子的尾巴扁。孔雀的尾巴最好看。'] },
  { title: '青蛙写诗', emoji: '🐸', lines: ['下雨了，雨点儿淅沥沥，沙啦啦。', '青蛙说：“我要写诗啦！”', '小蝌蚪游过来说：“我要给你当个小逗号。”', '池塘里的水泡泡说：“我能当个小句号。”', '荷叶上的一串水珠说：“我们可以当省略号。”', '青蛙的诗写成了：“呱呱，呱呱，呱呱呱……”'] },
  { title: '雨点儿', emoji: '🌧️', lines: ['数不清的雨点儿，从云彩里飘落下来。', '半空中，大雨点儿问小雨点儿：“你要到哪里去？”', '小雨点儿回答：“我要去有花有草的地方。”', '大雨点儿说：“我要去没有花没有草的地方。”'] },
  { title: '明天要远足', emoji: '🎒', lines: ['翻过来，翻过去，唉——睡不着。', '那地方的海，真的像老师说的，那么多种颜色吗？', '那地方的云，真的像同学说的，那么洁白柔软吗？'] },
  { title: '大还是小', emoji: '🤔', lines: ['有时候，我很大。', '我自己穿衣服的时候，我自己系鞋带的时候，我觉得自己很大。', '有时候，我很小。', '我够不到按钮的时候，我听到雷声喊妈妈的时候，我觉得自己很小。'] },
  { title: '项链', emoji: '🐚', lines: ['大海，蓝蓝的，又宽又远。', '沙滩，黄黄的，又长又软。', '雪白雪白的浪花，悄悄撒下小小的海螺和贝壳。', '小娃娃捡起海螺和贝壳，穿成彩色的项链，挂在胸前。'] },
  { title: '雪地里的小画家', emoji: '⛄', lines: ['下雪啦，下雪啦！', '雪地里来了一群小画家。', '小鸡画竹叶，小狗画梅花，', '小鸭画枫叶，小马画月牙。', '不用颜料不用笔，几步就成一幅画。', '青蛙为什么没参加？他在洞里睡着啦。'] },
  { title: '乌鸦喝水', emoji: '🐦', lines: ['一只乌鸦口渴了，到处找水喝。', '乌鸦看见一个瓶子，瓶子里有水。可是瓶口小，喝不着。', '乌鸦看见旁边有许多小石子，想出办法来了。', '乌鸦把石子一颗一颗放进瓶子里。水渐渐升高，乌鸦就喝着水了。'] },
  { title: '小蜗牛', emoji: '🐌', lines: ['蜗牛一家住在小树林旁边。', '春天来了，蜗牛妈妈对小蜗牛说：“到小树林里去玩吧，小树发芽了。”', '小蜗牛爬呀爬呀，好久才爬回来。他说：“妈妈，小树长满了叶子，地上还长着许多草莓呢。”', '蜗牛妈妈笑着说：“哦，已经是夏天了！”'] },
];

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
  emoji: string;
}
export const CLOCKS: ClockItem[] = [
  { hour: 1, label: '1时', emoji: '🕐' },
  { hour: 2, label: '2时', emoji: '🕑' },
  { hour: 3, label: '3时', emoji: '🕒' },
  { hour: 4, label: '4时', emoji: '🕓' },
  { hour: 5, label: '5时', emoji: '🕔' },
  { hour: 6, label: '6时', emoji: '🕕' },
  { hour: 7, label: '7时', emoji: '🕖' },
  { hour: 8, label: '8时', emoji: '🕗' },
  { hour: 9, label: '9时', emoji: '🕘' },
  { hour: 10, label: '10时', emoji: '🕙' },
  { hour: 11, label: '11时', emoji: '🕚' },
  { hour: 12, label: '12时', emoji: '🕛' },
];

/* -------------------- 英语 · 人教版（一年级起点）单元 -------------------- */
/**
 * Unit 1~7 对齐教材单元；Extra 为课外拓展主题。
 * 约束：EN_WORD_TOPICS 的每个主题都必须落在某个单元里，
 * 否则那批单词在「单元通关」里根本刷不到（有测试守着）。
 */
export interface EnUnit {
  unit: string;
  title: string;
  emoji: string;
  topics: string[];
  extra?: boolean; // 教材之外的拓展单元
}
export const EN_UNITS: EnUnit[] = [
  { unit: 'Unit 1', title: 'Hello! 你好', emoji: '👋', topics: ['问候'] },
  { unit: 'Unit 2', title: 'My school 我的学校', emoji: '🏫', topics: ['学校'] },
  { unit: 'Unit 3', title: 'My face 我的脸', emoji: '😊', topics: ['身体'] },
  { unit: 'Unit 4', title: 'Animals 动物', emoji: '🐾', topics: ['动物'] },
  { unit: 'Unit 5', title: 'Numbers 数字', emoji: '🔢', topics: ['数字'] },
  { unit: 'Unit 6', title: 'Colours 颜色', emoji: '🌈', topics: ['颜色'] },
  { unit: 'Unit 7', title: 'Fruit & food 水果食物', emoji: '🍎', topics: ['食物'] },
  { unit: 'Extra 1', title: 'My family 我的家人', emoji: '👨‍👩‍👧', topics: ['家人'], extra: true },
  { unit: 'Extra 2', title: 'Clothes 我的衣服', emoji: '👕', topics: ['衣物'], extra: true },
  { unit: 'Extra 3', title: 'Actions 动起来', emoji: '🏃', topics: ['动作'], extra: true },
  { unit: 'Extra 4', title: 'Nature & weather 自然天气', emoji: '🌤️', topics: ['自然', '天气'], extra: true },
  { unit: 'Extra 5', title: 'Transport 交通工具', emoji: '🚌', topics: ['交通工具'], extra: true },
  { unit: 'Extra 6', title: 'Toys & places 玩具去处', emoji: '🧸', topics: ['玩具', '场所'], extra: true },
  { unit: 'Extra 7', title: 'Time 时间', emoji: '🕒', topics: ['时间'], extra: true },
];

/* ============================================================
   人教版（部编版）小学一年级上册 · 进一步扩充
   —— 笔画偏旁 / 课文生字 / 分与合 / RAZ 点读
   ============================================================ */

/* -------------------- 语文 · 基本笔画（写字基础） -------------------- */
export interface StrokeItem {
  stroke: string; // 笔画符号
  name: string; // 笔画名称
  example: string; // 例字
  dir: string; // 书写方向小提示
}
export const STROKES: StrokeItem[] = [
  { stroke: '一', name: '横', example: '一 二 三', dir: '从左到右' },
  { stroke: '丨', name: '竖', example: '十 中 上', dir: '从上到下' },
  { stroke: '丿', name: '撇', example: '八 人 天', dir: '从右上到左下' },
  { stroke: '㇏', name: '捺', example: '八 入 尺', dir: '从左上到右下' },
  { stroke: '丶', name: '点', example: '头 火 下', dir: '从轻到重' },
  { stroke: '㇀', name: '提', example: '虫 把 江', dir: '从下到右上' },
  { stroke: '𠃍', name: '横折', example: '口 五 日', dir: '横后折下' },
  { stroke: '㇇', name: '横撇', example: '又 水 子', dir: '横后向左撇' },
  { stroke: '乛', name: '横钩', example: '你 子 买', dir: '横后向左钩' },
  { stroke: '𠃊', name: '竖折', example: '山 牙 出', dir: '竖后向右折' },
  { stroke: '㇙', name: '竖提', example: '长 比 衣', dir: '竖后向右上提' },
  { stroke: '㇄', name: '竖弯', example: '四 西 酒', dir: '竖后向右弯' },
  { stroke: '亅', name: '竖钩', example: '小 可 水', dir: '竖后向左上钩' },
  { stroke: '㇁', name: '弯钩', example: '了 手 狗', dir: '弯弯地钩起' },
  { stroke: '㇂', name: '斜钩', example: '我 成 战', dir: '向右下斜钩' },
  { stroke: '𠃋', name: '撇折', example: '去 东 公', dir: '撇后向右折' },
  { stroke: '㇃', name: '卧钩', example: '心 思 怎', dir: '躺平后向上钩' },
  { stroke: '𡿨', name: '撇点', example: '女 妈 好', dir: '撇后向右点' },
  { stroke: '𠃌', name: '横折钩', example: '月 用 力', dir: '横折后向左钩' },
  { stroke: '乚', name: '竖弯钩', example: '儿 巴 毛', dir: '竖弯后向上钩' },
  { stroke: '㇈', name: '横折弯钩', example: '九 几 吃', dir: '横折弯后向上钩' },
  { stroke: '㇉', name: '竖折折钩', example: '马 鸟 妈', dir: '竖折折后向左钩' },
];

/* -------------------- 语文 · 常用偏旁部首 -------------------- */
export interface RadicalItem {
  radical: string;
  name: string;
  examples: string[];
}
export const RADICALS: RadicalItem[] = [
  { radical: '亻', name: '单人旁', examples: ['你', '们', '作', '他'] },
  { radical: '扌', name: '提手旁', examples: ['把', '挂', '打', '拍'] },
  { radical: '艹', name: '草字头', examples: ['莲', '芽', '花', '苗'] },
  { radical: '口', name: '口字旁', examples: ['叶', '吗', '吃', '听'] },
  { radical: '囗', name: '国字框', examples: ['国', '回', '园'] },
  { radical: '氵', name: '三点水', examples: ['江', '河', '洗', '洞'] },
  { radical: '讠', name: '言字旁', examples: ['说', '课', '语', '话'] },
  { radical: '虫', name: '虫字旁', examples: ['蛙', '蚂', '蚁', '蜘'] },
  { radical: '木', name: '木字旁', examples: ['树', '桃', '林', '桥'] },
  { radical: '日', name: '日字旁', examples: ['明', '晚', '时', '晴'] },
  { radical: '月', name: '月字旁', examples: ['朋', '肚', '肥', '脚'] },
  { radical: '女', name: '女字旁', examples: ['好', '妹', '妈', '奶'] },
  { radical: '纟', name: '绞丝旁', examples: ['红', '绿', '给', '纸'] },
  { radical: '宀', name: '宝盖', examples: ['它', '家', '字', '安'] },
  { radical: '辶', name: '走之', examples: ['远', '近', '送', '过'] },
  { radical: '犭', name: '反犬旁', examples: ['猫', '狗', '猪', '猴'] },
  { radical: '门', name: '门字框', examples: ['闪', '问', '间', '闲'] },
  { radical: '禾', name: '禾木旁', examples: ['和', '秋', '种', '香'] },
  { radical: '鸟', name: '鸟字边', examples: ['鸭', '鸡', '鹅', '鸦'] },
  { radical: '灬', name: '四点底', examples: ['点', '黑', '热', '煮'] },
  { radical: '目', name: '目字旁', examples: ['眼', '睛', '睡', '盯'] },
  { radical: '彳', name: '双人旁', examples: ['得', '很', '行', '往'] },
  { radical: '攵', name: '反文旁', examples: ['放', '收', '数', '教'] },
  { radical: '刂', name: '立刀', examples: ['到', '别', '刻', '剧'] },
];

/* -------------------- 语文 · 笔顺规则口诀（书写提示） -------------------- */
export interface StrokeRule {
  name: string; // 规则名称
  rhyme: string; // 顺口溜
  examples: string[]; // 例字
  emoji: string;
}
export const STROKE_RULES: StrokeRule[] = [
  { name: '先横后竖', rhyme: '横要平，竖要直，先写横来后写竖。', examples: ['十', '干', '王'], emoji: '一' },
  { name: '先撇后捺', rhyme: '撇向左，捺向右，先撇后捺字才正。', examples: ['人', '八', '天'], emoji: '丿' },
  { name: '从上到下', rhyme: '一笔一笔往下写，从上到下不乱跑。', examples: ['三', '云', '草'], emoji: '⬇️' },
  { name: '从左到右', rhyme: '左边写完写右边，从左到右排排队。', examples: ['川', '奶', '林'], emoji: '➡️' },
  { name: '先外后内', rhyme: '外面先写框，再写里面小娃娃。', examples: ['月', '用', '风'], emoji: '🔲' },
  { name: '先中间后两边', rhyme: '中间先站稳，左边右边再跟上。', examples: ['水', '小', '办'], emoji: '🎯' },
  { name: '先外后内再封口', rhyme: '先写大门框，里头写完再关门。', examples: ['日', '田', '口'], emoji: '🚪' },
];

/* -------------------- 语文 · 汉字变变变（我的发现·汉字规律） -------------------- */
export interface CharTransform {
  chars: string[]; // 一组相关的字，如 ['人', '从', '众']
  title: string; // 规律说明，如「人→从→众」
  hint: string; // 发现提示
  emoji: string;
}
export const CHAR_TRANSFORMS: CharTransform[] = [
  { chars: ['人', '从', '众'], title: '人→从→众', hint: '一个人，两个人跟着，三个人就变成一群啦！', emoji: '👥' },
  { chars: ['木', '林', '森'], title: '木→林→森', hint: '一棵树、两棵树成树林，三棵树就是大森林！', emoji: '🌳' },
  { chars: ['口', '吕', '品'], title: '口→吕→品', hint: '一个口，两个口，三个口，嘴巴多就是"品"味！', emoji: '👄' },
  { chars: ['日', '昌', '晶'], title: '日→昌→晶', hint: '一个太阳、两个太阳亮堂堂，三个太阳亮晶晶！', emoji: '☀️' },
  { chars: ['一', '二', '三'], title: '一→二→三', hint: '一横、两横、三横，数字就是这么变出来的！', emoji: '🔢' },
  { chars: ['大', '天', '夫'], title: '大→天→夫', hint: '大人头上加一横就是"天"丈夫，一个比一个厉害！', emoji: '🧑' },
  { chars: ['水', '冰', '淼'], title: '水→冰→淼', hint: '水结成冰，水多多就变成"淼"啦！', emoji: '💧' },
];

/* -------------------- 语文 · 课文生字（一年级上册课文 1~14） -------------------- */
export interface TextCharItem {
  char: string;
  phrase: string;
}
export interface TextCharLesson {
  title: string;
  emoji: string;
  items: TextCharItem[];
}
export const TEXT_CHAR_LESSONS: TextCharLesson[] = [
  { title: '课文 1《秋天》', emoji: '🍂', items: [
    { char: '秋', phrase: '秋天' }, { char: '气', phrase: '天气' }, { char: '了', phrase: '凉了' },
    { char: '树', phrase: '大树' }, { char: '叶', phrase: '树叶' }, { char: '片', phrase: '一片' },
    { char: '飞', phrase: '飞走' }, { char: '会', phrase: '大会' }, { char: '个', phrase: '一个' },
  ] },
  { title: '课文 2《小小的船》', emoji: '🌙', items: [
    { char: '船', phrase: '小船' }, { char: '两', phrase: '两头' }, { char: '头', phrase: '船头' },
    { char: '在', phrase: '坐在' }, { char: '里', phrase: '里面' }, { char: '看', phrase: '看见' },
    { char: '见', phrase: '见到' }, { char: '闪', phrase: '闪亮' }, { char: '星', phrase: '星星' },
  ] },
  { title: '课文 3《江南》', emoji: '🪷', items: [
    { char: '江', phrase: '江南' }, { char: '南', phrase: '南方' }, { char: '可', phrase: '可以' },
    { char: '采', phrase: '采莲' }, { char: '莲', phrase: '莲叶' }, { char: '鱼', phrase: '小鱼' },
    { char: '东', phrase: '东边' }, { char: '西', phrase: '西边' }, { char: '北', phrase: '北边' },
  ] },
  { title: '课文 4《四季》', emoji: '🌸', items: [
    { char: '尖', phrase: '尖尖' }, { char: '说', phrase: '说话' }, { char: '春', phrase: '春天' },
    { char: '青', phrase: '青蛙' }, { char: '蛙', phrase: '青蛙' }, { char: '夏', phrase: '夏天' },
    { char: '弯', phrase: '弯弯' }, { char: '就', phrase: '就是' }, { char: '冬', phrase: '冬天' },
  ] },
  { title: '课文 5《影子》', emoji: '👤', items: [
    { char: '影', phrase: '影子' }, { char: '前', phrase: '前面' }, { char: '后', phrase: '后面' },
    { char: '黑', phrase: '黑色' }, { char: '狗', phrase: '小狗' }, { char: '左', phrase: '左边' },
    { char: '右', phrase: '右边' }, { char: '它', phrase: '它的' }, { char: '朋', phrase: '朋友' },
    { char: '友', phrase: '朋友' },
  ] },
  { title: '课文 6《比尾巴》', emoji: '🐒', items: [
    { char: '比', phrase: '比较' }, { char: '尾', phrase: '尾巴' }, { char: '巴', phrase: '尾巴' },
    { char: '谁', phrase: '谁的' }, { char: '长', phrase: '长长' }, { char: '短', phrase: '短短' },
    { char: '把', phrase: '一把' }, { char: '伞', phrase: '雨伞' }, { char: '兔', phrase: '兔子' },
    { char: '最', phrase: '最好' },
  ] },
  { title: '课文 7《青蛙写诗》', emoji: '🐸', items: [
    { char: '写', phrase: '写字' }, { char: '诗', phrase: '古诗' }, { char: '点', phrase: '标点' },
    { char: '要', phrase: '需要' }, { char: '过', phrase: '过来' }, { char: '给', phrase: '送给' },
    { char: '当', phrase: '当心' }, { char: '串', phrase: '一串' }, { char: '们', phrase: '我们' },
    { char: '以', phrase: '可以' },
  ] },
  { title: '课文 8《雨点儿》', emoji: '🌧️', items: [
    { char: '雨', phrase: '雨点' }, { char: '数', phrase: '数数' }, { char: '清', phrase: '数不清' },
    { char: '彩', phrase: '云彩' }, { char: '飘', phrase: '飘落' }, { char: '落', phrase: '落下' },
    { char: '空', phrase: '空中' }, { char: '问', phrase: '问好' }, { char: '回', phrase: '回答' },
    { char: '答', phrase: '回答' },
  ] },
  { title: '课文 9《明天要远足》', emoji: '🎒', items: [
    { char: '明', phrase: '明天' }, { char: '才', phrase: '才来' }, { char: '同', phrase: '同学' },
    { char: '学', phrase: '学习' }, { char: '睡', phrase: '睡觉' }, { char: '海', phrase: '大海' },
    { char: '真', phrase: '真的' }, { char: '老', phrase: '老师' }, { char: '师', phrase: '老师' },
    { char: '吗', phrase: '好吗' },
  ] },
  { title: '课文 10《大还是小》', emoji: '🤔', items: [
    { char: '时', phrase: '时候' }, { char: '候', phrase: '时候' }, { char: '觉', phrase: '觉得' },
    { char: '得', phrase: '觉得' }, { char: '自', phrase: '自己' }, { char: '己', phrase: '自己' },
    { char: '很', phrase: '很多' }, { char: '穿', phrase: '穿衣' }, { char: '服', phrase: '衣服' },
    { char: '快', phrase: '快乐' },
  ] },
  { title: '课文 11《项链》', emoji: '🐚', items: [
    { char: '蓝', phrase: '蓝色' }, { char: '又', phrase: '又宽又远' }, { char: '笑', phrase: '大笑' },
    { char: '着', phrase: '笑着' }, { char: '向', phrase: '方向' }, { char: '和', phrase: '和好' },
    { char: '贝', phrase: '贝壳' }, { char: '娃', phrase: '娃娃' }, { char: '挂', phrase: '挂上' },
    { char: '活', phrase: '快活' }, { char: '金', phrase: '金色' },
  ] },
  { title: '课文 12《雪地里的小画家》', emoji: '⛄', items: [
    { char: '群', phrase: '一群' }, { char: '竹', phrase: '竹叶' }, { char: '牙', phrase: '月牙' },
    { char: '用', phrase: '不用' }, { char: '几', phrase: '几步' }, { char: '步', phrase: '脚步' },
    { char: '为', phrase: '因为' }, { char: '参', phrase: '参加' }, { char: '加', phrase: '参加' },
    { char: '洞', phrase: '洞里' }, { char: '着', phrase: '睡着' },
  ] },
  { title: '课文 13《乌鸦喝水》', emoji: '🐦', items: [
    { char: '乌', phrase: '乌鸦' }, { char: '鸦', phrase: '乌鸦' }, { char: '处', phrase: '到处' },
    { char: '找', phrase: '找到' }, { char: '办', phrase: '办法' }, { char: '旁', phrase: '旁边' },
    { char: '许', phrase: '许多' }, { char: '法', phrase: '办法' }, { char: '放', phrase: '放进' },
    { char: '进', phrase: '进去' }, { char: '高', phrase: '升高' },
  ] },
  { title: '课文 14《小蜗牛》', emoji: '🐌', items: [
    { char: '住', phrase: '住在' }, { char: '孩', phrase: '小孩' }, { char: '玩', phrase: '玩吧' },
    { char: '吧', phrase: '走吧' }, { char: '发', phrase: '发芽' }, { char: '芽', phrase: '发芽' },
    { char: '爬', phrase: '爬呀' }, { char: '呀', phrase: '爬呀' }, { char: '久', phrase: '好久' },
    { char: '回', phrase: '回来' }, { char: '全', phrase: '全了' }, { char: '变', phrase: '变了' },
  ] },
];

/* -------------------- 语文 · 描红字库（扩展，含课文常用字） -------------------- */
export const TRACE_CHARS: string[] = [
  '人', '口', '日', '月', '水', '火', '大', '小', '上', '下', '木', '山', '石', '田', '土', '天',
  '一', '二', '三', '十', '中', '了', '子', '头', '目', '耳', '手', '足', '心', '女', '力', '刀',
  '风', '云', '雨', '马', '牛', '羊', '鸟', '鱼', '花', '虫', '书', '门', '牙', '尺', '文', '不',
  '飞', '见', '明', '星', '朋', '友', '问', '同', '自', '己', '衣', '牙', '王', '生', '里', '东',
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

/* -------------------- 语文 · 拼音拼读（声母 + 单韵母 拼一拼） -------------------- */
export interface PinyinBlendItem {
  sheng: string; // 声母
  yun: string; // 单韵母
  syllable: string; // 拼出的音节
  word: string; // 例字
  emoji: string;
}
export const PINYIN_BLEND: PinyinBlendItem[] = [
  { sheng: 'b', yun: 'a', syllable: 'ba', word: '八', emoji: '🎈' },
  { sheng: 'p', yun: 'a', syllable: 'pa', word: '趴', emoji: '🐭' },
  { sheng: 'm', yun: 'a', syllable: 'ma', word: '妈', emoji: '👩' },
  { sheng: 'd', yun: 'a', syllable: 'da', word: '大', emoji: '🐘' },
  { sheng: 't', yun: 'a', syllable: 'ta', word: '他', emoji: '🧒' },
  { sheng: 'n', yun: 'a', syllable: 'na', word: '拿', emoji: '✋' },
  { sheng: 'l', yun: 'a', syllable: 'la', word: '拉', emoji: '🎻' },
  { sheng: 'b', yun: 'o', syllable: 'bo', word: '波', emoji: '🌊' },
  { sheng: 'p', yun: 'o', syllable: 'po', word: '坡', emoji: '⛰️' },
  { sheng: 'm', yun: 'o', syllable: 'mo', word: '摸', emoji: '🤚' },
  { sheng: 'f', yun: 'o', syllable: 'fo', word: '佛', emoji: '🙏' },
  { sheng: 'b', yun: 'i', syllable: 'bi', word: '笔', emoji: '🖊️' },
  { sheng: 'p', yun: 'i', syllable: 'pi', word: '皮', emoji: '👟' },
  { sheng: 'm', yun: 'i', syllable: 'mi', word: '米', emoji: '🍚' },
  { sheng: 'g', yun: 'e', syllable: 'ge', word: '哥', emoji: '👦' },
  { sheng: 'h', yun: 'e', syllable: 'he', word: '喝', emoji: '🥤' },
  { sheng: 'b', yun: 'u', syllable: 'bu', word: '布', emoji: '👕' },
  { sheng: 'm', yun: 'u', syllable: 'mu', word: '木', emoji: '🪵' },
  { sheng: 'h', yun: 'u', syllable: 'hu', word: '虎', emoji: '🐯' },
];

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
];

/* -------------------- 英语 · 自然拼读（CVC 词） -------------------- */
export interface CvcItem {
  word: string;
  sound: string; // 字母音拆分，如 c-a-t
  emoji: string;
  cn: string;
}
export const CVC_WORDS: CvcItem[] = [
  { word: 'cat', sound: 'c-a-t', emoji: '🐱', cn: '猫' },
  { word: 'dog', sound: 'd-o-g', emoji: '🐶', cn: '狗' },
  { word: 'pig', sound: 'p-i-g', emoji: '🐷', cn: '猪' },
  { word: 'sun', sound: 's-u-n', emoji: '☀️', cn: '太阳' },
  { word: 'cup', sound: 'c-u-p', emoji: '🥤', cn: '杯子' },
  { word: 'hat', sound: 'h-a-t', emoji: '🎩', cn: '帽子' },
  { word: 'bug', sound: 'b-u-g', emoji: '🐛', cn: '虫子' },
  { word: 'box', sound: 'b-o-x', emoji: '📦', cn: '盒子' },
  { word: 'pen', sound: 'p-e-n', emoji: '🖊️', cn: '钢笔' },
  { word: 'red', sound: 'r-e-d', emoji: '🔴', cn: '红色' },
  { word: 'bed', sound: 'b-e-d', emoji: '🛏️', cn: '床' },
  { word: 'fox', sound: 'f-o-x', emoji: '🦊', cn: '狐狸' },
  { word: 'bag', sound: 'b-a-g', emoji: '👜', cn: '包' },
  { word: 'map', sound: 'm-a-p', emoji: '🗺️', cn: '地图' },
  { word: 'bat', sound: 'b-a-t', emoji: '🦇', cn: '蝙蝠' },
  { word: 'rat', sound: 'r-a-t', emoji: '🐀', cn: '老鼠' },
  { word: 'fan', sound: 'f-a-n', emoji: '💨', cn: '扇子' },
  { word: 'mat', sound: 'm-a-t', emoji: '🟫', cn: '垫子' },
  { word: 'hen', sound: 'h-e-n', emoji: '🐔', cn: '母鸡' },
  { word: 'ten', sound: 't-e-n', emoji: '🔟', cn: '十' },
  { word: 'leg', sound: 'l-e-g', emoji: '🦵', cn: '腿' },
  { word: 'net', sound: 'n-e-t', emoji: '🕸️', cn: '网' },
  { word: 'big', sound: 'b-i-g', emoji: '🐘', cn: '大的' },
  { word: 'pin', sound: 'p-i-n', emoji: '📌', cn: '别针' },
  { word: 'fin', sound: 'f-i-n', emoji: '🐟', cn: '鱼鳍' },
  { word: 'sit', sound: 's-i-t', emoji: '🪑', cn: '坐' },
  { word: 'six', sound: 's-i-x', emoji: '6️⃣', cn: '六' },
  { word: 'log', sound: 'l-o-g', emoji: '🪵', cn: '木头' },
  { word: 'pot', sound: 'p-o-t', emoji: '🍲', cn: '锅' },
  { word: 'hot', sound: 'h-o-t', emoji: '🥵', cn: '热' },
  { word: 'top', sound: 't-o-p', emoji: '🔝', cn: '顶' },
  { word: 'mop', sound: 'm-o-p', emoji: '🧹', cn: '拖把' },
  { word: 'rug', sound: 'r-u-g', emoji: '🟥', cn: '地毯' },
  { word: 'bus', sound: 'b-u-s', emoji: '🚌', cn: '公交车' },
  { word: 'nut', sound: 'n-u-t', emoji: '🥜', cn: '坚果' },
  { word: 'hug', sound: 'h-u-g', emoji: '🤗', cn: '拥抱' },
  { word: 'tub', sound: 't-u-b', emoji: '🛁', cn: '浴缸' },
];

/* -------------------- 语文 · 课文阅读理解（一年级短句） -------------------- */
export interface ReadingItem {
  passage: string;
  question: string;
  options: string[];
  answer: string;
  emoji: string;
  chapter?: string;
}
export const READING_PASSAGES: ReadingItem[] = [
  { passage: '小鸡跟着鸡妈妈在草地上找虫子吃。', question: '小鸡在干什么？', options: ['找虫子吃', '睡觉', '游泳'], answer: '找虫子吃', emoji: '🐤' },
  { passage: '天上的白云像小羊。', question: '白云像什么？', options: ['小羊', '小鱼', '小树'], answer: '小羊', emoji: '☁️' },
  { passage: '秋天到了，树叶变黄了，一片一片落下来。', question: '树叶为什么落下来？', options: ['秋天到了', '春天到了', '被风吹跑'], answer: '秋天到了', emoji: '🍂' },
  { passage: '小明早上自己穿好衣服，背上书包去上学。', question: '小明去哪里？', options: ['上学', '公园', '超市'], answer: '上学', emoji: '🎒' },
  { passage: '小兔子爱吃胡萝卜，不爱吃肉。', question: '小兔子爱吃什么？', options: ['胡萝卜', '肉', '米饭'], answer: '胡萝卜', emoji: '🥕' },
  { passage: '晚上，月亮挂在天上，星星一闪一闪。', question: '什么时候星星出来了？', options: ['晚上', '早上', '中午'], answer: '晚上', emoji: '⭐' },
  { passage: '花儿开了，蜜蜂来采蜜。', question: '谁在采蜜？', options: ['蜜蜂', '蝴蝶', '小鸟'], answer: '蜜蜂', emoji: '🐝' },
  { passage: '弟弟把玩具收拾好，房间变干净了。', question: '房间为什么干净了？', options: ['玩具收拾好了', '有人打扫', '本来就很干净'], answer: '玩具收拾好了', emoji: '🧸' },

  // —— 2025 新增：萌可主题小故事（读懂萌可们的小日常）——
  { passage: '爱心萌可看见小朋友摔倒了，马上跑过去把小朋友扶起来。', question: '爱心萌可在干什么？', options: ['扶起摔倒的小朋友', '玩游戏', '睡大觉'], answer: '扶起摔倒的小朋友', emoji: '💗' },
  { passage: '正正萌可和好朋友赛跑，虽然他跑得慢，但他一直坚持，终于跑到了终点。', question: '正正萌可跑到了哪里？', options: ['终点', '山顶', '家里'], answer: '终点', emoji: '💪' },
  { passage: '唱唱萌可在花园里唱歌，小鸟听见了，也跟着叽叽喳喳地唱起来。', question: '谁跟着唱唱萌可唱歌？', options: ['小鸟', '小鱼', '小猫'], answer: '小鸟', emoji: '🎵' },
  { passage: '好奇萌可捡到一片奇怪的叶子，他拿起放大镜，认真地看了又看。', question: '好奇萌可用什么看叶子？', options: ['放大镜', '望远镜', '眼镜'], answer: '放大镜', emoji: '🔍' },
  { passage: '甜心萌可做了甜甜的糖果，她把糖果分给每一个小伙伴吃。', question: '甜心萌可把糖果分给谁？', options: ['小伙伴', '陌生人', '全都自己吃'], answer: '小伙伴', emoji: '🍬' },
  { passage: '宝石萌可在宝石洞里找呀找，终于找到一颗闪闪发光的红宝石。', question: '宝石萌可找到了什么？', options: ['红宝石', '糖果', '玩具'], answer: '红宝石', emoji: '💎' },
  { passage: '温柔萌可说话轻轻的，上课时她总是小声提醒大家坐端正、认真听。', question: '温柔萌可提醒大家做什么？', options: ['坐端正、认真听', '大声说话', '跑出去玩'], answer: '坐端正、认真听', emoji: '🌸' },
  { passage: '淘气萌可把钥匙萌可的钥匙藏了起来，急得钥匙萌可到处找。', question: '谁藏起了钥匙？', options: ['淘气萌可', '爱心萌可', '唱唱萌可'], answer: '淘气萌可', emoji: '😈' },
  { passage: '乐美公主教小朋友变魔法：先把爱心魔杖举高高，再转一个圈。', question: '乐美公主教小朋友做什么？', options: ['变魔法', '写作业', '买菜'], answer: '变魔法', emoji: '👑' },
  { passage: '月光萌可晚上睡不着，她数着天上的星星：一颗、两颗……数着数着就睡着了。', question: '月光萌可数什么睡觉？', options: ['星星', '苹果', '小汽车'], answer: '星星', emoji: '🌙' },
];

/* -------------------- 数学 · 序数（第1~第N / 排队） -------------------- */
export interface OrdinalItem {
  row: string[]; // 一排 emoji
  ask: number; // 从左边数，第几个（0 基）
  question: string;
  answer: string; // 如 第3
}
export const ORDINALS: OrdinalItem[] = [
  { row: ['🐱', '🐶', '🐰', '🐯', '🐼'], ask: 2, question: '🐱🐶🐰🐯🐼 从左边数，🐰排第几？', answer: '第3' },
  { row: ['🍎', '🍌', '🍊', '🍇'], ask: 0, question: '🍎🍌🍊🍇 从左边数，🍎排第几？', answer: '第1' },
  { row: ['🚌', '🚗', '🚕', '🚙', '🚎'], ask: 4, question: '🚌🚗🚕🚙🚎 从左边数，🚎排第几？', answer: '第5' },
  { row: ['🐟', '🐠', '🐡', '🦈'], ask: 1, question: '🐟🐠🐡🦈 从左边数，🐠排第几？', answer: '第2' },
  { row: ['🌹', '🌻', '🌷', '🌼', '🌺'], ask: 2, question: '🌹🌻🌷🌼🌺 从左边数，🌷排第几？', answer: '第3' },
  { row: ['🍓', '🍉', '🍇', '🍒', '🍑'], ask: 3, question: '🍓🍉🍇🍒🍑 从左边数，🍒排第几？', answer: '第4' },
  { row: ['🦁', '🐯', '🐻', '🐼', '🐨'], ask: 4, question: '🦁🐯🐻🐼🐨 从左边数，🐨排第几？', answer: '第5' },
  { row: ['⭐', '🌙', '☁️', '⚡', '❄️'], ask: 3, question: '⭐🌙☁️⚡❄️ 从左边数，⚡排第几？', answer: '第4' },
];

/* -------------------- 数学 · 钟表半时（分针指 6） -------------------- */
export interface ClockHalfItem {
  hour: number;
  label: string;
  emoji: string;
}
export const CLOCK_HALF: ClockHalfItem[] = [
  { hour: 1, label: '1时半', emoji: '🥛' },
  { hour: 3, label: '3时半', emoji: '🍰' },
  { hour: 5, label: '5时半', emoji: '🌇' },
  { hour: 7, label: '7时半', emoji: '🌆' },
  { hour: 9, label: '9时半', emoji: '📚' },
  { hour: 11, label: '11时半', emoji: '🛏️' },
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

/* -------------------- 生活 · 整理书包（上学准备） -------------------- */
export interface SchoolItem {
  name: string;
  emoji: string;
  bring: boolean; // true=要带去学校
}
export const SCHOOL_ITEMS: SchoolItem[] = [
  { name: '语文书', emoji: '📕', bring: true },
  { name: '数学书', emoji: '📗', bring: true },
  { name: '铅笔', emoji: '✏️', bring: true },
  { name: '尺子', emoji: '📏', bring: true },
  { name: '水杯', emoji: '🥤', bring: true },
  { name: '作业本', emoji: '📓', bring: true },
  { name: '书包', emoji: '🎒', bring: true },
  { name: '玩具车', emoji: '🚗', bring: false },
  { name: '平板', emoji: '💻', bring: false },
  { name: '零食', emoji: '🍪', bring: false },
  { name: '洋娃娃', emoji: '🧸', bring: false },
  { name: '游戏机', emoji: '🎮', bring: false },
];

/* -------------------- 英语 · 常见句型（选词填空） -------------------- */
export interface EnSentenceItem {
  sentence: string; // 含 ___ 表示空格
  options: string[];
  answer: string;
  speak: string; // 完整句子（朗读用）
  emoji: string;
}
export const EN_SENTENCES: EnSentenceItem[] = [
  { sentence: 'I ___ a cat.', options: ['have', 'has', 'am'], answer: 'have', speak: 'I have a cat.', emoji: '🐱' },
  { sentence: 'This ___ a dog.', options: ['is', 'are', 'am'], answer: 'is', speak: 'This is a dog.', emoji: '🐶' },
  { sentence: 'I can ___ .', options: ['jump', 'jumps', 'jumping'], answer: 'jump', speak: 'I can jump.', emoji: '🦘' },
  { sentence: 'What ___ your name?', options: ['is', 'are', 'am'], answer: 'is', speak: 'What is your name?', emoji: '📛' },
  { sentence: 'I ___ happy.', options: ['am', 'is', 'are'], answer: 'am', speak: 'I am happy.', emoji: '😊' },
  { sentence: 'He ___ a ball.', options: ['has', 'have', 'is'], answer: 'has', speak: 'He has a ball.', emoji: '⚽' },
  { sentence: 'We ___ friends.', options: ['are', 'is', 'am'], answer: 'are', speak: 'We are friends.', emoji: '🤝' },
  { sentence: 'My name ___ Tom.', options: ['is', 'am', 'are'], answer: 'is', speak: 'My name is Tom.', emoji: '🏷️' },
  { sentence: 'I like ___ .', options: ['apples', 'apple', 'an apple'], answer: 'apples', speak: 'I like apples.', emoji: '🍎' },
  { sentence: 'How ___ you?', options: ['are', 'is', 'am'], answer: 'are', speak: 'How are you?', emoji: '🤗' },
];

/* -------------------- 语文 · 笔顺（跟课本生字表同源） -------------------- */
export interface StrokeOrderItem {
  char: string;
  py: string;
  mean: string;
}
// 说明：笔顺字表不再单独维护，改为在 GRADE1_CHAR_UNITS 派生层里生成
// （见文件末尾的 STROKE_ORDER_CHARS / strokeOrderByChapter），全册 276 字都能看笔顺。

/* -------------------- 语文 · 组词造句 -------------------- */
export interface WordFormItem {
  char: string; // 要组词/造句的字
  word: string; // 含该字的正确词
  wrongWords: string[]; // 干扰词（不含该字或不是词）
  sentenceOk: string; // 用该词的正确句子
  sentenceWrong: string[]; // 干扰句子（不通顺）
}

// ⚠️ 数据规则（改动前必读）：
// 题目是「给『X』组一个词，下面哪个对？」，所以 wrongWords 里的三个词
// **绝对不能含有 char 本身**，否则它们也是正确答案，孩子答对反而被判错。
// （旧数据里 山→[火山, 上山, 山下] 这类全是有效组词，已全部修正。）
export const WORD_FORM: WordFormItem[] = [
  { char: '火', word: '火车', wrongWords: ['水果', '开门', '口水'], sentenceOk: '我坐火车去外婆家。', sentenceWrong: ['火车在天上飞。', '火车吃了苹果。'] },
  { char: '水', word: '水果', wrongWords: ['火车', '大山', '明月'], sentenceOk: '妹妹最爱吃水果。', sentenceWrong: ['水果在唱歌。', '水果长得比楼房高。'] },
  { char: '花', word: '花朵', wrongWords: ['小鸟', '大米', '汽车'], sentenceOk: '花园里开满了花朵。', sentenceWrong: ['花朵会跑步。', '花朵吃了米饭。'] },
  { char: '风', word: '大风', wrongWords: ['太阳', '石头', '铅笔'], sentenceOk: '今天刮起了大风。', sentenceWrong: ['大风在写字。', '大风吃了西瓜。'] },
  { char: '月', word: '月亮', wrongWords: ['太阳', '小狗', '书包'], sentenceOk: '晚上月亮出来了。', sentenceWrong: ['月亮在读书。', '月亮喝了牛奶。'] },
  { char: '鸟', word: '小鸟', wrongWords: ['大树', '白云', '桌子'], sentenceOk: '小鸟在树上唱歌。', sentenceWrong: ['小鸟在写作业。', '小鸟开着汽车上班。'] },
  { char: '书', word: '书本', wrongWords: ['苹果', '小猫', '花园'], sentenceOk: '我每天都要看书本。', sentenceWrong: ['书本在游泳。', '书本吃了蛋糕。'] },
  { char: '山', word: '高山', wrongWords: ['河水', '大海', '衣服'], sentenceOk: '远处有一座高山。', sentenceWrong: ['高山在说话。', '高山喝了汤。'] },
  { char: '日', word: '日出', wrongWords: ['月亮', '大风', '雨伞'], sentenceOk: '我们早起去看日出。', sentenceWrong: ['日出在写作业。', '日出把书包背走了。'] },
  { char: '木', word: '木头', wrongWords: ['白云', '小鱼', '铅笔'], sentenceOk: '爷爷用木头做了一把椅子。', sentenceWrong: ['木头在天上飞。', '木头唱起了歌。'] },
  { char: '手', word: '小手', wrongWords: ['大树', '汽车', '月亮'], sentenceOk: '洗干净小手再吃饭。', sentenceWrong: ['小手在天上飞。', '小手吃了一碗面。'] },
  { char: '口', word: '口水', wrongWords: ['大山', '花朵', '书包'], sentenceOk: '看到蛋糕，弟弟流口水了。', sentenceWrong: ['口水会开汽车。', '口水长在树上。'] },
  { char: '目', word: '目光', wrongWords: ['小鸟', '大米', '雨伞'], sentenceOk: '妈妈的目光很温柔。', sentenceWrong: ['目光在吃饭。', '目光穿上了鞋子。'] },
  { char: '耳', word: '耳朵', wrongWords: ['小手', '大风', '汽车'], sentenceOk: '小兔子的耳朵长长的。', sentenceWrong: ['耳朵在开火车。', '耳朵吃了西瓜。'] },
  { char: '心', word: '开心', wrongWords: ['大树', '白云', '桌子'], sentenceOk: '得了小红花，我很开心。', sentenceWrong: ['开心跑到树上去了。', '开心喝了一杯水。'] },
  { char: '田', word: '田地', wrongWords: ['月亮', '书包', '小猫'], sentenceOk: '农民伯伯在田地里干活。', sentenceWrong: ['田地在天上飞。', '田地背着书包上学。'] },
  { char: '虫', word: '昆虫', wrongWords: ['大山', '雨水', '汽车'], sentenceOk: '草丛里有很多小昆虫。', sentenceWrong: ['昆虫在开飞机。', '昆虫穿上了大衣服。'] },
  { char: '石', word: '石头', wrongWords: ['小鸟', '花朵', '面包'], sentenceOk: '小河边有一块大石头。', sentenceWrong: ['石头在唱歌跳舞。', '石头吃了三碗饭。'] },
  { char: '云', word: '白云', wrongWords: ['大山', '小狗', '铅笔'], sentenceOk: '天上飘着一朵白云。', sentenceWrong: ['白云在写作业。', '白云坐在椅子上。'] },
  { char: '雨', word: '下雨', wrongWords: ['太阳', '书包', '小猫'], sentenceOk: '今天下雨了，出门要带伞。', sentenceWrong: ['下雨在吃苹果。', '下雨背着书包上学。'] },
  { char: '牛', word: '小牛', wrongWords: ['大树', '汽车', '月亮'], sentenceOk: '小牛在草地上吃草。', sentenceWrong: ['小牛在写字。', '小牛开着飞机。'] },
  { char: '羊', word: '山羊', wrongWords: ['白云', '面包', '铅笔'], sentenceOk: '山羊有一把长长的胡子。', sentenceWrong: ['山羊在看电视写作业。', '山羊喝了一桶油。'] },
  { char: '车', word: '汽车', wrongWords: ['小鸟', '花朵', '大米'], sentenceOk: '爸爸开汽车送我上学。', sentenceWrong: ['汽车在天上游泳。', '汽车吃了一个苹果。'] },
  { char: '门', word: '大门', wrongWords: ['小猫', '白云', '书包'], sentenceOk: '学校的大门打开了。', sentenceWrong: ['大门在跑步比赛。', '大门吃了西瓜。'] },
  { char: '天', word: '天空', wrongWords: ['大地', '小狗', '铅笔'], sentenceOk: '天空又高又蓝。', sentenceWrong: ['天空在写作业。', '天空坐在板凳上。'] },
  { char: '家', word: '家人', wrongWords: ['小鸟', '汽车', '花朵'], sentenceOk: '我爱我的家人。', sentenceWrong: ['家人长在大树上。', '家人被风吹到天上去了。'] },
];

/* -------------------- 语文 · 指读高亮 -------------------- */
export const FINGER_READ: string[] = [
  '春天来了，花儿开了。',
  '小鸟在树上唱歌。',
  '太阳公公笑眯眯。',
  '妹妹在数星星。',
  '小兔子爱吃胡萝卜。',
  '妈妈给我讲故事。',
  '我们一起做游戏。',
  '小鱼在水里游来游去。',
  '月亮升上了树梢。',
  '风儿轻轻吹过脸颊。',
  '弟弟把玩具收好了。',
  '老师夸我写字真漂亮。',
];

/* -------------------- 语文 · 古诗趣味化（诗中有画） -------------------- */
export interface PoemPictureQ {
  poem: string;
  hint: string; // 诗句提示
  options: string[]; // emoji 选项
  answer: string; // 正确的 emoji
}

// 覆盖 POEMS 里全部 16 首，热门篇目再各配一题，共 28 题。
export const POEM_PICTURE_Q: PoemPictureQ[] = [
  { poem: '咏鹅', hint: '鹅，鹅，鹅，曲项向天歌。', options: ['🦢', '🐱', '🐟'], answer: '🦢' },
  { poem: '咏鹅', hint: '白毛浮绿水，红掌拨清波。', options: ['🌊', '⛰️', '🏜️'], answer: '🌊' },
  { poem: '悯农（其二）', hint: '锄禾日当午，汗滴禾下土。', options: ['🌾', '🍔', '🚗'], answer: '🌾' },
  { poem: '悯农（其二）', hint: '谁知盘中餐，粒粒皆辛苦。', options: ['🍚', '🍦', '🍟'], answer: '🍚' },
  { poem: '静夜思', hint: '举头望明月，低头思故乡。', options: ['🌙', '☀️', '⭐'], answer: '🌙' },
  { poem: '静夜思', hint: '床前明月光，疑是地上霜。', options: ['❄️', '🔥', '🌈'], answer: '❄️' },
  { poem: '江南', hint: '江南可采莲，莲叶何田田。', options: ['🪷', '🌲', '🍎'], answer: '🪷' },
  { poem: '江南', hint: '鱼戏莲叶间。', options: ['🐟', '🐘', '🐔'], answer: '🐟' },
  { poem: '春晓', hint: '春眠不觉晓，处处闻啼鸟。', options: ['🐦', '🐟', '🌸'], answer: '🐦' },
  { poem: '春晓', hint: '夜来风雨声，花落知多少。', options: ['🌧️', '☀️', '🌈'], answer: '🌧️' },
  { poem: '村居', hint: '儿童散学归来早，忙趁东风放纸鸢。', options: ['🪁', '📚', '🚲'], answer: '🪁' },
  { poem: '村居', hint: '草长莺飞二月天，拂堤杨柳醉春烟。', options: ['🌱', '🍂', '❄️'], answer: '🌱' },
  { poem: '咏柳', hint: '碧玉妆成一树高，万条垂下绿丝绦。', options: ['🌿', '🍎', '🌲'], answer: '🌿' },
  { poem: '咏柳', hint: '不知细叶谁裁出，二月春风似剪刀。', options: ['✂️', '🔨', '🥄'], answer: '✂️' },
  { poem: '登鹳雀楼', hint: '白日依山尽，黄河入海流。', options: ['🌄', '🌧️', '🏙️'], answer: '🌄' },
  { poem: '登鹳雀楼', hint: '欲穷千里目，更上一层楼。', options: ['🏯', '🚗', '⛵'], answer: '🏯' },
  { poem: '敕勒歌', hint: '风吹草低见牛羊。', options: ['🐑', '🐟', '🦅'], answer: '🐑' },
  { poem: '敕勒歌', hint: '天似穹庐，笼盖四野。', options: ['⛺', '🏢', '🚢'], answer: '⛺' },
  { poem: '池上', hint: '小娃撑小艇，偷采白莲回。', options: ['🛶', '🚗', '🛝'], answer: '🛶' },
  { poem: '小池', hint: '小荷才露尖尖角，早有蜻蜓立上头。', options: ['🦗', '🐱', '🌞'], answer: '🦗' },
  { poem: '小池', hint: '泉眼无声惜细流，树阴照水爱晴柔。', options: ['💧', '🔥', '🏔️'], answer: '💧' },
  { poem: '画', hint: '远看山有色，近听水无声。', options: ['🖼️', '📻', '🎈'], answer: '🖼️' },
  { poem: '赠汪伦', hint: '桃花潭水深千尺，不及汪伦送我情。', options: ['🌊', '🔥', '🏜️'], answer: '🌊' },
  { poem: '寻隐者不遇', hint: '松下问童子，言师采药去。', options: ['🌲', '🏖️', '🌵'], answer: '🌲' },
  { poem: '风', hint: '解落三秋叶，能开二月花。', options: ['🍃', '🔥', '🌊'], answer: '🍃' },
  { poem: '风', hint: '过江千尺浪，入竹万竿斜。', options: ['🎋', '🌵', '🍄'], answer: '🎋' },
  { poem: '画鸡', hint: '头上红冠不用裁，满身雪白走将来。', options: ['🐔', '🐶', '🐱'], answer: '🐔' },
  { poem: '画鸡', hint: '平生不敢轻言语，一叫千门万户开。', options: ['🌅', '🌃', '🕯️'], answer: '🌅' },
];

/* -------------------- 语文 · 我的一天（时间线） -------------------- */
export interface MyDayItem {
  time: string;
  emoji: string;
  text: string; // 用「时间 + 动作」的口吻，便于点读
}

export const MY_DAY: MyDayItem[] = [
  { time: '7:00', emoji: '🌅', text: '早上七点，程程起床啦。' },
  { time: '7:30', emoji: '🪥', text: '七点半，刷牙洗脸真干净。' },
  { time: '8:00', emoji: '🍚', text: '八点吃早饭，身体棒棒。' },
  { time: '8:30', emoji: '🎒', text: '八点半，背着书包上学去。' },
  { time: '12:00', emoji: '🍱', text: '中午十二点，吃香喷喷的午饭。' },
  { time: '16:30', emoji: '📚', text: '下午四点半，放学回家做作业。' },
  { time: '18:00', emoji: '🍲', text: '晚上六点，全家一起吃晚饭。' },
  { time: '19:30', emoji: '🛁', text: '七点半，洗澡香香的。' },
  { time: '20:30', emoji: '📖', text: '八点半，读一本好看的绘本。' },
  { time: '21:00', emoji: '😴', text: '晚上九点，盖好被子睡觉觉。' },
];

/* ============================================================
 * 人教版（部编版）小学一年级上册 · 生字表（按单元对齐课本）
 * ------------------------------------------------------------
 * 对应 public/textbooks/chapters/chinese 的章节顺序（见 textbooks.ts），
 * 收录各单元「会认字」与可听写的「词语」，供家长「按单元一键布置听写」
 * 以及识字模块对齐使用。字序参考义务教育教科书识字表。
 * ============================================================ */
export interface CharUnit {
  unit: string;
  chapter: number; // 对应课本章节 idx
  emoji: string;
  text: string; // 单元导语 / 课文句子
  chars: string[]; // 本单元会认字
  words: string[]; // 本单元可听写词语
}

export const GRADE1_CHAR_UNITS: CharUnit[] = [
  {
    unit: '我上学了',
    chapter: 1,
    emoji: '🏫',
    text: '上学歌：太阳当空照，花儿对我笑。爱学习，爱祖国。',
    chars: ['我', '上', '学', '了', '爱', '国', '中', '你', '们'],
    words: ['我们', '上学', '中国', '爱你', '你们'],
  },
  {
    unit: '识字（一）· 天地人',
    chapter: 2,
    emoji: '🌍',
    text: '天 地 人 你 我 他；一二三四五，金木水火土。',
    chars: [
      '天', '地', '人', '你', '我', '他', '一', '二', '三', '四', '五', '上', '下',
      '口', '耳', '目', '手', '足', '站', '坐',
      '日', '月', '山', '川', '水', '火', '田', '禾',
      '对', '云', '雨', '风', '花', '鸟', '虫',
      '六', '七', '八', '九', '十',
    ],
    words: ['天上', '土地', '口水', '日子', '火山', '田地', '虫子', '雨水', '花鸟', '手足', '日月', '山水', '坐下'],
  },
  {
    unit: '汉语拼音（一）',
    chapter: 3,
    emoji: '🔤',
    text: '拼音单元：拼一拼、读一读，认识更多字。',
    chars: ['爸', '妈', '马', '土', '不', '画', '打', '棋', '鸡'],
    words: ['爸妈', '马车', '土地', '画画', '打球', '下棋', '小鸡'],
  },
  {
    unit: '汉语拼音（二）',
    chapter: 4,
    emoji: '🔡',
    text: '拼音单元：字、词、句、子，学语文。',
    chars: ['字', '词', '语', '句', '子', '桌', '纸', '文', '数', '学', '音', '乐'],
    words: ['字词', '句子', '桌子', '白纸', '语文', '数学', '音乐'],
  },
  {
    unit: '汉语拼音（三）',
    chapter: 5,
    emoji: '🔣',
    text: '拼音单元：读儿歌，认生字。',
    chars: ['妹', '奶', '白', '皮', '小', '桥', '台', '雪', '儿', '草', '家', '是', '车', '羊', '走', '也'],
    words: ['妹妹', '奶奶', '皮球', '小桥', '台上', '雪人', '儿子', '草地', '大家', '马车', '也是'],
  },
  {
    unit: '阅读（一）· 秋天·小小的船·江南·四季',
    chapter: 6,
    emoji: '🍂',
    text: '秋天来了，小小的船，江南可采莲，四季更替。',
    chars: [
      '秋', '气', '了', '树', '叶', '片', '大', '飞', '会', '个',
      '的', '船', '两', '头', '在', '里', '看', '见', '闪', '星',
      '江', '南', '可', '采', '莲', '鱼', '东', '西', '北',
      '尖', '说', '春', '青', '蛙', '夏', '弯', '皮', '地', '就', '冬',
    ],
    words: ['秋天', '天气', '树叶', '飞机', '开会', '小船', '两头', '看见', '星星', '江南', '莲叶', '东西', '东北', '尖尖的', '春天', '青蛙', '夏天', '冬天'],
  },
  {
    unit: '识字（二）· 画·大小多少·小书包·日月明·升国旗',
    chapter: 7,
    emoji: '✏️',
    text: '画里藏字，大小多少，小书包，日月明，升国旗。',
    chars: [
      '画', '远', '色', '近', '听', '无', '声', '去', '还', '来',
      '多', '少', '黄', '牛', '只', '猫', '边', '鸭', '苹', '果', '杏', '桃',
      '包', '尺', '作', '业', '笔', '刀', '课', '本', '早', '校',
      '明', '力', '男', '尘', '从', '众', '双', '木', '林', '森', '条',
      '升', '国', '旗', '中', '红', '歌', '起', '么', '美', '丽', '立',
    ],
    words: ['画画', '远近', '听到', '无声', '来去', '多少', '黄牛', '小猫', '苹果', '书包', '尺子', '作业', '本子', '早上', '学校', '明月', '力气', '尘土', '树林', '森林', '一条', '升旗', '中国', '红旗', '国歌', '美丽', '起立'],
  },
  {
    unit: '阅读（二）· 影子·比尾巴·青蛙写诗·雨点儿',
    chapter: 8,
    emoji: '👣',
    text: '影子跟着我，比尾巴，青蛙写诗，雨点儿沙沙。',
    chars: [
      '影', '前', '后', '黑', '狗', '左', '右', '它', '好', '朋', '友',
      '尾', '巴', '谁', '长', '短', '把', '伞', '兔', '最', '公',
      '写', '诗', '点', '要', '过', '给', '当', '串', '们', '以', '成',
      '数', '彩', '半', '空', '问', '到', '方', '没', '更', '绿', '出', '长',
    ],
    words: ['影子', '前后', '黑狗', '左右', '朋友', '尾巴', '长短', '一把', '兔子', '公鸡', '写字', '诗歌', '过来', '当心', '我们', '以后', '成长'],
  },
  {
    unit: '阅读（三）· 远足·大还是小·项链·雪地·乌鸦·蜗牛',
    chapter: 9,
    emoji: '🐌',
    text: '明天要远足，大还是小，项链，雪地里的小画家，乌鸦喝水，小蜗牛。',
    chars: [
      '睡', '那', '海', '真', '老', '师', '吗', '同', '什', '才', '亮',
      '时', '候', '觉', '得', '自', '己', '很', '穿', '衣', '服', '快',
      '蓝', '又', '笑', '着', '向', '和', '贝', '娃', '挂', '活', '金',
      '群', '竹', '牙', '用', '几', '步', '为', '参', '加', '洞', '鸡',
      '乌', '鸦', '处', '找', '办', '许', '法', '放', '进', '高',
      '住', '孩', '玩', '吧', '发', '芽', '爬', '呀', '久', '回', '全', '变',
    ],
    words: ['睡觉', '大海', '老师', '同学', '什么', '天才', '明亮', '时候', '觉得', '自己', '穿衣', '衣服', '快乐', '蓝色', '笑着', '贝壳', '娃娃', '金鱼', '雪花', '参加', '乌鸦', '找到', '办法', '进出', '高处', '孩子', '发芽'],
  },
];

/* ============================================================
 * 生字表派生数据
 * ------------------------------------------------------------
 * 识字课文 / 家长听写 / 识字闯关 / 组词造句 共用 GRADE1_CHAR_UNITS 一份表，
 * 下面这些派生结构负责把「单元 → 字 / 词」翻成各练习模块要的形状：
 *  · TEXTBOOK_CHARACTERS   给识字闯关按课本顺序出题（只收已有释义的字）
 *  · buildUnitWordItems()  给组词造句按单元词语出「组词」题
 *  · STROKE_ORDER_CHARS    给笔顺动画按课本顺序排字
 * ============================================================ */

const CHAR_META = new Map<string, CharacterItem>(CHARACTERS.map((c) => [c.char, c]));

export interface TextbookChar extends CharacterItem {
  chapter: number;
  unit: string;
}

/**
 * 课本生字表 ∩ 已有释义的字，按单元先后排列。
 * 识字闯关需要 meaning 做选项，所以生字表里还没写释义的字先不出题
 * （想扩题量就往 CHARACTERS 里补该字的 meaning / phrase 即可，无需改模块）。
 */
export const TEXTBOOK_CHARACTERS: TextbookChar[] = (() => {
  const out: TextbookChar[] = [];
  const seen = new Set<string>();
  for (const u of GRADE1_CHAR_UNITS) {
    for (const c of u.chars) {
      const meta = CHAR_META.get(c);
      if (!meta || seen.has(c)) continue; // 课本里复现的字（如「了」「们」）只按首次出现的单元收一次
      seen.add(c);
      out.push({ ...meta, chapter: u.chapter, unit: u.unit });
    }
  }
  return out;
})();

/**
 * 笔顺动画字表：全册生字按课本顺序排，替代原先手写的 16 字小表。
 * hanzi-writer 按字取笔画数据，所以这里只要给出字 + 标音 + 释义。
 */
export const STROKE_ORDER_CHARS: StrokeOrderItem[] = TEXTBOOK_CHARACTERS.map((c) => ({
  char: c.char,
  py: c.pinyin,
  mean: c.meaning,
}));

/** 按课本单元取笔顺字表，chapter 传 0 表示全册 */
export function strokeOrderByChapter(chapter: number): StrokeOrderItem[] {
  const src = chapter > 0 ? TEXTBOOK_CHARACTERS.filter((c) => c.chapter === chapter) : TEXTBOOK_CHARACTERS;
  return src.map((c) => ({ char: c.char, py: c.pinyin, mean: c.meaning }));
}

/** 生字表覆盖到的课本单元（供 UI 做单元切换） */
export const CHAR_UNIT_OPTIONS: { chapter: number; unit: string; emoji: string; count: number }[] =
  GRADE1_CHAR_UNITS.map((u) => ({
    chapter: u.chapter,
    unit: u.unit,
    emoji: u.emoji,
    count: TEXTBOOK_CHARACTERS.filter((c) => c.chapter === u.chapter).length,
  }));

/** 取到第 chapter 单元（含）为止的生字，用于难度分层 */
export function textbookCharsUpTo(chapter: number): TextbookChar[] {
  return TEXTBOOK_CHARACTERS.filter((c) => c.chapter <= chapter);
}

/** 由生字表词语派生的「组词」题 */
export interface UnitWordItem {
  char: string; // 要组词的字
  word: string; // 本单元里含该字的词
  wrongWords: string[]; // 干扰词：来自别的单元，且一定不含该字
  unit: string;
  chapter: number;
}

const ALL_UNIT_WORDS = Array.from(new Set(GRADE1_CHAR_UNITS.flatMap((u) => u.words)));

function pickN<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/**
 * 把生字表的词语变成组词题。
 * 沿用 WORD_FORM 的铁律：干扰词绝不能含 char 本身，否则也是正确答案。
 */
export function buildUnitWordItems(): UnitWordItem[] {
  const seen = new Set<string>();
  const items: UnitWordItem[] = [];
  for (const u of GRADE1_CHAR_UNITS) {
    const unitChars = new Set(u.chars);
    for (const word of u.words) {
      const char = word.split('').find((c) => unitChars.has(c));
      if (!char) continue;
      const key = `${char}|${word}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const wrongWords = pickN(
        ALL_UNIT_WORDS.filter((w) => w !== word && !w.includes(char)),
        3,
      );
      if (wrongWords.length < 3) continue;
      items.push({ char, word, wrongWords, unit: u.unit, chapter: u.chapter });
    }
  }
  return items;
}

/* ============================================================
 * 数学 · 按课本单元对齐
 * ------------------------------------------------------------
 * chapter 对应 textbooks.ts 里 math 的章节 idx（PDF 也是按这个切的），
 * moduleKeys 指向 study-modules.ts 里 math 学科的模块 key，
 * 这样「翻到课本第几单元 → 点开对应练习」就能一一对上。
 * 有测试校验：每个 key 都真实存在，且所有数学模块都至少归到一个单元。
 * ============================================================ */
export interface MathUnit {
  chapter: number;
  unit: string; // 课本单元名（与 textbooks.ts 标题对应，去掉多余空格）
  emoji: string;
  goal: string; // 这一单元要掌握什么
  moduleKeys: string[];
}

export const MATH_UNITS: MathUnit[] = [
  {
    chapter: 1,
    unit: '数学游戏',
    emoji: '🎲',
    goal: '数一数、比一比、找规律，先玩起来',
    moduleKeys: ['count', 'compare', 'position', 'pattern'],
  },
  {
    chapter: 2,
    unit: '一 · 5 以内数的认识和加减法',
    emoji: '✋',
    goal: '认识 1~5，会 5 以内的加减和分与合',
    moduleKeys: ['count', 'split', 'calc', 'ordinal'],
  },
  {
    chapter: 3,
    unit: '二 · 6~10 的认识和加减法',
    emoji: '🔟',
    goal: '认识 6~10，会 10 以内加减与看图列式',
    moduleKeys: ['split', 'calc', 'pic-eq', 'word-problem'],
  },
  {
    chapter: 4,
    unit: '三 · 认识立体图形',
    emoji: '📦',
    goal: '认识长方体、正方体、圆柱和球',
    moduleKeys: ['solid', 'shape', 'angle'],
  },
  {
    chapter: 5,
    unit: '四 · 11~20 的认识',
    emoji: '🔢',
    goal: '1 个十和几个一，认识 11~20',
    moduleKeys: ['1120', 'ordinal', 'compare-more'],
  },
  {
    chapter: 6,
    unit: '五 · 20 以内的进位加法',
    emoji: '➕',
    goal: '凑十法算进位加，反过来会退位减',
    moduleKeys: ['carry', 'borrow', 'word-problem', 'pic-eq'],
  },
  {
    chapter: 7,
    unit: '六 · 复习与关联',
    emoji: '🎯',
    goal: '把学过的连起来：钟表、日历和综合练习',
    moduleKeys: ['clock', 'clock-half', 'calendar', 'calc', 'mult-table'],
  },
];

/** 某个数学模块归属的课本单元（模块页上标「课本第几单元」用） */
export function mathUnitsOfModule(moduleKey: string): MathUnit[] {
  return MATH_UNITS.filter((u) => u.moduleKeys.includes(moduleKey));
}

/* ============================================================
 * 语文 · 按课本单元对齐（与 MATH_UNITS 对称）
 * ------------------------------------------------------------
 * 语文模块不像数学那样天然「一单元 = 几个练习」，而是按主题组织
 * （识字 / 拼音 / 阅读 各自一组模块）。这里按每个单元的「性质」把
 * 相关模块归到该单元下，让「翻到课本第几单元 → 点开对应练习」也能
 * 在语文侧一一对上。
 * 有测试校验：每个 key 都真实存在，且所有语文模块都至少归到一个单元。
 * ============================================================ */
export interface ChineseUnit {
  chapter: number;
  unit: string; // 课本单元名（与 GRADE1_CHAR_UNITS 对应）
  emoji: string;
  goal: string; // 这一单元要掌握什么（取单元导语）
  moduleKeys: string[];
}

const CHAR_LESSON: string[] = [
  'lessons', 'characters', 'quiz', 'word-form', 'strokes-order', 'trace',
  'strokes', 'sentence', 'school-prep', 'my-day',
  // 2025 新增：萌可趣味学园（识字/生活类）
  'proverbs', 'antonyms', 'quantifiers', 'riddles', 'safety', 'char-transform',
];
const PINYIN_LESSON: string[] = ['pinyin', 'pinyin-blend', 'characters'];
const READ_LESSON: string[] = ['texts', 'textchars', 'reading', 'finger-read', 'quiz', 'poems', 'poem-fun', 'nursery-rhymes'];

/** 由 GRADE1_CHAR_UNITS 派生：按单元性质挑出相关模块 key */
function deriveChineseUnits(): ChineseUnit[] {
  return GRADE1_CHAR_UNITS.map((u) => {
    let keys: string[];
    if (u.unit.startsWith('汉语拼音')) keys = PINYIN_LESSON;
    else if (u.unit.startsWith('阅读')) keys = READ_LESSON;
    else keys = CHAR_LESSON; // 我上学了 / 识字（一）（二）
    return { chapter: u.chapter, unit: u.unit, emoji: u.emoji, goal: u.text, moduleKeys: keys };
  });
}

export const CHINESE_UNITS: ChineseUnit[] = deriveChineseUnits();

/** 某个语文模块归属的课本单元（模块页上标「课本第几单元」用） */
export function chineseUnitsOfModule(moduleKey: string): ChineseUnit[] {
  return CHINESE_UNITS.filter((u) => u.moduleKeys.includes(moduleKey));
}

/* ============================================================
 * 【2025 新版】萌可趣味学园（一年级上册扩充内容）
 * 由萌可角色出题引导：睿智名言（睿智萌可）/ 儿歌乐园（唱唱萌可）/
 * 反义词量词（淘气萌可）/ 谜语宝箱（好奇萌可）/ 安全课堂（温柔萌可）/
 * 英文儿歌（唱唱萌可+甜心萌可）/ 笔顺规则口诀 / 汉字变变变
 * ============================================================ */

/* -------------------- 语文 · 睿智萌可的智慧名言（日积月累·谚语） -------------------- */
export interface ProverbItem {
  first: string; // 谚语前半句（题目）
  second: string; // 谚语后半句（答案）
  hint: string; // 睿智萌可的小提示
  emoji: string;
}
export const PROVERBS: ProverbItem[] = [
  { first: '一年之计在于春', second: '一日之计在于晨', hint: '春天是一年的开始，早晨是一天的开始，要珍惜时间哦！', emoji: '🌱' },
  { first: '一寸光阴一寸金', second: '寸金难买寸光阴', hint: '时间比金子还宝贵，金子买不回来时间呢！', emoji: '⏰' },
  { first: '种瓜得瓜', second: '种豆得豆', hint: '种下什么就收获什么，努力学习就会有收获！', emoji: '🍈' },
  { first: '前人栽树', second: '后人乘凉', hint: '以前的人种下大树，后来的人就能在树下乘凉。', emoji: '🌳' },
  { first: '千里之行', second: '始于足下', hint: '再远的路也要从第一步开始走，学习也是一样！', emoji: '🦶' },
  { first: '百尺竿头', second: '更进一步', hint: '已经做得很好了，还要再接再厉，做得更好！', emoji: '🎋' },
  { first: '人心齐', second: '泰山移', hint: '大家一起团结，再难的事也能做到！', emoji: '⛰️' },
  { first: '众人拾柴', second: '火焰高', hint: '大家一起来帮忙，事情就能做得又快又好！', emoji: '🔥' },
  { first: '书读百遍', second: '其义自见', hint: '书多读几遍，意思自然就明白了！', emoji: '📚' },
  { first: '眼过千遍', second: '不如手过一遍', hint: '看再多遍，不如自己动手写一遍记得牢！', emoji: '✍️' },
];

/* -------------------- 语文 · 唱唱萌可的儿歌乐园（和大人一起读） -------------------- */
export interface NurseryRhyme {
  title: string;
  emoji: string;
  lines: string[]; // 儿歌内容
  question: string; // 理解小问答
  options: string[]; // 选项（含答案）
  answer: string; // 正确选项
  tip: string; // 唱唱萌可的小提示
}
export const NURSERY_RHYMES: NurseryRhyme[] = [
  {
    title: '小兔子乖乖',
    emoji: '🐰',
    lines: ['小兔子乖乖，把门儿开开，', '快点儿开开，我要进来。', '不开不开我不开，', '妈妈没回来，谁来也不开。'],
    question: '小兔子为什么不开门呀？',
    options: ['因为妈妈说"谁来也不开"', '因为小兔子在睡觉', '因为家里没人'],
    answer: '因为妈妈说"谁来也不开"',
    tip: '一个人在家时，谁来也不要开门哦，要等爸爸妈妈回来！',
  },
  {
    title: '剪窗花',
    emoji: '✂️',
    lines: ['小剪刀，咔嚓嚓，', '娃娃学习剪窗花。', '剪梅花，剪雪花，', '剪对喜鹊叫喳喳。'],
    question: '娃娃用剪刀剪了什么？',
    options: ['梅花、雪花和喜鹊', '苹果和香蕉', '小猫和小狗'],
    answer: '梅花、雪花和喜鹊',
    tip: '剪窗花是过年的传统游戏，剪刀很锋利，要在大人的帮助下使用哦！',
  },
  {
    title: '小鸟念书',
    emoji: '🐦',
    lines: ['老师教大家读书，', '窗外的风说："咕咕咕，咕咕咕。"', '小鸟说："叽叽叽，叽叽叽。"', '大家都说：', '"风和小鸟也在念书呢！"'],
    question: '窗外谁在"念书"呀？',
    options: ['风和小鸟', '小猫和小狗', '老师和同学'],
    answer: '风和小鸟',
    tip: '你听，风"咕咕"，小鸟"叽叽"，大自然也在读书呢，真有趣！',
  },
  {
    title: '小松鼠找花生',
    emoji: '🥜',
    lines: ['小松鼠种下一颗花生，', '天天松土、浇水，', '等呀等，花开了，', '又等呀等，花生不见了！', '原来是花生藏在泥土里呢。'],
    question: '花生去哪儿了？',
    options: ['藏在地底下了', '被小松鼠吃掉了', '被风吹走了'],
    answer: '藏在地底下了',
    tip: '原来花生是长在地底下的果果呀，小松鼠挖出来就可以吃啦！',
  },
  {
    title: '拔萝卜',
    emoji: '🥕',
    lines: ['老公公种了个大萝卜，', '拔呀拔，拔不动。', '老婆婆来帮忙，还是拔不动。', '小姑娘、小花狗、小花猫都来了，', '"嗨哟嗨哟"一起拔，', '大萝卜终于拔出来啦！'],
    question: '大萝卜最后是怎么拔出来的？',
    options: ['大家一起拔出来的', '老公公一个人拔的', '大萝卜自己跑出来的'],
    answer: '大家一起拔出来的',
    tip: '一个人的力气小，大家一起力气大，团结力量大！',
  },
  {
    title: '猴子捞月亮',
    emoji: '🙈',
    lines: ['一只猴子看见井里有个月亮，', '大叫："月亮掉进井里啦！"', '猴子们一只接一只倒挂着捞月亮，', '捞呀捞，月亮碎了一池水。', '抬头一看，月亮还在天上呢！'],
    question: '井里的"月亮"是什么呀？',
    options: ['月亮的倒影', '真的月亮', '一个圆盘子'],
    answer: '月亮的倒影',
    tip: '井里的月亮是天上月亮的倒影，就像镜子里能看到自己一样！',
  },
  {
    title: '谁会飞',
    emoji: '🌟',
    lines: ['谁会飞？鸟会飞。', '鸟儿怎样飞？扑扑翅膀去又回。', '谁会跑？马会跑。', '马儿怎样跑？四脚离地身不摇。', '谁会游？鱼会游。', '鱼儿怎样游？摇摇尾巴点点头。'],
    question: '鱼是怎么游的？',
    options: ['摇摇尾巴点点头', '扑扑翅膀去又回', '四脚离地身不摇'],
    answer: '摇摇尾巴点点头',
    tip: '每种动物都有自己的本领，鸟会飞、马会跑、鱼会游，真厉害！',
  },
];

/* -------------------- 语文 · 淘气萌可的反义词（捣蛋配对） -------------------- */
export interface AntonymItem {
  a: string; // 一个词
  b: string; // 它的反义词
  emojiA: string;
  emojiB: string;
}
export const ANTONYMS: AntonymItem[] = [
  { a: '大', b: '小', emojiA: '🐘', emojiB: '🐭' },
  { a: '多', b: '少', emojiA: '🍎🍎🍎', emojiB: '🍎' },
  { a: '上', b: '下', emojiA: '☝️', emojiB: '👇' },
  { a: '前', b: '后', emojiA: '🏃', emojiB: '🐢' },
  { a: '左', b: '右', emojiA: '👈', emojiB: '👉' },
  { a: '长', b: '短', emojiA: '🐍', emojiB: '🐛' },
  { a: '高', b: '矮', emojiA: '🦒', emojiB: '🐇' },
  { a: '胖', b: '瘦', emojiA: '🐷', emojiB: '🐒' },
  { a: '远', b: '近', emojiA: '🌅', emojiB: '🌸' },
  { a: '有', b: '无', emojiA: '🧸', emojiB: '🕳️' },
  { a: '开', b: '关', emojiA: '🚪', emojiB: '🔒' },
  { a: '来', b: '去', emojiA: '🚶', emojiB: '🏃' },
  { a: '黑', b: '白', emojiA: '🌙', emojiB: '☁️' },
  { a: '早', b: '晚', emojiA: '🌞', emojiB: '🌙' },
  { a: '冷', b: '热', emojiA: '❄️', emojiB: '🔥' },
  { a: '快', b: '慢', emojiA: '🐆', emojiB: '🐌' },
];

/* -------------------- 语文 · 量词搭配（宝盒萌可的量词宝箱） -------------------- */
export interface QuantifierItem {
  item: string; // 物品名
  correct: string; // 正确量词
  options: string[]; // 选项（含 correct）
  emoji: string;
}
export const QUANTIFIERS: QuantifierItem[] = [
  { item: '猫', correct: '只', options: ['只', '个', '条'], emoji: '🐱' },
  { item: '苹果', correct: '个', options: ['个', '只', '把'], emoji: '🍎' },
  { item: '鱼', correct: '条', options: ['条', '只', '个'], emoji: '🐟' },
  { item: '牛', correct: '头', options: ['头', '条', '只'], emoji: '🐮' },
  { item: '树叶', correct: '片', options: ['片', '个', '棵'], emoji: '🍃' },
  { item: '花', correct: '朵', options: ['朵', '条', '只'], emoji: '🌺' },
  { item: '书', correct: '本', options: ['本', '只', '头'], emoji: '📖' },
  { item: '大树', correct: '棵', options: ['棵', '朵', '个'], emoji: '🌳' },
  { item: '星星', correct: '颗', options: ['颗', '条', '把'], emoji: '⭐' },
  { item: '尺子', correct: '把', options: ['把', '个', '条'], emoji: '📏' },
  { item: '小鸟', correct: '只', options: ['只', '个', '条'], emoji: '🐦' },
  { item: '大山', correct: '座', options: ['座', '个', '片'], emoji: '⛰️' },
];

/* -------------------- 语文 · 好奇萌可的谜语宝箱 -------------------- */
export interface RiddleItem {
  riddle: string; // 谜面
  answer: string; // 谜底
  options: string[]; // 选项（含谜底）
  hint: string; // 好奇萌可的小提示
  emoji: string;
}
export const RIDDLES: RiddleItem[] = [
  { riddle: '千条线，万条线，落到水里看不见。', answer: '雨', options: ['雨', '雪', '风'], hint: '下雨的时候，天上会掉下很多透明的线～', emoji: '🌧️' },
  { riddle: '有时像圆盘，有时像镰刀，晚上才出来。', answer: '月亮', options: ['月亮', '太阳', '星星'], hint: '它住在天上，白天睡觉，晚上上班～', emoji: '🌙' },
  { riddle: '头戴红帽子，身穿花衣裳，天天喔喔叫，催人快起床。', answer: '公鸡', options: ['公鸡', '母鸡', '鸭子'], hint: '每天天一亮，它就"喔喔喔"地叫～', emoji: '🐔' },
  { riddle: '红眼睛，白皮毛，耳朵长，尾巴短，爱吃萝卜和青菜。', answer: '兔子', options: ['兔子', '小猫', '小狗'], hint: '它跳跳跳，耳朵长长的，最爱吃萝卜～', emoji: '🐰' },
  { riddle: '一个游泳家，说话呱呱呱，小时有尾巴，大了没尾巴。', answer: '青蛙', options: ['青蛙', '小鱼', '螃蟹'], hint: '小的时候像小鱼，长大了蹦蹦跳，叫起来"呱呱"～', emoji: '🐸' },
  { riddle: '五个兄弟住一起，名字不同高矮齐。', answer: '手指', options: ['手指', '脚趾', '牙齿'], hint: '每个人手上都有一大家子兄弟～', emoji: '✋' },
  { riddle: '说它是头牛，不会拉犁头，说它力气小，背着房子走。', answer: '蜗牛', options: ['蜗牛', '黄牛', '乌龟'], hint: '它走路慢慢地，壳就是它的家～', emoji: '🐌' },
  { riddle: '爱吃肉，爱睡觉，身体胖乎乎，鼻子哼哼叫。', answer: '猪', options: ['猪', '狗', '猫'], hint: '它胖乎乎的，睡觉的时候"哼哼"叫～', emoji: '🐷' },
  { riddle: '身上雪白，水中游玩，走起路来，一摇一摆。', answer: '鸭子', options: ['鸭子', '小鸟', '母鸡'], hint: '它走起路来摇摇摆摆，会游泳会"嘎嘎"叫～', emoji: '🦆' },
  { riddle: '胡子一大把，从不叫爸爸，天天咩咩叫，爱吃青草呀。', answer: '羊', options: ['羊', '牛', '马'], hint: '它"咩咩"叫，白色的毛，爱吃青草～', emoji: '🐑' },
];

/* -------------------- 综合 · 温柔萌可的安全小课堂 -------------------- */
export interface SafetyItem {
  scenario: string; // 情景
  statement: string; // 说法/做法（让孩子判断对错）
  isSafe: boolean; // 是否正确/安全
  tip: string; // 温柔萌可的小提示
  emoji: string;
}
export const SAFETY_TIPS: SafetyItem[] = [
  { scenario: '过马路时', statement: '绿灯亮了才过马路，还要走斑马线。', isSafe: true, tip: '过马路"一停二看三通过"，绿灯亮了再走哦！', emoji: '🚦' },
  { scenario: '过马路时', statement: '看到红灯亮了，还是拉着妈妈冲过去。', isSafe: false, tip: '红灯要停！就算有急事，也要等绿灯亮了才能走哦！', emoji: '🚦' },
  { scenario: '遇到陌生人', statement: '陌生人给糖果，我收下并跟他走。', isSafe: false, tip: '陌生人给的东西不能要，更不能跟着走，要马上告诉爸爸妈妈！', emoji: '🍬' },
  { scenario: '遇到陌生人', statement: '迷路了，找警察叔叔或穿制服的叔叔阿姨帮忙。', isSafe: true, tip: '迷路了要找警察叔叔帮忙，还要记住爸爸妈妈的电话号码哦！', emoji: '👮' },
  { scenario: '在家里', statement: '大人不在家，自己玩打火机。', isSafe: false, tip: '火很危险，千万不能玩！发现火灾要马上叫大人、拨119！', emoji: '🔥' },
  { scenario: '在家里', statement: '饭前用肥皂把手洗干净。', isSafe: true, tip: '小手洗干净，细菌全跑掉，吃饭才香喷喷！', emoji: '🧼' },
  { scenario: '在路上', statement: '和小伙伴在马路上追跑打闹。', isSafe: false, tip: '马路上汽车来来往往，追跑打闹太危险，要在安全的地方玩！', emoji: '🏃' },
  { scenario: '出门玩', statement: '记住爸爸妈妈的电话号码和家庭住址。', isSafe: true, tip: '记住电话和住址很重要，走丢了也能找回家！', emoji: '📞' },
  { scenario: '在水边', statement: '一个人去河边、池塘边玩水。', isSafe: false, tip: '水边很危险，一定要有大人陪着才能靠近！', emoji: '💧' },
  { scenario: '吃饭时', statement: '吃东西慢慢嚼，不说笑、不打闹。', isSafe: true, tip: '慢慢吃，好好嚼，吃饭时不打闹才不会呛到哦！', emoji: '🍚' },
];

/* -------------------- 英语 · 唱唱萌可的英文儿歌（音乐会） -------------------- */
export interface EnSong {
  title: string;
  emoji: string;
  lyrics: string[]; // 歌词（英文）
  cn: string; // 中文大意
  keywords: { en: string; cn: string }[]; // 关键词（配图）
}
export const EN_SONGS: EnSong[] = [
  {
    title: 'Twinkle Twinkle Little Star',
    emoji: '⭐',
    lyrics: ['Twinkle, twinkle, little star,', 'How I wonder what you are!', 'Up above the world so high,', 'Like a diamond in the sky.'],
    cn: '一闪一闪亮晶晶，满天都是小星星，挂在天上放光明，好像许多小眼睛。',
    keywords: [
      { en: 'star', cn: '星星' },
      { en: 'sky', cn: '天空' },
      { en: 'diamond', cn: '钻石' },
      { en: 'high', cn: '高高' },
    ],
  },
  {
    title: 'Head, Shoulders, Knees and Toes',
    emoji: '🙆',
    lyrics: ['Head, shoulders, knees and toes,', 'Knees and toes, knees and toes.', 'Head, shoulders, knees and toes,', 'Eyes, ears, mouth and nose.'],
    cn: '头、肩膀、膝盖和脚趾，膝盖和脚趾。眼睛、耳朵、嘴巴和鼻子。',
    keywords: [
      { en: 'head', cn: '头' },
      { en: 'shoulders', cn: '肩膀' },
      { en: 'knees', cn: '膝盖' },
      { en: 'toes', cn: '脚趾' },
      { en: 'eyes', cn: '眼睛' },
      { en: 'nose', cn: '鼻子' },
    ],
  },
  {
    title: 'Old MacDonald Had a Farm',
    emoji: '🚜',
    lyrics: ['Old MacDonald had a farm, E-I-E-I-O.', 'And on his farm he had a cow, E-I-E-I-O.', 'With a moo-moo here and a moo-moo there,', 'Here a moo, there a moo, everywhere a moo-moo.'],
    cn: '老麦克唐纳有个农场，咿呀咿呀哟。农场里有一头牛，哞哞叫。',
    keywords: [
      { en: 'farm', cn: '农场' },
      { en: 'cow', cn: '奶牛' },
      { en: 'moo', cn: '哞' },
    ],
  },
  {
    title: 'If You\'re Happy and You Know It',
    emoji: '😄',
    lyrics: ['If you\'re happy and you know it, clap your hands!', 'If you\'re happy and you know it, clap your hands!', 'If you\'re happy and you know it, and you really want to show it,', 'If you\'re happy and you know it, clap your hands!'],
    cn: '如果你开心，就拍拍手！想要告诉大家你开心，就拍拍手！',
    keywords: [
      { en: 'happy', cn: '开心' },
      { en: 'clap', cn: '拍手' },
      { en: 'hands', cn: '手' },
    ],
  },
  {
    title: 'The Wheels on the Bus',
    emoji: '🚌',
    lyrics: ['The wheels on the bus go round and round,', 'Round and round, round and round.', 'The wheels on the bus go round and round,', 'All through the town.'],
    cn: '巴士的轮子转呀转，转呀转，转呀转，穿过整个小镇。',
    keywords: [
      { en: 'wheels', cn: '轮子' },
      { en: 'bus', cn: '公交车' },
      { en: 'round', cn: '圆圈' },
      { en: 'town', cn: '小镇' },
    ],
  },
  {
    title: 'The ABC Song',
    emoji: '🔤',
    lyrics: ['A B C D E F G,', 'H I J K L M N O P,', 'Q R S, T U V,', 'W X Y and Z.', 'Now I know my ABCs,', 'Next time won\'t you sing with me?'],
    cn: 'A 到 Z，26 个字母我都会，下次跟我一起唱吧！',
    keywords: [
      { en: 'A B C', cn: '字母 A B C' },
      { en: 'sing', cn: '唱歌' },
    ],
  },
];
