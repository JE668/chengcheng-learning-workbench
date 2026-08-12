'use client';

import { useEffect, useState } from 'react';

type Status = 'pending' | 'approved' | 'rejected' | null;

export default function CertRequestButton({ initialStatus }: { initialStatus: Status }) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [busy, setBusy] = useState(false);

  // 进入页面后同步一次服务端最新状态（防止多端不一致）
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/child/cert-request');
        const d = await r.json();
        if (d.status) setStatus(d.status);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  async function apply() {
    setBusy(true);
    try {
      const r = await fetch('/api/child/cert-request', { method: 'POST' });
      const d = await r.json();
      if (d.ok) setStatus('pending');
    } finally {
      setBusy(false);
    }
  }

  if (status === 'pending') {
    return (
      <div className="no-print text-center mt-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-moko-mint/20 text-moko-mint px-5 py-3 font-black text-lg">
          📨 奖状申请已提交，等爸爸妈妈审批就好啦～
        </div>
      </div>
    );
  }
  if (status === 'approved') {
    return (
      <div className="no-print text-center mt-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-moko-gold/20 text-moko-gold px-5 py-3 font-black text-lg">
          🎉 爸爸妈妈已经给你颁发奖状啦！去找爸爸妈妈领取实物奖状吧～
        </div>
      </div>
    );
  }
  return (
    <div className="no-print text-center mt-6 flex items-center justify-center gap-3">
      {status === 'rejected' && (
        <span className="text-gray-500 text-sm">上次没通过，再努力一周再来申请吧～</span>
      )}
      <button
        onClick={apply}
        disabled={busy}
        className="btn btn-primary disabled:opacity-60"
      >
        {busy ? '提交中…' : '🎖️ 申请颁发奖状'}
      </button>
      <span className="text-gray-400 text-xs">（提交后由爸爸妈妈审批，通过才能拿到奖状哦）</span>
    </div>
  );
}
