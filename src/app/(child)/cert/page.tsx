import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { getCertData, getCertRequestStatus } from '@/lib/cert';
import Certificate from '@/components/Certificate';
import CertRequestButton from '@/components/CertRequestButton';

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

export default async function ChildCertPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'child') return null;

  const childId = user.id;
  const childName = user.displayName || '小朋友';

  // 三条查询互不依赖，Promise.all 并行（2026-11-10 第三轮审查：原本三连串行，
  // award 页同款优化在 441c102 已做，这里补齐 cert 漏掉的这处）。
  const [prefRow, data, requestStatus] = await Promise.all([
    getDb().execute({ sql: 'SELECT cert_pref FROM users WHERE id = ?', args: [childId] }),
    getCertData(childId, childName),
    getCertRequestStatus(childId),
  ]);
  const initialPref = parsePref(prefRow.rows[0]?.cert_pref);

  return (
    <div className="max-w-3xl mx-auto fade-up">
      <h1 className="page-title mb-2">我的奖状 🏆</h1>
      <p className="text-gray-600 mb-4">
        选你最喜欢的萌可和颜色，做成专属奖状！做好后点「申请颁发」，等爸爸妈妈审批通过，就能拿到奖状啦～
      </p>
      <Certificate
        data={data}
        editable={true}
        initialPref={initialPref}
        persistUrl="/api/child/cert-pref"
        printable={false}
      />
      <CertRequestButton initialStatus={requestStatus} />
      <div className="no-print text-center mt-6">
        <Link href="/record" className="text-moko-violet font-bold hover:underline">
          ‹ 返回学习记录
        </Link>
      </div>
    </div>
  );
}
