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
  /** 一个典型示例 */
  example: {
    problem: string;
    solution: string[];
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
