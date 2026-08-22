'use client';

import { useState } from 'react';

interface CalendarDay {
  day: string;
  count: number;
  hasTrouble: boolean;
}

interface CheckinCalendarProps {
  days: CalendarDay[];
}

/**
 * 打卡日历客户端组件：中断日可点击 → 直接申请时光沙漏。
 *
 * 交互逻辑：
 *   - 未断签日（count >= 3）和当天：显示信息，不可交互
 *   - 中断日（count < 3，过去日期）：点击后弹出确认框，确认后调用
 *     POST /api/castle/request-timeglass 带 day 参数发起申请
 *   - 已成功申请过该日期的：不再重复申请
 */
export default function CheckinCalendar({ days }: CheckinCalendarProps) {
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDay, setConfirmDay] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  // 把 days 按 ISO 周（周一开始）分组
  const weeks: CalendarDay[][] = [];
  let cur: CalendarDay[] = [];
  const first = days[0];
  if (first) {
    const ft = new Date(first.day + 'T00:00:00');
    const firstDow = (ft.getDay() + 6) % 7;
    for (let i = 0; i < firstDow; i++) cur.push({ day: '', count: -1, hasTrouble: false });
  }
  for (const c of days) {
    cur.push(c);
    if (c.day && ((new Date(c.day + 'T00:00:00').getDay() + 6) % 7) === 6) {
      weeks.push(cur);
      cur = [];
    }
  }
  if (cur.length) weeks.push(cur);

  const isBrokenDay = (c: CalendarDay) => c.day && c.day < today && c.count >= 0 && c.count < 3;

  async function handleRequest(day: string) {
    if (busy) return;
    setBusy(true);
    setMsg('');
    try {
      const r = await fetch('/api/castle/request-timeglass', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ day }),
      });
      const j = await r.json();
      setMsg(j.message || '已申请 ✅');
    } catch {
      setMsg('网络错误');
    } finally {
      setBusy(false);
      setConfirmDay(null);
    }
  }

  const weekday = ['一', '二', '三', '四', '五', '六', '日'];
  const dayColor = (count: number) => {
    if (count >= 3) return 'bg-green-500 text-white';
    if (count === 2) return 'bg-green-300 text-white';
    if (count === 1) return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-400';
  };

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {weekday.map((w) => (
          <div key={w} className="text-center text-[11px] font-bold text-gray-400">
            {w}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
          {week.map((c, ci) =>
            c.day === '' ? (
              <div key={ci} className="h-10 rounded-xl bg-transparent" />
            ) : isBrokenDay(c) ? (
              <div
                key={ci}
                title={`「${c.day.slice(5).replace('-', '月')}月${c.day.slice(8)}日」只打了 ${c.count}/3 科，点一下申请时光沙漏补打卡`}
                onClick={() => setConfirmDay(c.day)}
                className={
                  'h-10 rounded-xl flex flex-col items-center justify-center relative text-xs font-bold transition cursor-pointer border-2 border-dashed border-moko-violet/40 hover:border-moko-violet hover:scale-105 ' +
                  dayColor(c.count)
                }
              >
                <span>{new Date(c.day + 'T00:00:00').getDate()}</span>
                <span className="text-[9px] mt-0.5 opacity-90">⏳</span>
              </div>
            ) : (
              <div
                key={ci}
                title={`${c.day} · 打卡 ${c.count}/3 科${c.hasTrouble ? ' · 有捣蛋萌可' : ''}`}
                className={
                  'h-10 rounded-xl flex flex-col items-center justify-center relative text-xs font-bold transition ' +
                  dayColor(c.count)
                }
              >
                {new Date(c.day + 'T00:00:00').getDate()}
                {c.hasTrouble && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-white" />
                )}
              </div>
            ),
          )}
        </div>
      ))}
      <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500 inline-block" /> 三科全勤
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-300 inline-block" /> 两科
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-100 inline-block" /> 单科
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gray-100 inline-block" /> 未打卡
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gray-100 border-2 border-dashed border-moko-violet/40 inline-block" /> 中断（可点补打卡）
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> 捣蛋萌可
        </span>
      </div>

      {/* 确认弹窗 */}
      {confirmDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={() => setConfirmDay(null)}>
          <div
            className="bg-white rounded-3xl p-6 shadow-2xl max-w-xs w-full fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <span className="text-4xl">⏳</span>
              <div className="font-black text-lg text-moko-violet mt-2">补打卡？</div>
              <div className="text-sm text-gray-600 mt-1">
                {confirmDay.slice(5).replace('-', '月')}月{confirmDay.slice(8)}日 只打了 {days.find((d) => d.day === confirmDay)?.count}/3 科
              </div>
              <div className="text-xs text-gray-500 mt-1">
                向爸爸妈妈申请时光沙漏补打卡，审批后自动恢复连续天数
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDay(null)}
                className="flex-1 py-2.5 rounded-full bg-gray-100 text-gray-600 font-bold text-sm active:scale-95 transition"
              >
                取消
              </button>
              <button
                onClick={() => handleRequest(confirmDay)}
                disabled={busy}
                className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-moko-violet to-moko-purple text-white font-black text-sm active:scale-95 transition disabled:opacity-50"
              >
                {busy ? '申请中…' : '⏳ 申请'}
              </button>
            </div>
            {msg && (
              <div className="text-xs text-center text-moko-rose font-bold mt-3">{msg}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
