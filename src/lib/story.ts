import { mokoCollection, mokoCollectionByName } from './moko-collection';
import type { MokoChar } from './types';

/** 单个剧情章节（捕捉一只萌可） */
export interface StoryChapter {
  id: string;
  title: string;
  mokoName: string; // 必须存在于 mokoCollection 的真实萌可名字
  mokoKey?: string; // 直接关联图鉴萌可 key（优先于 mokoName 解析，避免重名/改名失效）
  emoji: string;
  gradient: string; // tailwind 渐变类，用于卡片主题色
  scene: string; // 副标题 / 场景
  /** 先完成对应学习模块（≥1 星）才解锁本集剧情；不设置则默认只受线性推进解锁 */
  module?: StoryChapterModuleReq;
  paragraphs: string[]; // 剧情文字（适合一年级孩子）
  tip?: string; // 给程程的小提示
  quiz?: StoryQuiz; // 读完故事后的小问题（答对才能捕捉萌可）
}

/** 读完故事后的小互动题：4 选 1，answer 为正确选项下标 */
export interface StoryQuiz {
  q: string;
  options: string[];
  answer: number;
  /** 题目类型：用于前端展示不同交互/难度标识 */
  type?: 'recall' | 'math' | 'logic' | 'chinese' | 'english' | 'identify';
}

/** 解锁条件：先完成某学习模块（拿到 ≥1 星）才能读/捕捉这一集。不设置则默认只受线性推进解锁。 */
export interface StoryChapterModuleReq {
  subject: string; // chinese / math / english
  key: string; // study-modules.ts 里的模块 key
}

/* ------------------------------------------------------------------ *
 * 系列（分类）相关的文案/配色，用于「图鉴远征」自动生成的章节
 * ------------------------------------------------------------------ */
const CAT_LABEL: Record<string, string> = {
  royal: '皇室萌可',
  mo: '魔方萌可',
  key: '钥匙萌可',
  jewel: '闪亮宝石萌可',
  sweetie: '魔法甜心萌可',
  star: '闪耀流星萌可',
  princess: '闪亮公主萌可',
  prince: '王子萌可',
  villain: '反派萌可',
  legend: '传奇萌可',
  guide: '引导萌可',
  trouble: '捣蛋萌可',
};

const CAT_GRADIENT: Record<string, string> = {
  royal: 'from-moko-pink to-moko-rose',
  mo: 'from-moko-cyan to-moko-blue',
  key: 'from-moko-violet to-moko-purple',
  jewel: 'from-moko-purple to-moko-violet',
  sweetie: 'from-moko-pink to-moko-rose',
  star: 'from-moko-cyan to-moko-blue',
  princess: 'from-moko-gold to-moko-yellow',
  prince: 'from-moko-blue to-moko-cyan',
  villain: 'from-slate-500 to-slate-600',
  legend: 'from-moko-gold to-moko-yellow',
  guide: 'from-moko-rose to-moko-pink',
  trouble: 'from-slate-600 to-slate-700',
};

/** 该系列萌可陪程程一起做什么（融进剧情第 2 段） */
const CAT_THEME: Record<string, string> = {
  royal: '认字读诗',
  mo: '魔法变身',
  key: '解开知识谜题',
  jewel: '数数宝石',
  sweetie: '甜甜地复习',
  star: '看星星许愿',
  princess: '优雅地起舞',
  prince: '守护伙伴',
  villain: '把调皮鬼送回家',
  legend: '见证奇迹',
  guide: '领航探险',
  trouble: '把小淘气哄好',
};

/** 给程程的小提示（第 3 段） */
const CAT_TIP: Record<string, string> = {
  royal: '皇室萌可最讲礼貌，见到字宝宝要问好哦～',
  mo: '魔方萌可会变魔术，变出满满的学习劲头！',
  key: '钥匙萌可说：每一个「为什么」都是一把小钥匙。',
  jewel: '宝石越数越亮，数学也越练越棒！',
  sweetie: '学累了就来甜甜圈工厂歇一歇～',
  star: '对着流星许个愿，然后一步一步去实现它。',
  princess: '像小公主一样优雅，写字也漂漂亮亮。',
  prince: '王子的剑守护大家，勇气也会保护你。',
  villain: '调皮鬼只是想玩，陪它玩完就送它回家吧。',
  legend: '传说中的萌可，会带来意想不到的幸运！',
  guide: '乐美公主的爱心魔杖，永远为你领航。',
  trouble: '小淘气最爱恶作剧，温柔对它就好啦。',
};

