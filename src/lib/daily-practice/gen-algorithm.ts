/**
 * 算法题 → 每日一练题型转换
 * 将 AlgorithmQuestion 转换为 PracticeQuestion（kind='math'）格式
 */
import type { PracticeQuestion } from './types';
import type { AlgorithmQuestion } from '../algorithm/types';
import { ALGORITHM_TOPICS } from '../algorithm/topics';

/**
 * 将算法题转换为每日一练的简单选择题格式
 * 算法题本身是分步填空题，这里取最终答案作为题目
 */
export function genAlgorithmQ(algoQ: AlgorithmQuestion): PracticeQuestion {
  const topic = ALGORITHM_TOPICS.find((t) => t.id === algoQ.topicId);
  
  // 生成 4 个选项：正确答案 + 3 个干扰项
  const correct = algoQ.answer;
  const options = generateOptions(correct);
  const answerIdx = options.findIndex((o) => o === correct);
  
  return {
    id: `algo-${algoQ.id}`,
    kind: 'math',
    subject: '数学',
    prompt: `${algoQ.prompt}（${topic?.name ?? '算法题'}）`,
    options: options.map(String),
    answer: answerIdx,
    explain: algoQ.explain,
    emoji: topic?.mantraEmoji,
  };
}

/**
 * 生成 4 个选项（含正确答案）
 * 干扰项策略：正确答案 ±1, ±2, ±3
 */
function generateOptions(correct: number): number[] {
  const offsets = [-3, -2, -1, 1, 2, 3, -5, 5];
  const used = new Set<number>([correct]);
  const options = [correct];
  
  // 随机选 3 个干扰项
  const shuffledOffsets = offsets.sort(() => Math.random() - 0.5);
  for (const offset of shuffledOffsets) {
    if (options.length >= 4) break;
    const candidate = correct + offset;
    if (candidate >= 0 && candidate !== correct && !used.has(candidate)) {
      used.add(candidate);
      options.push(candidate);
    }
  }
  
  // 如果还不够，用更大偏移量
  let extra = 4;
  while (options.length < 4) {
    for (const sign of [1, -1]) {
      const candidate = correct + sign * extra;
      if (candidate >= 0 && !used.has(candidate)) {
        used.add(candidate);
        options.push(candidate);
        break;
      }
    }
    extra++;
  }
  
  // 打乱顺序
  return options.sort(() => Math.random() - 0.5);
}
