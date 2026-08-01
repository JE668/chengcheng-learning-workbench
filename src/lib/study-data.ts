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

  // —— 一年级上册 识字课文补充 ——
  { char: '你', strokeCount: 7, meaning: '你（第二人称）', phrase: '你们好', category: '家庭' },
  { char: '我', strokeCount: 7, meaning: '我（自己）', phrase: '我们', category: '家庭' },
  { char: '他', strokeCount: 5, meaning: '他（第三人称）', phrase: '他们', category: '家庭' },
  { char: '金', strokeCount: 8, meaning: '金子 / 金属', phrase: '金子闪闪', category: '自然' },
  { char: '川', strokeCount: 3, meaning: '河流 / 山川', phrase: '山川壮美', category: '自然' },
  { char: '禾', strokeCount: 5, meaning: '禾苗（庄稼）', phrase: '禾苗青青', category: '植物' },
  { char: '站', strokeCount: 10, meaning: '站立', phrase: '站如松', category: '动作' },
  { char: '云', strokeCount: 4, meaning: '云朵', phrase: '白云飘飘', category: '自然' },
  { char: '雨', strokeCount: 8, meaning: '雨水', phrase: '下雨啦', category: '自然' },
  { char: '风', strokeCount: 4, meaning: '风', phrase: '大风呼呼', category: '自然' },
  { char: '明', strokeCount: 8, meaning: '明亮 / 明白', phrase: '明亮灯光', category: '自然' },
  { char: '男', strokeCount: 7, meaning: '男孩 / 男人', phrase: '男孩勇敢', category: '家庭' },
  { char: '尖', strokeCount: 6, meaning: '尖锐 / 笔尖', phrase: '笔尖尖尖', category: '物品' },
  { char: '尘', strokeCount: 6, meaning: '尘土', phrase: '尘土飞扬', category: '自然' },
  { char: '从', strokeCount: 4, meaning: '跟从', phrase: '跟从老师', category: '家庭' },
  { char: '众', strokeCount: 6, meaning: '众人 / 许多', phrase: '众人拾柴', category: '家庭' },
  { char: '林', strokeCount: 8, meaning: '树林', phrase: '树林密密', category: '植物' },
  { char: '森', strokeCount: 12, meaning: '森林', phrase: '森林深深', category: '植物' },
  { char: '包', strokeCount: 5, meaning: '书包 / 包裹', phrase: '书包真神气', category: '物品' },
  { char: '尺', strokeCount: 4, meaning: '尺子', phrase: '一把尺子', category: '物品' },
  { char: '作', strokeCount: 7, meaning: '作业 / 工作', phrase: '做作业', category: '物品' },
  { char: '业', strokeCount: 5, meaning: '作业 / 事业', phrase: '完成作业', category: '物品' },
  { char: '本', strokeCount: 5, meaning: '本子 / 书本', phrase: '一本本子', category: '物品' },
  { char: '课', strokeCount: 10, meaning: '上课 / 课程', phrase: '上课啦', category: '物品' },
  { char: '早', strokeCount: 6, meaning: '早晨 / 早', phrase: '早上好', category: '自然' },
  { char: '校', strokeCount: 10, meaning: '学校', phrase: '学校真漂亮', category: '物品' },
  { char: '升', strokeCount: 4, meaning: '升起', phrase: '升旗', category: '动作' },
  { char: '国', strokeCount: 8, meaning: '国家 / 中国', phrase: '我爱中国', category: '家庭' },
  { char: '旗', strokeCount: 14, meaning: '旗帜', phrase: '五星红旗', category: '物品' },
  { char: '起', strokeCount: 10, meaning: '起来 / 起立', phrase: '起立', category: '动作' },
  { char: '美', strokeCount: 9, meaning: '美丽', phrase: '美丽中国', category: '自然' },
  { char: '丽', strokeCount: 7, meaning: '美丽', phrase: '风和日丽', category: '自然' },
  { char: '歌', strokeCount: 14, meaning: '歌曲 / 唱歌', phrase: '唱歌', category: '动作' },
  { char: '午', strokeCount: 4, meaning: '中午 / 下午', phrase: '中午吃饭', category: '自然' },
  { char: '晚', strokeCount: 11, meaning: '晚上', phrase: '晚上好', category: '自然' },
  { char: '昨', strokeCount: 9, meaning: '昨天', phrase: '昨天的事', category: '自然' },
  { char: '今', strokeCount: 4, meaning: '今天', phrase: '今天开心', category: '自然' },
  { char: '年', strokeCount: 6, meaning: '年 / 新年', phrase: '过新年', category: '自然' },
  { char: '开', strokeCount: 4, meaning: '打开 / 开心', phrase: '开门', category: '动作' },
  { char: '关', strokeCount: 6, meaning: '关上', phrase: '关上门', category: '动作' },
  { char: '牙', strokeCount: 4, meaning: '牙齿', phrase: '刷牙', category: '人体' },
  { char: '少', strokeCount: 4, meaning: '多少 / 少', phrase: '不少', category: '数字' },
  { char: '不', strokeCount: 4, meaning: '不（否定）', phrase: '不行', category: '动作' },
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
  // —— 人教版（一年级起点）一年级上册 单元补充 ——
  学校: [
    { word: 'book', cn: '书', emoji: '📕', sentence: 'I have a book.' },
    { word: 'bag', cn: '书包', emoji: '🎒', sentence: 'This is my bag.' },
    { word: 'pen', cn: '钢笔', emoji: '🖊️', sentence: 'I have a pen.' },
    { word: 'pencil', cn: '铅笔', emoji: '✏️', sentence: 'I have a pencil.' },
    { word: 'ruler', cn: '尺子', emoji: '📏', sentence: 'I have a ruler.' },
    { word: 'eraser', cn: '橡皮', emoji: '🧽', sentence: 'I have an eraser.' },
    { word: 'school', cn: '学校', emoji: '🏫', sentence: 'This is my school.' },
  ],
  问候: [
    { word: 'hello', cn: '你好', emoji: '👋', sentence: 'Hello! I am ...' },
    { word: 'hi', cn: '嗨', emoji: '🙋', sentence: 'Hi! I am ...' },
    { word: 'goodbye', cn: '再见', emoji: '👋', sentence: 'Goodbye!' },
    { word: 'bye', cn: '拜拜', emoji: '✋', sentence: 'Bye!' },
  ],
};