/** 每系列的备选标题，按下标取，制造一点变化 */
const CAT_TITLE: Record<string, string[]> = {
  royal: ['皇宫新朋友', '皇室小客人', '城堡来客'],
  mo: ['魔方奇遇', '奇妙的一天', '魔法变身记'],
  key: ['钥匙秘境', '知识宝盒', '解谜小能手'],
  jewel: ['宝石矿洞', '闪亮一刻', '宝藏探险'],
  sweetie: ['甜甜圈工厂', '糖果派对', '甜蜜时光'],
  star: ['流星之夜', '星星许愿', '天文冒险'],
  princess: ['公主的下午', '闪亮加冕', '优雅舞会'],
  prince: ['王子的守护', '骑士精神', '勇敢出击'],
  villain: ['调皮鬼来了', '捣蛋大作战', '送它回家'],
  legend: ['传说降临', '奇迹时刻', '传奇故事'],
  guide: ['领航时刻', '乐美同行'],
  trouble: ['小淘气', '恶作剧风波'],
};

/* ------------------------------------------------------------------ *
 * 9 集「主线剧情」——保留原文案与 id，向后兼容已写入 story_progress 的记录
 * ------------------------------------------------------------------ */
const HERO_CHAPTERS: StoryChapter[] = [
  {
    id: 'ch1-love',
    title: '初遇萌可王国',
    mokoName: '爱心萌可',
    mokoKey: 'col_01_爱心萌可_render',
    emoji: '💗',
    gradient: 'from-moko-pink to-moko-rose',
    scene: '第一集 · 皇室萌可',
    module: { subject: 'chinese', key: 'characters' },
    paragraphs: [
      '程程推开一扇闪闪发光的门，来到了神奇的萌可王国。',
      '一朵粉色的小云飘过来，原来是爱心萌可！她举着爱心镜子说：「啾~ 欢迎你，我们一起用爱心光波，认字读诗吧！」',
      '爱心萌可把镜子轻轻一照，程程就学会了好多好多的字。',
    ],
    tip: '语文里藏着好多字宝宝，和爱心萌可一起去找它们吧！',
    quiz: {
      q: '爱心萌可用什么本领，帮程程认字读书呀？',
      options: ['爱心光波', '勇气相机', '甜心铃铛', '万能钥匙'],
      answer: 0,
      type: 'recall',
    },
  },
  {
    id: 'ch2-courage',
    title: '勇气数学大冒险',
    mokoName: '正正萌可',
    mokoKey: 'col_01_正正萌可_render',
    emoji: '💪',
    gradient: 'from-moko-blue to-moko-cyan',
    scene: '第二集 · 皇室萌可',
    module: { subject: 'math', key: 'count' },
    paragraphs: [
      '爱心萌可带着程程来到一片数字森林，正正萌可正举着勇气相机等大家。',
      '「哈哈，无所畏惧！」正正萌可说，「加加减减一点都不可怕，我们一起把数字打败！」',
      '程程跟着正正萌可数呀算呀，越来越勇敢了。',
    ],
    tip: '数学就像闯关游戏，算对一步就前进一格！',
    quiz: {
      q: '程程在数字森林里看见 3 棵苹果树，每棵树上有 4 个苹果。正正萌可问：一共有几个苹果？',
      options: ['7', '12', '9', '10'],
      answer: 1,
      type: 'math',
    },
  },
  {
    id: 'ch3-sing',
    title: '唱唱的英语歌',
    mokoName: '唱唱萌可',
    mokoKey: 'col_01_唱唱萌可_render',
    emoji: '🎵',
    gradient: 'from-moko-yellow to-moko-gold',
    scene: '第三集 · 皇室萌可',
    module: { subject: 'english', key: 'letters' },
    paragraphs: [
      '森林尽头的舞台上，唱唱萌可摇着甜心铃铛唱起了歌。',
      '「啦啦啦，唱给世界听！」唱唱萌可用歌声教程程念出了一个个英文字母和单词。',
      '程程跟着哼唱，发现英语原来这么好听。',
    ],
    tip: '把单词唱成歌，记起来就轻松多啦！',
    quiz: {
      q: '唱唱萌可教程程的单词 "apple" 里，第一个字母发什么音？',
      options: ['/æ/ (啊)', '/e/ (额)', '/i/ (依)', '/o/ (哦)'],
      answer: 0,
      type: 'english',
    },
  },
  {
    id: 'ch4-mermaid',
    title: '钥匙秘境的人鱼',
    mokoName: '人鱼萌可',
    mokoKey: 'col_04_人鱼萌可_render',
    emoji: '🧜',
    gradient: 'from-moko-violet to-moko-purple',
    scene: '第四集 · 钥匙萌可',
    paragraphs: [
      '前方出现一座发光的水下秘境，钥匙萌可把万能钥匙交给了程程。',
      '人鱼萌可在水里转了个圈：「想知道宝盒里的秘密？先解开知识谜题吧！」',
      '程程用钥匙打开了一扇扇门，学到了好多新知识。',
    ],
    tip: '每一个「为什么」，都是一把打开知识的小钥匙。',
    quiz: {
      q: '人鱼萌可守护的宝盒有 3 把锁，每把锁需要 2 把钥匙才能打开。程程一共需要几把钥匙？',
      options: ['5', '6', '4', '3'],
      answer: 1,
      type: 'math',
    },
  },
  {
    id: 'ch5-share',
    title: '宝石矿洞的分享',
    mokoName: '分享萌可',
    mokoKey: 'col_03_分享萌可_render',
    emoji: '💎',
    gradient: 'from-moko-purple to-moko-violet',
    scene: '第五集 · 闪亮宝石萌可',
    paragraphs: [
      '萌可王国深处是亮晶晶的宝石矿洞，分享萌可捧着一颗闪亮宝石迎接程程。',
      '「分享最快乐啦！」分享萌可把宝石分成两半，一半给程程，一半留给朋友。',
      '程程明白了，好的东西要和别人一起分享才更闪亮。',
    ],
    tip: '会分享的小朋友，身边总有许多好朋友。',
    quiz: {
      q: '分享萌可有 8 颗宝石，她想平均分给 4 个朋友，每个朋友能分到几颗？',
      options: ['1', '2', '3', '4'],
      answer: 1,
      type: 'math',
    },
  },
  {
    id: 'ch6-cotton',
    title: '甜甜圈工厂',
    mokoName: '棉花糖萌可',
    mokoKey: 'col_05_棉花糖萌可_render',
    emoji: '🍬',
    gradient: 'from-moko-pink to-moko-rose',
    scene: '第六集 · 魔法甜心萌可',
    paragraphs: [
      '一阵甜甜的香味飘来，棉花糖萌可在甜甜圈工厂门口招手。',
      '「软软的，甜甜的！」她递给程程一个棉花糖，「吃点点心，再继续学习也不迟哦。」',
      '程程在甜甜的梦里，把学过的字和数都复习了一遍。',
    ],
    tip: '学累了就休息一下，像棉花糖一样软软地放松～',
    quiz: {
      q: '棉花糖萌可做了 15 个棉花糖，送给程程 6 个，又送给朋友 4 个，自己还剩几个？',
      options: ['5', '6', '7', '4'],
      answer: 0,
      type: 'math',
    },
  },
  {
    id: 'ch7-kiss',
    title: '流星之夜',
    mokoName: '亲亲萌可',
    mokoKey: 'col_06_亲亲萌可_render',
    emoji: '☄️',
    gradient: 'from-moko-cyan to-moko-blue',
    scene: '第七集 · 闪耀流星萌可',
    paragraphs: [
      '夜晚降临，亲亲萌可指着天空：「快看，流星来啦！」',
      '一颗流星划过，亲亲萌可说：「快许个愿吧——认真学习的愿望，一定会实现！」',
      '程程闭上眼睛许愿：希望明天也能和萌可们一起学习。',
    ],
    tip: '对着流星许个愿，然后一步一步去实现它。',
    quiz: {
      q: '亲亲萌可和程程一起看流星，看见 3 颗流星，每颗流星许 1 个愿，一共许了几个愿？',
      options: ['2', '3', '4', '5'],
      answer: 1,
      type: 'math',
    },
  },
  {
    id: 'ch8-moon',
    title: '月光公主',
    mokoName: '月光萌可',
    mokoKey: 'col_01_月光萌可_render',
    emoji: '🌙',
    gradient: 'from-moko-violet to-moko-blue',
    scene: '第八集 · 皇室萌可',
    paragraphs: [
      '月光洒在城堡的尖顶上，月光萌可戴着月光皇冠出现了。',
      '「月光之下，数到一百！」她拉着程程的手，一起数着天上的小星星。',
      '数着数着，程程觉得夜晚也变得温柔又安心。',
    ],
    tip: '睡不着的时候，就和月光萌可一起数星星吧。',
    quiz: {
      q: '月光萌可和程程数星星，先数了 27 颗，又数了 38 颗，一共数了几颗？',
      options: ['55', '65', '54', '66'],
      answer: 1,
      type: 'math',
    },
  },
  {
    id: 'ch9-lucky',
    title: '传奇的约定',
    mokoName: '幸运萌可',
    mokoKey: 'col_10_幸运萌可_render',
    emoji: '🍀',
    gradient: 'from-moko-gold to-moko-yellow',
    scene: '第九集 · 传奇萌可',
    paragraphs: [
      '故事的尽头，一道幸运的金光落下，幸运萌可笑眯眯地出现。',
      '「你一路勇敢地学到了这里，真了不起！」幸运萌可把四叶草递给程程，「这是我们的约定——以后也要天天和萌可一起学习哦。」',
      '程程把四叶草收好，萌可王国响起了庆祝的歌声。',
    ],
    tip: '你已经捕捉了好多萌可！打开图鉴，看看谁在等你回家～',
    quiz: {
      q: '幸运萌可送程程一株四叶草，四叶草有 4 片叶子。如果有 5 株这样的四叶草，一共有几片叶子？',
      options: ['15', '20', '25', '10'],
      answer: 1,
      type: 'math',
    },
  },
];

