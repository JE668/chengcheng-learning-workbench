'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, shadows, radius, transitionBase, textSizes, fontWeights } from './utils';
import { X } from 'lucide-react';

export const modalVariants = cva(
  [
    'fixed inset-0 z-50 flex items-center justify-center',
    'bg-black/50 backdrop-blur-sm',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-4xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export const modalContentVariants = cva(
  [
    'relative w-full bg-white rounded-2xl shadow-xl',
    'overflow-hidden',
    'transform transition-all duration-200 ease-out',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
    'data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
    'data-[state=open]:slide-in-from-bottom-4',
  ],
  {
    variants: {
      variant: {
        default: 'bg-white',
        success: 'bg-green-50 border-2 border-green-200',
        warning: 'bg-yellow-50 border-2 border-yellow-200',
        danger: 'bg-red-50 border-2 border-red-200',
        info: 'bg-blue-50 border-2 border-blue-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: VariantProps<typeof modalVariants>['size'];
  variant?: VariantProps<typeof modalContentVariants>['variant'];
  showClose?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const Modal = React.forwardRef<HTMLDialogElement, ModalProps>(
  (
    {
      open,
      onOpenChange,
      title,
      description,
      children,
      footer,
      size = 'md',
      variant = 'default',
      showClose = true,
      closeOnOverlayClick = true,
      closeOnEscape = true,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            onClick={(e) => {
              if (e.target === e.currentTarget) onOpenChange(false);
            }}
          />
          <DialogPrimitive.Content
            ref={ref}
            className={cn(
              modalContentVariants({ variant }),
              size === 'sm' && 'max-w-sm',
              size === 'md' && 'max-w-md',
              size === 'lg' && 'max-w-lg',
              size === 'xl' && 'max-w-xl',
              size === 'full' && 'max-w-4xl',
              className
            )}
            onOpenChange={onOpenChange}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onOpenChange(false);
            }}
            {...props}
          >
            {(title || true) && (
              <div className="flex items-start justify-between p-5 border-b border-gray-100">
                <div className="flex-1 pr-4">
                  {title && (
                    <DialogPrimitive.Title className="text-lg font-bold text-gray-900">
                      {title}
                    </DialogPrimitive.Title>
                  )}
                </div>
                <DialogPrimitive.Close
                  className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="关闭"
                >
                  <X className="h-5 w-5" />
                </DialogPrimitive.Close>
              </div>
            )}
            <div className="p-5">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50">
                {footer}
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }
);

Modal.displayName = 'Modal';

export { Modal };
export type { ModalProps };