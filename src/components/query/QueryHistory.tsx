import { useState } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';

export function QueryHistory() {
  const { queryHistory, setQuery } = useDatabaseStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (queryHistory.length === 0) return null;

  return (
    <div className="border-t border-gray-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
      >
        <span>查询历史 ({queryHistory.length})</span>
        <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
      </button>
      
      {isExpanded && (
        <div className="max-h-40 overflow-auto">
          {queryHistory.map((query, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(query)}
              className="w-full px-3 py-2 text-left text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 font-mono truncate"
              title={query}
            >
              {query.length > 50 ? query.slice(0, 50) + '...' : query}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}