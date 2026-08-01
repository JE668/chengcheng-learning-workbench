'use client';

/**
 * 最外层错误边界：仅当根布局本身（含 <html>/<body>）崩溃时触发。
 * 必须自行渲染 <html><body>，且不能用依赖布局样式的 className（样式可能未加载），
 * 故此处用内联样式兜底，保证任何情况下都有可读的「重试」入口。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh">
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
        <div style={{ fontSize: 64, marginBottom: 16 }}>🧸</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 8px' }}>哎呀，萌可迷路了～</h2>
        <p style={{ color: '#6b7280', margin: '0 0 24px', maxWidth: 420 }}>
          出了一点小问题，点下面重试一下吧。
        </p>
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
