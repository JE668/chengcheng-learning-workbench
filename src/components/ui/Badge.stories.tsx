import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Badge, PrimaryBadge, SuccessBadge, WarningBadge, DangerBadge, InfoBadge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '标签组件，用于状态标识、分类标记等',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'accent', 'success', 'warning', 'danger', 'info'],
      description: '语义色调',
    },
    variant: {
      control: 'select',
      options: ['solid', 'soft', 'outline', 'dot'],
      description: '视觉变体',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      description: '尺寸',
    },
    clickable: { control: 'boolean', description: '可点击' },
    dismissible: { control: 'boolean', description: '可关闭' },
    onDismiss: { action: 'dismissed' },
  },
  args: { onDismiss: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基础色调
export const Default: Story = { args: { children: '默认', tone: 'default' } };
export const Primary: Story = { args: { children: '主要', tone: 'primary' } };
export const Secondary: Story = { args: { children: '次要', tone: 'secondary' } };
export const Accent: Story = { args: { children: '强调', tone: 'accent' } };
export const Success: Story = { args: { children: '成功', tone: 'success' } };
export const Warning: Story = { args: { children: '警告', tone: 'warning' } };
export const Danger: Story = { args: { children: '危险', tone: 'danger' } };
export const Info: Story = { args: { children: '信息', tone: 'info' } };

// 变体
export const Solid: Story = { args: { children: '实心', variant: 'solid', tone: 'primary' } };
export const Soft: Story = { args: { children: '柔和', variant: 'soft', tone: 'primary' } };
export const Outline: Story = { args: { children: '轮廓', variant: 'outline', tone: 'primary' } };
export const Dot: Story = { args: { children: '圆点', variant: 'dot', tone: 'primary' } };

// 尺寸
export const ExtraSmall: Story = { args: { children: 'XS', size: 'xs' } };
export const Small: Story = { args: { children: 'SM', size: 'sm' } };
export const Medium: Story = { args: { children: 'MD', size: 'md' } };
export const Large: Story = { args: { children: 'LG', size: 'lg' } };

// 状态
export const Clickable: Story = { args: { children: '可点击', clickable: true, tone: 'primary' } };
export const Dismissible: Story = { args: { children: '可关闭', dismissible: true, tone: 'warning' } };

// 带图标
export const WithLeftIcon: Story = {
  args: {
    children: '新功能',
    leftIcon: <span className="w-3 h-3">✨</span>,
    tone: 'accent',
  },
};

export const WithRightIcon: Story = {
  args: {
    children: '进行中',
    rightIcon: <span className="w-3 h-3 animate-spin">⟳</span>,
    tone: 'info',
  },
};

// 快捷组件
export const Shortcuts: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <PrimaryBadge>主要</PrimaryBadge>
      <SuccessBadge>成功</SuccessBadge>
      <WarningBadge>警告</WarningBadge>
      <DangerBadge>危险</DangerBadge>
      <InfoBadge>信息</InfoBadge>
    </div>
  ),
};

// 所有变体组合展示
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 p-4">
      {['default', 'primary', 'secondary', 'accent', 'success', 'warning', 'danger', 'info'].map(tone => (
        <div key={tone} className="flex flex-col gap-2">
          <span className="text-xs text-text-tertiary uppercase">{tone}</span>
          <div className="flex gap-2">
            <Badge tone={tone as any} variant="solid">实心</Badge>
            <Badge tone={tone as any} variant="soft">柔和</Badge>
            <Badge tone={tone as any} variant="outline">轮廓</Badge>
            <Badge tone={tone as any} variant="dot">圆点</Badge>
          </div>
        </div>
      ))}
    </div>
  ),
};