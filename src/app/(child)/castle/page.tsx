'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { magicShop, starShop, MokoCategories } from '@/lib/moko';
import { MokoAvatar } from '@/components/MokoAvatar';
import { SeriesCompleteBanner } from '@/components/SeriesCompleteBanner';
import { EmptyState } from '@/components/EmptyState';
import { HarvestBtn } from '@/components/castle-client';

type Stage = 'obtained' | 'settled' | 'playing' | 'friend';
interface Resident {
  key: string; name: string; img: string; emoji: string; color: string;
  stage: Stage; mood: number; status: 'resident' | 'fled';
  progress: number; nextStage: Stage | null;
}
interface StateView {
  today: string; sunlight: number; starCoins: number; prosperity: number;
  streakDays: number; shieldEquipped: number; skin: string;
  checkins: Record<string, string>;
  residents: Resident[];
  gallery: { key: string; name: string; img: string; emoji: string; color: string; category?: string; subject?: string; owned: boolean }[];
  troublemakers: { key: string; name: string; img: string }[];
  inventory: Record<string, number>;
  missedDays: { day: string; missed: string[]; hasTrouble: boolean }[];
  canBuyShield: boolean; noStarToday: boolean; freezeCount: number;
  harvestableStars: number; friendTotal: number; friendHarvestedToday: number;
  penaltyAlert: string;
}
const STAGE_LABEL: Record<Stage, string> = { obtained: '刚解锁', settled: '入驻城堡', playing: '开心玩耍', friend: '好朋友' };
const TABS = [['hall', '🏰 大厅'], ['gallery', '📖 图鉴'], ['shop', '🛍️ 商店'], ['bag', '🎒 背包'], ['achv', '🏅 成就']] as const;
/** ⏳ 时光沙漏申请按钮：点击后向家长发起申请 */
function TimeGlassRequestBtn({ busy, onMsg }: { busy: boolean; onMsg: (m: string) => void }) {
  const [reqSent, setReqSent] = useState(false);
  return (
    <div className="mb-4 rounded-2xl bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 p-3 shadow">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⏳</span>
        <div className="flex-1">
          <div className="font-bold text-purple-700 text-sm">需要时光沙漏吗？</div>
          <div className="text-xs text-gray-500 mt-0.5">让爸爸妈妈帮你补打卡，找回萌可和星星币</div>
        </div>
        <button
          onClick={async () => {
            if (reqSent) return;
            setReqSent(true);
            try {
              const r = await fetch('/api/castle/request-timeglass', { method: 'POST' });
              const j = await r.json();
              onMsg(j.message || '已申请 ✅');
            } catch {
              onMsg('网络错误');
              setReqSent(false);
            }
          }}
          disabled={busy || reqSent}
          className={"shrink-0 px-4 py-2 rounded-xl font-bold text-sm shadow transition-all " + (reqSent ? "bg-gray-200 text-gray-400 cursor-default" : "bg-purple-500 text-white hover:bg-purple-600 active:scale-95")}
        >
          {reqSent ? '已申请 ✅' : '申请时光沙漏'}
        </button>
      </div>
    </div>
  );
}

const SKINS = [
  { key: 'default', name: '梦幻城堡', emoji: '🏰' },
  { key: 'skin_star', name: '星空城堡', emoji: '🌌' },
  { key: 'skin_candy', name: '糖果城堡', emoji: '🍬' },
];

