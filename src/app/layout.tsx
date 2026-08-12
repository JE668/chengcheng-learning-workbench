import './globals.css';
import { ensureSchema } from '@/lib/db';
import PwaRegister from '@/components/PwaRegister';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '程程学习工作台',
  description: '奇妙萌可主题的儿童学习工作台',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon-192.png',
    shortcut: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: '程程学习' },
};

export const viewport = {
  themeColor: '#a855f7',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
