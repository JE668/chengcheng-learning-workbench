import './globals.css';
import { ensureSchema } from '@/lib/db';
import PwaRegister from '@/components/PwaRegister';
import OfflineIndicator from '@/components/OfflineIndicator';
import OfflineSync from '@/components/OfflineSync';
import ErrorBoundary from '@/components/ErrorBoundary';
import DatabaseErrorFallback from '@/components/DatabaseErrorFallback';
import * as Sentry from '@sentry/nextjs';
import { reportWebVitals } from '@/lib/web-vitals';
import { PageTransition } from '@/components/PageTransition';

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

/**
 * 进程内记忆化：根布局是 force-dynamic，每个请求都会渲染，而 ensureSchema() 虽然
 * 幂等但成本不低（2 个 PRAGMA + 建表写事务批次 + 迁移检查）。并发访问时这些写操作
 * 会在 NAS 上互相争锁。
 *
 * 放在调用点记忆化，既做到「一个进程只初始化一次」，又不改变 ensureSchema() 自身的
 * 语义（测试需要它能被反复调用并每次都真的执行迁移）。
 */
let schemaReady: Promise<void> | null = null;

function ensureSchemaOncePerProcess(): Promise<void> {
  if (!schemaReady) {
    schemaReady = ensureSchema().catch((error) => {
      schemaReady = null; // 失败时允许下一个请求重试
      throw error;
    });
  }
  return schemaReady;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  try {
    await ensureSchemaOncePerProcess();
  } catch (error) {
    console.error('Database initialization failed:', error);
    // Serialize error for Client Component (must be plain object, no functions)
    const serializedError = {
      name: error instanceof Error ? error.name : 'Error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      digest: (error as { digest?: string }).digest,
    };
    return <DatabaseErrorFallback error={serializedError} />;
  }
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-moko-cream">
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
        <OfflineSync />
        <PwaRegister />
        <WebVitalsReporter />
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
