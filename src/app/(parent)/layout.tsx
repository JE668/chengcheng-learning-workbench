import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Nav from '@/components/Nav';
import Clock from '@/components/Clock';

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'parent') redirect('/home');
  return (
    <div className="flex min-h-screen">
      <Nav user={user} />
      <main className="flex-1 p-4 md:p-8 pb-28 md:pb-8 safe-bottom">
        {children}
      </main>
      <Clock />
    </div>
  );
}
