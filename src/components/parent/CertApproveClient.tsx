'use client';

import { useState } from 'react';

type Status = 'pending' | 'approved' | 'rejected';

export default function CertApproveClient({
  requestId,
  initialStatus,
}: {
  requestId: number;
  initialStatus: Status;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [busy, setBusy] = useState(false);

  async function decide(next: 'approved' | 'rejected') {
    setBusy(true);
    try {
      const r = await fetch('/api/parent/cert-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, status: next }),
      });
      const d = await r.json();
      if (d.ok) setStatus(next as Status);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {status === 'pending' && (
        <>
          <button
            onClick={() => decide('approved')}
            disabled={busy}
            className="btn btn-mint text-sm disabled:opacity-60"
          >
            通过并颁发
          </button>
          <button
            onClick={() => decide('rejected')}
            disabled={busy}
            className="btn bg-gray-300 text-white text-sm disabled:opacity-60"
          >
            暂不通过
          </button>
        </>
      )}
      {status === 'approved' && <span className="text-moko-mint font-bold">✅ 已颁发</span>}
      {status === 'rejected' && <span className="text-gray-400 font-bold">🚫 未通过</span>}
    </div>
  );
}
