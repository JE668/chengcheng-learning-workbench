import { getCurrentUser } from '@/lib/auth';
import { getChildId } from '@/lib/db';
import { ChildSwitcher } from '@/components/ChildSwitcher';
import { RedeemClient } from '@/components/parent/RedeemClient';

export default async function RedeemPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'parent') return null;
  const childId = (await getChildId(user)) ?? 0;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h1 className="text-3xl font-black text-moko-violet">兑换管理 🎁</h1>
        <ChildSwitcher />
      </div>
      <RedeemClient childId={childId} />
    </div>
  );
}
