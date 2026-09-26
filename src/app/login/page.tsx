'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/atomic/Button';
import { Input } from '@/components/atomic/Input';

const USERS = [
  { username: 'parent', label: '👩 爸爸妈妈', role: 'parent', color: 'from-moko-purple to-moko-violet', emoji: '👑' },
  { username: 'cara', label: '🧒 程程', role: 'child', color: 'from-moko-pink to-moko-rose', emoji: '🌟' },
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
    setLoading(true); setError('');
    localStorage.setItem('lastUser', username);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || '登录失败'); return; }
    router.push(data.redirect);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #fce4ec 0%, #f3e5f5 30%, #e8eaf6 60%, #e0f2fe 100%)',
      }}
    >
      {/* 浮动萌可装饰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Image src="/moko/heartping.jpg" alt="爱心萌可装饰图" width={80} height={80} className="absolute w-20 h-20 rounded-full opacity-10 float-moko" style={{ top: '8%', left: '6%', animationDelay: '0s' }} />
        <Image src="/moko/courageping.jpg" alt="正正萌可装饰图" width={64} height={64} className="absolute w-16 h-16 rounded-full opacity-10 float-moko" style={{ top: '12%', right: '8%', animationDelay: '1.5s' }} />
        <Image src="/moko/singping.jpg" alt="唱唱萌可装饰图" width={72} height={72} className="absolute w-18 h-18 rounded-full opacity-10 float-moko" style={{ bottom: '20%', left: '4%', animationDelay: '0.8s' }} />
        <Image src="/moko/gemsping.jpg" alt="宝石萌可装饰图" width={56} height={56} className="absolute w-14 h-14 rounded-full opacity-10 float-moko" style={{ bottom: '10%', right: '6%', animationDelay: '2.2s' }} />
        <Image src="/moko/lemei.jpg" alt="乐美装饰图" width={96} height={96} className="absolute w-24 h-24 rounded-full opacity-10 float-moko" style={{ top: '40%', left: '2%', animationDelay: '1s' }} />
        {/* 装饰性星星 */}
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="absolute text-2xl opacity-20 float-moko"
            style={{
              top: Math.random() * 90 + '%',
              left: Math.random() * 90 + '%',
              animationDelay: Math.random() * 3 + 's',
              animationDuration: (3 + Math.random() * 3) + 's',
              fontSize: (12 + Math.random() * 16) + 'px',
            }}
          >
            {['✨', '⭐', '💫', '🌟', '🦋'][i % 5]}
          </span>
        ))}
      </div>

      <div className="relative z-10 bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl p-8 md:p-10 w-full max-w-md text-center border-2 border-white/60">
        {/* 乐美欢迎头像 */}
        <div className="relative mx-auto mb-5 w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-moko-pink to-moko-purple opacity-20 animate-pulse" />
          <Image
            src="/moko/lemei.jpg"
            alt="乐美"
            fill
            className="w-28 h-28 rounded-full border-4 border-moko-pink shadow-lg mx-auto object-cover relative z-10"
            priority
            sizes="112px"
          />
          <span className="absolute -bottom-1 -right-1 text-3xl z-20">👑</span>
        </div>

        <h1 className="text-3xl font-black text-moko-violet mb-1">程程学习工作台</h1>
        <p className="text-moko-rose font-bold text-sm mb-6">和奇妙萌可一起学习吧 ✨</p>

        {/* 快速选择：家长 / 孩子 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {USERS.map((u) => (
            <button
              key={u.username}
              onClick={() => quickLogin(u.username)}
              className={'rounded-2xl p-4 shadow-lg border-2 transition-all active:scale-95 ' + (username === u.username ? 'border-moko-rose scale-105 bg-gradient-to-br ' + u.color + ' text-white' : 'border-gray-100 bg-white hover:border-moko-pink/30')}
            >
              <div className="text-3xl mb-1">{u.emoji}</div>
              <div className={'font-bold text-sm ' + (username === u.username ? 'text-white' : 'text-moko-violet')}>{u.label}</div>
            </button>
          ))}
        </div>

        <form id="login-form" onSubmit={submit} className="space-y-4">
          <Input
            type="text"
            name="username"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            size="lg"
          />
          <Input
            type="password"
            name="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            size="lg"
          />
          {error && <p className="text-red-500 font-bold text-sm bg-red-50 rounded-2xl p-3">{error}</p>}
          <Button type="submit" variant="brand" size="xl" fullWidth loading={loading}>
            ✨ 进入学习世界
          </Button>
        </form>


      </div>
    </div>
  );
}