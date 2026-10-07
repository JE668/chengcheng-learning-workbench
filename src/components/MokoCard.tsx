import Image from 'next/image';
import Link from 'next/link';
// 显式导入 React：Next 的 JSX 转换会自动注入，但 vitest/esbuild 直跑时不会，
// 缺了它单测里会抛 "React is not defined"（与 atomic/a11y.test.tsx 的约定一致）。
import React, { type ReactNode } from 'react';

export default function MokoCard({
  href,
  title,
  desc,
  img,
  color,
  badge,
}: {
  href?: string;
  title: string;
  desc?: string;
  img: string;
  color: string;
  /**
   * 右上角角标位置的内容。
   *
   * 接受 ReactNode 而非 string：本卡片常用于服务端组件，而「历史最佳成绩」
   * 这类数据存在 localStorage（客户端专属）。若在服务端组件里直接读，
   * 会因 `typeof window === 'undefined'` 恒得空值，角标永远不显示。
   * 因此调用方传入一个**客户端组件**（见 GameBestBadge），
   * 由它在水合后自行决定渲染与否，并自行输出定位样式。
   */
  badge?: ReactNode;
}) {
  const body = (
    <div
      className={`rounded-3xl p-4 shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1 ${color} text-white overflow-hidden relative`}
    >
      {badge}
      <Image
        src={img || '/moko/lemei.jpg'}
        alt={title}
        width={128}
        height={128}
        className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-2xl border-4 border-white/40 shadow mb-3"
      />
      <h3 className="text-xl md:text-2xl font-extrabold drop-shadow">{title}</h3>
      {desc ? <p className="text-sm md:text-base opacity-90 mt-1 font-medium">{desc}</p> : null}
      <div className="absolute -right-6 -bottom-6 text-8xl opacity-10">✨</div>
    </div>
  );
  if (href) return <Link href={href}>{body}</Link>;
  return body;
}
