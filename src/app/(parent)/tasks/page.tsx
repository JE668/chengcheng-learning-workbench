'use client';

import { useState } from 'react';

export default function TasksPage() {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('语文');
  const [desc, setDesc] = useState('');
  const [points, setPoints] = useState(5);
  const [msg, setMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, subject, description: desc, points }),
    });
    if (res.ok) { setMsg('任务发布成功！'); setTitle(''); setDesc(''); }
    else setMsg('发布失败');
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-black text-moko-violet mb-4">发布学习任务 📝</h1>
      <div className="card-moko">
        {msg && <div className="mb-4 p-3 rounded-2xl bg-moko-mint text-white font-bold text-center">{msg}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">任务名称</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-moko-pink outline-none" />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">学科</label>
            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-moko-pink outline-none">
              <option>语文</option><option>数学</option><option>英语</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">描述</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} className="w-full rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-moko-pink outline-none" />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">积分奖励</label>
            <input type="number" min={1} max={50} value={points} onChange={e => setPoints(Number(e.target.value))} className="w-full rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-moko-pink outline-none" />
          </div>
          <button className="w-full py-3 bg-gradient-to-r from-moko-rose to-moko-pink text-white text-xl font-extrabold rounded-2xl shadow hover:scale-[1.02] transition">发布任务</button>
        </form>
      </div>
    </div>
  );
}
