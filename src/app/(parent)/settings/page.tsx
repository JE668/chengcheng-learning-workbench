'use client';

import { useState } from 'react';
import { ChildSwitcher } from '@/components/ChildSwitcher';

export default function SettingsPage() {
  const [childUsername, setChildUsername] = useState('cara');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function save() {
    const res = await fetch('/api/child/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childUsername, newPassword }),
    });
    const d = await res.json();
    setMsg(d.ok ? '孩子密码已更新' : d.error || '更新失败');
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h1 className="text-3xl font-black text-moko-violet">设置 ⚙️</h1>
        <ChildSwitcher />
      </div>
      <div className="card-moko">
        <h2 className="text-xl font-bold text-moko-violet mb-4">修改孩子密码</h2>
        {msg && <div className="mb-4 p-3 rounded-2xl bg-moko-mint text-white font-bold text-center">{msg}</div>}
        <div className="space-y-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">孩子用户名</label>
            <input value={childUsername} onChange={e => setChildUsername(e.target.value)} className="w-full rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-moko-pink outline-none" />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">新密码（至少 4 位）</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-moko-pink outline-none" />
          </div>
          <button onClick={save} disabled={newPassword.length < 4} className="w-full py-3 bg-gradient-to-r from-moko-rose to-moko-pink text-white text-xl font-extrabold rounded-2xl shadow hover:scale-[1.02] transition disabled:opacity-40 disabled:cursor-not-allowed">保存修改</button>
        </div>
      </div>
    </div>
  );
}
