'use client';

import type { Operator } from '@/lib/algorithm/types';

interface VerticalCalculationProps {
  /** 第一个数（被加数/被减数） */
  a: number;
  /** 第二个数（加数/减数） */
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
 *
 * 标准竖式版式（数位严格对齐，最多三位）：
 *      ¹        ← 进位小 1 标在十位上方
 *    [百][十][个]
 *  +       [b十][b个]
 *  ─────────────
 *    [百][十][个]  ← 答案
 *
 * 进位：十位上方显示黄色小「1」；
 * 退位：被减数十位划线改成「少 1」，个位右上角标小红点（借 1 当 10）。
 *
 * 用法：<VerticalCalculation a={9} b={5} operator="+" showCarry />
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
  const aTens = Math.floor(a / 10) % 10;
  const aOnes = a % 10;
  const aHundreds = Math.floor(a / 100);
  const bTens = Math.floor(b / 10) % 10;
  const bOnes = b % 10;
  const bHundreds = Math.floor(b / 100);

  // 进位/退位
  const carryIn = operator === '+' && aOnes + bOnes >= 10 ? 1 : 0;
  const borrow = operator === '-' && aOnes < bOnes;

  // 是否需要百位列：任何操作数或答案达到三位数
  const needHundreds = aHundreds > 0 || bHundreds > 0 || (answer !== null && answer >= 100);
  const ansHundreds = answer !== null ? Math.floor(answer / 100) : null;
  const ansTens = answer !== null ? Math.floor((answer % 100) / 10) : null;
  const ansOnes = answer !== null ? answer % 10 : null;

  const digitCls = compact ? 'text-2xl' : 'text-3xl sm:text-4xl';
  const cell = `${digitCls} font-black w-9 sm:w-10 text-center`;
  const opCls = compact ? 'text-xl' : 'text-2xl sm:text-3xl';

  return (
    <div className="inline-block font-mono bg-white/90 rounded-3xl px-6 py-4 shadow-lg border-2 border-moko-purple/20">
      {/* 进位/退位标记行（与下方数位严格同网格） */}
      {showCarry && (carryIn > 0 || borrow) && (
        <div className="flex justify-end items-end h-6 mb-0.5">
          {/* 占位：运算符列 */}
          <span className="w-7 sm:w-8" />
          {needHundreds && <span className="w-9 sm:w-10" />}
          {/* 十位上方：进位小 1 / 退位后的新十位 */}
          <span className={`${digitCls} font-black w-9 sm:w-10 text-center relative`}>
            {carryIn > 0 && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-sm text-orange-500 bg-orange-100 rounded-full w-5 h-5 flex items-center justify-center border border-orange-300">
                1
              </span>
            )}
          </span>
          <span className="w-9 sm:w-10" />
        </div>
      )}

      {/* 被加数/被减数 */}
      <div className="flex justify-end items-center">
        <span className={`${opCls} font-black w-7 sm:w-8 text-center text-transparent select-none`} aria-hidden>
          +
        </span>
        {needHundreds && (
          <span className={`${cell} text-gray-700`}>{aHundreds > 0 ? aHundreds : ''}</span>
        )}
        <span className={`${cell} text-gray-700 relative`} aria-label={`${aTens}个十`}>
          {borrow && showCarry ? (
            <>
              {/* 退位：原十位划掉，右上角写新的十位值 */}
              <span className="relative inline-block">
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="block w-full h-0.5 bg-red-400 rotate-[-12deg] rounded" />
                </span>
                <span className="text-gray-300">{aTens > 0 ? aTens : '0'}</span>
              </span>
              <span className="absolute -top-3 -right-1 text-xs text-red-500 font-black bg-red-50 rounded px-0.5 leading-4 border border-red-200">
                {aTens - 1 < 0 ? 9 : aTens - 1}
              </span>
            </>
          ) : (
            aTens > 0 ? aTens : ''
          )}
        </span>
        <span
          className={`${cell} relative ${borrow && showCarry ? 'text-red-500' : 'text-gray-700'}`}
          aria-label={`${aOnes}个一`}
        >
          {aOnes}
          {borrow && showCarry && (
            <span className="absolute -top-3 -right-1 text-xs text-red-500 font-black bg-red-50 rounded-full w-4 h-4 flex items-center justify-center border border-red-200" title="向十位借 1 当 10">
              10
            </span>
          )}
        </span>
      </div>

      {/* 加数/减数（带运算符列） */}
      <div className="flex justify-end items-center mt-1">
        <span className={`${opCls} font-black w-7 sm:w-8 text-center text-moko-purple`}>{operator}</span>
        {needHundreds && (
          <span className={`${cell} text-gray-700`}>{bHundreds > 0 ? bHundreds : ''}</span>
        )}
        <span className={`${cell} text-gray-700`}>{bTens > 0 ? bTens : ''}</span>
        <span className={`${cell} text-gray-700`}>{bOnes}</span>
      </div>

      {/* 横线 */}
      <div className="border-t-[3px] border-moko-purple/50 my-2 rounded" />

      {/* 答案：逐位列出，个位必显示，十位/百位按需 */}
      {answer !== null && (
        <div className="flex justify-end items-center">
          <span className={`${opCls} font-black w-7 sm:w-8 text-center text-transparent select-none`} aria-hidden>
            =
          </span>
          {needHundreds && (
            <span className={`${cell} text-moko-rose`}>{ansHundreds! > 0 ? ansHundreds : ''}</span>
          )}
          {/* 十位：答案 >=10 或需要补位时显示 */}
          <span className={`${cell} text-moko-rose`}>
            {(answer ?? 0) >= 10 || carryIn === 1 ? ansTens : ''}
          </span>
          <span className={`${cell} text-moko-rose relative`}>
            {ansOnes}
            {carryIn > 0 && showCarry && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-orange-400 font-black whitespace-nowrap">
                ▲ 进位后写的
              </span>
            )}
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
