import './globals.css';
import { ensureSchema } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '程程学习工作台',
  description: '奇妙萌可主题的儿童学习工作台',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await ensureSchema();
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-moko-cream">{children}</body>
    </html>
  );
}
