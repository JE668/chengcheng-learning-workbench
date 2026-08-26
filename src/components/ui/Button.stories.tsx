import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Button, PrimaryButton, SecondaryButton, DangerButton, AccentButton, OutlineButton, GhostButton } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '通用按钮组件，支持多种变体、尺寸和状态',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'outline', 'ghost', 'danger', 'success'],
      description: '按钮视觉变体',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'icon'],
      description: '按钮尺寸',
    },
    loading: {
      control: 'boolean',
      description: '加载状态',
    },
    disabled: {
      control: 'boolean',
      description: '禁用状态',
    },
    block: {
      control: 'boolean',
      description: '全宽显示',
    },
    onClick: { action: 'clicked' },
  },
  args: { onClick: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基础变体
export const Primary: Story = {
  args: { children: '主要按钮', variant: 'primary' },
};

export const Secondary: Story = {
  args: { children: '次要按钮', variant: 'secondary' },
};

export const Accent: Story = {
  args: { children: '强调按钮', variant: 'accent' },
};

export const Outline: Story = {
  args: { children: '轮廓按钮', variant: 'outline' },
};

export const Ghost: Story = {
  args: { children: '幽灵按钮', variant: 'ghost' },
};

export const Danger: Story = {
  args: { children: '危险按钮', variant: 'danger' },
};

export const Success: Story = {
  args: { children: '成功按钮', variant: 'success' },
};

// 尺寸
export const Small: Story = {
  args: { children: '小按钮', size: 'sm' },
};

export const Medium: Story = {
  args: { children: '中按钮', size: 'md' },
};

export const Large: Story = {
  args: { children: '大按钮', size: 'lg' },
};

export const ExtraLarge: Story = {
  args: { children: '超大按钮', size: 'xl' },
};

export const IconOnly: Story = {
  args: {
    size: 'icon',
    'aria-label': '仅图标',
    children: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>,
  },
};

// 状态
export const Loading: Story = {
  args: { children: '加载中...', loading: true },
};

export const Disabled: Story = {
  args: { children: '禁用状态', disabled: true },
};

export const Block: Story = {
  args: { children: '全宽按钮', block: true },
  decorators: [(Story) => <div style={{ width: '300px' }}><Story /></div>],
};

// 带图标
export const WithLeftIcon: Story = {
  args: {
    children: '添加',
    leftIcon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>,
  },
};

export const WithRightIcon: Story = {
  args: {
    children: '下一步',
    rightIcon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M5 12h14M12 5l7 7-7 7" /></svg>,
  },
};

// 快捷组件
export const Shortcuts: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <PrimaryButton>Primary</PrimaryButton>
      <SecondaryButton>Secondary</SecondaryButton>
      <AccentButton>Accent</AccentButton>
      <OutlineButton>Outline</OutlineButton>
      <GhostButton>Ghost</GhostButton>
      <DangerButton>Danger</DangerButton>
      <Button variant="success">Success</Button>
    </div>
  ),
};

// 交互演示
export const Interactive: Story = {
  args: { children: '点击我' },
  play: async ({ canvasElement }) => {
    const button = canvasElement.getByRole('button');
    await new Promise(r => setTimeout(r, 500));
    button.click();
  },
};