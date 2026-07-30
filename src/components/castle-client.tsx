'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Subject } from '@/lib/types';

const SUBJECTS: { key: Subject; label: string; grad: string; icon: string }[] = [
  { key: '语文', label: '语文', grad: 'from-moko-pink to-moko-rose', icon: '📖' },
  { key: '数学', label: '数学', grad: 'from-moko-blue to-sky-400', icon: '🔢' },
  { key: '英语', label: '英语', grad: 'from-moko-yellow to-amber-300', icon: '🔤' },
];

const STATUS_TEXT: Record<string, string> = {
  pending: '我完成了',
  child_done: '已提交，等爸爸妈妈确认 ✅',
  confirmed: '今天已完成 🌟',
};

/** 今日三科打卡面板（孩子端） */
export function CheckinPanel({ initial }: { initial: Record<Subject, string> }) {
  const router = useRouter();
  const [status, setStatus] = useState<Record<Subject, string>>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  async function done(s: Subject) {
    if (status[s] !== 'pending') return;
    setBusy(s);
    setMsg('');
    try {
      const r = await fetch('/api/castle/checkin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subject: s }),
      });
      const j = await r.json();
      if (j.ok) {
        setStatus((p) => ({ ...p, [s]: 'child_done' }));
        setMsg('提交成功，等爸爸妈妈确认就可以获得萌可啦～');
        router.refresh();
      } else setMsg(j.error || '出错了');
    } catch {
      setMsg('网络错误');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SUBJECTS.map((s) => {
          const st = status[s.key];
          return (
            <div key={s.key} className={`rounded-3xl p-4 bg-gradient-to-br ${s.grad} text-white shadow-lg`}>
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className="font-black text-lg mb-2">{s.label}</div>
              <button
                disabled={st !== 'pending' || busy === s.key}
                onClick={() => done(s.key)}
                className={`w-full py-2 rounded-full font-bold text-sm transition transform active:scale-95 ${
                  st === 'pending' ? 'bg-white text-moko-rose hover:scale-105' : 'bg-white/30 cursor-default'
                }`}
              >
                {busy === s.key ? '提交中…' : STATUS_TEXT[st]}
              </button>
            </div>
          );
        })}
      </div>
      {msg && <p className="text-sm text-moko-violet font-semibold mt-3">{msg}</p>}
    </div>
  );
}

/** 一键收获星星币 */
export function HarvestBtn() {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  async function harvest() {
    setBusy(true);
    setMsg('');
    try {
      const r = await fetch('/api/castle/harvest', { method: 'POST' });
      const j = await r.json();
      setMsg(j.message || '');
      router.refresh();
    } catch {
      setMsg('网络错误');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button onClick={harvest} disabled={busy} className="btn-magic bg-moko-gold text-white">
        {busy ? '收获中…' : '⭐ 收获星星币'}
      </button>
      {msg && <span className="text-xs text-moko-violet font-semibold">{msg}</span>}
    </div>
  );
}
