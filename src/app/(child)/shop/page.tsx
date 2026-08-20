'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { starShop } from '@/lib/moko';
import { EmptyState } from '@/components/EmptyState';

interface StateView {
  starCoins: number;
  inventory: Record<string, number>;
}
interface Wish {
  id: number;
  text: string;
  status: 'pending' | 'approved' | 'fulfilled';
}
const WISH_META: Record<Wish['status'], { label: string; cls: string }> = {
  pending: { label: '等爸爸妈妈看看 😊', cls: 'bg-gray-100 text-gray-500' },
  approved: { label: '已同意·努力攒星星币 💪', cls: 'bg-moko-mint text-white' },
  fulfilled: { label: '已经实现啦 🎉', cls: 'bg-moko-gold text-white' },
};

export default function ShopPage() {
  const router = useRouter();
  const [state, setState] = useState<StateView | null>(null);
  const [msg, setMsg] = useState('');
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [wishText, setWishText] = useState('');

  const load = useCallback(async () => {
    const r = await fetch('/api/castle/state');
    const j = await r.json();
    setState({ starCoins: j.starCoins, inventory: j.inventory });
  }, []);
  const loadWishes = useCallback(async () => {
    const r = await fetch('/api/wishes');
    const j = await r.json();
    setWishes((j.wishes || []) as Wish[]);
  }, []);
  useEffect(() => {
    load();
    loadWishes();
  }, [load, loadWishes]);

  async function buy(key: string, cost: number) {
    setMsg('');
    const r = await fetch('/api/castle/buy', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ itemKey: key }) });
    const j = await r.json();
    setMsg(j.message || (j.ok ? '兑换成功！' : (j.error || '')));
    await load(); router.refresh();
  }

  async function addWish() {
    const t = wishText.trim();
    if (!t) return;
    setWishText('');
    await fetch('/api/wishes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: t }) });
    await loadWishes();
  }

  if (!state) return <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-20 gap-3 text-moko-violet font-bold"><span className="moko-loader"><span></span><span></span><span></span></span>商城加载中… ✨</div>;

  return (
    <div className="max-w-3xl mx-auto fade-up">
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">🛍️ 星星币商城</h1>
        <div className="text-sm font-bold text-moko-gold">⭐ {state.starCoins}</div>
      </div>

      {/* 🐷 愿望存钱罐 */}
      <div className="rounded-3xl p-5 mb-5 bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-moko-pink/30 shadow">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🐷</span>
          <h2 className="text-lg font-black text-moko-rose">我的愿望存钱罐</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">把想换的奖励写进存钱罐，攒够星星币、爸爸妈妈同意就能实现啦～</p>
        <div className="flex gap-2 mb-3">
          <input
            value={wishText}
            onChange={(e) => setWishText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addWish()}
            placeholder="我想换……（如：去公园玩、一本恐龙书）"
            maxLength={100}
            className="flex-1 rounded-2xl border-2 border-moko-pink/30 px-4 py-2 text-sm focus:border-moko-pink outline-none"
          />
          <button onClick={addWish} className="btn btn-primary text-sm whitespace-nowrap">存进去 💰</button>
        </div>
        <div className="space-y-2">
          {wishes.map((w) => {
            const m = WISH_META[w.status];
            return (
              <div key={w.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm">
                <span className="flex-1 text-sm font-semibold text-gray-700 truncate">{w.text}</span>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${m.cls}`}>{m.label}</span>
              </div>
            );
          })}
          {wishes.length === 0 && <EmptyState emoji="🐷" title="存钱罐还是空的" desc="写下第一个愿望吧～" />}
        </div>
      </div>

      <p className="text-gray-500 mb-4 text-sm">用好朋友萌可每天产出的星星币，兑换长期小奖励～</p>
      {msg && <p className="text-sm text-moko-violet font-semibold mb-3">{msg}</p>}
      <div className="space-y-3">
        {starShop.map((s) => {
          const owned = Number(state.inventory[s.key] || 0) > 0;
          const afford = state.starCoins >= s.cost;
          const isSkin = s.key.startsWith('skin_');
          const skinPreview: Record<string, string> = {
            skin_star: 'bg-gradient-to-br from-indigo-400 to-purple-600',
            skin_candy: 'bg-gradient-to-br from-pink-300 to-orange-300',
          };
          return (
            <div key={s.key} className="card-moko flex items-center gap-3">
              <div className="text-4xl">{s.icon}</div>
              <div className="flex-1">
                <div className="font-bold text-moko-violet">{s.name}</div>
                <div className="text-xs text-gray-500">{s.desc}</div>
                {isSkin && (
                  <div className={`mt-1.5 h-8 rounded-lg ${skinPreview[s.key] ?? 'bg-gray-200'} flex items-center justify-center`}>
                    <span className="text-xs text-white/80 font-bold">预览效果</span>
                  </div>
                )}
              </div>
              {owned ? (
                <span className="text-sm font-bold text-green-500">已拥有 ✓</span>
              ) : (
                <button onClick={() => buy(s.key, s.cost)} disabled={!afford} className={`btn text-white text-sm whitespace-nowrap ${afford ? 'btn-gold' : 'bg-gray-300 cursor-not-allowed'}`}>⭐ {s.cost}</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
