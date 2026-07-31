'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/lib/types';

const childLinks = [
  { href: '/home', label: '首页', icon: '🏠' },
  { href: '/study', label: '学习', icon: '📚' },
  { href: '/my-tasks', label: '我的任务', icon: '📝' },
  { href: '/textbook', label: '课本', icon: '📖' },
  { href: '/games', label: '游戏', icon: '🎮' },
  { href: '/record', label: '记录', icon: '🏆' },
  { href: '/cert', label: '奖状', icon: '🎖️' },
  { href: '/castle', label: '城堡', icon: '🏰' },
  { href: '/shop', label: '商店', icon: '🛍️' },
];

const parentLinks = [
  { href: '/dashboard', label: '看板', icon: '📊' },
  { href: '/tasks', label: '任务', icon: '📝' },
  { href: '/mistakes', label: '错题本', icon: '📕' },
  { href: '/redeem', label: '兑换', icon: '🎁' },
  { href: '/reports', label: '报告', icon: '📈' },
  { href: '/settings', label: '设置', icon: '⚙️' },
];

export default function Nav({ user }: { user: User }) {
  const pathname = usePathname();
  const links = user.role === 'parent' ? parentLinks : childLinks;
  const logoutAction = user.role === 'parent' ? '/api/auth/logout' : '/api/auth/logout';

  const Item = ({ href, label, icon }: { href: string; label: string; icon: string }) => {
    const active = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-lg font-bold transition ${
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
          <img src="/moko/lemei.jpg" alt="logo" className="w-12 h-12 rounded-full border-4 border-white shadow" />
          <div>
            <h1 className="font-bold text-xl leading-tight">程程学习工作台</h1>
            <p className="text-xs opacity-80">{user.displayName} · {user.role === 'parent' ? '爸爸妈妈' : '小朋友'}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          {links.map((l) => <Item key={l.href} {...l} />)}
        </nav>
        <form action={logoutAction} method="POST">
          <button className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl text-white/90 hover:bg-white/20">
            <span>🚪</span><span>退出</span>
          </button>
        </form>
      </aside>

      {/* mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-gradient-to-r from-moko-purple to-moko-violet px-2 pb-2 pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
        <div className="flex justify-around">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`flex flex-col items-center p-2 rounded-xl ${pathname === l.href || pathname.startsWith(l.href + '/') ? 'bg-white text-moko-rose' : 'text-white/90'}`}>
              <span className="text-2xl">{l.icon}</span>
              <span className="text-xs font-bold">{l.label}</span>
            </Link>
          ))}
          <form action="/api/auth/logout" method="POST" className="flex flex-col items-center p-2 text-white/90">
            <button className="flex flex-col items-center"><span className="text-2xl">🚪</span><span className="text-xs font-bold">退出</span></button>
          </form>
        </div>
      </nav>
    </>
  );
}
