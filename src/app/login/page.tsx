'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const USERS = [
  { username: 'parent', label: '👩 爸爸妈妈', role: 'parent', color: 'from-moko-purple to-moko-violet', emoji: '👑' },
  { username: 'cara', label: '🧒 程程', role: 'child', color: 'from-moko-pink to-moko-rose', emoji: '🌟' },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const router = useRouter();

  // 记住上次登录角色
  useEffect(() => {
    const saved = localStorage.getItem('lastUser');
    if (saved) setUsername(saved);
  }, []);

  // 儿童快捷登录：密码固定 0000，自动填充
  function quickLogin(user: string) {
    setUsername(user);
    localStorage.setItem('lastUser', user);
    if (user === 'cara') {
      setPassword('0000');
      // 自动提交
      setTimeout(() => document.getElementById('login-form')?.requestSubmit(), 100);
    }
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
        <img src="/moko/heartping.jpg" alt="" className="absolute w-20 h-20 rounded-full opacity-10 float-moko" style={{ top: '8%', left: '6%', animationDelay: '0s' }} />
        <img src="/moko/courageping.jpg" alt="" className="absolute w-16 h-16 rounded-full opacity-10 float-moko" style={{ top: '12%', right: '8%', animationDelay: '1.5s' }} />
        <img src="/moko/singping.jpg" alt="" className="absolute w-18 h-18 rounded-full opacity-10 float-moko" style={{ bottom: '20%', left: '4%', animationDelay: '0.8s' }} />
        <img src="/moko/gemsping.jpg" alt="" className="absolute w-14 h-14 rounded-full opacity-10 float-moko" style={{ bottom: '10%', right: '6%', animationDelay: '2.2s' }} />
        <img src="/moko/lemei.jpg" alt="" className="absolute w-24 h-24 rounded-full opacity-10 float-moko" style={{ top: '40%', left: '2%', animationDelay: '1s' }} />
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
          <img src="/moko/lemei.jpg" alt="乐美" className="w-28 h-28 rounded-full border-4 border-moko-pink shadow-lg mx-auto object-cover relative z-10" />
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
          <input
            type="text"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-5 py-3 rounded-2xl border-2 border-gray-200 text-lg focus:border-moko-pink outline-none transition bg-white/70"
          />
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3 rounded-2xl border-2 border-gray-200 text-lg focus:border-moko-pink outline-none transition bg-white/70 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-gray-400 hover:text-moko-rose transition"
              tabIndex={-1}
            >
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
          {error && <p className="text-red-500 font-bold text-sm bg-red-50 rounded-2xl p-3">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-moko-rose to-moko-pink text-white text-xl font-extrabold rounded-2xl shadow-lg hover:scale-[1.02] hover:shadow-xl transition disabled:opacity-60 active:scale-95"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="moko-loader"><span></span><span></span><span></span></span>
                登录中…
              </span>
            ) : '✨ 进入学习世界'}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-4">家长账号：parent / 12345678　孩子账号：cara / 0000</p>
      </div>
    </div>
  );
}
