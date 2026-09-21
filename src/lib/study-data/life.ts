/**
 * 本文件由 study-data.ts 拆分而来（数据内容未改动，仅移动位置）。
 * 对外统一入口仍是 @/lib/study-data，见 src/lib/study-data.ts 的聚合 re-export。
 */

/* -------------------- 生活 · 整理书包（上学准备） -------------------- */
export interface SchoolItem {
  name: string;
  emoji: string;
  bring: boolean; // true=要带去学校
}
export const SCHOOL_ITEMS: SchoolItem[] = [
  { name: '语文书', emoji: '📕', bring: true },
  { name: '数学书', emoji: '📗', bring: true },
  { name: '铅笔', emoji: '✏️', bring: true },
  { name: '尺子', emoji: '📏', bring: true },
  { name: '水杯', emoji: '🥤', bring: true },
  { name: '作业本', emoji: '📓', bring: true },
  { name: '书包', emoji: '🎒', bring: true },
  { name: '玩具车', emoji: '🚗', bring: false },
  { name: '平板', emoji: '💻', bring: false },
  { name: '零食', emoji: '🍪', bring: false },
  { name: '洋娃娃', emoji: '🧸', bring: false },
  { name: '游戏机', emoji: '🎮', bring: false },
];

/* ============================== 【2025 练习册扩充】 ============================== */

/* -------------------- 语文 · 我的一天（时间线） -------------------- */
export interface MyDayItem {
  time: string;
  emoji: string;
  text: string; // 用「时间 + 动作」的口吻，便于点读
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

/* ============================================================
 * 人教版（部编版）小学一年级上册 · 生字表（按单元对齐课本）
 * ------------------------------------------------------------
 * 对应 public/textbooks/chapters/chinese 的章节顺序（见 textbooks.ts），
 * 收录各单元「会认字」与可听写的「词语」，供家长「按单元一键布置听写」
 * 以及识字模块对齐使用。字序参考义务教育教科书识字表。
 * ============================================================ */

/* -------------------- 综合 · 温柔萌可的安全小课堂 -------------------- */
export interface SafetyItem {
  scenario: string; // 情景
  statement: string; // 说法/做法（让孩子判断对错）
  isSafe: boolean; // 是否正确/安全
  tip: string; // 温柔萌可的小提示
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
