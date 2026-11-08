'use client';

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClayCard, ClayButton, ClayInput } from '@/components/design-system';

const USERS = [
  {
    username: 'parent',
    label: '👩 爸爸妈妈',
    role: 'parent',
    color: 'from-moko-purple to-moko-violet',
    emoji: '👑',
  },
  {
    username: 'cara',
    label: '🧒 程程',
    role: 'child',
    color: 'from-moko-pink to-moko-rose',
    emoji: '🌟',
  },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 记住上次登录角色
  useEffect(() => {
    const saved = localStorage.getItem('lastUser');
    if (saved) setUsername(saved);
  }, []);

  // 选择用户后填入用户名，密码需手动输入
  function quickLogin(user: string) {
    setUsername(user);
    setPassword('');
    setError('');
    localStorage.setItem('lastUser', user);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    localStorage.setItem('lastUser', username);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || '登录失败');
      return;
    }

    // 顺序很重要：先 refresh 让 middleware 读到刚写入的 session cookie，**再**跳转。
    // 原来是 push 与 refresh 并发执行，push 触发的 middleware 检查可能跑在
    // cookie 生效之前，于是把 /dashboard 又弹回 /login（CI e2e 上偶发，
    // 表现为「Login API 200 但页面停在 /login」，重试即通过）。
    router.refresh();
    router.push(data.redirect);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #fce4ec 0%, #f3e5f5 30%, #e8eaf6 60%, #e0f2fe 100%)',
      }}
    >
      {/* 浮动萌可装饰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <img
          src="/moko/heartping.webp"
          alt="爱心萌可装饰图"
          width={80}
          height={80}
          className="absolute w-20 h-20 rounded-full opacity-10 float-moko"
          style={{ top: '8%', left: '6%', animationDelay: '0s' }}
        />
        <img
          src="/moko/courageping.webp"
          alt="正正萌可装饰图"
          width={64}
          height={64}
          className="absolute w-16 h-16 rounded-full opacity-10 float-moko"
          style={{ top: '12%', right: '8%', animationDelay: '1.5s' }}
        />
        <img
          src="/moko/singping.webp"
          alt="唱唱萌可装饰图"
          width={72}
          height={72}
          className="absolute w-18 h-18 rounded-full opacity-10 float-moko"
          style={{ bottom: '20%', left: '4%', animationDelay: '0.8s' }}
        />
        <img
          src="/moko/gemsping.webp"
          alt="宝石萌可装饰图"
          width={56}
          height={56}
          className="absolute w-14 h-14 rounded-full opacity-10 float-moko"
          style={{ bottom: '10%', right: '6%', animationDelay: '2.2s' }}
        />
        <img
          src="/moko/lemei.webp"
          alt="乐美装饰图"
          width={96}
          height={96}
          className="absolute w-24 h-24 rounded-full opacity-10 float-moko"
          style={{ top: '40%', left: '2%', animationDelay: '1s' }}
        />
        {/* 装饰性星星 */}
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="absolute text-2xl opacity-20 float-moko"
            style={{
              top: Math.random() * 90 + '%',
              left: Math.random() * 90 + '%',
              animationDelay: Math.random() * 3 + 's',
              animationDuration: 3 + Math.random() * 3 + 's',
              fontSize: 12 + Math.random() * 16 + 'px',
            }}
          >
            {['✨', '⭐', '💫', '🌟', '🦋'][i % 5]}
          </span>
        ))}
      </div>

      <ClayCard theme="violet" className="relative z-10 p-8 md:p-10 w-full max-w-md text-center">
        {/* 乐美欢迎头像 */}
        <div className="relative mx-auto mb-5 w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-moko-pink to-moko-purple opacity-20 animate-pulse" />
          <img
            src="/moko/lemei.webp"
            alt="乐美"
            width={112}
            height={112}
            className="absolute left-2 top-2 h-28 w-28 rounded-full border-4 border-moko-pink object-cover shadow-lg z-10"
            decoding="async"
          />
          <span className="absolute -bottom-1 -right-1 text-3xl z-20">👑</span>
        </div>

        <h1 className="text-3xl font-black text-moko-violet mb-1">程程学习工作台</h1>
        <p className="text-moko-rose font-bold text-sm mb-6">和奇妙萌可一起学习吧 ✨</p>

        {/* 快速选择：家长 / 孩子 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {USERS.map((u) => (
            <ClayButton
              key={u.username}
              onClick={() => quickLogin(u.username)}
              variant={username === u.username ? 'brand' : 'outline'}
              size="lg"
              className="h-20 flex flex-col gap-1"
            >
              <span className="text-3xl">{u.emoji}</span>
              <span className="font-bold text-sm">{u.label}</span>
            </ClayButton>
          ))}
        </div>

        <form id="login-form" onSubmit={submit} className="space-y-4">
          <ClayInput
            type="text"
            name="username"
            placeholder="用户名"
            value={username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
            size="lg"
          />
          <ClayInput
            type="password"
            name="password"
            placeholder="密码"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            size="lg"
          />
          {error && (
            <p
              className="text-danger-foreground font-bold text-sm bg-danger/10 border border-danger/20 rounded-2xl p-3"
              role="alert"
            >
              {error}
            </p>
          )}
          <ClayButton type="submit" variant="brand" size="xl" fullWidth loading={loading}>
            ✨ 进入学习世界
          </ClayButton>
        </form>
      </ClayCard>
    </div>
  );
}
