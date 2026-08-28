'use client';

import { HTMLAttributes, forwardRef, useId, useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SelectProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** 选项 */
  options: { value: string; label: string; disabled?: boolean }[];
  /** 当前值 */
  value?: string;
  /** 变更回调 */
  onChange?: (value: string) => void;
  /** 占位符 */
  placeholder?: string;
  /** 标签 */
  label?: string;
  /** 错误信息 */
  error?: string;
  /** 帮助文本 */
  hint?: string;
  /** 禁用 */
  disabled?: boolean;
  /** 必填 */
  required?: boolean;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否可搜索 */
  searchable?: boolean;
  /** 最大高度 */
  maxHeight?: string;
  /** 类名 */
  className?: string;
  /** 名称（表单提交用） */
  name?: string;
}

const sizeStyles = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-5 text-lg',
};

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = '请选择',
      label,
      error,
      hint,
      disabled = false,
      required = false,
      size = 'md',
      searchable = false,
      maxHeight = '200px',
      className,
      name,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const triggerId = `${id}-trigger`;
    const listboxId = `${id}-listbox`;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listboxRef = useRef<HTMLDivElement>(null);
    const optionsRef = useRef<(HTMLLIElement | null)[]>([]);

    const filteredOptions = searchable
      ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
      : options;

    const selectedOption = options.find(o => o.value === value);

    // 点击外部关闭
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (triggerRef.current?.contains(e.target as Node)) return;
        if (listboxRef.current?.contains(e.target as Node)) return;
        setOpen(false);
        setSearch('');
        setHighlightedIndex(-1);
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 键盘导航
    useEffect(() => {
      if (!open) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setHighlightedIndex(i => Math.min(i + 1, filteredOptions.length - 1));
            break;
          case 'ArrowUp':
            e.preventDefault();
            setHighlightedIndex(i => Math.max(i - 1, -1));
            break;
          case 'Enter':
          case ' ':
            if (highlightedIndex >= 0) {
              e.preventDefault();
              const option = filteredOptions[highlightedIndex];
              if (!option.disabled) {
                onChange?.(option.value);
                setOpen(false);
                setSearch('');
                setHighlightedIndex(-1);
              }
            }
            break;
          case 'Escape':
            setOpen(false);
            setSearch('');
            setHighlightedIndex(-1);
            triggerRef.current?.focus();
            break;
          case 'Home':
            e.preventDefault();
            setHighlightedIndex(0);
            break;
          case 'End':
            e.preventDefault();
            setHighlightedIndex(filteredOptions.length - 1);
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, filteredOptions, highlightedIndex, onChange]);

    // 滚动到高亮项
    useEffect(() => {
      if (highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
        optionsRef.current[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }, [highlightedIndex]);

    const handleOptionClick = (optionValue: string, optionDisabled: boolean) => {
      if (optionDisabled) return;
      onChange?.(optionValue);
      setOpen(false);
      setSearch('');
      setHighlightedIndex(-1);
      triggerRef.current?.focus();
    };

    const handleTriggerClick = () => {
      if (disabled) return;
      setOpen(!open);
      if (!open) {
        setHighlightedIndex(filteredOptions.findIndex(o => o.value === value));
      }
    };

    return (
      <div ref={ref} className={twMerge('w-full', className)} {...props}>
        {label && (
          <label
            htmlFor={triggerId}
            className="block text-sm font-semibold text-text mb-1.5"
          >
            {label}
            {required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative">
          <button
            ref={triggerRef}
            id={triggerId}
            type="button"
            role="combobox"
            className={twMerge(
              clsx(
                'w-full flex items-center justify-between',
                'bg-surface border-2 rounded-xl',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                sizeStyles[size],
                error && 'border-danger focus-visible:ring-danger focus-visible:border-danger',
                disabled && 'bg-surface-hover'
              )
            )}
            onClick={handleTriggerClick}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined}
            aria-describedby={describedBy}
            aria-invalid={error ? 'true' : 'false'}
          >
            <span className={twMerge('truncate flex-1', value ? 'text-text' : 'text-text-tertiary')}>
              {selectedOption?.label ?? placeholder}
            </span>
            <svg
              className={twMerge(
                'w-5 h-5 flex-shrink-0 ml-2 text-text-tertiary transition-transform',
                open && 'rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {searchable && open && (
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                className="absolute top-full left-0 right-0 mt-1 px-3 py-2 bg-surface border-2 border-border rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                placeholder="搜索..."
                aria-label="搜索选项"
                autoFocus
              />
            )}
          </button>

          {open && (
            <div
              ref={listboxRef}
              id={listboxId}
              role="listbox"
              aria-multiselectable="false"
              aria-activedescendant={highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined}
              className={twMerge(
                'absolute top-full left-0 right-0 z-50 mt-1.5',
                'bg-white dark:bg-gray-900 border-2 border-border rounded-xl shadow-xl',
                'overflow-hidden animate-slide-down',
                `max-h-[${maxHeight}]`
              )}
            >
              {searchable && (
                <div className="p-2 border-b border-border sticky top-0 bg-white dark:bg-gray-900">
                  <input
                    type="text"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setHighlightedIndex(0); }}
                    className="w-full px-3 py-2 bg-surface border-2 border-border rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="搜索选项..."
                    aria-label="搜索选项"
                    autoFocus
                  />
                </div>
              )}
              <ul className="py-1" role="presentation">
                {filteredOptions.length === 0 ? (
                  <li className="px-3 py-4 text-center text-text-tertiary text-sm" role="option" aria-selected="false" aria-disabled="true">
                    {searchable ? '没有匹配的选项' : '没有可用选项'}
                  </li>
                ) : (
                  filteredOptions.map((option, index) => (
                    <li
                      key={option.value}
                      ref={el => { optionsRef.current[index] = el; }}
                      id={`${listboxId}-option-${index}`}
                      role="option"
                      aria-selected={option.value === value}
                      aria-disabled={option.disabled}
                      className={twMerge(
                        clsx(
                          'px-3 py-2.5 cursor-pointer transition-colors',
                          'hover:bg-surface hover:text-text',
                          option.value === value && 'bg-primary/10 text-primary font-semibold',
                          highlightedIndex === index && 'bg-surface-hover',
                          option.disabled && 'opacity-50 cursor-not-allowed'
                        )
                      )}
                      onClick={() => handleOptionClick(option.value, option.disabled ?? false)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      {option.label}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          {error && (
            <p id={errorId} className="mt-1.5 text-sm text-danger flex items-center gap-1" role="alert">
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

          {/* 隐藏的原生 select 用于表单提交 */}
          {name && (
            <select name={name} value={value || ''} onChange={e => onChange?.(e.target.value)} className="hidden" aria-hidden="true">
              <option value="">--</option>
              {options.map(o => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
            </select>
          )}
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';