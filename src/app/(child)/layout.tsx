import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
      <main className="flex-1 p-4 md:p-8 pb-28 md:pb-8 safe-bottom kids-bg pr-28 md:pr-36">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      {/*
        右上角浮动控件统一放进**一个** fixed 容器。
        此前 EyeRest 与 Clock 各自写 fixed top-3 right-3 z-40，在同一位置**完全重叠**
        （Clock 的收起按钮被 EyeRest 药丸压住）。现在由容器定位、纵向排列，
        且宽度不超过 main 预留的 pr-28。
      */}
      <div className="fixed top-3 right-3 z-40 flex flex-col items-end gap-2">
        <EyeRest />
        <Clock />
      </div>
      <FullscreenToggle />
    </div>
  );
}
