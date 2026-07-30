'use client';

import { useEffect, useState } from 'react';

export default function RedeemPage() {
  const [items, setItems] = useState<any[]>([]);
  const [reward, setReward] = useState('萌可小玩具');
  const [cost, setCost] = useState(50);
  const [msg, setMsg] = useState('');

  async function load() {
    const r = await fetch('/api/redeem');
    const d = await r.json();
    setItems(d.redemptions || []);
  }

  useEffect(() => { load(); }, []);

  async function create() {
    const res = await fetch('/api/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rewardName: reward, cost }),
    });
    const d = await res.json();
    setMsg(d.ok ? '已为孩子创建兑换' : d.error);
    if (d.ok) load();
  }

  async function update(id: number, status: string) {
    await fetch('/api/redeem', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    load();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-black text-moko-violet mb-4">兑换管理 🎁</h1>
      <div className="card-moko mb-6">
        <h2 className="text-xl font-bold text-moko-violet mb-3">直接给孩子发奖励</h2>
        {msg && <div className="mb-3 p-2 rounded-xl bg-moko-mint text-white font-bold text-center">{msg}</div>}
        <div className="flex flex-col md:flex-row gap-3">
          <input value={reward} onChange={e => setReward(e.target.value)} className="flex-1 rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-moko-pink outline-none" />
          <input type="number" value={cost} onChange={e => setCost(Number(e.target.value))} className="w-24 rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-moko-pink outline-none" />
          <button onClick={create} className="btn-magic bg-moko-rose text-white">发放</button>
        </div>
      </div>

      <h2 className="text-2xl font-black text-moko-violet mb-3">兑换申请</h2>
      <div className="space-y-3">
        {items.map((r) => (
          <div key={r.id} className="card-moko flex flex-col md:flex-row justify-between md:items-center gap-3">
            <div>
              <div className="font-bold text-lg">{r.reward_name}</div>
              <div className="text-sm text-gray-500">-{r.cost} 积分 · {r.status === 'pending' ? '待审核' : r.status === 'approved' ? '已通过' : '已拒绝'}</div>
            </div>
            {r.status === 'pending' && (
              <div className="flex gap-2">
                <button onClick={() => update(r.id, 'approved')} className="btn-magic bg-moko-mint text-white text-sm">通过</button>
                <button onClick={() => update(r.id, 'rejected')} className="btn-magic bg-gray-300 text-white text-sm">拒绝</button>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <div className="card-moko text-gray-500">暂无兑换记录</div>}
      </div>
    </div>
  );
}
