/**
 * 错题的「错误原因」结构化标签。
 *
 * 目标不是让家长做数据录入，而是让复习闭环能回答：
 * 这道题到底是因为粗心错、概念没懂，还是审题错了。
 * 连续同类错误会被每日一练加权（见 getDueMistakes 的优先级）。
 */
export const MISTAKE_ERROR_TYPES = {
  careless: '粗心',
  concept: '概念不清',
  reading: '审题错误',
} as const;

export type MistakeErrorType = keyof typeof MISTAKE_ERROR_TYPES;

export const MISTAKE_ERROR_TYPE_VALUES = Object.keys(MISTAKE_ERROR_TYPES) as MistakeErrorType[];

/** 兼容历史/未知数据：只有已知标签才用于分组与加权，前端不会渲染空值。 */
export function isMistakeErrorType(value: unknown): value is MistakeErrorType {
  return typeof value === 'string' && value in MISTAKE_ERROR_TYPES;
}

export function mistakeErrorTypeLabel(value: unknown): string {
  return isMistakeErrorType(value) ? MISTAKE_ERROR_TYPES[value] : '';
}
