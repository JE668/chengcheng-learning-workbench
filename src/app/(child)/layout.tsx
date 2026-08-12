import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Nav from '@/components/Nav';
import EyeRest from '@/components/EyeRest';
import Clock from '@/components/Clock';
import FullscreenToggle from '@/components/FullscreenToggle';

export default async function ChildLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'child') redirect('/dashboard');
  return (
    <div className="flex min-h-screen">
      <Nav user={user} />
      <main className="flex-1 p-4 md:p-8 pb-28 md:pb-8 safe-bottom">
        {children}
      </main>
      <EyeRest />
      <Clock />
      <FullscreenToggle />
    </div>
  );
}
