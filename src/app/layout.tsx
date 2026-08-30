import './globals.css';
import { ensureSchema } from '@/lib/db';
import PwaRegister from '@/components/PwaRegister';
import OfflineIndicator from '@/components/OfflineIndicator';
import ErrorBoundary from '@/components/ErrorBoundary';
import DatabaseErrorFallback from '@/components/DatabaseErrorFallback';
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
    // Serialize error for Client Component (must be plain object)
    const serializedError = {
      name: error instanceof Error ? error.name : 'Error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      digest: (error as { digest?: string }).digest,
    };
    return <DatabaseErrorFallback error={serializedError} reset={() => window.location.reload()} />;
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
