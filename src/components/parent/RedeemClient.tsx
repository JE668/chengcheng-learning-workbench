'use client';

import { useEffect, useState } from 'react';
import { ClayCard, ClayButton } from '@/components/design-system';
import { REWARD_TEMPLATES } from '@/lib/moko';
import { EmptyState } from '@/components/EmptyState';

interface RedemptionItem {
  id: number;
  reward_name: string;
  cost: number;
  status: 'pending' | 'approved' | 'rejected';
}
interface Wish {
  id: number;
  text: string;
  status: 'pending' | 'approved' | 'fulfilled';
}
const WISH_META: Record<Wish['status'], { label: string; cls: string }> = {
  pending: { label: '待同意', cls: 'bg-gray-100 text-gray-500' },
  approved: { label: '已同意', cls: 'bg-moko-mint text-white' },
  fulfilled: { label: '已实现', cls: 'bg-moko-gold text-white' },
};

export function RedeemClient({ childId }: { childId: number }) {
  const [items, setItems] = useState<RedemptionItem[]>([]);
  const [reward, setReward] = useState('萌可小玩具');
  const [cost, setCost] = useState(50);
  const [msg, setMsg] = useState('');
  const [wishes, setWishes] = useState<Wish[]>([]);

  // 切换孩子后（childId 变化 → 服务端刷新本组件）重新拉取该孩子的兑换申请与愿望
  useEffect(() => {
    (async () => {
      const r = await fetch('/api/redeem');
      const d = await r.json();
      setItems((d.redemptions || []) as RedemptionItem[]);
      const w = await fetch('/api/wishes');
      const wd = await w.json();
      setWishes((wd.wishes || []) as Wish[]);
      setMsg('');
    })();
  }, [childId]);

  async function create() {
    const res = await fetch('/api/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rewardName: reward, cost }),
    });
    const d = await res.json();
    setMsg(d.ok ? '已为孩子创建兑换' : d.error);
    if (d.ok) {
      const r = await fetch('/api/redeem');
      const dd = await r.json();
      setItems((dd.redemptions || []) as RedemptionItem[]);
    }
  }

  async function update(id: number, status: string) {
    await fetch('/api/redeem', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    const r = await fetch('/api/redeem');
    const d = await r.json();
    setItems((d.redemptions || []) as RedemptionItem[]);
  }

  async function updateWish(id: number, status: 'approved' | 'fulfilled') {
    await fetch('/api/wishes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    const w = await fetch('/api/wishes');
    const wd = await w.json();
    setWishes((wd.wishes || []) as Wish[]);
  }

  function applyTemplate(name: string, tplCost: number) {
    setReward(name);
    setCost(tplCost);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <ClayCard theme="violet" className="mb-6">
        <h2 className="text-xl font-bold text-moko-violet mb-3">直接给孩子发奖励</h2>
        {msg && (
          <div className="mb-3 p-2 rounded-xl bg-moko-mint text-white font-bold text-center">
            {msg}
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            className="flex-1 rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-moko-pink outline-none"
          />
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
            className="w-24 rounded-2xl border-2 border-gray-200 px-4 py-2 focus:border-moko-pink outline-none"
          />
          <ClayButton variant="brand" onClick={create}>
            发放
          </ClayButton>
        </div>
        <div className="mt-3">
          <div className="text-xs text-gray-500 mb-1.5">快捷模板（点一下填好奖励名和积分）：</div>
          <div className="flex flex-wrap gap-2">
            {REWARD_TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => applyTemplate(t.name, t.cost)}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 hover:bg-moko-pink/20 hover:text-moko-rose transition"
              >
                {t.name} · {t.cost}分
              </button>
            ))}
          </div>
        </div>
      </ClayCard>

      {/* 🐷 愿望存钱罐 */}
      <h2 className="text-2xl font-black text-moko-violet mb-3">愿望存钱罐 🐷</h2>
      <div className="space-y-3 mb-6">
        {wishes.map((w) => {
          const m = WISH_META[w.status];
          return (
            <ClayCard
              key={w.id}
              theme="violet"
              className="flex flex-col md:flex-row justify-between md:items-center gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">💡</span>
                <div>
                  <div className="font-bold text-lg">{w.text}</div>
                  <div className="text-sm text-gray-500">{m.label}</div>
                </div>
              </div>
              {w.status === 'pending' && (
                <div className="flex gap-2">
                  <ClayButton variant="mint" size="sm" onClick={() => updateWish(w.id, 'approved')}>
                    同意兑换目标
                  </ClayButton>
                  <ClayButton
                    variant="gold"
                    size="sm"
                    onClick={() => updateWish(w.id, 'fulfilled')}
                  >
                    已实现
                  </ClayButton>
                </div>
              )}
              {w.status === 'approved' && (
                <ClayButton variant="gold" size="sm" onClick={() => updateWish(w.id, 'fulfilled')}>
                  已实现
                </ClayButton>
              )}
            </ClayCard>
          );
        })}
        {wishes.length === 0 && (
          <ClayCard theme="violet" className="text-gray-500">
            孩子还没往存钱罐里放愿望～
          </ClayCard>
        )}
      </div>

      <h2 className="text-2xl font-black text-moko-violet mb-3">兑换申请</h2>
      <div className="space-y-3">
        {items.map((r) => (
          <ClayCard
            key={r.id}
            theme="violet"
            className="flex flex-col md:flex-row justify-between md:items-center gap-3"
          >
            <div>
              <div className="font-bold text-lg">{r.reward_name}</div>
              <div className="text-sm text-gray-500">
                -{r.cost} 积分 ·{' '}
                {r.status === 'pending' ? '待审核' : r.status === 'approved' ? '已通过' : '已拒绝'}
              </div>
            </div>
            {r.status === 'pending' && (
              <div className="flex gap-2">
                <ClayButton variant="mint" size="sm" onClick={() => update(r.id, 'approved')}>
                  通过
                </ClayButton>
                <ClayButton
                  variant="destructive"
                  size="sm"
                  onClick={() => update(r.id, 'rejected')}
                >
                  拒绝
                </ClayButton>
              </div>
            )}
          </ClayCard>
        ))}
        {items.length === 0 && (
          <EmptyState
            emoji="🎁"
            title="暂无兑换记录"
            desc="孩子提交兑换申请后，会在这里出现待你审核。"
          />
        )}
      </div>
    </div>
  );
}
