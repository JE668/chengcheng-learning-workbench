/**
 * 本文件由 study-data.ts 拆分而来（数据内容未改动，仅移动位置）。
 * 对外统一入口仍是 @/lib/study-data，见 src/lib/study-data.ts 的聚合 re-export。
 */

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

/* -------------------- 语文 · 形近字（一课一贴练习册） -------------------- */
export interface SimilarCharGroup {
  a: string; // 字 A
  b: string; // 字 B
  aMean: string; // A 的意思/组词
  bMean: string; // B 的意思/组词
  tip: string; // 辨别提示
  emoji: string;
}
export const SIMILAR_CHARS: SimilarCharGroup[] = [
  { a: '地', b: '他', aMean: '土地、地球', bMean: '他们、他的', tip: '土+也=地（和土地有关），亻+也=他（指人）', emoji: '🌍' },
  { a: '日', b: '目', aMean: '日子、太阳', bMean: '眼睛、目光', tip: '日中间一点，目中间一横', emoji: '🌞' },
  { a: '田', b: '四', aMean: '田野、田地', bMean: '四周、四月', tip: '田中间十字，四中间儿字', emoji: '🌾' },
  { a: '禾', b: '木', aMean: '禾苗、禾田', bMean: '木头、树木', tip: '禾多一撇，木是一棵树', emoji: '🌱' },
  { a: '人', b: '入', aMean: '人们、大人', bMean: '进入、出入', tip: '人撇低捺高，入撇高捺低', emoji: '🚶' },
  { a: '天', b: '夫', aMean: '天空、天上', bMean: '丈夫、大夫', tip: '天是天上，夫是大夫', emoji: '🌤️' },
  { a: '月', b: '用', aMean: '月亮、月份', bMean: '使用、用来', tip: '月里面两横，用里面三横', emoji: '🌙' },
  { a: '火', b: '水', aMean: '大火、着火', bMean: '河水、水田', tip: '火是红色，水是蓝色', emoji: '🔥' },
  { a: '己', b: '已', aMean: '自己、自我', bMean: '已经、早已', tip: '己右边开口，已右边封口', emoji: '🙋' },
  { a: '又', b: '双', aMean: '又一个、又是', bMean: '双手、双人', tip: '又加又就是双', emoji: '✌️' },
];

/* -------------------- 语文 · 拟声词（一课一贴练习册） -------------------- */
export interface OnomatopoeiaItem {
  sound: string; // 拟声词
  subject: string; // 发出声音的事物
  emoji: string;
}
export const ONOMATOPOEIA: OnomatopoeiaItem[] = [
  { sound: '哗哗', subject: '小溪流', emoji: '💧' },
  { sound: '沙沙', subject: '小雨点', emoji: '🌧️' },
  { sound: '咕咕', subject: '小鸽子', emoji: '🕊️' },
  { sound: '嘎嘎', subject: '小鸭子', emoji: '🦆' },
  { sound: '喵喵', subject: '小花猫', emoji: '🐱' },
  { sound: '呱呱', subject: '小青蛙', emoji: '🐸' },
  { sound: '汪汪', subject: '小狗', emoji: '🐶' },
  { sound: '喵喵', subject: '小猫', emoji: '🐱' },
  { sound: '嗡嗡', subject: '小蜜蜂', emoji: '🐝' },
  { sound: '咚咚', subject: '心跳声', emoji: '💓' },
  { sound: '哗哗', subject: '下雨声', emoji: '🌧️' },
  { sound: '沙沙', subject: '风吹树叶', emoji: '🍃' },
  { sound: '叽叽', subject: '小鸟', emoji: '🐦' },
  { sound: '咯咯', subject: '母鸡', emoji: '🐔' },
  { sound: '呱呱', subject: '青蛙', emoji: '🐸' },
  { sound: '汪汪', subject: '小狗', emoji: '🐶' },
  { sound: '哞哞', subject: '老牛', emoji: '🐮' },
  { sound: '咩咩', subject: '小羊', emoji: '🐑' },
  { sound: '嘎嘎', subject: '小鸭子', emoji: '🦆' },
  { sound: '嗡嗡', subject: '小蜜蜂', emoji: '🐝' },
];

