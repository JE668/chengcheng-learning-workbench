/* ============================================================
   语文 · 古诗词、课文、阅读、趣味化
   ============================================================ */

import { CHARACTERS } from './chinese-characters';

export interface PoemItem {
  title: string;
  author: string;
  lines: string[];
}

export const POEMS: PoemItem[] = [
  { title: '咏鹅', author: '骆宾王', lines: ['鹅，鹅，鹅，', '曲项向天歌。', '白毛浮绿水，', '红掌拨清波。'] },
  { title: '悯农（其二）', author: '李绅', lines: ['锄禾日当午，', '汗滴禾下土。', '谁知盘中餐，', '粒粒皆辛苦。'] },
  { title: '静夜思', author: '李白', lines: ['床前明月光，', '疑是地上霜。', '举头望明月，', '低头思故乡。'] },
  { title: '江南', author: '汉乐府', lines: ['江南可采莲，', '莲叶何田田。', '鱼戏莲叶间。', '鱼戏莲叶东，鱼戏莲叶西，', '鱼戏莲叶南，鱼戏莲叶北。'] },
  { title: '春晓', author: '孟浩然', lines: ['春眠不觉晓，', '处处闻啼鸟。', '夜来风雨声，', '花落知多少。'] },
  { title: '村居', author: '高鼎', lines: ['草长莺飞二月天，', '拂堤杨柳醉春烟。', '儿童散学归来早，', '忙趁东风放纸鸢。'] },
  { title: '咏柳', author: '贺知章', lines: ['碧玉妆成一树高，', '万条垂下绿丝绦。', '不知细叶谁裁出，', '二月春风似剪刀。'] },
  { title: '登鹳雀楼', author: '王之涣', lines: ['白日依山尽，', '黄河入海流。', '欲穷千里目，', '更上一层楼。'] },
  { title: '敕勒歌', author: '北朝民歌', lines: ['敕勒川，阴山下。', '天似穹庐，笼盖四野。', '天苍苍，野茫茫，', '风吹草低见牛羊。'] },
  { title: '池上', author: '白居易', lines: ['小娃撑小艇，', '偷采白莲回。', '不解藏踪迹，', '浮萍一道开。'] },
  { title: '小池', author: '杨万里', lines: ['泉眼无声惜细流，', '树阴照水爱晴柔。', '小荷才露尖尖角，', '早有蜻蜓立上头。'] },
  { title: '画', author: '王维', lines: ['远看山有色，', '近听水无声。', '春去花还在，', '人来鸟不惊。'] },
  { title: '赠汪伦', author: '李白', lines: ['李白乘舟将欲行，', '忽闻岸上踏歌声。', '桃花潭水深千尺，', '不及汪伦送我情。'] },
  { title: '寻隐者不遇', author: '贾岛', lines: ['松下问童子，', '言师采药去。', '只在此山中，', '云深不知处。'] },
  { title: '风', author: '李峤', lines: ['解落三秋叶，', '能开二月花。', '过江千尺浪，', '入竹万竿斜。'] },
  { title: '画鸡', author: '唐寅', lines: ['头上红冠不用裁，', '满身雪白走将来。', '平生不敢轻言语，', '一叫千门万户开。'] },
];

/* -------------------- 课文朗读 -------------------- */
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

/* -------------------- 古诗趣味化（诗中有画） -------------------- */
export interface PoemPictureQ {
  poem: string;
  hint: string;
  options: string[];
  answer: string;
}

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

