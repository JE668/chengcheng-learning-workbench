import './globals.css';
import { ensureSchema } from '@/lib/db';
import PwaRegister from '@/components/PwaRegister';
import OfflineIndicator from '@/components/OfflineIndicator';
import ErrorBoundary from '@/components/ErrorBoundary';
import * as Sentry from '@sentry/nextjs';
import { reportWebVitals } from '@/lib/web-vitals';
import { PageTransition } from '@/components/PageTransition';
import { QueryProvider } from '@/providers/QueryProvider';

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
  try {
    await ensureSchema();
  } catch (error) {
    console.error('Database initialization failed:', error);
    return (
      <html lang="zh-CN">
        <body
          style={{
            margin: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            background: '#fdf2f8',
            color: '#7c3aed',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '24px',
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>🐠</div>
          <h2 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 8px' }}>数据库初始化失败</h2>
          <p style={{ color: '#6b7280', margin: '0 0 24px', maxWidth: 420, lineHeight: 1.6 }}>
            无法连接数据库。请检查 TURSO_URL 配置、/data 目录权限，或确认数据库文件未被损坏。
          </p>
          {process.env.NODE_ENV !== 'production' && (
            <pre style={{ background: '#fef2f2', color: '#991b1b', padding: 12, borderRadius: 8, maxWidth: 500, overflow: 'auto', fontSize: 12, textAlign: 'left' }}>
              {String(error)}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              borderRadius: 16,
              background: '#7c3aed',
              color: '#fff',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ↻ 重试
          </button>
        </body>
      </html>
    );
  }
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-moko-cream">
        <QueryProvider>
          <Sentry.ErrorBoundary fallback={({ error, resetError }) => (
            <div className="flex flex-col items-center justify-center min-h-[300px] p-4 text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">出错了 😢</h2>
              <p className="text-gray-600 mb-4">{error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : '未知错误'}</p>
              <button
                onClick={resetError}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                重试
              </button>
            </div>
          )}>
            <ErrorBoundary>
              <PageTransition>{children}</PageTransition>
            </ErrorBoundary>
          </Sentry.ErrorBoundary>
          <OfflineIndicator />
          <PwaRegister />
          <WebVitalsReporter />
        </QueryProvider>
      </body>
    </html>
  );
}

function WebVitalsReporter() {
  if (typeof window !== 'undefined') {
    // Use setTimeout to ensure Sentry is initialized
    setTimeout(() => {
      reportWebVitals();
    }, 0);
  }
  return null;
}
