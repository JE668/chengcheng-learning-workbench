'use client';

import type { Operator } from '@/lib/algorithm/types';

interface VerticalCalculationProps {
  /** 被加数/被减数 */
  a: number;
  /** 加数/减数 */
  b: number;
  /** 运算符 */
  operator: Operator;
  /** 当前答案（可能还未知，可传 null） */
  answer?: number | null;
  /** 是否展示进位/退位标记 */
  showCarry?: boolean;
  /** 是否展示「过程中的中间值」（用于分步演示） */
  showIntermediate?: boolean;
  /** 中间结果（用于显示第一步的答案） */
  intermediateValue?: number;
  /** 紧凑模式（用于小尺寸） */
  compact?: boolean;
}

/**
 * 竖式计算组件 - 萌可风格
 * 展示两位数加减法竖式，支持进位/退位高亮动画
 *
 * 用法：
 * <VerticalCalculation a={9} b={5} operator="+" showCarry />
 */
export function VerticalCalculation({
  a,
  b,
  operator,
  answer = null,
  showCarry = true,
  showIntermediate = false,
  intermediateValue,
  compact = false,
}: VerticalCalculationProps) {
  const aTens = Math.floor(a / 10);
  const aOnes = a % 10;
  const bTens = Math.floor(b / 10);
  const bOnes = b % 10;

  // 计算进位/退位
  const onesSum = aOnes + (operator === '+' ? bOnes : -bOnes);
  const carryIn = operator === '+' && onesSum >= 10 ? 1 : 0;
  const borrow = operator === '-' && aOnes < bOnes ? 1 : 0;

  const sizeClass = compact ? 'text-2xl' : 'text-3xl sm:text-4xl';

  return (
    <div className="inline-block font-mono bg-white/90 rounded-3xl px-6 py-4 shadow-lg border-2 border-moko-purple/20">
      {/* 进位标记（进位用） */}
      {showCarry && carryIn > 0 && (
        <div className="flex justify-end mb-1 pr-12">
          <span className="text-sm font-black text-orange-500 bg-orange-100 rounded-full px-2 py-0.5">
            + 1 借位
          </span>
        </div>
      )}

      {/* 被加数/被减数 */}
      <div className="flex justify-end gap-2">
        <span
          className={`${sizeClass} font-black text-gray-700 w-10 text-center relative`}
          aria-label={`${aTens}个十`}
        >
          {aTens > 0 ? aTens : ''}
        </span>
        <span
          className={`${sizeClass} font-black text-gray-700 w-10 text-center ${
            operator === '-' && aOnes < bOnes ? 'text-red-400 bg-red-50 rounded-lg' : ''
          }`}
        >
          {aOnes}
          {operator === '-' && aOnes < bOnes && (
            <span className="absolute -top-1 -right-1 text-xs bg-red-200 text-red-600 rounded-full w-5 h-5 flex items-center justify-center font-black">
              借
            </span>
          )}
        </span>
      </div>

      {/* 加数/减数 */}
      <div className="flex justify-end gap-2 mt-1">
        <span className={`${sizeClass} font-black text-moko-purple w-10 text-center mr-2`}>
          {operator}
        </span>
        <span className={`${sizeClass} font-black text-gray-700 w-10 text-center`}>
          {bTens > 0 ? bTens : ''}
        </span>
        <span className={`${sizeClass} font-black text-gray-700 w-10 text-center`}>{bOnes}</span>
      </div>

      {/* 横线 */}
      <div className="border-t-2 border-moko-purple/40 my-2" />

      {/* 答案 */}
      {answer !== null && (
        <div className="flex justify-end gap-2">
          <span className={`${sizeClass} font-black text-moko-rose w-10 text-center`}>
            {Math.floor(answer / 10)}
          </span>
          <span className={`${sizeClass} font-black text-moko-rose w-10 text-center`}>
            {answer % 10}
          </span>
        </div>
      )}

      {/* 中间步骤（只在分步演示时显示） */}
      {showIntermediate && intermediateValue !== undefined && (
        <div className="mt-2 pt-2 border-t border-dashed border-moko-purple/30">
          <div className="text-sm text-gray-500 font-bold">第一步结果：</div>
          <div className="text-2xl font-black text-moko-violet text-center mt-1">{intermediateValue}</div>
        </div>
      )}
    </div>
  );
}
