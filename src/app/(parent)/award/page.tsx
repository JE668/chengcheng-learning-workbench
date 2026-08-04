import { getCurrentUser } from '@/lib/auth';
import { getDb, getChildId } from '@/lib/db';
import { ChildSwitcher } from '@/components/ChildSwitcher';
import { getCertData, getCertRequests } from '@/lib/cert';
import Certificate from '@/components/Certificate';
import PrintButton from '@/components/PrintButton';
import CertApproveClient from '@/components/parent/CertApproveClient';

function parsePref(raw: unknown): { mokoKey: string; theme: string; name?: string } | null {
  if (raw == null) return null;
  try {
    const o = JSON.parse(String(raw));
    if (o && typeof o.mokoKey === 'string') {
      return {
        mokoKey: o.mokoKey,
        theme: typeof o.theme === 'string' ? o.theme : 'violet',
        name: typeof o.name === 'string' ? o.name : '',
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export default async function ParentCertPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') return null;
  const childId = (await getChildId(user)) ?? 0;

  const db = getDb();
  const childRow = await db.execute({ sql: 'SELECT display_name FROM users WHERE id = ?', args: [childId] });
  const childName = String(childRow.rows[0]?.display_name ?? '小朋友');

  const data = await getCertData(childId, childName);
  const prefRow = await db.execute({ sql: 'SELECT cert_pref FROM users WHERE id = ?', args: [childId] });
  const initialPref = parsePref(prefRow.rows[0]?.cert_pref);
  const requests = await getCertRequests(childId);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h1 className="text-3xl font-black text-moko-violet">奖状颁发 🎖️</h1>
        <ChildSwitcher />
      </div>

      <p className="text-gray-600 mb-4">
        这里是孩子申请颁发的奖状。审批通过后，由你（爸爸妈妈）在这里打印实物奖状交给孩子——孩子端不能自己打印哦。
      </p>

      {/* 奖状预览（家长打印） */}
      <div className="rounded-2xl p-4 bg-white shadow-lg border-2 border-moko-purple/20 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-moko-violet">奖状预览</h2>
          <PrintButton className="btn-magic bg-moko-gold text-white text-sm" />
        </div>
        <Certificate data={data} editable={false} initialPref={initialPref} />
      </div>

      {/* 申请记录 */}
      <h2 className="text-2xl font-black text-moko-violet mb-3">颁发申请记录</h2>
      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="card-moko flex flex-col md:flex-row justify-between md:items-center gap-3">
            <div>
              <div className="font-bold text-lg">第 {r.id} 次申请</div>
              <div className="text-sm text-gray-500">
                {r.createdAt}
                {r.status === 'pending' ? ' · 待审批' : r.status === 'approved' ? ' · 已颁发' : ' · 未通过'}
              </div>
            </div>
            <CertApproveClient requestId={r.id} initialStatus={r.status} />
          </div>
        ))}
        {requests.length === 0 && (
          <div className="card-moko text-gray-500">孩子还没有提交奖状申请～孩子端点「申请颁发奖状」后，这里就会出现待审批记录。</div>
        )}
      </div>
    </div>
  );
}
