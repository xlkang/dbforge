import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // 显示更详细的错误信息用于调试
      const errorMsg = this.state.error?.message || 'Unknown error';
      const isHooksError = errorMsg.includes('hooks') || errorMsg.includes('Hook');
      
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-[var(--bg-secondary)] rounded-lg border border-red-500/30 p-6 m-4">
          <div className="text-center max-w-2xl">
            <h2 className="text-xl font-semibold text-red-400 mb-2">
              {isHooksError ? '⚠️ React Hooks 错误' : '❌ Something went wrong'}
            </h2>
            <p className="text-[var(--text-muted)] text-sm mb-4 font-mono bg-[var(--bg-tertiary)] p-3 rounded">
              {errorMsg}
            </p>
            {this.state.error?.stack && (
              <details className="text-left text-xs text-[var(--text-muted)] mb-4">
                <summary className="cursor-pointer text-blue-400">查看堆栈</summary>
                <pre className="mt-2 p-2 bg-[var(--bg-tertiary)] rounded overflow-auto max-h-48">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-white rounded transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
