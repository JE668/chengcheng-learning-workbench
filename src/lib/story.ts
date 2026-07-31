import { mokoCollectionByName } from './moko-collection';

/** 单个剧情章节（捕捉一只萌可） */
export interface StoryChapter {
  id: string;
  title: string;
  mokoName: string; // 必须存在于 mokoCollection 的真实萌可名字
  emoji: string;
  gradient: string; // tailwind 渐变类，用于卡片主题色
  scene: string; // 副标题 / 场景
  paragraphs: string[]; // 剧情文字（适合一年级孩子）
  tip?: string; // 给程程的小提示
}

/**
 * 萌可剧情：跟着乐美公主的领航故事，一集一集认识并捕捉萌可。
 * 章节顺序即解锁顺序——捕到上一只，才会遇到下一只。
 */
export const storyChapters: StoryChapter[] = [
  {
    id: 'ch1-love',
    title: '初遇萌可王国',
    mokoName: '爱心萌可',
    emoji: '💗',
    gradient: 'from-moko-pink to-moko-rose',
    scene: '第一集 · 皇室萌可',
    paragraphs: [
      '程程推开一扇闪闪发光的门，来到了神奇的萌可王国。',
      '一朵粉色的小云飘过来，原来是爱心萌可！她举着爱心镜子说：「啾~ 欢迎你，我们一起用爱心光波，认字读诗吧！」',
      '爱心萌可把镜子轻轻一照，程程就学会了好多好多的字。',
    ],
    tip: '语文里藏着好多字宝宝，和爱心萌可一起去找它们吧！',
  },
  {
    id: 'ch2-courage',
    title: '勇气数学大冒险',
    mokoName: '正正萌可',
    emoji: '💪',
    gradient: 'from-moko-blue to-moko-cyan',
    scene: '第二集 · 皇室萌可',
    paragraphs: [
      '爱心萌可带着程程来到一片数字森林，正正萌可正举着勇气相机等大家。',
      '「哈哈，无所畏惧！」正正萌可说，「加加减减一点都不可怕，我们一起把数字打败！」',
      '程程跟着正正萌可数呀算呀，越来越勇敢了。',
    ],
    tip: '数学就像闯关游戏，算对一步就前进一格！',
  },
  {
    id: 'ch3-sing',
    title: '唱唱的英语歌',
    mokoName: '唱唱萌可',
    emoji: '🎵',
    gradient: 'from-moko-yellow to-moko-gold',
    scene: '第三集 · 皇室萌可',
    paragraphs: [
      '森林尽头的舞台上，唱唱萌可摇着甜心铃铛唱起了歌。',
      '「啦啦啦，唱给世界听！」唱唱萌可用歌声教程程念出了一个个英文字母和单词。',
      '程程跟着哼唱，发现英语原来这么好听。',
    ],
    tip: '把单词唱成歌，记起来就轻松多啦！',
  },
  {
    id: 'ch4-mermaid',
    title: '钥匙秘境的人鱼',
    mokoName: '人鱼萌可',
    emoji: '🧜',
    gradient: 'from-moko-violet to-moko-purple',
    scene: '第四集 · 钥匙萌可',
    paragraphs: [
      '前方出现一座发光的水下秘境，钥匙萌可把万能钥匙交给了程程。',
      '人鱼萌可在水里转了个圈：「想知道宝盒里的秘密？先解开知识谜题吧！」',
      '程程用钥匙打开了一扇扇门，学到了好多新知识。',
    ],
    tip: '每一个「为什么」，都是一把打开知识的小钥匙。',
  },
  {
    id: 'ch5-share',
    title: '宝石矿洞的分享',
    mokoName: '分享萌可',
    emoji: '💎',
    gradient: 'from-moko-purple to-moko-violet',
    scene: '第五集 · 闪亮宝石萌可',
    paragraphs: [
      '萌可王国深处是亮晶晶的宝石矿洞，分享萌可捧着一颗闪亮宝石迎接程程。',
      '「分享最快乐啦！」分享萌可把宝石分成两半，一半给程程，一半留给朋友。',
      '程程明白了，好的东西要和别人一起分享才更闪亮。',
    ],
    tip: '会分享的小朋友，身边总有许多好朋友。',
  },
  {
    id: 'ch6-cotton',
    title: '甜甜圈工厂',
    mokoName: '棉花糖萌可',
    emoji: '🍬',
    gradient: 'from-moko-pink to-moko-rose',
    scene: '第六集 · 魔法甜心萌可',
    paragraphs: [
      '一阵甜甜的香味飘来，棉花糖萌可在甜甜圈工厂门口招手。',
      '「软软的，甜甜的！」她递给程程一个棉花糖，「吃点点心，再继续学习也不迟哦。」',
      '程程在甜甜的梦里，把学过的字和数都复习了一遍。',
    ],
    tip: '学累了就休息一下，像棉花糖一样软软地放松～',
  },
  {
    id: 'ch7-kiss',
    title: '流星之夜',
    mokoName: '亲亲萌可',
    emoji: '☄️',
    gradient: 'from-moko-cyan to-moko-blue',
    scene: '第七集 · 闪耀流星萌可',
    paragraphs: [
      '夜晚降临，亲亲萌可指着天空：「快看，流星来啦！」',
      '一颗流星划过，亲亲萌可说：「快许个愿吧——认真学习的愿望，一定会实现！」',
      '程程闭上眼睛许愿：希望明天也能和萌可们一起学习。',
    ],
    tip: '对着流星许个愿，然后一步一步去实现它。',
  },
  {
    id: 'ch8-moon',
    title: '月光公主',
    mokoName: '月光萌可',
    emoji: '🌙',
    gradient: 'from-moko-violet to-moko-blue',
    scene: '第八集 · 闪亮公主萌可',
    paragraphs: [
      '月光洒在城堡的尖顶上，月光萌可戴着月光皇冠出现了。',
      '「月光之下，数到一百！」她拉着程程的手，一起数着天上的小星星。',
      '数着数着，程程觉得夜晚也变得温柔又安心。',
    ],
    tip: '睡不着的时候，就和月光萌可一起数星星吧。',
  },
  {
    id: 'ch9-lucky',
    title: '传奇的约定',
    mokoName: '幸运萌可',
    emoji: '🍀',
    gradient: 'from-moko-gold to-moko-yellow',
    scene: '第九集 · 传奇萌可',
    paragraphs: [
      '故事的尽头，一道幸运的金光落下，幸运萌可笑眯眯地出现。',
      '「你一路勇敢地学到了这里，真了不起！」幸运萌可把四叶草递给程程，「这是我们的约定——以后也要天天和萌可一起学习哦。」',
      '程程把四叶草收好，萌可王国响起了庆祝的歌声。',
    ],
    tip: '你已经捕捉了好多萌可！打开图鉴，看看谁在等你回家～',
  },
];

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