/* -------------------- 语文 · 多音字（一课一贴练习册） -------------------- */
export interface PolyphonicChar {
  char: string;
  readings: { pinyin: string; meaning: string; example: string }[];
  tip: string;
  emoji: string;
}
export const POLYPHONIC_CHARS: PolyphonicChar[] = [
  { char: '了', readings: [
    { pinyin: 'le', meaning: '助词（表示完成）', example: '吃了、看了' },
    { pinyin: 'liǎo', meaning: '明白、了解', example: '了解、清楚' },
  ], tip: 'le=助词，liǎo=明白', emoji: '👀' },
  { char: '乐', readings: [
    { pinyin: 'lè', meaning: '快乐、高兴', example: '快乐、欢乐' },
    { pinyin: 'yuè', meaning: '音乐、乐器', example: '音乐、乐器' },
  ], tip: 'lè=快乐，yuè=音乐', emoji: '🎵' },
  { char: '好', readings: [
    { pinyin: 'hǎo', meaning: '好的、美好', example: '好人、好看' },
    { pinyin: 'hào', meaning: '喜爱、爱好', example: '爱好、好学' },
  ], tip: 'hǎo=好的，hào=喜爱', emoji: '😊' },
  { char: '得', readings: [
    { pinyin: 'dé', meaning: '得到、获得', example: '得到、获得' },
    { pinyin: 'de', meaning: '助词（表示程度）', example: '跑得快' },
    { pinyin: 'děi', meaning: '必须、需要', example: '得走、得来' },
  ], tip: 'dé=得到，de=助词，děi=必须', emoji: '🤔' },
  { char: '地', readings: [
    { pinyin: 'dì', meaning: '土地、地面', example: '土地、地球' },
    { pinyin: 'de', meaning: '助词（修饰动词）', example: '慢慢地走' },
  ], tip: 'dì=土地，de=助词', emoji: '🌍' },
];

/* -------------------- 语文 · 形近字辨别儿歌（一课一贴练习册） -------------------- */
export interface SimilarCharRiddle {
  char: string;
  riddle: string;
  answer: string;
  emoji: string;
}
export const SIMILAR_CHAR_RIDDLES: SimilarCharRiddle[] = [
  { char: '地', riddle: '土加也，脚下有地，负载万物', answer: '地', emoji: '🌍' },
  { char: '他', riddle: '亻加也，指你我之外的第三个人', answer: '他', emoji: '🙋' },
  { char: '日', riddle: '头顶有天，覆盖万物，一个圆圈中间一点', answer: '日', emoji: '🌞' },
  { char: '目', riddle: '日中间一横，能看东西', answer: '目', emoji: '👁️' },
  { char: '田', riddle: '口中间十，四方方，写好汉字它来帮', answer: '田', emoji: '🌾' },
  { char: '禾', riddle: '木多一撇，禾苗禾苗绿又大', answer: '禾', emoji: '🌱' },
  { char: '火', riddle: '人字加两点，点燃万物暖洋洋', answer: '火', emoji: '🔥' },
  { char: '水', riddle: '四个小点，大自然的来源', answer: '水', emoji: '💧' },
];

