'use client';

import { useState } from 'react';
import { addDays, dateStr } from '@/lib/date';
import { ClayButton } from '@/components/design-system';

/** ⏳ 时光沙漏申请按钮：点击后向家长发起申请 */
export function TimeGlassRequestBtn({
  busy,
  onMsg,
}: {
  busy: boolean;
  onMsg: (m: string) => void;
}) {
  const [reqSent, setReqSent] = useState(false);
  return (
    <div className="mb-4 rounded-2xl bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 p-3 shadow">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⏳</span>
        <div className="flex-1 min-w-0">
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
          className={
            'shrink-0 px-4 py-2 rounded-xl font-bold text-sm shadow transition-all ' +
            (reqSent
              ? 'bg-gray-200 text-gray-400 cursor-default'
              : 'bg-purple-500 text-white hover:bg-purple-600 active:scale-95')
          }
        >
          {reqSent ? '已申请 ✅' : '申请时光沙漏'}
        </button>
      </div>
    </div>
  );
}

/** 时光沙漏使用卡：选日期，补整天打卡 */
export function TimeGlassCard({
  count,
  busy,
  onUse,
}: {
  count: number;
  busy: boolean;
  onUse: (day: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  // 默认选昨天（惰性初始化，代替 useEffect 里的 setState）
  const [day, setDay] = useState(() => addDays(dateStr(), -1));

  return (
    <div className="rounded-3xl p-4 shadow-lg border-2 border-moko-violet/20 bg-moko-violet/5">
      <div className="flex items-center gap-3">
        <div className="text-4xl">⏳</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-moko-violet">时光沙漏 ×{count}</div>
          <div className="text-xs text-gray-500">
            选一个过去漏做的日期，一键补打卡三科，恢复连续天数
          </div>
        </div>
        <ClayButton
          variant="violet"
          size="sm"
          onClick={() => setExpanded((e) => !e)}
          disabled={busy}
        >
          {expanded ? '收起' : '使用'}
        </ClayButton>
      </div>
      {expanded && (
        <div className="mt-3 space-y-2 fade-up">
          <div>
            <label className="text-xs text-gray-500 font-bold">补打卡日期</label>
            <input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              max={dateStr()}
              className="block w-full mt-1 rounded-xl border-2 border-moko-violet/20 px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={() => onUse(day)}
            disabled={busy || !day}
            className="w-full py-2.5 rounded-full bg-gradient-to-r from-moko-violet to-moko-purple text-white font-black text-sm active:scale-95 transition disabled:opacity-50"
          >
            ⏳ 确认补打卡（三科一起补）
          </button>
        </div>
      )}
    </div>
  );
}
