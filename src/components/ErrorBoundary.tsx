'use client';

import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="max-w-lg mx-auto mt-20 p-8 text-center">
          <div className="text-6xl mb-4">😅</div>
          <h2 className="text-xl font-black text-moko-violet mb-2">哎呀，出了点小问题</h2>
          <p className="text-gray-500 text-sm mb-4">萌可们正在努力修复，试试刷新页面吧～</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="px-6 py-3 rounded-full bg-moko-rose text-white font-bold shadow hover:scale-105 transition"
          >刷新页面 🔄</button>
          <details className="mt-4 text-left">
            <summary className="text-xs text-gray-400 cursor-pointer">错误详情</summary>
            <pre className="text-xs text-red-500 mt-2 p-2 bg-red-50 rounded overflow-auto max-h-32">{this.state.error?.message}</pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}