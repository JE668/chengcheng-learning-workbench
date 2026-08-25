/* ============================================================
   语文 · 阅读理解、儿歌、谚语、反义词、量词、谜语、安全、组词
   ============================================================ */

/* -------------------- 课文阅读理解 -------------------- */
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

/* -------------------- 儿歌乐园（唱唱萌可） -------------------- */
export interface NurseryRhyme {
  title: string;
  emoji: string;
  lines: string[];
  question: string;
  options: string[];
  answer: string;
  tip: string;
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
    lines: ['老师教大家读书，', '窗外的风说："咕咕咕，咕咕咕。"', '小鸟说："叽叽叽，叽叽叽。"', '大家都说："风和小鸟也在念书呢！"'],
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

/* -------------------- 谚语（睿智萌可） -------------------- */
export interface ProverbItem {
  first: string;
  second: string;
  hint: string;
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

/* -------------------- 反义词（淘气萌可） -------------------- */
export interface AntonymItem {
  a: string;
  b: string;
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

/* -------------------- 量词（宝盒萌可） -------------------- */
export interface QuantifierItem {
  item: string;
  correct: string;
  options: string[];
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

/* -------------------- 谜语（好奇萌可） -------------------- */
export interface RiddleItem {
  riddle: string;
  answer: string;
  options: string[];
  hint: string;
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

/* -------------------- 安全小课堂（温柔萌可） -------------------- */
export interface SafetyItem {
  scenario: string;
  statement: string;
  isSafe: boolean;
  tip: string;
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

/* -------------------- 组词造句 -------------------- */
export interface WordFormItem {
  char: string;
  word: string;
  wrongWords: string[];
  sentenceOk: string;
  sentenceWrong: string[];
}

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

/* -------------------- 英文儿歌（唱唱萌可+甜心萌可） -------------------- */
export interface EnSong {
  title: string;
  emoji: string;
  lyrics: string[];
  cn: string;
  keywords: { en: string; cn: string }[];
}

export const EN_SONGS: EnSong[] = [
  {
    title: 'Twinkle Twinkle Little Star',
    emoji: '⭐',
    lyrics: ['Twinkle, twinkle, little star,', 'How I wonder what you are!', 'Up above the world so high,', 'Like a diamond in the sky.'],
    cn: '一闪一闪亮晶晶，满天都是小星星，挂在天上放光明，好像许多小眼睛。',
    keywords: [{ en: 'star', cn: '星星' }, { en: 'sky', cn: '天空' }, { en: 'diamond', cn: '钻石' }, { en: 'high', cn: '高高' }],
  },
  {
    title: 'Head, Shoulders, Knees and Toes',
    emoji: '🙆',
    lyrics: ['Head, shoulders, knees and toes,', 'Knees and toes, knees and toes.', 'Head, shoulders, knees and toes,', 'Eyes, ears, mouth and nose.'],
    cn: '头、肩膀、膝盖和脚趾，膝盖和脚趾。眼睛、耳朵、嘴巴和鼻子。',
    keywords: [{ en: 'head', cn: '头' }, { en: 'shoulders', cn: '肩膀' }, { en: 'knees', cn: '膝盖' }, { en: 'toes', cn: '脚趾' }, { en: 'eyes', cn: '眼睛' }, { en: 'nose', cn: '鼻子' }],
  },
  {
    title: 'Old MacDonald Had a Farm',
    emoji: '🚜',
    lyrics: ['Old MacDonald had a farm, E-I-E-I-O.', 'And on his farm he had a cow, E-I-E-I-O.', 'With a moo-moo here and a moo-moo there,', 'Here a moo, there a moo, everywhere a moo-moo.'],
    cn: '老麦克唐纳有个农场，咿呀咿呀哟。农场里有一头牛，哞哞叫。',
    keywords: [{ en: 'farm', cn: '农场' }, { en: 'cow', cn: '奶牛' }, { en: 'moo', cn: '哞' }],
  },
  {
    title: 'If You\'re Happy and You Know It',
    emoji: '😄',
    lyrics: ['If you\'re happy and you know it, clap your hands!', 'If you\'re happy and you know it, clap your hands!', 'If you\'re happy and you know it, and you really want to show it,', 'If you\'re happy and you know it, clap your hands!'],
    cn: '如果你开心，就拍拍手！想要告诉大家你开心，就拍拍手！',
    keywords: [{ en: 'happy', cn: '开心' }, { en: 'clap', cn: '拍手' }, { en: 'hands', cn: '手' }],
  },
  {
    title: 'The Wheels on the Bus',
    emoji: '🚌',
    lyrics: ['The wheels on the bus go round and round,', 'Round and round, round and round.', 'The wheels on the bus go round and round,', 'All through the town.'],
    cn: '巴士的轮子转呀转，转呀转，转呀转，穿过整个小镇。',
    keywords: [{ en: 'wheels', cn: '轮子' }, { en: 'bus', cn: '公交车' }, { en: 'round', cn: '圆圈' }, { en: 'town', cn: '小镇' }],
  },
  {
    title: 'The ABC Song',
    emoji: '🔤',
    lyrics: ['A B C D E F G,', 'H I J K L M N O P,', 'Q R S, T U V,', 'W X Y and Z.', 'Now I know my ABCs,', 'Next time won\'t you sing with me?'],
    cn: 'A 到 Z，26 个字母我都会，下次跟我一起唱吧！',
    keywords: [{ en: 'A B C', cn: '字母 A B C' }, { en: 'sing', cn: '唱歌' }],
  },
];