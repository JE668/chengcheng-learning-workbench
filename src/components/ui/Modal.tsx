'use client';

import { Fragment, ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X } from 'lucide-react';

export interface ModalProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 标题 */
  title?: string;
  /** 内容 */
  children: ReactNode;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 点击遮罩关闭 */
  closeOnOverlayClick?: boolean;
  /** 按 ESC 关闭 */
  closeOnEscape?: boolean;
  /** 底部操作栏 */
  footer?: ReactNode;
  /** 是否为确认对话框 */
  confirm?: boolean;
  /** 确认按钮文本 */
  confirmText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 确认按钮变体 */
  confirmVariant?: 'primary' | 'danger' | 'success';
  /** 确认回调 */
  onConfirm?: () => void | Promise<void>;
  /** 类名 */
  className?: string;
  /** 是否禁用滚动锁定 */
  disableScrollLock?: boolean;
  /** 唯一标识（用于无障碍） */
  id?: string;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer,
  confirm = false,
  confirmText = '确认',
  cancelText = '取消',
  confirmVariant = 'primary',
  onConfirm,
  className,
  disableScrollLock = false,
  id,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const confirmLoading = useRef(false);

  // 焦点陷阱
  useEffect(() => {
    if (!open) return;

    previousActiveElement.current = document.activeElement as HTMLElement;

    // 锁定 body 滚动
    if (!disableScrollLock) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
    }

    // 聚焦到模态框
    setTimeout(() => {
      contentRef.current?.focus();
    }, 0);

    // ESC 关闭
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
      // Tab 焦点陷阱
      if (e.key === 'Tab') {
        const focusableElements = contentRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (!disableScrollLock) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
      previousActiveElement.current?.focus();
    };
  }, [open, closeOnEscape, onClose, disableScrollLock]);

  // 点击遮罩关闭
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (confirmLoading.current || !onConfirm) return;
    confirmLoading.current = true;
    try {
      await onConfirm();
    } finally {
      confirmLoading.current = false;
    }
  };

  if (!open) return null;

  const modalContent = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? `${id}-title` : undefined}
      aria-describedby={children ? `${id}-content` : undefined}
    >
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        aria-hidden="true"
      />

      {/* 模态框内容 */}
      <div
        ref={contentRef}
        tabIndex={-1}
        className={twMerge(
          clsx(
            'relative w-full bg-white dark:bg-gray-900 shadow-2xl animate-scale-in',
            'rounded-3xl border-2 border-border',
            sizeStyles[size],
            className
          )
        )}
      >
        {(title || showClose) && (
          <div className="flex items-start justify-between p-5 border-b border-border">
            {title && (
              <h2
                id={`${id}-title`}
                className="text-xl font-black text-text flex-1 pr-4"
              >
                {title}
              </h2>
            )}
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-shrink-0 p-1.5 rounded-lg text-text-tertiary hover:text-text hover:bg-surface transition-colors"
                aria-label="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        <div id={`${id}-content`} className="p-5">
          {children}
        </div>

        {(footer || confirm) && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-border bg-surface/50 rounded-b-3xl">
            {confirm && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-text border-2 border-border rounded-xl hover:bg-surface-hover transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={confirmLoading.current}
                  className={twMerge(
                    clsx(
                      'px-4 py-2 text-sm font-semibold rounded-xl transition-colors',
                      confirmVariant === 'primary' && 'bg-primary text-white hover:bg-primary-hover',
                      confirmVariant === 'danger' && 'bg-danger text-white hover:bg-danger/90',
                      confirmVariant === 'success' && 'bg-success text-white hover:bg-success/90'
                    )
                  )}
                >
                  {confirmLoading.current ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      处理中...
                    </span>
                  ) : (
                    confirmText
                  )}
                </button>
              </>
            )}
            {footer && !confirm && <>{footer}</>}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
}

/** 确认对话框快捷方式 */
export function ConfirmDialog(props: Omit<ModalProps, 'confirm' | 'title' | 'children'> & {
  message: ReactNode;
  title?: string;
}) {
  return (
    <Modal
      {...props}
      confirm
      title={props.title}
      children={<p className="text-text-secondary">{props.message}</p>}
    />
  );
}

/** Toast 容器 */
export function ToastContainer() {
  // 这里可以集成 useUIStore 的 toasts
  return null;
}