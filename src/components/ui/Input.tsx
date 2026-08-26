'use client';

import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 标签文本 */
  label?: string;
  /** 错误信息 */
  error?: string;
  /** 帮助文本 */
  hint?: string;
  /** 左侧图标 */
  leftIcon?: React.ReactNode;
  /** 右侧图标 */
  rightIcon?: React.ReactNode;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否全宽 */
  block?: boolean;
  /** 变体 */
  variant?: 'default' | 'filled' | 'outlined';
}

const baseStyles = `
  w-full transition-all duration-200
  placeholder:text-text-tertiary
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0
  disabled:opacity-50 disabled:cursor-not-allowed
  bg-surface border-2
`;

const variantStyles = {
  default: 'border-border focus-visible:ring-primary focus-visible:border-primary',
  filled: 'border-transparent bg-surface-hover focus-visible:ring-primary focus-visible:border-primary',
  outlined: 'border-2 border-border focus-visible:ring-primary focus-visible:border-primary',
};

const sizeStyles = {
  sm: 'h-8 px-3 text-sm gap-2',
  md: 'h-10 px-4 text-base gap-2',
  lg: 'h-12 px-5 text-lg gap-2.5',
};

const iconSizeStyles = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      size = 'md',
      block = true,
      variant = 'default',
      className,
      id: providedId,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={twMerge('w-full', block && 'block', className)}>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-semibold text-text mb-1.5"
          >
            {label}
            {required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div
              className={clsx(
                'absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none',
                iconSizeStyles[size]
              )}
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={twMerge(
              clsx(
                baseStyles,
                variantStyles[variant],
                sizeStyles[size],
                leftIcon && 'pl-10',
                rightIcon && 'pr-10',
                error && 'border-danger focus-visible:ring-danger focus-visible:border-danger',
                disabled && 'bg-surface-hover'
              ),
              props.className
            )}
            disabled={disabled}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            aria-required={required}
            {...props}
          />
          {rightIcon && (
            <div
              className={clsx(
                'absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none',
                iconSizeStyles[size]
              )}
              aria-hidden="true"
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={errorId}
            className="mt-1.5 text-sm text-danger flex items-center gap-1"
            role="alert"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    )
  }
);

Input.displayName = 'Input';

/** Textarea 组件 */
export interface TextareaProps extends Omit<InputProps, 'leftIcon' | 'rightIcon'> {
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      size = 'md',
      block = true,
      variant = 'default',
      className,
      id: providedId,
      disabled,
      required,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;

    const sizeStyles = {
      sm: 'p-3 text-sm',
      md: 'p-4 text-base',
      lg: 'p-5 text-lg',
    };

    return (
      <div className={twMerge('w-full', block && 'block', className)}>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-semibold text-text mb-1.5"
          >
            {label}
            {required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          className={twMerge(
            clsx(
              baseStyles.replace('h-', 'min-h-'),
              variantStyles[variant],
              sizeStyles[size],
              error && 'border-danger focus-visible:ring-danger focus-visible:border-danger',
              disabled && 'bg-surface-hover'
            ),
            props.className
          )}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          aria-required={required}
          {...props}
        />
        {error && (
          <p
            id={errorId}
            className="mt-1.5 text-sm text-danger flex items-center gap-1"
            role="alert"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

/** Label 组件 */
export const Label = forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={twMerge('block text-sm font-semibold text-text mb-1.5', className)}
      {...props}
    />
  )
);
Label.displayName = 'Label';