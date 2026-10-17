'use client';

import { useEffect, useState } from 'react';

/**
 * 🤝 每日组队挑战面板（家长看板用，2026-10-17）：
 * - 无今日挑战 → 选模块发起（预置几个适合组队的模块，也可手填 key）
 * - 有挑战 → 显示每个孩子的完成态，全员完成显示已结算
 * 模块 key 必须与 study-modules 的 key 一致（完成判定按它匹配）。
 */
const PRESET = [
  { key: 'make-ten', label: '凑十法（5关）' },
  { key: 'poems', label: '古诗诵读' },
  { key: 'mult-table', label: '乘法口诀表' },
  { key: 'pinyin-spell', label: '拼音拼读' },
  { key: 'characters', label: '识字挑战' },
];

interface ChallengeChild {
  id: number;
  name: string;
  completed: boolean;
}
interface Challenge {
  day: string;
  moduleKey: string;
  moduleLabel: string;
  rewarded: boolean;
  children: ChallengeChild[];
}

export default function CoopChallengePanel() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () =>
    fetch('/api/coop-challenge')
      .then((r) => r.json())
      .then((d) => setChallenge(d.challenge ?? null))
      .catch(() => setChallenge(null))
      .finally(() => setLoaded(true));

  useEffect(() => {
    void load();
    const t = setInterval(load, 60_000); // 孩子完成时家长这边自动亮
    return () => clearInterval(t);
  }, []);

  const launch = async (key: string, label: string) => {
    setBusy(true);
    setMsg('');
    try {
      const r = await fetch('/api/coop-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleKey: key, moduleLabel: label }),
      });
      const j = await r.json();
      if (r.ok) {
        setChallenge(j.challenge);
        setMsg('组队挑战已发起，孩子们都能在「萌可帮帮忙」看到～');
      } else setMsg(String(j.error || '发起失败'));
    } catch {
      setMsg('网络开小差了');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card-moko mb-6">
      <h2 className="text-xl font-black text-moko-violet mb-3">🤝 今日组队挑战</h2>
      {!loaded ? (
        <p className="text-gray-500 text-sm">加载中…</p>
      ) : challenge ? (
        <>
          <p className="font-bold text-moko-violet mb-3">
            {challenge.moduleLabel || challenge.moduleKey}
            {challenge.rewarded && (
              <span className="ml-2 rounded-full bg-moko-mint text-white text-xs font-black px-2 py-0.5">
                已达成，各 +5 星星币 🎉
              </span>
            )}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {challenge.children.map((ch) => (
              <div
                key={ch.id}
                className={`rounded-xl p-3 text-center border-2 ${
                  ch.completed ? 'bg-moko-mint/10 border-moko-mint' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="text-2xl mb-0.5">{ch.completed ? '✅' : '⏳'}</div>
                <div className="font-bold text-moko-violet text-sm">{ch.name}</div>
                <div className="text-xs text-gray-500">{ch.completed ? '完成啦' : '还没完成'}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-3">
            选一个模块，今天兄妹都完成它 → 每人 +5 星星币！孩子们在「萌可帮帮忙」页能看到彼此进度。
          </p>
          <div className="flex gap-2 flex-wrap">
            {PRESET.map((p) => (
              <button
                key={p.key}
                disabled={busy}
                onClick={() => launch(p.key, p.label)}
                className="px-4 py-2 rounded-2xl bg-white border-2 border-moko-purple/20 text-moko-violet font-bold text-sm hover:bg-moko-violet/10 transition disabled:opacity-50"
              >
                {p.label}
              </button>
            ))}
          </div>
        </>
      )}
      {msg && <p className="mt-3 text-sm font-bold text-moko-rose">{msg}</p>}
    </div>
  );
}
