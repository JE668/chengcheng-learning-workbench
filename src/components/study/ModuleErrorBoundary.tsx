'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  moduleKey: string;
  subject: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ModuleErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 可以在这里上报错误到监控服务
    console.error(`[ModuleError] ${this.props.subject}/${this.props.moduleKey}:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-3xl p-8 bg-white shadow-lg border-2 border-red-200 text-center">
          <div className="text-6xl mb-3">🤖</div>
          <h2 className="text-xl font-black text-gray-800 mb-2">萌可遇到了小问题</h2>
          <p className="text-sm text-gray-500 mb-4">
            {this.state.error?.message || '这个模块暂时无法加载，请重试'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={this.handleRetry}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-moko-violet to-moko-purple text-white font-bold text-sm hover:scale-105 transition"
            >
              🔄 重试
            </button>
            <Link
              href={`/study/${this.props.subject}`}
              className="px-5 py-2.5 rounded-full bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition"
            >
              返回科目页
            </Link>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            模块: {this.props.moduleKey} · 错误详情已记录
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
