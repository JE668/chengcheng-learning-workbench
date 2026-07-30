'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { starShop } from '@/lib/moko';

interface StateView {
  starCoins: number;
  inventory: Record<string, number>;
}
export default function ShopPage() {
  const router = useRouter();
  const [state, setState] = useState<StateView | null>(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const r = await fetch('/api/castle/state');
    const j = await r.json();
    setState({ starCoins: j.starCoins, inventory: j.inventory });
  }, []);
  useEffect(() => { load(); }, [load]);

  async function buy(key: string, cost: number) {
    setMsg('');
    const r = await fetch('/api/castle/buy', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ itemKey: key }) });
    const j = await r.json();
    setMsg(j.message || (j.ok ? '兑换成功！' : (j.error || '')));
    await load(); router.refresh();
  }

  if (!state) return <div className="max-w-3xl mx-auto text-center py-20 text-moko-violet font-bold">商城加载中… ✨</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-black text-moko-violet">🛍️ 星星币商城</h1>
        <div className="text-sm font-bold text-moko-gold">⭐ {state.starCoins}</div>
      </div>
      <p className="text-gray-500 mb-4 text-sm">用好朋友萌可每天产出的星星币，兑换长期小奖励～</p>
      {msg && <p className="text-sm text-moko-violet font-semibold mb-3">{msg}</p>}
      <div className="space-y-3">
        {starShop.map((s) => {
          const owned = Number(state.inventory[s.key] || 0) > 0;
          const afford = state.starCoins >= s.cost;
          return (
            <div key={s.key} className="card-moko flex items-center gap-3">
              <div className="text-4xl">{s.icon}</div>
              <div className="flex-1">
                <div className="font-bold text-moko-violet">{s.name}</div>
                <div className="text-xs text-gray-500">{s.desc}</div>
              </div>
              {owned ? (
                <span className="text-sm font-bold text-green-500">已拥有 ✓</span>
              ) : (
                <button onClick={() => buy(s.key, s.cost)} disabled={!afford} className={`btn-magic text-white text-sm whitespace-nowrap ${afford ? 'bg-moko-gold' : 'bg-gray-300 cursor-not-allowed'}`}>⭐ {s.cost}</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
