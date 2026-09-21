/**
 * 本文件由 study-data.ts 拆分而来（数据内容未改动，仅移动位置）。
 * 对外统一入口仍是 @/lib/study-data，见 src/lib/study-data.ts 的聚合 re-export。
 */

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