/** 主线登场的核心萌可名字（其余图鉴萌可自动生成「图鉴远征」章节） */
const HERO_NAMES = new Set(HERO_CHAPTERS.map((c) => c.mokoName));

// 主线 9 集的题做确定性洗牌，让正确选项位置每次都不同（但仍可答对）
const HERO_CHAPTERS_Q = HERO_CHAPTERS.map((c) =>
  c.quiz ? { ...c, quiz: shuffleQuiz(c.quiz, c.id) } : c,
);

/* ------------------------------------------------------------------ *
 * 「图鉴远征」——把图鉴里其余的萌可都做进剧情
 * 每份图鉴萌可自动生成一集，按系列顺序排列，捕捉它即可入驻城堡。
 * 这样「看完所有剧情」=「集齐整个图鉴」。
 * ------------------------------------------------------------------ */

// 确定性洗牌：用章节 key 当种子，保证服务端校验与孩子端渲染的选项顺序完全一致
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = arr.slice();
  let s = seed >>> 0;
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 对题目选项做确定性洗牌，避免正确项总在 A（孩子会瞎猜第一个）；种子来自章节 id，保证服务端/客户端一致
function shuffleQuiz(q: StoryQuiz, seedStr: string): StoryQuiz {
  const opts = seededShuffle(q.options, hashStr(seedStr));
  return { q: q.q, options: opts, answer: opts.indexOf(q.options[q.answer]) };
}

