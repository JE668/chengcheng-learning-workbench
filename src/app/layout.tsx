import './globals.css';
import { ensureSchema } from '@/lib/db';
import PwaRegister from '@/components/PwaRegister';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '程程学习工作台',
  description: '奇妙萌可主题的儿童学习工作台',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: '程程学习' },
};

export const viewport = {
  themeColor: '#a855f7',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await ensureSchema();
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-moko-cream">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
