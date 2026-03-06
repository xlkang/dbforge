import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, X, Table, Columns, Database, ChevronRight, Hash } from 'lucide-react';
import { useDatabaseStore } from '../../stores/databaseStore';
import { useTabStore } from '../../stores/tabStore';

interface SearchResult {
  type: 'table' | 'column' | 'view';
  name: string;
  tableName?: string;
  dataType?: string;
}

// 全局搜索功能
export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const { tables, tableColumns, selectedTable, connection, selectTable } = useDatabaseStore();
  const { addTab } = useTabStore();
  
  // 收集所有搜索结果
  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim() || !connection) return [];
    
    const lowerQuery = query.toLowerCase();
    const searchResults: SearchResult[] = [];
    
    // 搜索表
    tables.forEach(table => {
      if (table.name.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          type: 'table',
          name: table.name,
        });
      }
    });
    
    // 搜索列（仅当前选中的表）
    if (selectedTable) {
      tableColumns.forEach(col => {
        if (col.name.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            type: 'column',
            name: col.name,
            tableName: selectedTable,
            dataType: col.type,
          });
        }
      });
    }
    
    return searchResults.slice(0, 20);
  }, [query, tables, tableColumns, selectedTable, connection]);
  
  // 打开搜索面板
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl+K 或 Cmd+K 打开搜索
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(true);
    }
  }, []);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  // 处理键盘导航
  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };
  
  // 选择结果
  const handleSelectResult = (result: SearchResult) => {
    if (result.type === 'table') {
      selectTable(result.name);
      addTab({ title: result.name, type: 'table', tableName: result.name });
    } else if (result.type === 'column' && result.tableName) {
      selectTable(result.tableName);
    }
    setIsOpen(false);
    setQuery('');
  };
  
  // 获取结果图标
  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'table':
        return <Table className="w-4 h-4 text-blue-400" />;
      case 'column':
        return <Columns className="w-4 h-4 text-purple-400" />;
      case 'view':
        return <Database className="w-4 h-4 text-green-400" />;
    }
  };
  
  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] z-50">
      <div className="bg-[var(--bg-primary)] rounded-2xl w-[580px] border border-gray-800 shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-[var(--text-muted)]" strokeWidth={2} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyNavigation}
              placeholder="搜索表名、列名..."
              className="flex-1 bg-transparent text-[var(--text-primary)] text-lg placeholder-gray-600 focus:outline-none"
              autoFocus
            />
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-muted)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Results */}
        <div className="max-h-[400px] overflow-auto">
          {results.length === 0 && query.trim() && (
            <div className="p-8 text-center text-[var(--text-muted)]">
              未找到匹配的结果
            </div>
          )}
          
          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.name}`}
              onClick={() => handleSelectResult(result)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                index === selectedIndex 
                  ? 'bg-[var(--accent)]/20 border-l-2 border-[var(--accent)]' 
                  : 'hover:bg-[var(--bg-secondary)]'
              }`}
            >
              {getResultIcon(result.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-primary)] font-medium truncate">
                    {result.name}
                  </span>
                  {result.tableName && (
                    <>
                      <ChevronRight className="w-3 h-3 text-[var(--text-muted)]" />
                      <span className="text-[var(--text-muted)] text-sm truncate">
                        {result.tableName}
                      </span>
                    </>
                  )}
                </div>
                {result.dataType && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Hash className="w-3 h-3 text-[var(--text-muted)]" />
                    <span className="text-[var(--text-muted)] text-xs">{result.dataType}</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded">
                {result.type === 'table' ? '表' : result.type === 'column' ? '列' : '视图'}
              </span>
            </button>
          ))}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-800 bg-[var(--bg-secondary)]/50 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[var(--bg-primary)] rounded text-[10px]">↑↓</kbd>
              导航
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[var(--bg-primary)] rounded text-[10px]">↵</kbd>
              确认
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[var(--bg-primary)] rounded text-[10px]">esc</kbd>
              关闭
            </span>
          </div>
          <span>Ctrl+K 打开</span>
        </div>
      </div>
    </div>
  );
}