// 给图鉴远征章节自动出一道题：根据分类生成不同类型的题目
function buildAutoQuiz(m: MokoChar): StoryQuiz {
  const pool = mokoCollection.map((x) => x.name).filter((n) => n !== m.name);
  const seed = hashStr(m.key);
  const distractors = seededShuffle(pool, seed).slice(0, 3);
  const options = seededShuffle([m.name, ...distractors], seed ^ 0x9e3779b9);

  // 根据分类生成不同类型的题目
  const cat = m.category;
  let q = '';
  let type: StoryQuiz['type'] = 'identify';

  if (cat === 'royal') {
    // 皇室萌可：语文/记忆类
    const questions = [
      `这一集，程程遇到了哪只皇室萌可？`,
      `${m.name}的口癖是「${m.line.slice(0, m.line.indexOf('我'))}」，这只萌可是谁？`,
      `程程在皇室萌可的城堡里认识了新朋友，这位新朋友是？`,
    ];
    q = questions[seed % questions.length];
    type = 'chinese';
  } else if (cat === 'mo') {
    // 魔方萌可：逻辑/数学应用题
    const a = (seed % 8) + 2; // 2-9
    const b = ((seed >> 4) % 6) + 2; // 2-7
    const questions = [
      `${m.name}带程程玩魔方，有 ${a} 层魔方，每层 ${b} 个小方块，一共 ${a * b} 个小方块。这只萌可是谁？`,
      `${m.name}说：「${m.line}」程程和它一起变魔术，这只萌可是？`,
      `魔方萌可家族有 ${a + b} 只，其中 ${m.name} 最擅长 ${a > b ? '变身' : '解谜'}。遇到的是谁？`,
    ];
    q = questions[seed % questions.length];
    type = 'math';
  } else if (cat === 'key') {
    // 钥匙萌可：解谜/英语
    const questions = [
      `${m.name}守护着知识宝盒，它说：「${m.line}」这只钥匙萌可是？`,
      `程程需要 ${(seed % 3) + 2} 把钥匙才能打开 ${m.name} 守护的门，这只萌可是谁？`,
      `钥匙萌可 ${m.name} 最喜欢说：「${m.line.slice(0, 8)}...」遇到的是？`,
    ];
    q = questions[seed % questions.length];
    type = 'logic';
  } else if (cat === 'jewel') {
    // 宝石萌可：数数/数学
    const gems = (seed % 20) + 10;
    const friends = ((seed >> 3) % 4) + 2;
    const questions = [
      `${m.name}有 ${gems} 颗宝石，平均分给 ${friends} 个朋友，每人分 ${Math.floor(gems / friends)} 颗，剩 ${gems % friends} 颗。这只萌可是？`,
      `闪亮宝石矿洞里，${m.name} 数宝石最快！它说：「${m.line}」这是谁？`,
      `${m.name} 把 ${gems} 颗宝石分成 ${friends} 堆，这只宝石萌可是谁？`,
    ];
    q = questions[seed % questions.length];
    type = 'math';
  } else if (cat === 'sweetie') {
    // 甜心萌可：甜点计算/记忆
    const sweets = (seed % 15) + 5;
    const eaten = ((seed >> 2) % 5) + 1;
    const questions = [
      `${m.name}做了 ${sweets} 个甜点，程程吃了 ${eaten} 个，还剩 ${sweets - eaten} 个。这只甜心萌可是？`,
      `甜甜圈工厂里，${m.name} 说：「${m.line}」遇到的是哪只？`,
      `${m.name} 把 ${sweets} 颗糖果分成 ${eaten + 1} 份，这只萌可是谁？`,
    ];
    q = questions[seed % questions.length];
    type = 'math';
  } else if (cat === 'star') {
    // 星星萌可：天文/许愿/加减法
    const stars = (seed % 12) + 3;
    const wishes = ((seed >> 1) % 4) + 1;
    const questions = [
      `${m.name} 和程程数星星，看见 ${stars} 颗流星，每颗许 ${wishes} 个愿，共 ${stars * wishes} 个愿。这只萌可是？`,
      `流星划过夜空，${m.name} 说：「${m.line}」程程遇到的是哪只星星萌可？`,
      `${m.name} 守护 ${stars} 颗星星，这只闪耀流星萌可是谁？`,
    ];
    q = questions[seed % questions.length];
    type = 'math';
  } else if (cat === 'princess') {
    // 公主萌可：优雅/礼仪/记忆
    const questions = [
      `公主萌可 ${m.name} 优雅地跳舞，它说：「${m.line}」这是哪位小公主？`,
      `${m.name} 教程程礼仪：「${m.line.slice(0, 10)}...」遇到的是谁？`,
      `闪亮公主舞会上，${m.name} 最受欢迎，这只萌可是？`,
    ];
    q = questions[seed % questions.length];
    type = 'chinese';
  } else if (cat === 'prince') {
    // 王子萌可：守护/勇气/逻辑
    const guards = (seed % 5) + 3;
    const questions = [
      `${m.name} 守护着 ${guards} 位伙伴，它说：「${m.line}」这只王子萌可是？`,
      `王子萌可 ${m.name} 挥舞着剑，保护大家。它最常说：「${m.line.slice(0, 8)}...」是谁？`,
      `守护王国的 ${m.name}，带着 ${guards} 个勇士，遇到的是谁？`,
    ];
    q = questions[seed % questions.length];
    type = 'logic';
  } else if (cat === 'villain') {
    // 反派萌可：恶作剧/趣味
    const tricks = (seed % 6) + 2;
    const questions = [
      `调皮的 ${m.name} 搞了 ${tricks} 个恶作剧，它笑道：「${m.line}」这是谁？`,
      `${m.name} 说：「${m.line}」这只反派萌可是谁？`,
      `捣蛋萌可 ${m.name} 最爱恶作剧，程程遇到的是？`,
    ];
    q = questions[seed % questions.length];
    type = 'recall';
  } else if (cat === 'legend') {
    // 传奇萌可：奇迹/幸运/综合
    const luck = (seed % 10) + 1;
    const questions = [
      `传说中的 ${m.name} 带来 ${luck} 份幸运，它说：「${m.line}」这是谁？`,
      `${m.name} 降临时天空绽放烟花，它最爱说：「${m.line.slice(0, 10)}...」遇到的是？`,
      `幸运女神眷顾的 ${m.name}，程程终于见到它了！它是？`,
    ];
    q = questions[seed % questions.length];
    type = 'recall';
  } else {
    // 兜底：认萌可
    q = `这一集，程程遇到了哪只萌可？`;
    type = 'identify';
  }

  return { q, options, answer: options.indexOf(m.name), type };
}

