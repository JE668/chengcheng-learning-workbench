'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Subject } from '@/lib/types';

const SUBJECTS: { key: Subject; label: string; grad: string; icon: string }[] = [
  { key: '语文', label: '语文', grad: 'from-moko-pink to-moko-rose', icon: '📖' },
  { key: '数学', label: '数学', grad: 'from-moko-blue to-sky-400', icon: '🔢' },
  { key: '英语', label: '英语', grad: 'from-moko-yellow to-amber-300', icon: '🔤' },
];

/**
 * 今日三科打卡面板（孩子端）。
 * 打卡由「每日一练」全对后自动完成（写 confirmed），不再由孩子手动逐科提交。
 * 这里只展示三科真实状态，并在未完成时引导去做今日一练，避免「已提交却点不动」的困惑。
 */
export function CheckinPanel({ initial }: { initial: Record<Subject, string> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {SUBJECTS.map((s) => {
        const st = initial[s.key];
        const done = st !== 'pending';
        return (
          <div key={s.key} className={`rounded-3xl p-4 bg-gradient-to-br ${s.grad} text-white shadow-lg`}>
            <div className="text-3xl mb-1">{s.icon}</div>
            <div className="font-black text-lg mb-2">{s.label}</div>
            <div className={`w-full py-2 rounded-full font-bold text-sm ${done ? 'bg-white/30' : 'bg-white text-moko-rose'}`}>
              {done ? '今天已完成 🌟' : '待完成'}
            </div>
          </div>
        );
      })}
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
