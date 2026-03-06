import { Loader2, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';
import { useEffect, useState } from 'react';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

interface ToastProps {
  toast: {
    id: string;
    message: string;
    type: 'error' | 'success' | 'info' | 'warning';
  };
  onRemove: (id: string) => void;
}

function Toast({ toast, onRemove }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);
  
  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };
  
  const icons = {
    error: <XCircle className="w-5 h-5 text-red-400" />,
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-400" />,
  };
  
  const bgColors = {
    error: 'bg-red-900/90 border-red-700',
    success: 'bg-green-900/90 border-green-700',
    info: 'bg-blue-900/90 border-blue-700',
    warning: 'bg-yellow-900/90 border-yellow-700',
  };
  
  return (
    <div 
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
        ${bgColors[toast.type]}
        transition-all duration-300
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
    >
      {icons[toast.type]}
      <p className="text-sm text-white flex-1">{toast.message}</p>
      <button 
        onClick={handleRemove}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
}

// Loading spinner component
export function LoadingSpinner({ size = 'md', text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };
  
  return (
    <div className="flex items-center justify-center gap-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-400`} />
      {text && <span className="text-sm text-gray-400">{text}</span>}
    </div>
  );
}

// Loading overlay component
export function LoadingOverlay({ isLoading, text }: { isLoading: boolean; text?: string }) {
  if (!isLoading) return null;
  
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-secondary)] rounded-lg p-6 shadow-xl border border-[var(--border-color)]">
        <LoadingSpinner size="lg" text={text || '加载中...'} />
      </div>
    </div>
  );
}
