'use client';

import { useState, useEffect } from 'react';

interface DatabaseErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DatabaseErrorFallback({ error, reset }: DatabaseErrorFallbackProps) {
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    setShowError(true);
  }, []);

  if (!showError) {
    return null;
  }

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
          onClick={reset}
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