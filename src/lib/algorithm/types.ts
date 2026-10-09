/**
 * 萌可算法 - 计算技巧思维训练
 * 专注「方法理解」而非「纯计算」，通过分步填写让孩子掌握算理
 */

/** 运算符 */
export type Operator = '+' | '-' | '×' | '÷';

/** 难度等级（1=入门, 2=进阶, 3=挑战） */
export type Difficulty = 1 | 2 | 3;

/** 算法题目（分步填写） */
export interface AlgorithmQuestion {
  /** 唯一 ID */
  id: string;
  /** 所属主题 ID */
  topicId: string;
  /** 题目展示文本（如 "9 + 5 = ?"） */
  prompt: string;
  /** 数字列表（用于竖式渲染） */
  digits: number[];
  /** 运算符 */
  operator: Operator;
  /** 最终答案 */
  answer: number;
  /** 分步填写字段（按顺序展示） */
  stepFields: StepField[];
  /** 知识点/原理解释（答对后展示） */
  explain: string;
  /** 口诀提示（如果有） */
  mantra?: string;
  /** 题图数据（可选，用于实物图展示） */
  visualAid?: VisualAid;
}

/** 分步填写字段 */
export interface StepField {
  /** 步骤唯一 ID */
  id: string;
  /** 步骤标题（如「第一步：把 5 拆成 1 和 4」） */
  title: string;
  /** 步骤详细描述（为什么这样做） */
  description: string;
  /** 该步骤需要填写的输入框 */
  inputs: StepInput[];
  /** 当前步骤的展示文本（如「9 + 1 = 10」） */
  display: string;
  /** 当前步骤的提示（如果填写错误） */
  hint: string;
}

/** 步骤输入框 */
export interface StepInput {
  /** 输入框唯一 ID */
  id: string;
  /** 输入框前的文本（如 "5 = 1 + "） */
  prefix?: string;
  /** 输入框后的文本 */
  suffix?: string;
  /** 正确答案 */
  expectedValue: number;
  /** 该输入框显示的位数 */
  digitCount?: number;
  /** 输入框描述（placeholder） */
  placeholder?: string;
}

/** 实物图数据（用于凑十法/破十法的可视化） */
export interface VisualAid {
  /** 图示类型 */
  type: 'dots' | 'blocks' | 'number-line';
  /** 第一组数量 */
  groupA: number;
  /** 第二组数量 */
  groupB: number;
  /** 是否需要高亮「凑十」的部分 */
  highlightTen?: boolean;
}

// ============================================================================
// 例题「分幕思维可视化」（每个速算技巧配课本标准图示）
// ============================================================================

/** 例题互动小提问：点选 tiles，答对才解锁本幕动画与下一步 */
export interface ExampleQuiz {
  /** 提问文本 */
  prompt: string;
  /** 选项（数字直接写字符串，如 ['1', '2']；符号类可写 ['+ 18', '− 18']） */
  options: string[];
  /** 正确选项（必须与 options 中一项完全相等） */
  answer: string;
  /** 答对后的夸奖语 */
  praise?: string;
}

/** 每一幕的图形定义 —— 与教学呈现一一对应 */
export type ExampleVisual =
  /** 十格阵：两排格子，从 b 里搬豆子把 a 凑成 10（凑十法） */
  | { kind: 'ten-frame'; a: number; b: number }
  /** 课本标准「弧线分解图」：b 拆成 1 和几，弧线连回大数（凑十法总结） */
  | { kind: 'arc-split'; a: number; b: number }
  /** 拆数树：whole 拆成两个部分（破十/平十的第一步） */
  | { kind: 'number-bond'; whole: number; parts: [number, number] }
  /** 点点图：total 个豆子划掉 take 个，数剩下的（破十法 10−几） */
  | { kind: 'dot-take'; total: number; take: number }
  /** 数轴连减：from 出发，按 jumps 逐段往回跳（平十法） */
  | { kind: 'number-line'; from: number; jumps: number[] }
  /** 交换位置：两张数字卡带着 ⇄ 箭头对调（交换律） */
  | { kind: 'swap-pair'; a: number; b: number }
  /** 好朋友抱团：三数中两个好朋友隔空拥抱 / 添上括号抱在一起（结合律/添括号） */
  | {
      kind: 'brace-group';
      nums: [number, number, number];
      group: [number, number];
      mode: 'heart' | 'bracket';
    }
  /** 开括号：tokens 变换，flip=减号前要变号 / flip=false 加号前不变号（去括号） */
  | { kind: 'paren-flip'; before: string[]; after: string[]; flip: boolean }
  /** 好朋友数凑百：十位找十位、个位找个位（凑整法） */
  | { kind: 'hundred-pair'; a: number; b: number }
  /** 带符号搬家：每个数背着符号小背包换位置（混合运算） */
  | { kind: 'sign-move'; tokens: { sign: '+' | '-'; n: number }[]; moveFrom: number }
  /** 计算过程条：算式 chips 逐个亮起（各主题的纯计算步骤） */
  | { kind: 'calc-strip'; steps: string[] };

/** 例题的一幕 */
export interface ExampleScene {
  /** 萌可教练的引导语 */
  caption: string;
  /** 本幕图示 */
  visual: ExampleVisual;
  /** 互动小提问（答对才播放本幕动画、解锁下一步） */
  quiz?: ExampleQuiz;
  /** 已完成幕的紧凑回顾文本（如「9 + 1 = 10」） */
  key?: string;
  /** 是否总结幕（思维图 + 口诀 + 去练习） */
  summary?: boolean;
  /** 总结幕的算式流程（如 ['9 + 1 = 10', '10 + 4 = 14']） */
  flow?: string[];
  /** 总结幕的最终答案 */
  answer?: number;
}

/** 算法技巧主题 */
export interface AlgorithmTopic {
  /** 主题唯一 ID（如 'making-ten'） */
  id: string;
  /** 主题名称（如「凑十法」） */
  name: string;
  /** 主题描述 */
  description: string;
  /** 口诀/法则（用于最后的总结卡片） */
  mantra: string;
  /** 口诀的 emoji */
  mantraEmoji: string;
  /** 绑定的萌可角色 */
  moko: {
    name: string;
    img: string;
    emoji: string;
    color: string;
    line: string;
  };
  /** 原理说明（为什么要这样做） */
  principle: string;
  /** 关键应用点（什么时候用这个方法） */
  keyPoints: string[];
  /** 识别信号：什么时候该想到用这个方法（比步骤更可迁移） */
  signals: string[];
  /** 常见错误：孩子最容易踩的坑 */
  pitfalls: string[];
  /** 一个典型示例：题目 + 分幕思维可视化演示 */
  example: {
    /** 题目文本（如 "9 + 5 = ?"） */
    problem: string;
    /** 分幕演示：每幕一张专为此技巧设计的图示 */
    scenes: ExampleScene[];
  };
  /** 该主题下的所有练习题 */
  questions: AlgorithmQuestion[];
}

/** 【萌可算法】练习专题（一关10题） */
export interface PracticeSet {
  /** 专题唯一 ID */
  id: string;
  /** 专题标题（如「练习一：9 加几」） */
  title: string;
  /** 专题使用的技巧 */
  topicId: string;
  /** 主题下的题目列表 */
  questions: AlgorithmQuestion[];
  /** 完成后获得的星星数 */
  starReward: number;
}

/** 总体进度 */
export interface AlgorithmProgress {
  /** 各主题完成度（topicId -> 已完成题数） */
  byTopic: Record<string, number>;
  /** 已掌握的口诀数 */
  mantrasLearned: string[];
  /** 总正确数 */
  totalCorrect: number;
}