/** 全部英语单词（用于听音选词、口语练习） */
export const ALL_EN_WORDS: WordItem[] = Object.values(EN_WORD_TOPICS).flat();

/* ============================================================
   人教版（部编版）小学一年级上册 · 拓展内容
   ============================================================ */

/* -------------------- 语文 · 识字课文（按课本单元） -------------------- */
export interface CharacterLessonItem {
  char: string;
  phrase: string;
}
export interface CharacterLesson {
  lesson: string;
  emoji: string;
  text: string;
  items: CharacterLessonItem[];
}
export const CHARACTER_LESSONS: CharacterLesson[] = [
  {
    lesson: '识字 1《天地人》',
    emoji: '🌍',
    text: '天 地 人 你 我 他',
    items: [
      { char: '天', phrase: '天空' },
      { char: '地', phrase: '大地' },
      { char: '人', phrase: '人们' },
      { char: '你', phrase: '你们' },
      { char: '我', phrase: '我们' },
      { char: '他', phrase: '他们' },
    ],
  },
  {
    lesson: '识字 2《金木水火土》',
    emoji: '🔥',
    text: '一二三四五，金木水火土。天地分上下，日月照今古。',
    items: [
      { char: '金', phrase: '金子' },
      { char: '木', phrase: '木头' },
      { char: '水', phrase: '喝水' },
      { char: '火', phrase: '火苗' },
      { char: '土', phrase: '泥土' },
    ],
  },
  {
    lesson: '识字 3《口耳目手足》',
    emoji: '👀',
    text: '口 耳 目 手 足 —— 站如松，坐如钟。',
    items: [
      { char: '口', phrase: '开口' },
      { char: '耳', phrase: '耳朵' },
      { char: '目', phrase: '眼目' },
      { char: '手', phrase: '小手' },
      { char: '足', phrase: '足球' },
      { char: '站', phrase: '站直' },
      { char: '坐', phrase: '坐好' },
    ],
  },
  {
    lesson: '识字 4《日月山川》',
    emoji: '🏔️',
    text: '日 月 山 川 水 火 田 禾',
    items: [
      { char: '川', phrase: '山川' },
      { char: '禾', phrase: '禾苗' },
    ],
  },
  {
    lesson: '识字 5《对韵歌》',
    emoji: '🌧️',
    text: '云对雨，雪对风，花对树，鸟对虫。',
    items: [
      { char: '云', phrase: '白云' },
      { char: '雨', phrase: '下雨' },
      { char: '风', phrase: '大风' },
      { char: '鸟', phrase: '小鸟' },
      { char: '虫', phrase: '虫子' },
    ],
  },
  {
    lesson: '识字 6《日月明》',
    emoji: '💡',
    text: '日月明，田力男，小大尖，小土尘。二人从，三人众，双木林，三木森。',
    items: [
      { char: '明', phrase: '明亮' },
      { char: '男', phrase: '男孩' },
      { char: '尖', phrase: '笔尖' },
      { char: '尘', phrase: '尘土' },
      { char: '从', phrase: '跟从' },
      { char: '众', phrase: '众人' },
      { char: '林', phrase: '树林' },
      { char: '森', phrase: '森林' },
    ],
  },
  {
    lesson: '识字 7《小书包》',
    emoji: '🎒',
    text: '书包 尺子 作业本 笔 橡皮',
    items: [
      { char: '包', phrase: '书包' },
      { char: '尺', phrase: '尺子' },
      { char: '作', phrase: '作业' },
      { char: '业', phrase: '作业' },
      { char: '本', phrase: '本子' },
      { char: '课', phrase: '上课' },
      { char: '早', phrase: '早上' },
      { char: '校', phrase: '学校' },
    ],
  },
  {
    lesson: '识字 8《升国旗》',
    emoji: '🚩',
    text: '五星红旗，我们的国旗。国歌声中，徐徐升起。',
    items: [
      { char: '升', phrase: '升起' },
      { char: '国', phrase: '国家' },
      { char: '旗', phrase: '红旗' },
      { char: '起', phrase: '起立' },
      { char: '立', phrase: '立正' },
      { char: '美', phrase: '美丽' },
      { char: '丽', phrase: '美丽' },
      { char: '歌', phrase: '唱歌' },
      { char: '中', phrase: '中国' },
    ],
  },
];

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
  { hour: 1, label: '1时', emoji: '🌙' },
  { hour: 2, label: '2时', emoji: '🌙' },
  { hour: 3, label: '3时', emoji: '🕒' },
  { hour: 4, label: '4时', emoji: '🕓' },
  { hour: 5, label: '5时', emoji: '🌅' },
  { hour: 6, label: '6时', emoji: '🌅' },
  { hour: 7, label: '7时', emoji: '🌞' },
  { hour: 8, label: '8时', emoji: '🌞' },
  { hour: 9, label: '9时', emoji: '🏫' },
  { hour: 10, label: '10时', emoji: '🏫' },
  { hour: 11, label: '11时', emoji: '🍱' },
  { hour: 12, label: '12时', emoji: '🌞' },
];

/* -------------------- 英语 · 人教版（一年级起点）单元 -------------------- */
export const EN_UNITS: { unit: string; title: string; emoji: string; topics: string[] }[] = [
  { unit: 'Unit 1', title: 'Hello! 你好', emoji: '👋', topics: ['问候'] },
  { unit: 'Unit 2', title: 'My school 我的学校', emoji: '🏫', topics: ['学校'] },
  { unit: 'Unit 3', title: 'My face 我的脸', emoji: '😊', topics: ['身体'] },
  { unit: 'Unit 4', title: 'Animals 动物', emoji: '🐾', topics: ['动物'] },
  { unit: 'Unit 5', title: 'Numbers 数字', emoji: '🔢', topics: ['数字'] },
  { unit: 'Unit 6', title: 'Colours 颜色', emoji: '🌈', topics: ['颜色'] },
  { unit: 'Unit 7', title: 'Fruit 水果', emoji: '🍎', topics: ['食物'] },
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