/* -------------------- 语文 · 象形字（一课一贴练习册） -------------------- */
export interface PictographItem {
  char: string;
  py: string;
  meaning: string;
  hint: string;
  emoji: string;
}
export const PICTOGRAPHS: PictographItem[] = [
  { char: '日', py: 'rì', meaning: '太阳', hint: '古人画了一个圆圈，中间一点，代表太阳', emoji: '☀️' },
  { char: '月', py: 'yuè', meaning: '月亮', hint: '古人画了一个弯弯的月牙', emoji: '🌙' },
  { char: '山', py: 'shān', meaning: '山峰', hint: '古人画了三座尖尖的山峰', emoji: '⛰️' },
  { char: '川', py: 'chuān', meaning: '河流', hint: '古人画了三条弯弯的河流', emoji: '🏞️' },
  { char: '水', py: 'shuǐ', meaning: '水流', hint: '古人画了流动的水波', emoji: '💧' },
  { char: '火', py: 'huǒ', meaning: '火焰', hint: '古人画了一团跳动的火焰', emoji: '🔥' },
  { char: '田', py: 'tián', meaning: '田地', hint: '古人画了一个方方正正的田地', emoji: '🌾' },
  { char: '禾', py: 'hé', meaning: '禾苗', hint: '古人画了一棵弯弯的禾苗', emoji: '🌱' },
  { char: '木', py: 'mù', meaning: '树木', hint: '古人画了一棵大树，有树根有树枝', emoji: '🌳' },
  { char: '网', py: 'wǎng', meaning: '渔网', hint: '古人画了一张方格渔网', emoji: '🕸️' },
  { char: '羊', py: 'yáng', meaning: '山羊', hint: '古人画了一只长着弯曲羊角的羊', emoji: '🐑' },
  { char: '兔', py: 'tù', meaning: '兔子', hint: '古人画了一只竖着长耳朵的兔子', emoji: '🐰' },
  { char: '鸟', py: 'niǎo', meaning: '小鸟', hint: '古人画了一只尖嘴的小鸟', emoji: '🐦' },
  { char: '竹', py: 'zhú', meaning: '竹子', hint: '古人画了两片竹叶', emoji: '🎋' },
];

/* -------------------- 语文 · 成语填空（一课一贴练习册） -------------------- */
export interface IdiomItem {
  idiom: string;
  blank: string; // 缺的那个字
  position: number; // blank 在成语中的位置（0-based）
  meaning: string;
  example: string;
  emoji: string;
}
export const IDIOMS: IdiomItem[] = [
  { idiom: '耳目一新', blank: '目', position: 2, meaning: '听到的、看到的都和以前不一样，形容事物焕然一新', example: '教室里焕然一新，耳目一新', emoji: '👀' },
  { idiom: '面红耳赤', blank: '赤', position: 3, meaning: '脸和耳朵都红了，形容因激动或羞愧而脸色发红', example: '他争得面红耳赤', emoji: '😡' },
  { idiom: '目中无人', blank: '中', position: 2, meaning: '眼里没有别人，形容骄傲自大', example: '他做事目中无人', emoji: '😤' },
  { idiom: '口是心非', blank: '是', position: 2, meaning: '嘴里说的和心里想的不一样', example: '他是个口是心非的人', emoji: '🤐' },
  { idiom: '苦口婆心', blank: '口', position: 2, meaning: '耐心地、善意地反复劝告', example: '妈妈苦口婆心地劝我', emoji: '👵' },
  { idiom: '心直口快', blank: '直', position: 2, meaning: '心里怎么想，嘴上就怎么说，不拐弯抹角', example: '他心直口快', emoji: '💬' },
  { idiom: '一目十行', blank: '十', position: 2, meaning: '一眼看十行，形容看书非常快', example: '他读书一目十行', emoji: '📖' },
  { idiom: '手忙脚乱', blank: '脚', position: 3, meaning: '形容做事慌张，没有条理', example: '他做事手忙脚乱', emoji: '🤯' },
  { idiom: '画蛇添足', blank: '足', position: 3, meaning: '比喻做了多余的事，反而不好', example: '别画蛇添足了', emoji: '🐍' },
  { idiom: '守株待兔', blank: '兔', position: 3, meaning: '比喻死守经验，不知变通', example: '做事不能守株待兔', emoji: '🐰' },
  { idiom: '掩耳盗铃', blank: '铃', position: 3, meaning: '捂住耳朵去偷铃铛，比喻自己欺骗自己', example: '别掩耳盗铃了', emoji: '🔔' },
  { idiom: '刻舟求剑', blank: '剑', position: 3, meaning: '比喻不懂事物变化，拘泥于成例', example: '别刻舟求剑', emoji: '🗡️' },
];

