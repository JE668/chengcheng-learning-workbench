/**
 * 本文件由 study-data.ts 拆分而来（数据内容未改动，仅移动位置）。
 * 对外统一入口仍是 @/lib/study-data，见 src/lib/study-data.ts 的聚合 re-export。
 */

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
      { pinyin: 'ui', tone: 0, examples: ['水 shuǐ', '回家 huí jiā'] },
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

/* -------------------- 语文 · 拼音口诀（一课一贴练习册） -------------------- */
export interface PinyinTip {
  title: string;
  tip: string;
  emoji: string;
}
export const PINYIN_TIPS: PinyinTip[] = [
  { title: '单韵母 a o e', tip: 'a（阿姨）：嘴巴张大 a a a；o（公鸡）：嘴巴圆圆 o o o；e（白鹅）：嘴巴扁扁 e e e', emoji: '🅰️' },
  { title: '单韵母 i u ü', tip: 'i（衣服）：嘴巴尖尖 i i i；u（乌鸦）：嘴巴突出 u u u；ü（小鱼）：嘴巴撅撅 ü ü ü', emoji: '🅱️' },
  { title: '声母 b p m f', tip: 'b（广播）：右下半圆 b b b；p（山坡）：右上半圆 p p p；m（门洞）：两个门洞 m m m；f（拐杖）：一根拐杖 f f f', emoji: '🅲️' },
  { title: '声母 d t n l', tip: 'd（小鼓）：左下半圆 d d d；t（伞柄）：伞柄朝上 t t t；n（门洞）：一个门洞 n n n；l（木棍）：一根木棍 l l l', emoji: '🅳️' },
  { title: '声母 g k h', tip: 'g（鸽子）：鸽子鸽子 g g g；k（蝌蚪）：蝌蚪蝌蚪 k k k；h（喝水）：喝水喝水 h h h', emoji: '🅴️' },
  { title: '声母 j q x', tip: 'j（母鸡）：母鸡母鸡 j j j；q（气球）：气球气球 q q q；x（西瓜）：西瓜西瓜 x x x', emoji: '🅵️' },
  { title: '声母 z c s', tip: 'z（写字）：写写字写 z z z；c（刺猬）：刺猬刺猬 c c c；s（蚕虫）：蚕虫吐丝 s s s', emoji: '🅶️' },
  { title: '声母 zh ch sh r', tip: 'zh（蜘蛛）：织毛衣织毛衣 zh zh zh；ch（吃苹果）：吃苹果吃苹果 ch ch ch；sh（狮子）：狮子狮子 sh sh sh；r（日出）：日出日出 r r r', emoji: '🅷️' },
  { title: '整体认读', tip: 'zhi chi shi ri、yi wu yu 这 8 个音节不用拼读，看到就直接认读', emoji: '🔤' },
  { title: '书写规则', tip: '四线格里拼音字母占位：a o e 占中格；i u ü 占中上格；b p 占中下格；d t 占中上格；f 占上中格；m n l 占中格', emoji: '✍️' },
];

/* -------------------- 语文 · 声调表（一课一贴练习册） -------------------- */
export interface ToneItem {
  tone: number; // 1-4
  label: string; // 一声平, 二声扬…
  mark: string; // ā á ǎ à
  example: string[]; // 例字
  emoji: string;
  mnemonic: string; // 记忆口诀
}
export const TONE_ITEMS: ToneItem[] = [
  { tone: 1, label: '一声平', mark: 'ā', example: ['妈', '他', '花'], emoji: '😐', mnemonic: '一声平，像汽车' },
  { tone: 2, label: '二声扬', mark: 'á', example: ['麻', '拿', '茶'], emoji: '😊', mnemonic: '二声扬，像爬坡' },
  { tone: 3, label: '三声拐弯', mark: 'ǎ', example: ['马', '那', '洒'], emoji: '😯', mnemonic: '三声拐弯，先降后升' },
  { tone: 4, label: '四声降', mark: 'à', example: ['骂', '大', '爸'], emoji: '😠', mnemonic: '四声降，像下楼' },
];
