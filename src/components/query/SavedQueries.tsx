import { useState, useEffect } from 'react';

interface SavedQuery {
  id: string;
  name: string;
  sql: string;
}

const STORAGE_KEY = 'dbforge_saved_queries';

export function SavedQueries() {
  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [currentSql, setCurrentSql] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setQueries(JSON.parse(saved));
    }
  }, []);

  const saveQuery = () => {
    if (!newName.trim() || !currentSql.trim()) return;
    
    const query: SavedQuery = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      sql: currentSql,
    };
    
    const updated = [...queries, query];
    setQueries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setNewName('');
  };

  const deleteQuery = (id: string) => {
    const updated = queries.filter(q => q.id !== id);
    setQueries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const loadQuery = (sql: string) => {
    setCurrentSql(sql);
    // 触发 store 更新
    window.dispatchEvent(new CustomEvent('loadQuery', { detail: sql }));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"
        title="保存的查询"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 max-h-80 overflow-auto">
            <div className="p-3 border-b border-gray-700">
              <h3 className="font-semibold text-sm">保存的查询</h3>
            </div>
            
            <div className="p-2 space-y-2">
              {queries.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">暂无保存的查询</p>
              )}
              
              {queries.map((q) => (
                <div key={q.id} className="p-2 bg-gray-700/50 rounded group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{q.name}</span>
                    <button
                      onClick={() => deleteQuery(q.id)}
                      className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                  <button
                    onClick={() => loadQuery(q.sql)}
                    className="w-full text-left text-xs text-gray-400 hover:text-blue-400 truncate font-mono"
                  >
                    {q.sql.slice(0, 50)}...
                  </button>
                </div>
              ))}
            </div>

            <div className="p-2 border-t border-gray-700 space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="查询名称"
                className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentSql}
                  onChange={(e) => setCurrentSql(e.target.value)}
                  placeholder="SQL 语句"
                  className="flex-1 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs font-mono"
                />
                <button
                  onClick={saveQuery}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}