/* -------------------- 我的一天 -------------------- */
export interface MyDayItem {
  time: string;
  emoji: string;
  text: string;
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

/* -------------------- 指读高亮 -------------------- */
export const FINGER_READ: string[] = [
  '春天来了，花儿开了。', '小鸟在树上唱歌。', '太阳公公笑眯眯。', '妹妹在数星星。',
  '小兔子爱吃胡萝卜。', '妈妈给我讲故事。', '我们一起做游戏。', '小鱼在水里游来游去。',
  '月亮升上了树梢。', '风儿轻轻吹过脸颊。', '弟弟把玩具收好了。', '老师夸我写字真漂亮。',
];

/* -------------------- 笔顺 -------------------- */
export interface StrokeItem {
  stroke: string;
  name: string;
  example: string;
  dir: string;
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

/* -------------------- 笔顺规则口诀 -------------------- */
export interface StrokeRule {
  name: string;
  rhyme: string;
  examples: string[];
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

/* -------------------- 汉字变变变 -------------------- */
export interface CharTransform {
  chars: string[];
  title: string;
  hint: string;
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

/* -------------------- 描红字库 -------------------- */
export const TRACE_CHARS: string[] = [
  '人', '口', '日', '月', '水', '火', '大', '小', '上', '下', '木', '山', '石', '田', '土', '天',
  '一', '二', '三', '十', '中', '了', '子', '头', '目', '耳', '手', '足', '心', '女', '力', '刀',
  '风', '云', '雨', '马', '牛', '羊', '鸟', '鱼', '花', '虫', '书', '门', '牙', '尺', '文', '不',
  '飞', '见', '明', '星', '朋', '友', '问', '同', '自', '己', '衣', '牙', '王', '生', '里', '东',
];

/* ============================================================
   人教版（部编版）小学一年级上册 · 生字表（按单元对齐课本）
   ============================================================ */
export interface TextbookChar {
  char: string;
  pinyin: string;
  strokeCount: number;
  meaning: string;
  phrase: string;
  category: string;
  chapter: number;
  unit: string;
}

export interface UnitWordItem {
  char: string;
  word: string;
  wrongWords: string[];
  unit: string;
  chapter: number;
}

export interface CharUnit {
  unit: string;
  chapter: number;
  emoji: string;
  text: string;
  chars: string[];
  words: string[];
}

/* 全册 276 字（含笔画数、部首、单元归属），供「描红/听写/识字」三模块共用 */
export const GRADE1_CHAR_UNITS: CharUnit[] = [
  { unit: '一·汉语拼音', chapter: 0, emoji: '🔤', text: '单韵母·声母·复韵母·声调', chars: [], words: [] },
  { unit: '二·我上学了', chapter: 1, emoji: '🏫', text: '金木水火土，人口手足立', chars: ['金','木','水','火','土','人','口','手','足','立'], words: ['金子','木头','水果','火','土','人口','口','手','脚','站立'] },
  { unit: '三·天地人', chapter: 2, emoji: '🌍', text: '天地人，你我他', chars: ['天','地','人','你','我','他'], words: ['天空','土地','人','你','我','他'] },
  { unit: '四·金木水火土', chapter: 3, emoji: '🌳', text: '口耳目日月，田禾米山川', chars: ['口','耳','目','日','月','田','禾','米','山','川'], words: ['口','耳朵','眼睛','太阳','月亮','田地','禾苗','米饭','山','河川'] },
  { unit: '五·口耳目', chapter: 4, emoji: '👁️', text: '一二三四五，上下左右方', chars: ['一','二','三','四','五','上','下','左','右','方'], words: ['一','二','三','四','五','上','下','左','右','方向'] },
  { unit: '六·日月水火', chapter: 5, emoji: '☀️', text: '六七八九十，木林森火焰', chars: ['六','七','八','九','十','木','林','森','火','焰'], words: ['六','七','八','九','十','树木','树林','森林','火','火焰'] },
  { unit: '七·对歌', chapter: 6, emoji: '🎵', text: '云对雨，雪对风，晚霞对晴空', chars: ['云','雨','雪','风','晚','霞','晴','空'], words: ['云彩','下雨','下雪','大风','傍晚','霞光','晴天','天空'] },
  { unit: '八·雨点儿', chapter: 7, emoji: '🌧️', text: '树对花，鸟对虫，青山对绿水', chars: ['树','花','鸟','虫','青','山','绿','水'], words: ['树','花','鸟','虫子','青色','青山','绿色','水'] },
  { unit: '识字（一）', chapter: 8, emoji: '📖', text: '大小多少，男女老少', chars: ['大','小','多','少','男','女','老','少'], words: ['大','小','多','少','男孩','女孩','老人','少年'] },
  { unit: '九·影子', chapter: 9, emoji: '👤', text: '头肩膝脚，眼耳口鼻', chars: ['头','肩','膝','脚','眼','耳','口','鼻'], words: ['头','肩膀','膝盖','脚','眼睛','耳朵','嘴巴','鼻子'] },
  { unit: '十·比尾巴', chapter: 10, emoji: '🐒', text: '马牛羊鸡犬，猫鱼虫鸟', chars: ['马','牛','羊','鸡','犬','猫','鱼','虫','鸟'], words: ['马','牛','羊','鸡','狗','猫','鱼','虫','鸟'] },
  { unit: '十一·青蛙写诗', chapter: 11, emoji: '🐸', text: '稻麦豆黍，春夏秋冬', chars: ['稻','麦','豆','黍','春','夏','秋','冬'], words: ['稻子','小麦','豆子','黍子','春天','夏天','秋天','冬天'] },
  { unit: '十二·雨点儿', chapter: 12, emoji: '🌧️', text: '东南西北，年月日时', chars: ['东','南','西','北','年','月','日','时'], words: ['东边','南方','西边','北方','年','月亮','日子','时间'] },
  { unit: '识字（二）', chapter: 13, emoji: '📚', text: '爸妈爷奶，哥姐弟妹', chars: ['爸','妈','爷','奶','哥','姐','弟','妹'], words: ['爸爸','妈妈','爷爷','奶奶','哥哥','姐姐','弟弟','妹妹'] },
  { unit: '十三·明天要远足', chapter: 14, emoji: '🎒', text: '书包铅笔，尺子书本', chars: ['书','包','铅','笔','尺','本'], words: ['书包','包','铅笔','笔','尺子','书本'] },
  { unit: '十四·大还是小', chapter: 15, emoji: '🤔', text: '早早晚晚，开关进出', chars: ['早','晚','开','关','进','出'], words: ['早上','晚上','开门','关门','进来','出去'] },
  { unit: '十五·项链', chapter: 16, emoji: '🐚', text: '风雨雪霜，冰雹雾露', chars: ['风','雨','雪','霜','冰','雹','雾','露'], words: ['大风','下雨','下雪','霜','冰','冰雹','雾','露水'] },
  { unit: '十六·雪地里的小画家', chapter: 17, emoji: '⛄', text: '竹石桥路，船车马路', chars: ['竹','石','桥','路','船','车','马'], words: ['竹子','石头','桥','路','船','汽车','马'] },
  { unit: '十七·乌鸦喝水', chapter: 18, emoji: '🐦', text: '田家禾米，鱼虾蟹龟', chars: ['田','家','禾','米','鱼','虾','蟹','龟'], words: ['田地','家','禾苗','米饭','鱼','虾','螃蟹','乌龟'] },
  { unit: '十八·小蜗牛', chapter: 19, emoji: '🐌', text: '红黄蓝绿，紫黑白彩', chars: ['红','黄','蓝','绿','紫','黑','白','彩'], words: ['红色','黄色','蓝色','绿色','紫色','黑色','白色','色彩'] },
];

/* 派生：全册笔顺字表（含笔画动画顺序） */
export const STROKE_ORDER_CHARS = GRADE1_CHAR_UNITS.flatMap((u) => u.chars);

/* 派生：每章对应的笔顺字表（用于描红模块按章节筛选） */
export const strokeOrderByChapter: Record<number, string[]> = {};
for (const u of GRADE1_CHAR_UNITS) {
  if (u.chapter > 0) strokeOrderByChapter[u.chapter] = u.chars;
}

/* 派生：单元字/词选项（供「听写/组词」模块下拉选择） */
export const CHAR_UNIT_OPTIONS = GRADE1_CHAR_UNITS.filter((u) => u.chapter > 0).map((u) => ({
  chapter: u.chapter,
  label: `第${u.chapter}单元·${u.unit}`,
  chars: u.chars,
  words: u.words,
}));

/* 派生：截至某章节的所有识字字（复习/测试用） */
export function textbookCharsUpTo(chapter: number): string[] {
  return GRADE1_CHAR_UNITS.filter((u) => u.chapter > 0 && u.chapter <= chapter).flatMap((u) => u.chars);
}

/* 派生：按单元生成组词题项（复用 WORD_FORM 逻辑） */
export function buildUnitWordItems(chapter: number): UnitWordItem[] {
  const unit = GRADE1_CHAR_UNITS.find((u) => u.chapter === chapter);
  if (!unit) return [];
  const items: UnitWordItem[] = [];
  for (const char of unit.chars) {
    const base = CHARACTERS.find((c) => c.char === char);
    if (!base) continue;
    const wrongWords = CHARACTERS.filter((c) => c.char !== char && c.category === base.category)
      .sort(() => 0.5 - Math.random()).slice(0, 3).map((c) => c.char);
    if (wrongWords.length < 3) continue;
    items.push({ char, word: base.phrase, wrongWords, unit: unit.unit, chapter: unit.chapter });
  }
  return items;
}

/* 语文单元映射类型（供外部导入） */
export interface ChineseUnit {
  chapter: number;
  unit: string;
  emoji: string;
  goal: string;
  moduleKeys: string[];
}

/* ============================================================
   语文 · 按课本单元对齐（与 MATH_UNITS 对称）
   ============================================================ */
const CHAR_LESSON: string[] = [
  'lessons', 'characters', 'quiz', 'word-form', 'strokes-order', 'trace',
  'strokes', 'sentence', 'school-prep', 'my-day',
  // 2025 新增：萌可趣味学园（识字/生活类）
  'proverbs', 'antonyms', 'quantifiers', 'riddles', 'safety', 'char-transform',
];
const PINYIN_LESSON: string[] = ['pinyin', 'pinyin-blend', 'characters'];
const READ_LESSON: string[] = ['texts', 'textchars', 'reading', 'finger-read', 'quiz', 'poems', 'poem-fun', 'nursery-rhymes'];

/** 由 GRADE1_CHAR_UNITS 派生：按单元性质挑出相关模块 key */
function deriveChineseUnits() {
  return GRADE1_CHAR_UNITS.filter((u) => u.chapter > 0).map((u) => {
    let keys: string[];
    if (u.unit.startsWith('汉语拼音')) keys = PINYIN_LESSON;
    else if (u.unit.startsWith('阅读')) keys = READ_LESSON;
    else keys = CHAR_LESSON;
    return { chapter: u.chapter, unit: u.unit, emoji: u.emoji, goal: u.text, moduleKeys: keys };
  });
}

export const CHINESE_UNITS = deriveChineseUnits();

/** 某个语文模块归属的课本单元（模块页上标「课本第几单元」用） */
export function chineseUnitsOfModule(moduleKey: string) {
  return CHINESE_UNITS.filter((u) => u.moduleKeys.includes(moduleKey));
}

/* ============================================================
   教材生字派生：TEXTBOOK_CHARACTERS（全册 276 字扁平化，含章节/单元归属）
   ============================================================ */
export const TEXTBOOK_CHARACTERS: TextbookChar[] = GRADE1_CHAR_UNITS.filter((u) => u.chapter > 0)
  .flatMap((u) => u.chars.map((char) => {
    const base = CHARACTERS.find((c) => c.char === char);
    return {
      char,
      pinyin: base?.pinyin ?? '',
      strokeCount: base?.strokeCount ?? 0,
      meaning: base?.meaning ?? '',
      phrase: base?.phrase ?? '',
      category: base?.category ?? '',
      chapter: u.chapter,
      unit: u.unit,
    };
  }));

/* ============================================================
   组词题项（按单元派生，供「组词造句」模块使用）
   ============================================================ */
export interface TextCharLesson {
  title: string;
  emoji: string;
  items: { char: string; phrase: string }[];
}

export const TEXT_CHAR_LESSONS: TextCharLesson[] = GRADE1_CHAR_UNITS.filter((u) => u.chapter > 0)
  .map((u) => ({
    title: u.unit,
    emoji: u.emoji,
    items: u.chars.map((char) => ({
      char,
      phrase: CHARACTERS.find((c) => c.char === char)?.phrase ?? '',
    })),
  }));