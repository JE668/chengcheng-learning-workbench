/**
 * 本文件由 study-data.ts 拆分而来（数据内容未改动，仅移动位置）。
 * 对外统一入口仍是 @/lib/study-data，见 src/lib/study-data.ts 的聚合 re-export。
 */

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
  { first: '良药苦口', second: '利于病', hint: '好药虽然难吃，但能治好病。批评的话虽然不好听，但能帮你进步！', emoji: '💊' },
  { first: '忠言逆耳', second: '利于行', hint: '真诚的建议有时候不好听，但能帮你走得更远！', emoji: '👂' },
  { first: '吃一堑', second: '长一智', hint: '摔了跤不要紧，下次就知道怎么避免了！', emoji: '📈' },
  { first: '失败是成功之母', second: '成功是失败之父', hint: '失败了没关系，总结经验下次就会更好！', emoji: '🔄' },
  { first: '只要功夫深', second: '铁杵磨成针', hint: '只要坚持努力，再难的事情也能做到！', emoji: '🪡' },
  { first: '玉不琢', second: '不成器', hint: '玉石不加工就变成不了漂亮的工艺品，人也要学习才能成才！', emoji: '🪨' },
  { first: '勤能补拙', second: '天道酬勤', hint: '聪明人也要努力，勤快的人可以弥补不足！', emoji: '🏆' },
  { first: '三人行', second: '必有我师', hint: '每个人都有自己的长处，我们要向别人学习！', emoji: '👥' },
  { first: '学而不思则罔', second: '思而不学则殆', hint: '只学习不思考会迷糊，只思考不学习会危险！', emoji: '🤔' },
  { first: '温故而知新', second: '可以为师矣', hint: '复习旧知识能学到新东西，这样就能当老师啦！', emoji: '🔄' },
  { first: '不积跬步', second: '无以至千里', hint: '不一步一步走，就到不了千里之外。学习要每天坚持！', emoji: '👣' },
  { first: '不积小流', second: '无以成江海', hint: '不汇聚小溪流，就形不成大海。每天进步一点点！', emoji: '🌊' },
  { first: '满招损', second: '谦受益', hint: '骄傲自大会吃亏，谦虚能学到更多！', emoji: '🙏' },
  { first: '尺有所短', second: '寸有所长', hint: '再长的尺子也有短的方面，再短的东西也有长处。每个人都有自己的强项！', emoji: '📏' },
  { first: '己所不欲', second: '勿施于人', hint: '自己不喜欢的事情，也不要让别人做。要懂得尊重别人！', emoji: '🤝' },
  { first: '天时不如地利', second: '地利不如人和', hint: '好天气不如好地势，好地势不如人心齐。团结的力量最大！', emoji: '🤗' },
  { first: '近朱者赤', second: '近墨者黑', hint: '靠近红颜料会变红，靠近墨会变黑。交什么朋友很重要！', emoji: '🎨' },
  { first: '机不可失', second: '时不再来', hint: '机会来了要抓住，错过了就不会再来了！', emoji: '⏳' },
  { first: '塞翁失马', second: '焉知非福', hint: '坏事不一定是坏事，有时候会变成好事。不要悲观！', emoji: '🐴' },
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
  { a: '好', b: '坏', emojiA: '👍', emojiB: '👎' },
  { a: '新', b: '旧', emojiA: '🆕', emojiB: '📜' },
  { a: '轻', b: '重', emojiA: '🪶', emojiB: '🪨' },
  { a: '深', b: '浅', emojiA: '🌊', emojiB: '🏖️' },
  { a: '明', b: '暗', emojiA: '☀️', emojiB: '🌑' },
  { a: '真', b: '假', emojiA: '✅', emojiB: '❌' },
  { a: '生', b: '熟', emojiA: '🥚', emojiB: '🍳' },
  { a: '甜', b: '苦', emojiA: '🍬', emojiB: '🍋' },
  { a: '哭', b: '笑', emojiA: '😢', emojiB: '😄' },
  { a: '男', b: '女', emojiA: '👦', emojiB: '👧' },
  { a: '内', b: '外', emojiA: '🏠', emojiB: '🌳' },
  { a: '进', b: '退', emojiA: '⏩', emojiB: '⏪' },
  { a: '胜', b: '败', emojiA: '🏆', emojiB: '💔' },
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
  { riddle: '四四方方一块田，人人种在田中间，不是稻子也不是谷，人人天天用。', answer: '口', options: ['口', '田', '目'], hint: '我们每个人脸上都有一块"田"，天天在用它～', emoji: '👄' },
  { riddle: '千口合一字，人人都会说，它把秘密藏，它把话语传。', answer: '舌', options: ['舌', '口', '言'], hint: '它藏在嘴里，帮我们说话和尝味道～', emoji: '👅' },
  { riddle: '有面没有口，有脚没有手，走起来快，跑起来轻。', answer: '桌子', options: ['桌子', '椅子', '床'], hint: '你写作业的时候，它就在你面前～', emoji: '🪑' },
  { riddle: '一个公公真稀奇，不吃饭来不喝水，每天准时报时间，滴答滴答不停息。', answer: '时钟', options: ['时钟', '手表', '闹钟'], hint: '它不会说话，但一直在"滴答滴答"～', emoji: '⏰' },
  { riddle: '小小银鱼儿，游在江河里，有时变成雪，有时变成雨。', answer: '水', options: ['水', '冰', '云'], hint: '它是生命之源，能变成很多形态～', emoji: '💧' },
  { riddle: '身穿金甲，头戴银盔，走路摇头摆尾，威风凛凛。', answer: '公鸡', options: ['公鸡', '凤凰', '龙'], hint: '它每天早上叫醒你起床～', emoji: '🐓' },
  { riddle: '一个圆盘子，里面装满了星星，晚上才能看到它。', answer: '夜空', options: ['夜空', '大海', '花园'], hint: '抬头往天上看，黑黑的，有很多星星～', emoji: '🌌' },
  { riddle: '小小一只船，天天在浪里翻，不怕风来也不怕浪，载着娃娃去上学。', answer: '书包', options: ['书包', '小船', '汽车'], hint: '它装满了你的课本和文具～', emoji: '🎒' },
  { riddle: '有头没有尾，有角没有嘴，有脚不会走，有手不会摸。', answer: '衣服', options: ['衣服', '鞋子', '帽子'], hint: '你每天早上都要穿它出门～', emoji: '👕' },
  { riddle: '白白胖胖圆又圆，一摔就破不能圆，里面藏着黄蛋黄，营养丰富人人夸。', answer: '鸡蛋', options: ['鸡蛋', '苹果', '土豆'], hint: '它是早餐桌上的好朋友～', emoji: '🥚' },
  { riddle: '小小诸葛亮，独坐中军帐，摆下八卦阵，专抓飞来将。', answer: '蜘蛛', options: ['蜘蛛', '蚂蚁', '蜜蜂'], hint: '它在网上"坐等"猎物～', emoji: '🕷️' },
  { riddle: '有马不能骑，有花不能摘，有门不能开，有路不能走。', answer: '画', options: ['画', '书', '照片'], hint: '它挂墙上，你只能看不能摸～', emoji: '🖼️' },
  { riddle: '兄弟七八个，围着柱子坐，大家一分家，衣服就扯破。', answer: '大蒜', options: ['大蒜', '洋葱', '土豆'], hint: '它是厨房里的常见调料～', emoji: '🧄' },
  { riddle: '有嘴不能说，有眼不能瞧，有耳不能听，有手不能拿。', answer: '布娃娃', options: ['布娃娃', '玩具车', '飞机'], hint: '它可以陪你睡觉，但它不会说话～', emoji: '🧸' },
  { riddle: '红公鸡，白公鸡，一起跑到泥地里，洗洗刷刷变干净。', answer: '洗脚', options: ['洗脚', '洗手', '洗澡'], hint: '每天晚上睡觉前都要做～', emoji: '🦶' },
  { riddle: '小小兵人排成队，走起路来一二一，遇到红灯站住了，绿灯亮了继续走。', answer: '行人', options: ['行人', '士兵', '交警'], hint: '过马路的时候要守交通规则～', emoji: '🚸' },
  { riddle: '小小一间房，只有一扇窗，天天唱唱歌，唱得大家亮。', answer: '收音机', options: ['收音机', '电视', '手机'], hint: '它可以播放音乐和新闻～', emoji: '📻' },
  { riddle: '一只小雀儿，尾巴像把扇，一开一关，样子挺好看。', answer: '啄木鸟', options: ['啄木鸟', '蝴蝶', '蜜蜂'], hint: '它用嘴敲树干找虫子～', emoji: '🐦' },
  { riddle: '有眼没有眉，有脚没有腿，有翅不会飞，有嘴不会说。', answer: '金鱼', options: ['金鱼', '麻雀', '蝴蝶'], hint: '它住在鱼缸里，红红黄黄很好看～', emoji: '🐠' },
];
