import { useState } from 'react';
import { History, ChevronDown, ChevronRight, Trash2, RotateCcw, Search } from 'lucide-react';
import { useDatabaseStore } from '../../stores/databaseStore';

export function QueryHistory() {
  const { queryHistory, setQuery, clearHistory } = useDatabaseStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [search, setSearch] = useState('');

  const filteredHistory = queryHistory.filter(q => 
    q.toLowerCase().includes(search.toLowerCase())
  );

  if (queryHistory.length === 0) return null;

  return (
    <div className="border-t border-gray-800 bg-[var(--bg-primary)]/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <History size={14} />
        <span className="text-xs">查询历史 ({queryHistory.length})</span>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-800">
          <div className="px-4 py-2 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索历史记录..."
                className="w-full bg-[var(--bg-secondary)]/50 text-[var(--text-secondary)] text-xs px-9 py-1.5 rounded outline-none focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-auto">
            {filteredHistory.slice().reverse().map((query, idx) => (
              <div
                key={idx}
                className="group flex items-start gap-2 px-4 py-2 hover:bg-[var(--bg-secondary)]/50 cursor-pointer border-b border-gray-800/50"
                onClick={() => setQuery(query)}
              >
                <RotateCcw size={12} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
                <code className="text-xs text-[var(--text-muted)] font-mono truncate flex-1">{query}</code>
              </div>
            ))}
            {filteredHistory.length === 0 && search && (
              <div className="px-4 py-3 text-xs text-[var(--text-muted)]">没有匹配的历史记录</div>
            )}
          </div>
          <div className="px-4 py-2 border-t border-gray-800 flex justify-end">
            <button
              onClick={clearHistory}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <Trash2 size={12} /> 清空历史
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
