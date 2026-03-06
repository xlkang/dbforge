import { useState, useEffect } from 'react';
import { Bookmark, Plus, Trash2, Play, X } from 'lucide-react';
import { useDatabaseStore } from '../../stores/databaseStore';

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
  const setQuery = useDatabaseStore((s) => s.setQuery);

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
    setQuery(sql);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        title="保存的查询"
      >
        <Bookmark className="w-4 h-4" strokeWidth={2} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-blue-400" strokeWidth={2} />
                <h3 className="text-sm font-medium text-gray-300">保存的查询</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-800 rounded text-gray-600 hover:text-gray-400"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            
            {/* List */}
            <div className="flex-1 overflow-auto p-2">
              {queries.length === 0 && (
                <div className="text-center py-8">
                  <Bookmark className="w-8 h-8 text-gray-800 mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-xs text-gray-600">暂无保存的查询</p>
                </div>
              )}
              
              {queries.map((q) => (
                <div key={q.id} className="p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg group mb-2 last:mb-0 transition-colors border border-transparent hover:border-gray-800">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-300">{q.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => loadQuery(q.sql)}
                        className="p-1 hover:bg-blue-500/20 rounded text-gray-600 hover:text-blue-400"
                        title="加载"
                      >
                        <Play className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => deleteQuery(q.id)}
                        className="p-1 hover:bg-red-500/20 rounded text-gray-600 hover:text-red-400"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => loadQuery(q.sql)}
                    className="w-full text-left text-xs text-gray-500 hover:text-blue-400 font-mono truncate block bg-gray-800/50 px-2 py-1.5 rounded"
                  >
                    {q.sql.slice(0, 60)}...
                  </button>
                </div>
              ))}
            </div>

            {/* Save Form */}
            <div className="p-3 border-t border-gray-800 bg-gray-900/50 space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="查询名称"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentSql}
                  onChange={(e) => setCurrentSql(e.target.value)}
                  placeholder="SELECT * FROM ..."
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs font-mono text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                />
                <button
                  onClick={saveQuery}
                  disabled={!newName.trim() || !currentSql.trim()}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
