'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AlgorithmQuestion, StepField, StepInput } from '@/lib/algorithm/types';
import { VerticalCalculation } from './VerticalCalculation';
import { sfxComplete, sfxWrong } from '@/lib/sfx';
import { FadeIn, Shake } from './LazyMotion';

interface AlgorithmQuizProps {
  question: AlgorithmQuestion;
  onComplete: (correct: boolean) => void;
  onNext: () => void;
  showPrinciple?: boolean;
}

/**
 * 算法题目分步填写组件
 * 展示：题目 → 原理 → 一步一步填写 → 最终答案
 * 使用 CSS 动画替代 framer-motion 以减小 bundle
 */
export function AlgorithmQuiz({ question, onComplete, onNext, showPrinciple = true }: AlgorithmQuizProps) {
  // 当前步骤索引
  const [stepIdx, setStepIdx] = useState(0);
  // 每个输入框的答案
  const [answers, setAnswers] = useState<Record<string, number | ''>>({});
  // 是否正确（每个步骤）
  const [stepCorrect, setStepCorrect] = useState<Record<string, boolean>>({});
  // 是否全部完成
  const [completed, setCompleted] = useState(false);
  // 开启的提示
  const [hintShown, setHintShown] = useState<Set<string>>(new Set());
  // 答错的输入框（用于 shake 动画）
  const [errorInputs, setErrorInputs] = useState<Set<string>>(new Set());

  const currentStep: StepField = question.stepFields[stepIdx];
  const isLastStep = stepIdx === question.stepFields.length - 1;

  // 初始化时重置所有答案
  useEffect(() => {
    setAnswers({});
    setStepCorrect({});
    setStepIdx(0);
    setCompleted(false);
    setHintShown(new Set());
    setErrorInputs(new Set());
  }, [question.id]);

  /** 填写输入框 */
  const handleInput = useCallback((inputId: string, value: string) => {
    const num = value === '' ? '' : parseInt(value, 10);
    setAnswers((prev) => ({ ...prev, [inputId]: num }));
    // 清除错误状态
    if (errorInputs.has(inputId)) {
      setErrorInputs((prev) => {
        const next = new Set(prev);
        next.delete(inputId);
        return next;
      });
    }
    // 清除 hint
    if (hintShown.has(inputId)) {
      setHintShown((prev) => {
        const next = new Set(prev);
        next.delete(inputId);
        return next;
      });
    }
  }, [errorInputs, hintShown]);

  /** 提交当前步骤 */
  const handleSubmitStep = useCallback(() => {
    if (!currentStep) return;

    let allCorrect = true;
    const newStepCorrect: Record<string, boolean> = { ...stepCorrect };
    const newErrors = new Set<string>();

    currentStep.inputs.forEach((input) => {
      const userValue = answers[input.id];
      const isCorrect = userValue === input.expectedValue;
      newStepCorrect[input.id] = isCorrect;
      if (!isCorrect) {
        allCorrect = false;
        if (userValue !== '') {
          newErrors.add(input.id);
        }
        setHintShown((prev) => new Set(prev).add(input.id));
      }
    });

    setStepCorrect(newStepCorrect);
    setErrorInputs(newErrors);

    if (allCorrect) {
      sfxComplete();
      if (isLastStep) {
        setCompleted(true);
        onComplete(true);
      } else {
        setStepIdx(stepIdx + 1);
      }
    } else if (newErrors.size > 0) {
      sfxWrong();
    }
  }, [currentStep, stepIdx, answers, stepCorrect, isLastStep, onComplete]);

  /** 跳到下一步（如果当前步骤全部正确） */
  const canGoNext = currentStep?.inputs.every((input) => stepCorrect[input.id]) ?? false;

  /** 查看提示 */
  const showHint = (inputId: string) => {
    setHintShown((prev) => new Set(prev).add(inputId));
  };

  if (!currentStep) return null;

  return (
    <div className="space-y-4">
      {/* 题目区 */}
      <FadeIn duration={0.3}>
        <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-moko-purple/20">
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* 竖式显示 */}
            <VerticalCalculation
              a={question.digits[0]}
              b={question.digits[1]}
              operator={question.operator}
              answer={completed ? question.answer : null}
              showCarry
            />
          </div>

          {/* 大题目提示 */}
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-black text-moko-violet mb-2">
              {question.prompt}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* 当前步骤卡片（分步填写） */}
      {!completed && (
        <FadeIn key={currentStep.id} duration={0.3}>
          <div className="bg-gradient-to-br from-moko-blue/10 to-moko-cyan/10 rounded-3xl p-5 border-2 border-moko-blue/25 shadow-lg">
            {/* 步骤标题 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-full bg-moko-blue text-white flex items-center justify-center font-black text-sm">
                {stepIdx + 1}
              </span>
              <h3 className="text-lg font-black text-moko-blue">{currentStep.title}</h3>
            </div>

            {/* 步骤描述 */}
            <p className="text-sm text-gray-700 leading-relaxed mb-4 font-medium">{currentStep.description}</p>

            {/* 展示区域 */}
            {currentStep.display && (
              <div className="text-xl sm:text-2xl font-black text-center my-4 text-moko-violet bg-white/60 rounded-2xl py-3 px-4">
                {currentStep.display}
              </div>
            )}

            {/* 输入框区域 */}
            {currentStep.inputs.length > 0 && (
              <div className="mt-4 space-y-3">
                {currentStep.inputs.map((input, idx) => {
                  const userValue = answers[input.id];
                  const isCorrect = stepCorrect[input.id];
                  const showHintForThis = hintShown.has(input.id);
                  const hasValue = userValue !== '' && userValue !== undefined;
                  const hasError = errorInputs.has(input.id);

                  return (
                    <FadeIn
                      key={input.id}
                      delay={idx * 0.1}
                      duration={0.2}
                    >
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {/* 前缀 */}
                        {input.prefix && (
                          <span className="text-2xl font-black text-gray-700">{input.prefix}</span>
                        )}

                        {/* 输入框 */}
                        <div className="relative">
                          {hasError && !isCorrect ? (
                            <Shake>
                              <StepInputBox
                                input={input}
                                value={userValue}
                                isCorrect={isCorrect}
                                hasValue={hasValue}
                                onChange={(v) => handleInput(input.id, v)}
                                onEnter={handleSubmitStep}
                                disabled={isCorrect}
                                autoFocus={idx === 0}
                              />
                            </Shake>
                          ) : (
                            <StepInputBox
                              input={input}
                              value={userValue}
                              isCorrect={isCorrect}
                              hasValue={hasValue}
                              onChange={(v) => handleInput(input.id, v)}
                              onEnter={handleSubmitStep}
                              disabled={isCorrect}
                              autoFocus={idx === 0}
                            />
                          )}

                          {/* 正确答案指示（已答对时显示） */}
                          {isCorrect && (
                            <span className="absolute -top-2 -right-2 text-2xl">✅</span>
                          )}
                        </div>

                        {/* 提示按钮（答错时显示） */}
                        {showHintForThis && !isCorrect && (
                          <button
                            onClick={() => showHint(input.id)}
                            className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold hover:bg-red-200 transition"
                          >
                            看提示 💡
                          </button>
                        )}

                        {/* 提示文字 */}
                        {showHintForThis && !isCorrect && (
                          <div className="w-full text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">
                            💡 {currentStep.hint}
                          </div>
                        )}
                      </div>
                    </FadeIn>
                  );
                })}
              </div>
            )}

            {/* 无需输入的步骤：直接点击进入下一步 */}
            {currentStep.inputs.length === 0 && (
              <button
                onClick={handleSubmitStep}
                className="w-full mt-4 py-3 rounded-full bg-moko-blue text-white font-black text-lg shadow-lg hover:scale-105 active:scale-95 transition"
              >
                我懂了，下一步 →
              </button>
            )}
          </div>
        </FadeIn>
      )}

      {/* 提交按钮（如果需要输入才能继续） */}
      {!completed && currentStep.inputs.length > 0 && canGoNext && !isLastStep && (
        <button
          onClick={handleSubmitStep}
          className="w-full py-3 rounded-full bg-gradient-to-r from-moko-blue to-moko-cyan text-white font-black text-lg shadow-lg hover:scale-102 active:scale-98 transition"
        >
          提交答案 ✓
        </button>
      )}

      {/* 完成卡片 */}
      {completed && (
        <FadeIn duration={0.4}>
          <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl p-8 text-white shadow-2xl">
            <div className="text-center space-y-3">
              <div className="text-7xl">🎉</div>
              <h2 className="text-3xl font-black">全部完成！</h2>
              <div className="text-xl font-bold space-y-1">
                <p>最终答案：</p>
                <div className="text-5xl font-black tracking-wider bg-white/20 rounded-2xl py-3 px-6 inline-block">
                  {question.answer}
                </div>
              </div>
              <p className="text-sm opacity-90 font-bold">{question.explain}</p>

              {/* 下一题按钮 */}
              <button
                onClick={onNext}
                className="mt-4 px-8 py-3 rounded-full bg-white text-moko-purple font-black text-lg shadow-lg hover:scale-105 active:scale-95 transition"
              >
                下一题 →
              </button>
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
}

/** 独立输入框组件（避免重复代码） */
function StepInputBox({
  input,
  value,
  isCorrect,
  hasValue,
  onChange,
  onEnter,
  disabled,
  autoFocus,
}: {
  input: StepInput;
  value: number | '' | undefined;
  isCorrect: boolean;
  hasValue: boolean;
  onChange: (v: string) => void;
  onEnter: () => void;
  disabled: boolean;
  autoFocus?: boolean;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value === '' ? '' : value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEnter();
      }}
      placeholder={input.placeholder ?? '?'}
      className={`w-20 h-16 text-3xl text-center font-black rounded-2xl border-4 transition-all outline-none ${
        isCorrect
          ? 'bg-green-50 border-green-400 text-green-700'
          : hasValue
            ? 'bg-red-50 border-red-400 text-red-700'
            : 'border-moko-purple/30 text-gray-700 bg-white'
      }`}
      disabled={disabled || isCorrect}
      autoFocus={autoFocus}
    />
  );
}
