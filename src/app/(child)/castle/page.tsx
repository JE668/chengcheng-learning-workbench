'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { HarvestBtn } from '@/components/castle-client';
import { useOfflineStore } from '@/lib/stores';
import { ClayCard } from '@/components/design-system';

import { CastleSkeleton, PenaltyAlert } from './components/CastleChrome';
import { SkinSwitcher } from './components/SkinSwitcher';
import { HallTab } from './components/HallTab';
import { GalleryTab } from './components/GalleryTab';
import { ShopTab } from './components/ShopTab';
import { BagTab } from './components/BagTab';
import { AchievementTab, type Badge } from './components/AchievementTab';
import { TimeGlassRequestBtn } from './components/TimeGlass';
import { TABS, type StateView, type CastleTab } from './components/types';

export default function CastlePage() {
  const router = useRouter();
  const [tab, setTab] = useState<CastleTab>('hall');
  const [state, setState] = useState<StateView | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    // 弱网优化：state 与 badges 无依赖关系，并行取（此前串行两个
    // 往返，移动网络晚高峰页面亮屏要多等一拍）
    const [r, b] = await Promise.all([fetch('/api/castle/state'), fetch('/api/castle/badges')]);
    const [j, bj] = await Promise.all([r.json(), b.json()]);
    setState(j);
    setBadges(bj.badges || []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function act(url: string, body?: Record<string, unknown>, offlineType?: string) {
    setBusy(true);
    setMsg('');
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const j = await r.json();
      setMsg(j.message || (j.ok ? '成功！' : j.error || ''));
      await load();
      router.refresh();
    } catch {
      // 网络错误：入离线队列，联网后自动重放
      if (offlineType && body) {
        useOfflineStore.getState().addAction({ type: offlineType as never, payload: body });
        setMsg('网络不稳，已离线保存，联网后自动同步～');
      } else {
        setMsg('网络错误');
      }
    } finally {
      setBusy(false);
    }
  }

  if (!state) return <CastleSkeleton />;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">🏰 萌可城堡</h1>
        <div className="text-sm font-bold text-moko-rose">
          ☀️ {state.sunlight} · ⭐ {state.starCoins} · 🛡️ {state.shieldEquipped}
          {state.freezeCount > 0 && ` · 🧊 ×${state.freezeCount}`}
        </div>
      </div>

      {/* 🔔 惩罚通报：登录后首次加载时展示 */}
      {state.penaltyAlert && (
        <PenaltyAlert
          alert={state.penaltyAlert}
          onClose={() => setState({ ...state, penaltyAlert: '' })}
        />
      )}

      {/* ⏳ 时光沙漏申请按钮 */}
      {(state.troublemakers.length > 0 || state.penaltyAlert) && (
        <TimeGlassRequestBtn busy={busy} onMsg={setMsg} />
      )}

      {/* 繁荣度 + 收获 */}
      <ClayCard className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-gray-600">城堡繁荣度</span>
          <div className="flex-1 h-3 rounded-full bg-moko-cream overflow-hidden">
            <div
              className="h-full prosperity-sparkle bg-gradient_to_r from-moko-yellow via-moko-pink to-moko-violet"
              style={{ width: `${Math.min(100, state.prosperity * 4)}%` }}
            />
          </div>
          <span className="text-sm font-bold text-moko-violet">{state.prosperity}</span>
        </div>
        <div className="mt-3">
          <HarvestBtn
            info={{
              harvestableStars: state.harvestableStars,
              friendTotal: state.friendTotal,
              friendHarvestedToday: state.friendHarvestedToday,
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">连续打卡 {state.streakDays} 天</span>
        </div>
      </ClayCard>

      {/* 城堡皮肤切换 */}
      <SkinSwitcher
        skin={state.skin}
        inventory={state.inventory}
        busy={busy}
        onSelect={(key) => void act('/api/castle/skin', { skin: key })}
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-full font-bold whitespace-nowrap ${tab === k ? 'bg-moko-rose text-white' : 'bg-white text-moko-violet shadow'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {msg && <p className="text-sm text-moko-violet font-semibold mb-3">{msg}</p>}

      {/* ===== 大厅 ===== */}
      {tab === 'hall' && <HallTab state={state} />}

      {/* ===== 图鉴（按系列分类） ===== */}
      {tab === 'gallery' && <GalleryTab state={state} />}

      {/* ===== 魔法商店（阳光） ===== */}
      {tab === 'shop' && (
        <ShopTab
          state={state}
          busy={busy}
          onBuy={(k) => void act('/api/castle/buy', { itemKey: k }, 'buy')}
        />
      )}

      {/* ===== 背包 ===== */}
      {tab === 'bag' && (
        <BagTab
          state={state}
          busy={busy}
          onUseItem={(k, day) => void act('/api/castle/use-item', { itemKey: k, day }, 'use-item')}
        />
      )}

      {/* ===== 成就 ===== */}
      {tab === 'achv' && <AchievementTab badges={badges} />}
    </div>
  );
}
