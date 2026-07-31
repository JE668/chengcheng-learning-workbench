'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ChildItem {
  id: number;
  name: string;
  username: string;
  selected: boolean;
}

export function ChildSwitcher() {
  const router = useRouter();
  const [children, setChildren] = useState<ChildItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ username: '', name: '', password: '' });
  const [msg, setMsg] = useState('');

  async function load() {
    const res = await fetch('/api/children', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setChildren(data.children);
      setSelectedId(data.selectedId);
    }
  }
  useEffect(() => { load(); }, []);

  async function select(id: number) {
    setOpen(false);
    const res = await fetch(`/api/children/${id}/select`, { method: 'POST' });
    if (res.ok) {
      setSelectedId(id);
      router.refresh(); // 刷新服务端组件，让各看板切到新孩子
    }
  }

  async function addChild(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    const res = await fetch('/api/children', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setForm({ username: '', name: '', password: '' });
      setAdding(false);
      setMsg('已添加新孩子 🎉');
      await load();
    } else {
      setMsg(data.error || '添加失败');
    }
  }

  const current = children.find((c) => c.id === selectedId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-2xl px-4 py-2 bg-white/80 shadow border-2 border-moko-purple/30 hover:bg-white transition"
      >
        <span className="text-2xl">👧</span>
        <span className="font-black text-moko-violet">当前孩子：{current?.name ?? '—'}</span>
        <span className="text-moko-purple">▾</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-64 rounded-2xl bg-white shadow-xl border-2 border-moko-purple/30 p-2">
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => select(c.id)}
              className={`w-full text-left rounded-xl px-3 py-2 flex items-center justify-between hover:bg-moko-purple/10 ${c.selected ? 'bg-moko-purple/15 font-black' : ''}`}
            >
              <span>👧 {c.name}</span>
              {c.selected && <span className="text-moko-purple">✓</span>}
            </button>
          ))}

          <div className="my-2 border-t border-dashed border-gray-200" />

          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              className="w-full text-left rounded-xl px-3 py-2 text-moko-blue font-bold hover:bg-moko-blue/10"
            >
              ➕ 添加孩子
            </button>
          ) : (
            <form onSubmit={addChild} className="space-y-2 p-1">
              <input
                className="w-full rounded-lg border px-2 py-1 text-sm"
                placeholder="用户名(登录用)"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
              <input
                className="w-full rounded-lg border px-2 py-1 text-sm"
                placeholder="昵称(显示用)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="w-full rounded-lg border px-2 py-1 text-sm"
                type="password"
                placeholder="密码(≥4位)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 rounded-lg bg-moko-blue text-white font-bold py-1 text-sm">保存</button>
                <button type="button" onClick={() => setAdding(false)} className="flex-1 rounded-lg bg-gray-200 py-1 text-sm">取消</button>
              </div>
            </form>
          )}
          {msg && <p className="text-xs text-moko-rose px-2 pt-1">{msg}</p>}
        </div>
      )}
    </div>
  );
}
