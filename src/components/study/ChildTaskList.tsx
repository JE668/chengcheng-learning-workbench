'use client';

import { useState } from 'react';
import type { Task, Subject } from '@/lib/types';

const SUBJECT_COLOR: Record<Subject, string> = {
  语文: 'bg-moko-pink text-white',
  数学: 'bg-moko-blue text-white',
  英语: 'bg-moko-mint text-white',
};

const FILTERS: ('全部' | Subject)[] = ['全部', '语文', '数学', '英语'];

export default function ChildTaskList({ tasks, initialPoints }: { tasks: Task[]; initialPoints: number }) {
  const [list, setList] = useState<Task[]>(tasks);
  const [filter, setFilter] = useState<'全部' | Subject>('全部');
  const [points, setPoints] = useState(initialPoints);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const shown = filter === '全部' ? list : list.filter((t) => t.subject === filter);
  const doneCount = list.filter((t) => t.completed).length;
  const total = list.length;

  async function complete(t: Task) {
    try {
      const res = await fetch(`/api/tasks/${t.id}/complete`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setList((prev) => prev.map((x) => (x.id === t.id ? { ...x, completed: true } : x)));
        setPoints((p) => p + t.points);
        setToast({ msg: `完成「${t.title}」，获得 ${t.points} 积分！`, ok: true });
      } else {
        setToast({ msg: String(data.error || '出了点小问题，再试一次～'), ok: false });
      }
    } catch {
      setToast({ msg: '网络开小差了，再试一次～', ok: false });
    }
    setTimeout(() => setToast(null), 2600);
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`p-3 rounded-2xl text-white font-bold text-center shadow ${toast.ok ? 'bg-moko-mint' : 'bg-red-400'}`}>
          {toast.msg}
        </div>
      )}

      <div className="card-moko">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-moko-violet">完成进度</span>
          <span className="font-black text-moko-rose">{doneCount}/{total}</span>
        </div>
        <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-moko-rose to-moko-pink transition-all duration-500"
            style={{ width: total ? `${(doneCount / total) * 100}%` : '0%' }}
          />
        </div>
        <div className="mt-2 text-sm text-gray-500">
          当前积分：<span className="font-black text-moko-rose">{points}</span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full font-bold text-sm transition ${
              filter === s ? 'bg-moko-violet text-white' : 'bg-white text-moko-violet border-2 border-moko-purple/20'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card-moko text-gray-500 text-center py-10">还没有任务哦，等爸爸妈妈布置吧～ 🐣</div>
      ) : (
        shown.map((t) => (
          <div key={t.id} className="card-moko">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SUBJECT_COLOR[t.subject]}`}>{t.subject}</span>
                  <span className="font-black text-lg text-moko-violet truncate">{t.title}</span>
                </div>
                {t.description && <p className="text-sm text-gray-600 mb-2">{t.description}</p>}
                <div className="text-xs text-moko-rose font-bold">🎯 {t.points} 积分</div>
              </div>
              <button
                disabled={t.completed}
                onClick={() => complete(t)}
                className={`shrink-0 px-4 py-2 rounded-2xl font-bold text-white shadow ${
                  t.completed ? 'bg-moko-mint cursor-default' : 'bg-gradient-to-r from-moko-rose to-moko-pink hover:scale-105 transition'
                }`}
              >
                {t.completed ? '已完成 ✓' : '完成'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
