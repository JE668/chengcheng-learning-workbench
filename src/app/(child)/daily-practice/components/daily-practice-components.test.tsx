import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PracticeQuestion } from '@/lib/daily-practice';
import { AnswerOptions } from './AnswerOptions';
import { CheckInSubmit } from './CheckInSubmit';

afterEach(cleanup);

const mathQuestion: PracticeQuestion = {
  id: 'math-1',
  kind: 'math',
  subject: '数学',
  prompt: '1 + 1 = ?',
  options: ['1', '2', '3'],
  answer: 1,
  explain: '一加一等于二',
};

describe('每日一练答题组件', () => {
  it('答对后锁定选项并显示解析', () => {
    const onChoose = vi.fn();
    render(
      <AnswerOptions question={mathQuestion} selectedIndex={1} praise={null} onChoose={onChoose} />
    );

    const correct = screen.getByRole('button', { name: '2' });
    const wrong = screen.getByRole('button', { name: '3' });

    expect((correct as HTMLButtonElement).disabled).toBe(true);
    expect((wrong as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/答对啦/).textContent).toContain('一加一等于二');
  });

  it('答错后仍可重选，点击会把选项交给上层状态机', () => {
    const onChoose = vi.fn();
    render(
      <AnswerOptions question={mathQuestion} selectedIndex={0} praise={null} onChoose={onChoose} />
    );

    const anotherOption = screen.getByRole('button', { name: '3' });
    fireEvent.click(anotherOption);

    expect(anotherOption.hasAttribute('disabled')).toBe(false);
    expect(onChoose).toHaveBeenCalledWith(2);
    expect(screen.getByText(/再想想/)).toBeTruthy();
  });
});

describe('每日一练打卡提交组件', () => {
  it('未答题时禁用下一题，最后一题点击提交', () => {
    const onNext = vi.fn();
    const onSubmit = vi.fn();
    const { rerender } = render(
      <CheckInSubmit
        index={0}
        total={2}
        currentAnswered={false}
        allAnswered={false}
        submitting={false}
        onPrevious={vi.fn()}
        onNext={onNext}
        onSubmit={onSubmit}
      />
    );

    const next = screen.getByRole('button', { name: '下一题 ›' });
    expect((next as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(next);
    expect(onNext).not.toHaveBeenCalled();

    rerender(
      <CheckInSubmit
        index={1}
        total={2}
        currentAnswered
        allAnswered
        submitting={false}
        onPrevious={vi.fn()}
        onNext={onNext}
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '✅ 完成今日一练' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
