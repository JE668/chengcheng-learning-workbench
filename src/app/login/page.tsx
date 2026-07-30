'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-moko-pink via-moko-purple to-moko-violet">
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 w-full max-w-md text-center">
        <img src="/moko/lemei.jpg" alt="乐美" className="w-28 h-28 rounded-full border-4 border-moko-pink shadow mx-auto mb-4 object-cover" />
        <h1 className="text-3xl font-black text-moko-violet mb-2">程程学习工作台</h1>
        <p className="text-gray-500 mb-6">和奇妙萌可一起学习吧 ✨</p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="text"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-5 py-3 rounded-2xl border-2 border-gray-200 text-lg focus:border-moko-pink outline-none"
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-3 rounded-2xl border-2 border-gray-200 text-lg focus:border-moko-pink outline-none"
          />
          {error && <p className="text-red-500 font-bold">{error}</p>}
          <button disabled={loading} className="w-full py-4 bg-gradient-to-r from-moko-rose to-moko-pink text-white text-xl font-extrabold rounded-2xl shadow hover:scale-[1.02] transition disabled:opacity-60">
            {loading ? '登录中...' : '进入工作台'}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-6">默认家长 parent / 12345678，孩子 cheng / 12345678</p>
      </div>
    </div>
  );
}
