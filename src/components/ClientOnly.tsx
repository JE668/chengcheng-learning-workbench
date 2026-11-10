'use client';

import { useEffect, useState, type ReactNode } from 'react';

/**
 * 客户端挂载门控：服务端只渲染 loading 占位，挂载后才渲染 children。
 *
 * ## 为什么需要（第四轮 D+E 审查，2026-11-10）
 * 学习模块组件的首帧初始化大量使用 Math.random（题目、选项、抽题）——
 * 随机藏在 useState 初始化器调用的 helper 或 useMemo 工厂里，
 * 逐个组件改「首帧确定性 + 挂载后随机」要动 10+ 个文件且容易漏。
 * 这里在模块页统一包一层：模块本体永不参与 SSR，
 * 服务端与客户端首帧都是同一个占位框，hydration 必然一致。
 * 与 games/* 已有的「GameShell 交互后才渲染」保护同一思路。
 *
 * 代价：模块首帧多一次 effect 往返（占位框本就存在——模块是 next/dynamic 懒加载）。
 */
export default function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="rounded-2xl p-8 bg-white/60 border-2 border-moko-purple/10 text-center text-gray-400">
        🐣 模块加载中…
      </div>
    );
  }
  return <>{children}</>;
}
