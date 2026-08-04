'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChildSwitcher } from '@/components/ChildSwitcher';

type PTask = {
  id: number;
  title: string;
  subject: string;
  description: string;
  points: number;
  created_at: string;
};

const SUBJECTS = ['语文', '数学', '英语'];

export default function TasksPage() {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('语文');
  const [desc, setDesc] = useState('');
  const [points, setPoints] = useState(5);
  const [msg, setMsg] = useState('');

  const [tasks, setTasks] = useState<PTask[]>([]);
  const [editing, setEditing] = useState<PTask | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [eTitle, setETitle] = useState('');
  const [eSubject, setESubject] = useState('语文');
  const [eDesc, setEDesc] = useState('');
  const [ePoints, setEPoints] = useState(5);

  async function load() {
    const res = await fetch('/api/tasks');
    const data = await res.json() as { tasks?: Array<Record<string, unknown>> };
    setTasks(
      (data.tasks || []).map((r) => ({
        id: Number(r.id),
        title: String(r.title ?? ''),
        subject: String(r.subject ?? ''),
        description: String(r.description ?? ''),
        points: Number(r.points ?? 0),
        created_at: String(r.created_at ?? ''),
      })),
    );
  }
  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, subject, description: desc, points }),
    });
    if (res.ok) {
      setMsg('任务发布成功！');
      setTitle('');
      setDesc('');
      setPoints(5);
      setSubject('语文');
      await load();
    } else setMsg('发布失败，请重试');
  }

  function startEdit(t: PTask) {
    setEditing(t);
    setETitle(t.title);
    setESubject(t.subject);
    setEDesc(t.description);
    setEPoints(t.points);
    setConfirmId(null);
  }
  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/tasks/${editing!.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: eTitle, subject: eSubject, description: eDesc, points: ePoints }),
    });
    if (res.ok) {
      setEditing(null);
      setMsg('已保存修改');
      await load();
    } else setMsg('修改失败，请重试');
  }
  async function remove(id: number) {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    setConfirmId(null);
    if (res.ok) {
      setMsg('已删除任务');
      await load();
    } else setMsg('删除失败，请重试');
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h1 className="text-3xl font-black text-moko-violet">学习任务 📝</h1>
        <div className="flex items-center gap-2">
          <Link href="/dictation" className="px-4 py-2 rounded-2xl bg-gradient-to-r from-moko-rose to-moko-pink text-white font-black shadow hover:scale-105 transition text-sm">🎤 布置听写/口算</Link>
          <ChildSwitcher />
        </div>
      </div>

      <div className="card-moko mb-6">
        {editing ? (
          <form onSubmit={saveEdit} className="space-y-4">
            <div className="font-black text-moko-violet">编辑：{editing.title}</div>
            <Field label="任务名称" value={eTitle} onChange={setETitle} />
            <div>
              <label className="block font-bold text-gray-700 mb-1">学科</label>
              <select
                value={eSubject}
                onChange={(e) => setESubject(e.target.value)}
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-moko-pink outline-none"
              >
                {SUBJECTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <Field label="描述" value={eDesc} onChange={setEDesc} />
            <div>
              <label className="block font-bold text-gray-700 mb-1">积分奖励</label>
              <input
                type="number"
                min={1}
                max={50}
                value={ePoints}
                onChange={(e) => setEPoints(Number(e.target.value))}
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-moko-pink outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-3 bg-gradient-to-r from-moko-rose to-moko-pink text-white text-lg font-extrabold rounded-2xl shadow hover:scale-[1.02] transition">
                保存修改
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-5 py-3 rounded-2xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {msg && <div className="mb-2 p-3 rounded-2xl bg-moko-mint text-white font-bold text-center">{msg}</div>}
            <div>
              <label className="block font-bold text-gray-700 mb-1">任务名称</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-moko-pink outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">学科</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-moko-pink outline-none"
              >
                {SUBJECTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">描述</label>
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-moko-pink outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">积分奖励</label>
              <input
                type="number"
                min={1}
                max={50}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-moko-pink outline-none"
              />
            </div>
            <button className="w-full py-3 bg-gradient-to-r from-moko-rose to-moko-pink text-white text-xl font-extrabold rounded-2xl shadow hover:scale-[1.02] transition">
              发布任务
            </button>
          </form>
        )}
      </div>

      <h2 className="text-2xl font-black text-moko-violet mb-3">已发布任务（{tasks.length}）</h2>
      <div className="space-y-2">
        {tasks.map((t) => (
          <div key={t.id} className="card-moko flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-bold text-moko-violet truncate">
                {t.title} <span className="text-xs text-gray-400 font-normal">· {t.subject} · {t.points}分</span>
              </div>
              {t.description && <div className="text-sm text-gray-500 truncate">{t.description}</div>}
            </div>
            {confirmId === t.id ? (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => remove(t.id)}
                  className="px-3 py-1.5 rounded-xl bg-red-400 text-white font-bold text-sm hover:opacity-90"
                >
                  确定
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="px-3 py-1.5 rounded-xl bg-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            ) : (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startEdit(t)}
                  className="px-3 py-1.5 rounded-xl bg-moko-yellow text-gray-800 font-bold text-sm hover:opacity-90"
                >
                  编辑
                </button>
                <button
                  onClick={() => setConfirmId(t.id)}
                  className="px-3 py-1.5 rounded-xl bg-red-400 text-white font-bold text-sm hover:opacity-90"
                >
                  删除
                </button>
              </div>
            )}
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="card-moko text-gray-500 text-center py-6">还没有发布任务，在上面填表发布第一个吧！</div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block font-bold text-gray-700 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-moko-pink outline-none"
      />
    </div>
  );
}