export default function CastlePage() {
  const router = useRouter();
  const [tab, setTab] = useState<typeof TABS[number][0]>('hall');
  const [state, setState] = useState<StateView | null>(null);
  const [badges, setBadges] = useState<{ id: string; name: string; emoji: string; desc: string; earned: boolean; hint: string }[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch('/api/castle/state');
    const j = await r.json();
    setState(j);
    const b = await fetch('/api/castle/badges');
    const bj = await b.json();
    setBadges(bj.badges || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function act(url: string, body?: any) {
    setBusy(true); setMsg('');
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      const j = await r.json();
      setMsg(j.message || (j.ok ? '成功！' : (j.error || '')));
      await load(); router.refresh();
    } catch { setMsg('网络错误'); } finally { setBusy(false); }
  }

  if (!state)
    return (
      <div className="max-w-4xl mx-auto fade-up">
        {/* 骨架屏：模拟城堡页面布局 */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 w-40 rounded-2xl bg-moko-purple/20 animate-pulse" />
          <div className="h-6 w-32 rounded-2xl bg-moko-purple/15 animate-pulse" />
        </div>
        {/* 惩罚通报骨架 */}
        <div className="mb-4 h-20 rounded-2xl bg-gradient-to-r from-red-50/50 to-orange-50/50 border-2 border-red-100/50 animate-pulse" />
        {/* 繁荣度 + 收获骨架 */}
        <div className="card-moko mb-4">
          <div className="h-4 w-32 rounded-full bg-moko-purple/20 animate-pulse mb-4" />
          <div className="h-16 rounded-2xl bg-moko-gold/10 border-2 border-moko-gold/30 animate-pulse mb-3" />
          <div className="h-10 rounded-2xl bg-moko-gold/20 animate-pulse" />
        </div>
        {/* 选项卡骨架 */}
        <div className="flex gap-2 mb-4">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="h-10 w-20 rounded-full bg-moko-purple/15 animate-pulse" />
          ))}
        </div>
        {/* 城堡大厅骨架 */}
        <div className="card-moko">
          <div className="flex gap-4">
            {[1,2,3].map((i) => (
              <div key={i} className="w-28 text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-moko-purple/15 animate-pulse mb-2" />
                <div className="h-4 w-16 mx-auto rounded-full bg-moko-purple/20 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-moko-violet/40 text-sm mt-4 font-bold flex items-center justify-center gap-2">
          <span className="moko-loader"><span></span><span></span><span></span></span>
          萌可城堡加载中…
        </p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">🏰 萌可城堡</h1>
        <div className="text-sm font-bold text-moko-rose">☀️ {state.sunlight} · ⭐ {state.starCoins} · 🛡️ {state.shieldEquipped}{state.freezeCount > 0 && ` · 🧊 ×${state.freezeCount}`}</div>
      </div>

      {/* 🔔 惩罚通报：登录后首次加载时展示 */}
      {state.penaltyAlert && (
        <div className="mb-4 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 p-4 shadow-lg animate-bounce-in">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <div className="font-bold text-red-600 text-sm">城堡出事了！</div>
              <div className="text-sm text-red-700 mt-1">{state.penaltyAlert}</div>
              <div className="text-xs text-gray-500 mt-2">完成「今日一练」或使用道具可恢复城堡安宁 ✨</div>
            </div>
            <button
              onClick={() => setState({ ...state, penaltyAlert: '' })}
              className="text-red-400 hover:text-red-600 text-lg leading-none"
              title="关闭"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ⏳ 时光沙漏申请按钮 */}
      {(state.troublemakers.length > 0 || state.penaltyAlert) && (
        <TimeGlassRequestBtn busy={busy} onMsg={setMsg} />
      )}

      {/* 繁荣度 + 收获 */}
      <div className="card-moko mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-gray-600">城堡繁荣度</span>
          <div className="flex-1 h-3 rounded-full bg-moko-cream overflow-hidden">
            <div className="h-full prosperity-sparkle bg-gradient-to-r from-moko-yellow via-moko-pink to-moko-violet" style={{ width: `${Math.min(100, state.prosperity * 4)}%` }} />
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
      </div>

      {/* 城堡皮肤切换 */}
      <div className="card-moko mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-moko-violet mr-1">🎨 城堡皮肤：</span>
          {SKINS.map((s) => {
            const owned = s.key === 'default' || Number(state.inventory[s.key] || 0) > 0;
            const active = state.skin === s.key;
            return (
              <button
                key={s.key}
                onClick={() => owned && act('/api/castle/skin', { skin: s.key })}
                disabled={busy || !owned}
                title={owned ? `换成${s.name}` : '去星星币商城兑换'}
                className={`px-3 py-1.5 rounded-full font-bold text-sm transition ${active ? 'bg-moko-violet text-white' : owned ? 'bg-white text-moko-violet shadow' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                {s.emoji} {s.name}{!owned && ' 🔒'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-full font-bold whitespace-nowrap ${tab === k ? 'bg-moko-rose text-white' : 'bg-white text-moko-violet shadow'}`}>{label}</button>
        ))}
      </div>

      {msg && <p className="text-sm text-moko-violet font-semibold mb-3">{msg}</p>}

      {/* ===== 大厅 ===== */}
      {tab === 'hall' && (
        <div className={`card-moko relative overflow-hidden ${state.shieldEquipped > 0 ? 'shield-glow' : ''}`}>
          <div className={`castle-bg rounded-2xl p-4 min-h-[260px] ${state.skin === 'skin_star' ? 'castle-skin-star' : state.skin === 'skin_candy' ? 'castle-skin-candy' : 'castle-skin-default'}`}>
            {state.troublemakers.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {state.troublemakers.map((t, i) => (
                  <img key={i} src={t.img} alt={t.name} className="trouble-fly absolute w-16 h-16 rounded-full border-2 border-red-400 shadow-lg" style={{ top: `${10 + i * 18}%`, left: `${20 + i * 25}%`, animationDelay: `${i * 0.4}s` }} />
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-4 relative z-10">
              {state.residents.map((r) => (
                <div key={r.key} className={`w-28 text-center ${r.mood < 3 ? 'moko-sad' : 'moko-enter'} ${r.stage === 'friend' ? 'moko-walk' : ''}`}>
                  <div className="relative">
                    <MokoAvatar img={r.img} emoji={r.emoji} name={r.name} size={96} className="mx-auto" frameKey={Number(state.inventory.frame || 0) > 0 ? 'frame' : undefined} />
                    <div className="absolute -top-2 -right-2 text-lg">{'❤️'.repeat(r.mood)}{'🖤'.repeat(3 - r.mood)}</div>
                  </div>
                  <div className="font-bold text-moko-violet text-sm mt-1">{r.name}</div>
                  <div className="text-xs text-gray-500">{STAGE_LABEL[r.stage]}</div>
                  {r.stage !== 'friend' && (
                    <div className="h-1.5 rounded-full bg-white/70 mt-1 overflow-hidden">
                      <div className="h-full bg-moko-mint transition-all duration-700" style={{ width: `${Math.round(r.progress * 100)}%` }} />
                    </div>
                  )}
                  {r.stage === 'friend' && <div className="text-xs text-moko-mint font-bold mt-1">产出 ⭐</div>}
                </div>
              ))}
              {state.residents.length === 0 && <EmptyState emoji="🧸" title="还没有萌可入驻" desc="去完成「今日一练」打卡，就能召唤第一只萌可啦！" />}
            </div>
          </div>
          {state.troublemakers.length > 0 && (
            <p className="text-red-500 font-bold text-sm mt-3">⚠️ {state.troublemakers.length} 只捣蛋萌可溜进城堡捣乱！快在背包用魔法喷雾，和乐美一起把它们捉回去，或请爸爸妈妈补作业。</p>
          )}
        </div>
      )}

      {/* ===== 图鉴（按系列分类） ===== */}
      {tab === 'gallery' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="section-title">📖 萌可图鉴</h2>
            <span className="text-sm text-gray-500">共 {state.gallery.length} 种　已收集 {state.gallery.filter((g) => g.owned).length}</span>
          </div>
          {MokoCategories.filter((c) => c.key !== 'trouble').map((cat) => {
            const items = state.gallery.filter((g) => g.category === cat.key);
            if (!items.length) return null;
            const ownedCount = items.filter((g) => g.owned).length;
            const complete = ownedCount === items.length;
            return (
              <div key={cat.key}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{cat.emoji}</span>
                  <h2 className="section-title">{cat.label}</h2>
                  <span className="text-xs text-gray-400 hidden sm:inline">{cat.desc}</span>
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ml-auto ${complete ? 'bg-moko-gold text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {complete ? '👑 系列全齐' : `${ownedCount}/${items.length}`}
                  </span>
                </div>

                {complete && (
                  <div className="mb-3">
                    <SeriesCompleteBanner
                      catKey={cat.key}
                      label={cat.label}
                      emoji={cat.emoji}
                      members={items.map((g) => ({ img: g.img, emoji: g.emoji, name: g.name }))}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {items.map((g) => (
                    <div key={g.key} className={`card-moko text-center ${g.owned ? '' : 'opacity-70'}`}>
                      <MokoAvatar img={g.img} emoji={g.emoji} name={g.name} size={80} owned={g.owned} className="mx-auto" />
                      <div className="font-bold text-moko-violet text-sm mt-1">{g.name}</div>
                      <div className="text-xs text-gray-500">{g.owned ? '已收集 ✅' : '未解锁 🔒'}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== 魔法商店（阳光） ===== */}
      {tab === 'shop' && (
        <div className="space-y-3">
          <h2 className="section-title">🧪 魔法商店（阳光能量）</h2>
          {magicShop.map((s) => (
            <div key={s.key} className="card-moko flex items-center gap-3">
              <div className="text-4xl">{s.icon}</div>
              <div className="flex-1">
                <div className="font-bold text-moko-violet">{s.name}</div>
                <div className="text-xs text-gray-500">{s.desc}</div>
                {s.key === 'shield' && !state.canBuyShield && <div className="text-xs text-red-400">需连续打卡 3 天（当前 {state.streakDays} 天）</div>}
              </div>
              <button onClick={() => act('/api/castle/buy', { itemKey: s.key })} disabled={busy} className="btn btn-gold text-sm whitespace-nowrap">☀️ {s.cost}</button>
            </div>
          ))}
        </div>
      )}

      {/* ===== 背包 ===== */}
      {tab === 'bag' && (
        <div className="space-y-3">
          <h2 className="section-title">🎒 魔法背包</h2>
          <div className="card-moko text-sm text-gray-600">星星币余额：⭐ {state.starCoins}　护盾：🛡️ {state.shieldEquipped}{state.freezeCount > 0 ? `　冰冻：🧊 ×${state.freezeCount}` : ''}</div>
          {Number(state.inventory.spray || 0) > 0 && (
            <div className="rounded-3xl p-4 shadow-lg border-2 border-green-100 bg-green-50 flex items-center gap-3">
              <div className="text-4xl">🧴</div>
              <div className="flex-1"><div className="font-bold text-moko-violet">魔法喷雾 ×{state.inventory.spray}</div><div className="text-xs text-gray-500">捉回捣蛋萌可 + 安抚萌可 + 找回星星币</div></div>
              <button onClick={() => act('/api/castle/use-item', { itemKey: 'spray' })} disabled={busy} className="btn btn-mint text-sm">帮乐美捉回</button>
            </div>
          )}
          {Number(state.inventory.shield || 0) > 0 && (
            <div className="card-moko flex items-center gap-3"><div className="text-4xl">🛡️</div><div className="flex-1"><div className="font-bold text-moko-violet">护盾 ×{state.inventory.shield}</div><div className="text-xs text-gray-500">已自动装备，能帮乐美挡住一次捣蛋萌可</div></div></div>
          )}
          {state.freezeCount > 0 && (
            <div className="card-moko flex items-center gap-3"><div className="text-4xl">🧊</div><div className="flex-1"><div className="font-bold text-moko-violet">冰冻徽章 ×{state.freezeCount}</div><div className="text-xs text-gray-500">下次漏卡时自动消耗，保护连胜不中断</div></div></div>
          )}
          {Number(state.inventory.timeglass || 0) > 0 && (
            <TimeGlassCard count={Number(state.inventory.timeglass)} busy={busy} onUse={(day) => act('/api/castle/use-item', { itemKey: 'timeglass', day })} />
          )}
          {starShop.filter((s) => Number(state.inventory[s.key] || 0) > 0).map((s) => (
            <div key={s.key} className="card-moko flex items-center gap-3"><div className="text-4xl">{s.icon}</div><div className="flex-1"><div className="font-bold text-moko-violet">{s.name} ×{state.inventory[s.key]}</div><div className="text-xs text-gray-500">已拥有</div></div></div>
          ))}
          {Object.keys(state.inventory).length === 0 && <EmptyState emoji="🎒" title="背包还是空的" desc="去魔法商店用阳光能量兑换好物吧！" />}
        </div>
      )}

      {/* ===== 成就 ===== */}
      {tab === 'achv' && (
        <div>
          <h2 className="section-title mb-3">🏅 我的成就徽章</h2>
          <p className="text-xs text-gray-500 mb-3">每解锁一只萌可、每次坚持打卡，都会点亮一枚徽章！</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {badges.map((b) => (
              <div key={b.id} className={`rounded-2xl p-3 text-center shadow-lg border-2 ${b.earned ? 'bg-gradient-to-br from-moko-yellow to-moko-pink text-white border-white/40' : 'bg-white text-gray-400 border-gray-200'}`}>
                <div className="text-4xl mb-1 grayscale-[0.3]">{b.emoji}</div>
                <div className="font-black text-sm">{b.earned ? b.name : '??'}</div>
                <div className="text-[11px] mt-1 leading-tight">{b.earned ? b.desc : `🔒 ${b.hint}`}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** 时光沙漏使用卡：选日期，补整天打卡 */
function TimeGlassCard({ count, busy, onUse }: { count: number; busy: boolean; onUse: (day: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [day, setDay] = useState('');

  // 默认选昨天
  useEffect(() => {
    if (!day) {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      setDay(d.toISOString().slice(0, 10));
    }
  }, []);

  return (
    <div className="rounded-3xl p-4 shadow-lg border-2 border-moko-violet/20 bg-moko-violet/5">
      <div className="flex items-center gap-3">
        <div className="text-4xl">⏳</div>
        <div className="flex-1">
          <div className="font-bold text-moko-violet">时光沙漏 ×{count}</div>
          <div className="text-xs text-gray-500">选一个过去漏做的日期，一键补打卡三科，恢复连续天数</div>
        </div>
        <button onClick={() => setExpanded((e) => !e)} disabled={busy} className="btn btn-violet text-sm">
          {expanded ? '收起' : '使用'}
        </button>
      </div>
      {expanded && (
        <div className="mt-3 space-y-2 fade-up">
          <div>
            <label className="text-xs text-gray-500 font-bold">补打卡日期</label>
            <input type="date" value={day} onChange={(e) => setDay(e.target.value)} max={new Date().toISOString().slice(0, 10)}
              className="block w-full mt-1 rounded-xl border-2 border-moko-violet/20 px-3 py-2 text-sm" />
          </div>
          <button onClick={() => onUse(day)} disabled={busy || !day}
            className="w-full py-2.5 rounded-full bg-gradient-to-r from-moko-violet to-moko-purple text-white font-black text-sm active:scale-95 transition disabled:opacity-50">
            ⏳ 确认补打卡（三科一起补）
          </button>
        </div>
      )}
    </div>
  );
}