function buildAutoChapter(m: MokoChar, idx: number): StoryChapter {
  const cat = m.category;
  const label = CAT_LABEL[cat] ?? '萌可';
  const titles = CAT_TITLE[cat] ?? ['奇遇'];
  const title = titles[idx % titles.length];
  const theme = CAT_THEME[cat] ?? '快乐学习';
  const rawTip = CAT_TIP[cat] ?? `和${m.name}做朋友，每天都有新惊喜～`;
  // 让 tip 带上萌可名字，每只萌可的 tip 不再一模一样
  const tip = `${m.name}说：${rawTip}`;
  return {
    id: m.key,
    title,
    mokoName: m.name,
    mokoKey: m.key,
    emoji: m.emoji,
    gradient: CAT_GRADIENT[cat] ?? 'from-moko-pink to-moko-rose',
    scene: `图鉴远征 · ${label}`,
    paragraphs: [
      `萌可王国又迎来了一位新朋友——${m.name}！`,
      `${m.name}笑眯眯地说：「${m.line}」程程跟着${m.name}一起${theme}，学到了不少新本领。`,
    ],
    tip,
    quiz: buildAutoQuiz(m),
  };
}

const autoChapters: StoryChapter[] = mokoCollection
  .filter((m) => !HERO_NAMES.has(m.name))
  .map((m, i) => buildAutoChapter(m, i));

/**
 * 萌可剧情：先走 9 集「主线」，再进入「图鉴远征」——
 * 按图鉴系列把其余萌可一只一只做进剧情，捕到上一只才会遇到下一只。
 * 把全部剧情走完，就等于集齐了整个图鉴。
 */
export const storyChapters: StoryChapter[] = [...HERO_CHAPTERS_Q, ...autoChapters];

/** 把章节里的萌可名字解析成数据集中真实的 key（用于写入 moko_owned） */
export function resolveChapterMokoKey(name: string): string | null {
  return mokoCollectionByName[name]?.key ?? null;
}

export function getChapter(id: string): StoryChapter | undefined {
  return storyChapters.find((c) => c.id === id);
}

export function getChapterIndex(id: string): number {
  return storyChapters.findIndex((c) => c.id === id);
}
