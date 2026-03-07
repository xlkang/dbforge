import { useState, useEffect } from 'react';
import { Zap, Clock, Database, Activity, X } from 'lucide-react';

interface QueryPerformanceProps {
  isOpen: boolean;
  onClose: () => void;
  result?: {
    rowCount: number;
    executionTime: number;
    columns?: string[];
  } | null;
}

// 简单的性能估算
function analyzePerformance(rowCount: number, executionTime: number) {
  const suggestions: { level: 'good' | 'warning' | 'bad'; message: string }[] = [];
  
  // 执行时间分析
  if (executionTime < 100) {
    suggestions.push({ level: 'good', message: '查询执行迅速 (< 100ms)' });
  } else if (executionTime < 1000) {
    suggestions.push({ level: 'warning', message: '查询耗时中等 (100ms - 1s)' });
  } else {
    suggestions.push({ level: 'bad', message: '查询较慢 (> 1s)，建议优化' });
  }
  
  // 行数分析
  if (rowCount > 10000) {
    suggestions.push({ level: 'warning', message: `返回 ${rowCount} 行，考虑使用 LIMIT 限制` });
  }
  
  // 建议
  if (executionTime > 500 && rowCount > 1000) {
    suggestions.push({ level: 'good', message: '建议添加索引或使用分页' });
  }
  
  return suggestions;
}

export function QueryPerformance({ isOpen, onClose, result }: QueryPerformanceProps) {
  const [stats, setStats] = useState<any>(null);
  
  useEffect(() => {
    if (result) {
      const suggestions = analyzePerformance(result.rowCount, result.executionTime);
      setStats({
        rowCount: result.rowCount,
        executionTime: result.executionTime,
        columnCount: result.columns?.length || 0,
        suggestions,
      });
    }
  }, [result]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed right-4 top-20 z-40 w-80 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-[var(--text-primary)]">查询分析</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-[var(--bg-secondary)] rounded">
          <X className="w-4 h-4 text-[var(--text-muted)]" />
        </button>
      </div>
      
      {/* Stats */}
      <div className="p-3 space-y-2">
        {stats ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 bg-[var(--bg-secondary)] rounded-lg">
                <Clock className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-xs text-[var(--text-muted)]">执行时间</div>
                  <div className="text-sm text-[var(--text-primary)]">{stats.executionTime}ms</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-[var(--bg-secondary)] rounded-lg">
                <Database className="w-4 h-4 text-green-400" />
                <div>
                  <div className="text-xs text-[var(--text-muted)]">返回行数</div>
                  <div className="text-sm text-[var(--text-primary)]">{stats.rowCount}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-[var(--bg-secondary)] rounded-lg">
                <Activity className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="text-xs text-[var(--text-muted)]">列数</div>
                  <div className="text-sm text-[var(--text-primary)]">{stats.columnCount}</div>
                </div>
              </div>
            </div>
            
            {/* Suggestions */}
            <div className="mt-3">
              <div className="text-xs text-[var(--text-muted)] mb-2">优化建议</div>
              {stats.suggestions.map((s: any, i: number) => (
                <div 
                  key={i}
                  className={`text-xs p-2 rounded mb-1 ${
                    s.level === 'good' ? 'bg-green-500/10 text-green-400' :
                    s.level === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-red-500/10 text-red-400'
                  }`}
                >
                  {s.message}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-[var(--text-muted)] text-sm py-4">
            执行查询后查看分析
          </div>
        )}
      </div>
    </div>
  );
}

// Hook
export function useQueryPerformance() {
  const [isOpen, setIsOpen] = useState(false);
  
  return {
    isOpen,
    setIsOpen,
    QueryPerformance: (props: { result?: any }) => (
      <QueryPerformance isOpen={isOpen} onClose={() => setIsOpen(false)} {...props} />
    ),
  };
}
