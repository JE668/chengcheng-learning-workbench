'use client';

import { useState } from 'react';

/**
 * 家长端时光沙漏申请审批列表。
 * 显示孩子发起的待审批申请，支持批准/拒绝。
 */
export default function TimeGlassApproveList({
  requests,
  childId,
}: {
  requests: { id: number; text: string; createdAt: string }[];
  childId: number;
}) {
  const [list, setList] = useState(requests);
  const [msg, setMsg] = useState('');

  // 从申请文本中提取补打卡日期，如 "⏳ 申请时光沙漏（补 08-18日）"
  function extractDay(text: string): string | null {
    const m = text.match(/补\s*(\d{2}-\d{2})日/);
    return m ? `${m[1].slice(0, 2)}月${m[1].slice(3)}日` : null;
  }

  async function handleAction(wishId: number, action: 'approve' | 'reject') {
    setMsg('');
    try {
      const r = await fetch('/api/castle/approve-timeglass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wishId, action }),
      });
      const j = await r.json();
      if (j.ok) {
        setList((prev) => prev.filter((item) => item.id !== wishId));
        setMsg(j.message || '操作成功 ✅');
      } else {
        setMsg(j.error || '操作失败');
      }
    } catch {
      setMsg('网络错误');
    }
  }

  if (list.length === 0) return null;

  return (
    <div className="card-moko mt-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">⏳</span>
        <h2 className="text-xl font-bold text-moko-violet">时光沙漏申请</h2>
      </div>
      {msg && (
        <div className="text-sm font-bold text-moko-rose mb-2">{msg}</div>
      )}
      <div className="space-y-3">
        {list.map((req) => (
          <div
            key={req.id}
            className="rounded-2xl p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 flex items-center gap-3"
          >
            <span className="text-2xl">⏳</span>
            <div className="flex-1">
              <div className="font-bold text-purple-700 text-sm">
                {req.text.includes('（补')
                  ? `孩子申请时光沙漏补 ${extractDay(req.text) || '打卡'}`
                  : '孩子申请了时光沙漏'}
              </div>
              <div className="text-xs text-gray-500">
                申请时间：{req.createdAt}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                批准后孩子背包会收到 1 个时光沙漏，可用于补打卡、恢复萌可心情
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleAction(req.id, 'approve')}
                className="px-4 py-2 rounded-xl bg-green-500 text-white font-bold text-sm shadow hover:bg-green-600 active:scale-95 transition-all"
              >
                批准 ✅
              </button>
              <button
                onClick={() => handleAction(req.id, 'reject')}
                className="px-4 py-2 rounded-xl bg-gray-300 text-gray-600 font-bold text-sm shadow hover:bg-gray-400 active:scale-95 transition-all"
              >
                拒绝
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
