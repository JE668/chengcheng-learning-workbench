// @ts-nocheck
/**
 * Atomic Components - 原子组件库
 * 基于 class-variance-authority (cva) + Tailwind CSS
 * 统一设计语言、类型安全、可组合
 */

// 通用工具
export * from './utils';

// 原子组件（直接从组件文件导入，避免 Next.js 重复导出问题）
export { Button, type ButtonProps } from './Button';
export { Input, type InputProps } from './Input';
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  type CardProps,
} from './Card';
export { Badge, type BadgeProps } from './Badge';
export { Avatar, AvatarGroup, type AvatarProps } from './Avatar';
export { Modal, type ModalProps } from './Modal';
export { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';
export { Select, type SelectProps } from './Select';
export { Tabs, type TabsProps } from './Tabs';
export { Tooltip, type TooltipProps } from './Tooltip';
export { DropdownMenu, type DropdownMenuProps, type DropdownMenuItem } from './DropdownMenu';
export { Popover, type PopoverProps } from './Popover';

// 说明：原先这里导出的动画组件（Motion.tsx）与 Toast 依赖 framer-motion，
// 而它们整条引用链（components/index.ts → atomic/index.ts → Motion/Toast/PushPermission）
// **在本仓库里无人使用**，却把 framer-motion 拖进了依赖。已随依赖一并移除。
// 需要时从 git 历史取回，或直接用 globals.css 里已有的纯 CSS 关键帧实现。

// 复合组件（基于原子组件组合）
// 后续可添加：Accordion, DataTable, Form 等