/* -------------------- 语文 · 轻声词（一课一贴练习册） -------------------- */
export interface NeutralToneItem {
  word: string;
  normal: string[]; // 正常读音的声调
  light: string[]; // 轻声读音的声调
  emoji: string;
  tip: string;
}
export const NEUTRAL_TONE_WORDS: NeutralToneItem[] = [
  { word: '妈妈', normal: ['mā', 'mā'], light: ['mā', 'ma'], emoji: '👩', tip: '第二个"妈"读轻声，不标调号' },
  { word: '爸爸', normal: ['bà', 'bà'], light: ['bà', 'ba'], emoji: '👨', tip: '第二个"爸"读轻声' },
  { word: '哥哥', normal: ['gē', 'gē'], light: ['gē', 'ge'], emoji: '👦', tip: '第二个"哥"读轻声' },
  { word: '姐姐', normal: ['jiě', 'jiě'], light: ['jiě', 'jie'], emoji: '👧', tip: '第二个"姐"读轻声' },
  { word: '弟弟', normal: ['dì', 'dì'], light: ['dì', 'de'], emoji: '👶', tip: '第二个"弟"读轻声' },
  { word: '妹妹', normal: ['mèi', 'mèi'], light: ['mèi', 'mei'], emoji: '👧', tip: '第二个"妹"读轻声' },
  { word: '奶奶', normal: ['nǎi', 'nǎi'], light: ['nǎi', 'nai'], emoji: '👵', tip: '第二个"奶"读轻声' },
  { word: '爷爷', normal: ['yé', 'yé'], light: ['yé', 'ye'], emoji: '👴', tip: '第二个"爷"读轻声' },
  { word: '伯伯', normal: ['bó', 'bó'], light: ['bó', 'bo'], emoji: '👨', tip: '第二个"伯"读轻声' },
  { word: '叔叔', normal: ['shū', 'shū'], light: ['shū', 'shu'], emoji: '🧔', tip: '第二个"叔"读轻声' },
  { word: '阿姨', normal: ['ā', 'yí'], light: ['ā', 'yi'], emoji: '👩', tip: '第二个"姨"读轻声' },
  { word: '姑姑', normal: ['gū', 'gū'], light: ['gū', 'gu'], emoji: '👩', tip: '第二个"姑"读轻声' },
];

/* -------------------- 语文 · 形近字母（一课一贴练习册） -------------------- */
export interface LetterPair {
  a: string; // 字母 A
  b: string; // 字母 B
  aName: string; // A 的名称/含义
  bName: string; // B 的名称/含义
  tip: string; // 辨别口诀
  emoji: string;
}
export const LETTER_PAIRS: LetterPair[] = [
  { a: 'l', b: 'b', aName: 'l（el）', bName: 'b（bi）', tip: '6 个圈在右下是 b，1 个圈在左下是 l', emoji: '🅰️' },
  { a: 'd', b: 'q', aName: 'd（di）', bName: 'q（qi）', tip: '6 个圈在右上是 d，9 个圈在左上是 q', emoji: '🅱️' },
  { a: 'f', b: 't', aName: 'f（ef）', bName: 't（ti）', tip: '一拐一横是 f，一竖一横是 t', emoji: '🅲️' },
  { a: 'm', b: 'n', aName: 'm（em）', bName: 'n（en）', tip: '两个门洞是 m，一个门洞是 n', emoji: '🅳️' },
  { a: 'p', b: 'q', aName: 'p（pi）', bName: 'q（qi）', tip: 'p 像小旗，q 像气球', emoji: '🅴️' },
  { a: 'j', b: 'r', aName: 'j（ji）', bName: 'r（er）', tip: 'j 像母鸡，r 像日出', emoji: '🅵️' },
  { a: 'c', b: 's', aName: 'c（ci）', bName: 's（si）', tip: 'c 像刺猬，s 像蚕虫', emoji: '🅶️' },
  { a: 'z', b: 'c', aName: 'z（zi）', bName: 'c（ci）', tip: 'z 像写字，c 像刺猬', emoji: '🅷️' },
];

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
