import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'error', 
  onClose, 
  duration = 5000 
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const styles = {
    error: 'bg-red-900/90 border-red-500 text-red-100',
    success: 'bg-green-900/90 border-green-500 text-green-100',
    info: 'bg-blue-900/90 border-blue-500 text-blue-100',
    warning: 'bg-yellow-900/90 border-yellow-500 text-yellow-100',
  };

  const icons = {
    error: '❌',
    success: '✅',
    info: 'ℹ️',
    warning: '⚠️',
  };

  return (
    <div 
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${styles[type]} animate-slide-in`}
      style={{ animation: 'slideIn 0.3s ease-out' }}
    >
      <span className="text-lg">{icons[type]}</span>
      <span className="text-sm font-medium">{message}</span>
      <button 
        onClick={onClose}
        className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 m-4 bg-red-900/30 border border-red-600 rounded-lg">
          <h3 className="text-red-400 font-semibold mb-2">⚠️ 出现错误</h3>
          <p className="text-red-300 text-sm mb-3">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded text-sm"
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
