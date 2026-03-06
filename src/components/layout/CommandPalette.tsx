import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Command, FileText, Table2, Database, Play, Download, Upload, X, Settings } from 'lucide-react';
import { useTabStore } from '../../stores/tabStore';
import { useDatabaseStore } from '../../stores/databaseStore';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ElementType;
  category: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { addTab } = useTabStore();
  const { executeQuery, loadTables } = useDatabaseStore();

  // 定义所有命令
  const commands: Command[] = useMemo(() => [
    {
      id: 'new-query',
      label: '新建查询',
      shortcut: 'Ctrl+N',
      icon: FileText,
      category: '文件',
      action: () => addTab({ title: '新查询', type: 'query', sql: '' }),
    },
    {
      id: 'execute-query',
      label: '执行查询',
      shortcut: 'Ctrl+Enter',
      icon: Play,
      category: '查询',
      action: () => executeQuery(),
    },
    {
      id: 'refresh-tables',
      label: '刷新表列表',
      shortcut: 'F5',
      icon: Database,
      category: '数据库',
      action: () => loadTables(),
    },
    {
      id: 'export-data',
      label: '导出数据',
      shortcut: 'Ctrl+E',
      icon: Download,
      category: '数据',
      action: () => addTab({ title: '导出', type: 'query' }),
    },
    {
      id: 'import-data',
      label: '导入数据',
      shortcut: 'Ctrl+I',
      icon: Upload,
      category: '数据',
      action: () => {},
    },
    {
      id: 'new-table',
      label: '新建表',
      icon: Table2,
      category: '文件',
      action: () => addTab({ title: '新表', type: 'table' }),
    },
    {
      id: 'open-er-diagram',
      label: '打开 ER 图',
      icon: Database,
      category: '视图',
      action: () => addTab({ title: 'ER 图', type: 'diagram' }),
    },
    {
      id: 'open-chart',
      label: '打开图表视图',
      icon: Command,
      category: '视图',
      action: () => addTab({ title: '图表', type: 'chart' }),
    },
    {
      id: 'settings',
      label: '打开设置',
      icon: Settings,
      category: '系统',
      action: () => {},
    },
    {
      id: 'clear-query',
      label: '清空查询编辑器',
      shortcut: 'Ctrl+L',
      icon: X,
      category: '查询',
      action: () => useDatabaseStore.getState().setQuery(''),
    },
  ], [addTab, executeQuery, loadTables]);

  // 过滤命令
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lowerQuery = query.toLowerCase();
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(lowerQuery) ||
      cmd.category.toLowerCase().includes(lowerQuery)
    );
  }, [commands, query]);

  // 处理键盘导航
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // 重置选择
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // 自动聚焦
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 命令面板 */}
      <div className="relative w-full max-w-xl bg-[var(--bg-secondary)] rounded-lg shadow-2xl border border-[var(--border-color)] overflow-hidden">
        {/* 搜索框 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-color)]">
          <Search size={18} className="text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入命令名称..."
            className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none text-sm"
          />
          <span className="text-xs text-[var(--text-muted)]">ESC 关闭</span>
        </div>

        {/* 命令列表 */}
        <div className="max-h-[300px] overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-[var(--text-muted)] text-sm">
              没有找到匹配的命令
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  index === selectedIndex 
                    ? 'bg-[var(--accent)]/20 text-[var(--text-primary)]' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <cmd.icon size={16} />
                <span className="flex-1 text-sm">{cmd.label}</span>
                <span className="text-xs text-[var(--text-muted)]">{cmd.category}</span>
                {cmd.shortcut && (
                  <kbd className="text-xs px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)]">
                    {cmd.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
