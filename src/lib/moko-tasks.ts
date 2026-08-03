/**
 * 萌可小任务定义（前后端共用）。
 *
 * 关键设计：每条任务都绑定一个「完成凭证」——
 *  - module：对应学习模块至少拿到 1 颗星（写在 module_progress 表）
 *  - game  ：对应小游戏当天完成过一次（写在 completions 表，source = 游戏 id）
 * 只有拿到凭证，孩子端的「完成啦 ✓」按钮才会解锁，避免不学习直接点完成。
 */
export interface MokoTaskDef {
  key: string;
  emoji: string;
  name: string;
  want: string;
  href: string;
  doneLine: string;
  /** 解锁条件（二选一） */
  req: { module?: { subject: string; key: string }; game?: string };
  /** 未解锁时给孩子看的提示 */
  lockHint: string;
}

export const MOKO_TASKS: MokoTaskDef[] = [
  {
    key: 'apple',
    emoji: '🍎',
    name: '苹果萌可',
    want: '想吃 3 个苹果！去「古诗诵读」读一首诗喂饱我～',
    href: '/study/chinese/poems',
    doneLine: '咕噜～苹果好甜，谢谢你程程！',
    req: { module: { subject: 'chinese', key: 'poems' } },
    lockHint: '先去「古诗诵读」拿到 1 颗星，才能喂苹果哦',
  },
  {
    key: 'book',
    emoji: '📚',
    name: '书本萌可',
    want: '想听好故事！去「连词成句」造几句话吧～',
    href: '/study/chinese/sentence',
    doneLine: '你说的话真通顺，我学会啦！',
    req: { module: { subject: 'chinese', key: 'sentence' } },
    lockHint: '先去「连词成句」拿到 1 颗星，才能讲故事哦',
  },
  {
    key: 'num',
    emoji: '🔢',
    name: '数字萌可',
    want: '数字宝宝走丢啦！去玩一会儿「计算挑战」帮它们回家～',
    href: '/games/math-challenge',
    doneLine: '呼～数字都回家了，你真厉害！',
    req: { game: 'math-challenge' },
    lockHint: '先完整玩一局「计算挑战」，数字宝宝才会回家哦',
  },
  {
    key: 'tree',
    emoji: '🌳',
    name: '乘法萌可',
    want: '口诀树要浇水！去背几句「乘法口诀」吧～',
    href: '/study/math/mult-table',
    doneLine: '咕咚～口诀树发芽啦！',
    req: { module: { subject: 'math', key: 'mult-table' } },
    lockHint: '先去「乘法口诀树」拿到 1 颗星，才能浇水哦',
  },
];
