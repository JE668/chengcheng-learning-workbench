'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, focusRing, disabledStyles, transitionBase, shadows } from '@/components/atomic/utils';

/**
 * Claymorphism 输入框 —— 统一黏土拟态输入框的单一入口。
 *
 * 设计规格：
 * - 圆角 1rem (16px) → rounded-xl
 * - 白底 + 2px 边框（border-input = #e5e5e5）
 * - 聚焦态：border-primary + 可见焦点环
 * - 错误态：border-danger + 焦点环 danger/20
 * - 成功态：border-success + 焦点环 success/20
 * - 禁用态：opacity-50 + pointer-events-none
 * - Label 关联、错误提示 aria-describedby、清除按钮等无障碍完备
 */
export const clayInputVariants = cva(
  [
    'w-full',
    'rounded-xl border-2',
    'bg-white',
    'placeholder:text-gray-400',
    transitionBase,
    focusRing,
    disabledStyles,
    'text-gray-900 placeholder:text-gray-400',
    'border-input',
    shadows.card,
  ],
  {
    variants: {
      variant: {
        default: ['focus-visible:border-primary'],
        error: ['border-danger', 'focus-visible:border-danger', 'focus-visible:ring-danger/20'],
        success: [
          'border-success',
          'focus-visible:border-success',
          'focus-visible:ring-success/20',
        ],
        search: ['pl-10 pr-4', 'bg-gray-50', 'border-gray-100', 'focus-visible:bg-white'],
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: ['h-12 px-5 text-lg'],
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      fullWidth: true,
    },
  }
);

interface ClayInputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof clayInputVariants> {
  /** 标签文本 */
  label?: string;
  /** 是否必填 */
  required?: boolean;
  /** 错误提示文案 */
  error?: string;
  /** 提示文案 */
  hint?: string;
  /** 左侧图标 */
  leftIcon?: React.ReactNode;
  /** 右侧图标 */
  rightIcon?: React.ReactNode;
  /** 显示清除按钮 */
  clearable?: boolean;
  /** 输入框 id（可选，自动生成） */
  id?: string;
}

const ClayInput = React.forwardRef<HTMLInputElement, ClayInputProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      clearable,
      id,
      disabled,
      required,
      onChange,
      onBlur,
      ...props
    },
    forwardedRef
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    // 合成转发 ref 与内部 ref
    const composedRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [forwardedRef]
    );

    const inputId = React.useId();
    const finalId = id ?? inputId;
    const errorId = `${finalId}-error`;
    const hintId = `${finalId}-hint`;
    const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;

    const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      onChange?.({
        target: { value: '', name: props.name },
      } as React.ChangeEvent<HTMLInputElement>);
      onBlur?.(e as unknown as React.FocusEvent<HTMLInputElement>);
      inputRef.current?.focus();
    };

    return (
      <div className={cn('w-full', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={finalId} className="block text-sm font-semibold text-gray-700 mb-1.5">
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={composedRef}
            id={finalId}
            className={cn(
              clayInputVariants({ variant: error ? 'error' : variant, size, fullWidth }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              clearable && 'pr-10',
              className
            )}
            disabled={disabled}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            aria-required={required}
            onChange={onChange}
            onBlur={onBlur}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
              {rightIcon}
            </div>
          )}
          {clearable && !disabled && props.value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="清除内容"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        {error && (
          <p
            id={errorId}
            className="mt-1.5 text-sm text-red-600 flex items-center gap-1"
            role="alert"
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

ClayInput.displayName = 'ClayInput';

export { ClayInput, type ClayInputProps };
