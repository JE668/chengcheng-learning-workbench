'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { User } from '@/lib/types';

const childLinks = [
  { href: '/home', label: '萌可小屋', icon: '🏠' },
  { href: '/daily-practice', label: '萌可闯关', icon: '🎯' },
  { href: '/study', label: '萌可学堂', icon: '📚' },
  { href: '/my-tasks', label: '我的任务', icon: '📝' },
  { href: '/textbook', label: '萌可课本', icon: '📖' },
  { href: '/games', label: '萌可游戏', icon: '🎮' },
  { href: '/moko-house', label: '萌可房间', icon: '🧸' },
  { href: '/co-op', label: '萌可帮帮忙', icon: '🤝' },
  { href: '/badges', label: '勋章墙', icon: '🥇' },
  { href: '/record', label: '成长记录', icon: '🏆' },
  { href: '/cert', label: '荣誉奖状', icon: '🎖️' },
  { href: '/castle', label: '萌可城堡', icon: '🏰' },
  { href: '/shop', label: '萌可商店', icon: '🛍️' },
];

/** 孩子端高频入口（移动端底部常驻，其余 8 个收入「更多」抽屉） */
const childPrimary = ['/home', '/study', '/daily-practice', '/games', '/castle'];
const childSecondary = childLinks.filter((l) => !childPrimary.includes(l.href));

const parentLinks = [
  { href: '/dashboard', label: '看板', icon: '📊' },
  { href: '/tasks', label: '任务', icon: '📝' },
  { href: '/dictation', label: '听写布置', icon: '🎤' },
  { href: '/mistakes', label: '错题本', icon: '📕' },
  { href: '/redeem', label: '兑换', icon: '🎁' },
  { href: '/award', label: '奖状颁发', icon: '🎖️' },
  { href: '/reports', label: '报告', icon: '📈' },
  { href: '/settings', label: '设置', icon: '⚙️' },
];

export default function Nav({ user }: { user: User }) {
  const pathname = usePathname() ?? '';
  const isParent = user.role === 'parent';
  const links = isParent ? parentLinks : childLinks;
  const logoutAction = '/api/auth/logout';
  const [moreOpen, setMoreOpen] = useState(false);

  const Item = ({ href, label, icon }: { href: string; label: string; icon: string }) => {
    const active = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-lg font-bold transition ${
          active
            ? 'bg-white text-moko-rose shadow-lg scale-105'
            : 'text-white/90 hover:bg-white/20'
        }`}
      >
        <span className="text-2xl">{icon}</span>
        <span className="hidden md:inline">{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-gradient-to-b from-moko-purple to-moko-violet p-4 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-8 px-2">
          <Image
            src="/moko/lemei.jpg"
            alt="logo"
            width={48}
            height={48}
            className="w-12 h-12 rounded-full border-4 border-white shadow"
            sizes="48px"
          />
          <div>
            <div className="font-bold text-xl leading-tight">程程学习工作台</div>
            <p className="text-xs opacity-80">{user.displayName} · {isParent ? '爸爸妈妈' : '小朋友'}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 min-h-0 overflow-y-auto no-scrollbar pr-1">
          {links.map((l) => <Item key={l.href} {...l} />)}
        </nav>
        <form action={logoutAction} method="POST">
          <button className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl text-white/90 hover:bg-white/20">
            <span>🚪</span><span>退出</span>
          </button>
        </form>
      </aside>

      {/* mobile bottom bar */}
      {isParent ? (
        /* 家长端入口少，全部显示+退出 */
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-gradient-to-r from-moko-purple to-moko-violet px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {parentLinks.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + '/');
              return (
                <Link key={l.href} href={l.href} aria-label={l.label}
                  className={`flex flex-col items-center justify-center flex-shrink-0 w-14 py-1.5 rounded-2xl transition tap ${active ? 'bg-white text-moko-rose shadow' : 'text-white/90 hover:bg-white/15'}`}
                >
                  <span className="text-2xl leading-none">{l.icon}</span>
                </Link>
              );
            })}
            <form action="/api/auth/logout" method="POST" className="flex-shrink-0">
              <button aria-label="退出" className="flex flex-col items-center justify-center w-14 py-1.5 rounded-2xl text-white/90 hover:bg-white/15 tap">
                <span className="text-2xl leading-none">🚪</span>
              </button>
            </form>
          </div>
        </nav>
      ) : (
        /* 孩子端：5 高频 + 更多按钮 */
        <>
          <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-gradient-to-r from-moko-purple to-moko-violet px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
            <div className="flex gap-1 justify-around">
              {childPrimary.map((href) => {
                const l = childLinks.find((x) => x.href === href)!;
                const active = pathname === l.href || pathname.startsWith(l.href + '/');
                return (
                  <Link key={l.href} href={l.href} aria-label={l.label}
                    className={`flex flex-col items-center justify-center min-w-0 flex-1 py-1.5 rounded-2xl transition tap ${active ? 'bg-white text-moko-rose shadow' : 'text-white/90 hover:bg-white/15'}`}
                  >
                    <span className="text-2xl leading-none">{l.icon}</span>
                    <span className="text-[10px] leading-tight mt-0.5 font-bold truncate max-w-full">{l.label}</span>
                  </Link>
                );
              })}
              <button onClick={() => setMoreOpen(true)} aria-label="更多"
                className="flex flex-col items-center justify-center min-w-0 flex-1 py-1.5 rounded-2xl text-white/90 hover:bg-white/15 tap"
              >
                <span className="text-2xl leading-none">⋯</span>
                <span className="text-[10px] leading-tight mt-0.5 font-bold">更多</span>
              </button>
            </div>
          </nav>

          {/* 更多抽屉 */}
          {moreOpen && (
            <div className="fixed inset-0 z-[60]" onClick={() => setMoreOpen(false)}>
              {/* 半透明遮罩 */}
              <div className="absolute inset-0 bg-black/40" />
              {/* 抽屉面板 */}
              <div
                className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-moko-purple to-moko-violet rounded-t-3xl p-5 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-2xl animate-slide-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-black text-lg">🧩 更多功能</span>
                  <button onClick={() => setMoreOpen(false)} className="w-8 h-8 rounded-full bg-white/20 text-white font-bold text-lg flex items-center justify-center tap">
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {childSecondary.map((l) => {
                    const active = pathname === l.href || pathname.startsWith(l.href + '/');
                    return (
                      <Link key={l.href} href={l.href} onClick={() => setMoreOpen(false)}
                        className={`flex flex-col items-center justify-center py-3 rounded-2xl transition tap ${active ? 'bg-white/30 text-white shadow' : 'text-white/90 hover:bg-white/15'}`}
                      >
                        <span className="text-3xl">{l.icon}</span>
                        <span className="text-[11px] font-bold mt-1 text-center leading-tight">{l.label}</span>
                      </Link>
                    );
                  })}
                  {/* 退出按钮 */}
                  <form action={logoutAction} method="POST" className="contents">
                    <button aria-label="退出"
                      className="flex flex-col items-center justify-center py-3 rounded-2xl text-white/60 hover:bg-white/15 tap"
                    >
                      <span className="text-3xl">🚪</span>
                      <span className="text-[11px] font-bold mt-1">退出</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}