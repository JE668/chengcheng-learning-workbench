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
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, type CardProps } from './Card';
export { Badge, type BadgeProps } from './Badge';
export { Avatar, AvatarGroup, type AvatarProps } from './Avatar';
export { Modal, type ModalProps } from './Modal';
export { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';
export { Toast, type ToastProps } from './Toast';
export { Select, type SelectProps } from './Select';
export { Tabs, type TabsProps } from './Tabs';
export { Tooltip, type TooltipProps } from './Tooltip';
export { DropdownMenu, type DropdownMenuProps, type DropdownMenuItem } from './DropdownMenu';
export { Popover, type PopoverProps } from './Popover';
export { usePushPermission, PushPermissionButton, PushPermissionProvider } from './PushPermission';

// 动画组件
export { 
  PageTransition,
  StaggerContainer,
  StaggerItem,
  HoverCard,
  TapScale,
  Skeleton,
  CountUp,
  CircularProgress,
  Typewriter,
  PageProgress,
  MotionTapScale,
} from './Motion';

// 复合组件（基于原子组件组合）
// 后续可添加：Accordion, DataTable, Form 等