/**
 * 本文件由 study-data.ts 拆分而来（数据内容未改动，仅移动位置）。
 * 对外统一入口仍是 @/lib/study-data，见 src/lib/study-data.ts 的聚合 re-export。
 */

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

/* -------------------- 语文 · 课文（一课一贴练习册） -------------------- */
export interface TextbookText {
  title: string;
  author: string;
  type: string;
  lines: string[];
  analysis: string;
  keywords: { word: string; meaning: string }[];
  emoji: string;
}
export const TEXTBOOK_TEXTS: TextbookText[] = [
  {
    title: '鹅',
    author: '骆宾王',
    type: '古诗',
    lines: ['鹅，鹅，鹅，', '曲项向天歌。', '白毛浮绿水，', '红掌拨清波。'],
    analysis: '骆宾王小时候看到池塘里的白鹅，写了这首诗。鹅的脖子弯弯曲曲，对着天空唱歌。白色的羽毛浮在绿色的水面上，红色的脚掌拨动着清澈的波浪。',
    keywords: [
      { word: '曲', meaning: '弯曲' },
      { word: '项', meaning: '脖子' },
      { word: '拨', meaning: '划水、推动' },
      { word: '骆宾王', meaning: '唐朝诗人，"初唐四杰"之一' },
    ],
    emoji: '🦢',
  },
  {
    title: '画',
    author: '王维',
    type: '古诗',
    lines: ['远看山有色，', '近听水无声。', '春去花还在，', '人来鸟不惊。'],
    analysis: '从远处看，山是有颜色的；走近去听，却听不见流水的声音。春天过去了，花儿还在开着；人走近了，鸟儿也不会飞走。因为这是一幅画，画里的山有水有花有鸟，但它们都不会动。',
    keywords: [
      { word: '色', meaning: '颜色、色彩' },
      { word: '声', meaning: '声音、响声' },
      { word: '惊', meaning: '受惊、害怕' },
    ],
    emoji: '🖼️',
  },
];

/* -------------------- 语文 · 课文理解题（一课一贴练习册） -------------------- */
export interface TextComprehensionQ {
  textRef: string; // 引用 TEXTBOOK_TEXTS 的 title
  question: string;
  options: string[];
  answer: number; // 0-based
  explain: string;
  emoji: string;
}
export const TEXT_COMPREHENSION_QS: TextComprehensionQ[] = [
  // 《鹅》
  { textRef: '鹅', question: '《鹅》的作者是谁？', options: ['骆宾王', '王维', '李白', '杜甫'], answer: 0, explain: '骆宾王是唐朝诗人，"初唐四杰"之一', emoji: '🦢' },
  { textRef: '鹅', question: '鹅的羽毛是什么颜色？', options: ['黑色', '白色', '灰色', '彩色'], answer: 1, explain: '诗中"白毛浮绿水"，鹅的羽毛是白色的', emoji: '⚪' },
  { textRef: '鹅', question: '鹅的脚掌是什么颜色？', options: ['白色', '黄色', '红色', '黑色'], answer: 2, explain: '诗中"红掌拨清波"，鹅的脚掌是红色的', emoji: '🦆' },
  { textRef: '鹅', question: '"曲项向天歌"描写的是鹅的什么动作？', options: ['游水', '歪着脖子唱歌', '吃鱼', '睡觉'], answer: 1, explain: '曲项=弯着脖子，向天歌=对着天空唱歌', emoji: '🎵' },
  // 《画》
  { textRef: '画', question: '《画》的作者是谁？', options: ['骆宾王', '王维', '李白', '杜甫'], answer: 1, explain: '王维是唐朝诗人，画坛高手', emoji: '🖼️' },
  { textRef: '画', question: '"远看山有色"是什么意思？', options: ['山很远', '从远处看，山是有颜色的', '山没有颜色', '山很大'], answer: 1, explain: '从远处看，山是有颜色的', emoji: '⛰️' },
  { textRef: '画', question: '"近听水无声"说明这是什么？', options: ['真的水', '画中的水', '假的水', '没有水'], answer: 1, explain: '画中的水不会发出声音', emoji: '💧' },
  { textRef: '画', question: '"春去花还在"说明这是什么？', options: ['真的花', '画中的花', '假的花', '没有花'], answer: 1, explain: '画中的花春天过去了还在开', emoji: '🌸' },
  { textRef: '画', question: '"人来鸟不惊"说明这是什么？', options: ['真的鸟', '画中的鸟', '假の鸟', '没有鸟'], answer: 1, explain: '画中的鸟不会飞走', emoji: '🐦' },
  // 通用
  { textRef: '鹅', question: '这首诗描写的是什么季节？', options: ['春天', '夏天', '秋天', '冬天'], answer: 1, explain: '鹅在绿水中游，是夏天', emoji: '☀️' },
  { textRef: '画', question: '这首诗写的是一幅什么？', options: ['照片', '画', '雕塑', '视频'], answer: 1, explain: '整首诗描写的是一幅画', emoji: '🎨' },
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
