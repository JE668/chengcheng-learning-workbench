import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ClayButton } from './ClayButton';
import { ClayCard } from './ClayCard';

afterEach(cleanup);

describe('ClayCard · 可序列化链接入口', () => {
  it('传 href 时渲染为 Next Link 的锚点，而不是要求服务端传组件函数', () => {
    render(<ClayCard href="/daily-practice">开始练习</ClayCard>);

    const link = screen.getByRole('link', { name: '开始练习' });
    expect(link).toHaveAttribute('href', '/daily-practice');
    expect(link).toHaveClass('clay-card');
  });

  it('不传 href 时仍是普通卡片容器', () => {
    const { container } = render(<ClayCard>普通卡片</ClayCard>);

    expect(screen.queryByRole('link', { name: '普通卡片' })).not.toBeInTheDocument();
    expect(container.firstElementChild?.tagName).toBe('DIV');
  });
});

describe('ClayButton · 可序列化链接入口', () => {
  it('传 href 时渲染为可访问链接且不携带按钮 disabled 语义', () => {
    render(<ClayButton href="/daily-practice">开始练习</ClayButton>);

    const link = screen.getByRole('link', { name: '开始练习' });
    expect(link).toHaveAttribute('href', '/daily-practice');
    expect(link).not.toHaveAttribute('disabled');
  });

  it('普通按钮仍保持 button 语义', () => {
    render(<ClayButton>提交</ClayButton>);

    expect(screen.getByRole('button', { name: '提交' })).toBeInTheDocument();
  });
});
