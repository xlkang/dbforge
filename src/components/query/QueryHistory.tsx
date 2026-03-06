import { useState } from 'react';
import { History, ChevronDown, ChevronRight, Trash2, RotateCcw } from 'lucide-react';
import { useDatabaseStore } from '../../stores/databaseStore';

export function QueryHistory() {
  const { queryHistory, setQuery, clearHistory } = useDatabaseStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (queryHistory.length === 0) return null;

  return (
    <div className="border-t border-gray-800 bg-gray-900/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4" strokeWidth={2} />
          <span className="font-medium">查询历史</span>
          <span className="text-xs bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">{queryHistory.length}</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-600" strokeWidth={2} />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-600" strokeWidth={2} />
        )}
      </button>
      
      {isExpanded && (
        <div className="max-h-48 overflow-auto border-t border-gray-800">
          {queryHistory.slice().reverse().map((query, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(query)}
              className="w-full px-4 py-2.5 text-left text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 font-mono flex items-center gap-2 group transition-colors"
              title={query}
            >
              <RotateCcw className="w-3 h-3 text-gray-700 group-hover:text-gray-500 shrink-0" strokeWidth={2} />
              <span className="truncate">{query.length > 60 ? query.slice(0, 60) + '...' : query}</span>
            </button>
          ))}
          <button
            onClick={clearHistory}
            className="w-full px-4 py-2.5 text-left text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors border-t border-gray-800"
          >
            <Trash2 className="w-3 h-3" strokeWidth={2} />
            清空历史记录
          </button>
        </div>
      )}
    </div>
  );
}
