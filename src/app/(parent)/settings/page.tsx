'use client';

import { useState } from 'react';
import { ChildSwitcher } from '@/components/ChildSwitcher';

export default function SettingsPage() {
  const [childUsername, setChildUsername] = useState('cara');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');

  const [resetPw, setResetPw] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetting, setResetting] = useState(false);

  async function save() {
    const res = await fetch('/api/child/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childUsername, newPassword }),
    });
    const d = await res.json();
    setMsg(d.ok ? '孩子密码已更新' : d.error || '更新失败');
  }

  async function resetFactory() {
    if (!resetPw) {
      setResetMsg('请输入家长密码');
      return;
    }
    if (!window.confirm('确定还原出厂设置吗？\n该家长名下所有孩子的学习数据（萌可图鉴、错题本、城堡进度、奖状、任务等）将被清空且不可恢复，账号保留。')) {
      return;
    }
    setResetting(true);
    try {
      const res = await fetch('/api/parent/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPw }),
      });
      const d = await res.json();
      if (d.ok) {
        setResetMsg('已还原出厂设置，所有学习数据已清空 ✅');
        setResetPw('');
      } else {
        setResetMsg(d.error || '还原失败');
      }
    } catch {
      setResetMsg('还原失败，请重试');
    } finally {
      setResetting(false);
    }
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

      <div className="card-moko border-2 border-red-300 mt-6">
        <h2 className="text-xl font-bold text-red-500 mb-2">还原出厂设置 🏭</h2>
        <p className="text-sm text-gray-600 mb-4">
          清空该家长名下所有孩子的学习数据（萌可图鉴、错题本、城堡进度、奖状、任务等），账号保留。
          测试完成后可用它一键还原，再正式给孩子使用。需要输入家长密码确认。
        </p>
        {resetMsg && <div className="mb-4 p-3 rounded-2xl bg-moko-mint text-white font-bold text-center">{resetMsg}</div>}
        <div className="space-y-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">家长密码</label>
            <input type="password" value={resetPw} onChange={e => setResetPw(e.target.value)} className="w-full rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-red-300 outline-none" placeholder="请输入家长密码" />
          </div>
          <button onClick={resetFactory} disabled={resetting} className="w-full py-3 bg-red-500 text-white text-xl font-extrabold rounded-2xl shadow hover:scale-[1.02] transition disabled:opacity-40 disabled:cursor-not-allowed">还原出厂设置</button>
        </div>
      </div>
    </div>
  );
}
