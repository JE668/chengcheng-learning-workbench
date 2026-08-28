// @ts-nocheck
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { Button } from '@/components/atomic/Button';
import { Input } from '@/components/atomic/Input';

async function checkA11y(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: true },
      'label': { enabled: true },
      'button-name': { enabled: true },
      'link-name': { enabled: true },
      'image-alt': { enabled: true },
      'aria-valid-attr': { enabled: true },
      'aria-required-attr': { enabled: true },
      'aria-roles': { enabled: true },
      'focus-order-semantics': { enabled: true },
    },
  });
  return results;
}

describe('Accessibility Tests with axe-core', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  describe('Button Component', () => {
    it('should have no accessibility violations', async () => {
      render(<Button>测试按钮</Button>, { container });
      const results = await checkA11y(container);
      expect(results.violations).toHaveLength(0);
    });

    it('should be keyboard accessible', async () => {
      render(<Button>键盘可达</Button>, { container });
      const button = screen.getByRole('button', { name: /键盘可达/ });
      expect(button).toBeInTheDocument();
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Input Component', () => {
    it('should have no accessibility violations', async () => {
      render(<Input label="用户名" placeholder="请输入用户名" />, { container });
      const results = await checkA11y(container);
      expect(results.violations).toHaveLength(0);
    });

    it('should associate label with input', async () => {
      render(<Input label="邮箱" type="email" />, { container });
      const input = screen.getByLabelText(/邮箱/);
      expect(input).toBeInTheDocument();
    });

    it('should announce error message', async () => {
      render(<Input label="密码" error="密码不能为空" />, { container });
      const results = await checkA11y(container);
      expect(results.violations).toHaveLength(0);
      
      const errorMsg = screen.getByRole('alert');
      expect(errorMsg).toHaveTextContent(/密码不能为空/);
    });
  });
});