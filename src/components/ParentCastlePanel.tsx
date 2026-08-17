'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface StateView {
  today: string;
  sunlight: number; starCoins: number; prosperity: number; streakDays: number; shieldEquipped: number;
  checkins: Record<string, string>;
  residents: { key: string }[];
  troublemakers: { key: string }[];
  missedDays: { day: string; missed: string[]; hasTrouble: boolean }[];
}
const SUBJECTS = ['语文', '数学', '英语'];

export default function ParentCastlePanel() {
  const router = useRouter();
  const [state, setState] = useState<StateView | null>(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const r = await fetch('/api/castle/state');
    const j = await r.json();
    setState(j);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function confirm(day: string, subject: string) {
    setMsg('');
    const r = await fetch('/api/castle/confirm', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ day, subject }) });
    const j = await r.json();
    setMsg(j.message || (j.ok ? '已确认' : (j.error || '')));
    await load(); router.refresh();
  }

  async function giftTimeGlass() {
    setMsg('');
    const r = await fetch('/api/castle/gift-item', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ itemKey: 'timeglass' }) });
    const j = await r.json();
    setMsg(j.message || (j.ok ? '已发放' : (j.error || '')));
    await load(); router.refresh();
  }

  if (!state) return <div className="card-moko text-center text-moko-violet flex flex-col items-center justify-center gap-2"><span className="moko-loader"><span></span><span></span><span></span></span>城堡数据加载中…</div>;

  return (
    <div className="space-y-4">
      {/* 城堡总览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '阳光能量', value: state.sunlight, c: 'bg-moko-yellow' },
          { label: '星星币', value: state.starCoins, c: 'bg-moko-gold' },
          { label: '繁荣度', value: state.prosperity, c: 'bg-moko-blue' },
          { label: '入驻萌可', value: state.residents.length, c: 'bg-moko-purple' },
        ].map((s) => (
          <div key={s.label} className={`rounded-3xl p-4 shadow-lg border-2 border-white/40 text-center ${s.c} text-white`}>
            <div className="text-2xl font-black">{s.value}</div>
            <div className="text-xs opacity-90">{s.label}</div>
          </div>
        ))}
      </div>
      {state.troublemakers.length > 0 && (
        <div className="rounded-3xl p-4 shadow-lg border-2 border-red-100 bg-red-50 text-red-500 font-bold text-sm">⚠️ 有 {state.troublemakers.length} 只捣蛋萌可溜进城堡捣乱，快让孩子在背包用魔法喷雾，和乐美一起把它们捉回去，或在下方补作业。</div>
      )}

      {/* 今日打卡（由「今日一练」自动完成，家长端只读） */}
      <div className="card-moko">
        <h2 className="text-lg font-black text-moko-violet mb-1">🌟 今日学习打卡</h2>
        <p className="text-xs text-gray-500 mb-3">孩子完成「今日一练」三科全对即自动打卡，无需家长确认。</p>
        <div className="space-y-2">
          {SUBJECTS.map((sub) => {
            const st = state.checkins[sub] || 'pending';
            const label = st === 'confirmed' ? '已完成 ✓' : st === 'child_done' ? '已提交（旧）' : '待完成';
            const cls = st === 'confirmed' ? 'text-green-600 font-bold' : 'text-gray-500';
            return (
              <div key={sub} className="flex items-center justify-between bg-moko-cream rounded-2xl px-4 py-2">
                <span className="font-bold text-moko-violet">{sub}</span>
                <span className={`text-sm ml-auto ${cls}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 补作业（过去未完成） */}
      {state.missedDays.length > 0 && (
        <div className="card-moko">
          <h2 className="text-lg font-black text-moko-violet mb-2">🛠️ 补作业（过去未完成日期）</h2>
          <p className="text-xs text-gray-500 mb-2">补完某天三科并确认后，孩子会收到乐美送来的魔法喷雾，用来把捣蛋萌可捉回。</p>
          <div className="space-y-3">
            {state.missedDays.map((d) => (
              <div key={d.day} className="border rounded-2xl p-3 bg-moko-cream">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-moko-violet">{d.day}</span>
                  {d.hasTrouble && <span className="text-xs text-red-500">⚠️ 有捣蛋萌可捣乱</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map((sub) =>
                    d.missed.includes(sub) ? (
                      <button key={sub} onClick={() => confirm(d.day, sub)} className="px-3 py-1 rounded-full bg-white shadow text-sm font-bold text-moko-rose">补 {sub}</button>
                    ) : (
                      <span key={sub} className="px-3 py-1 rounded-full bg-green-100 text-green-600 text-sm">✓ {sub}</span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* 送时光沙漏（家长直接赠送，不消耗孩子资源） */}
      <div className="rounded-3xl p-4 shadow-lg border-2 border-moko-violet/20 bg-moko-violet/5 flex items-center gap-3">
        <div className="text-4xl">⏳</div>
        <div className="flex-1">
          <div className="font-bold text-moko-violet">送孩子一个时光沙漏</div>
          <div className="text-xs text-gray-500">孩子收到后可在城堡背包里使用，选一个漏做的日期补打卡。不消耗孩子的星星币。</div>
        </div>
        <button onClick={giftTimeGlass} className="px-4 py-2 rounded-full bg-moko-violet text-white font-bold text-sm shadow active:scale-95 transition">
          赠送
        </button>
      </div>

      {msg && <p className="text-sm text-moko-violet font-semibold">{msg}</p>}
    </div>
  );
}
