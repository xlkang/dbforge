import { useState } from 'react';
import { 
  Database, FileText, Play, Download, Upload, 
  RefreshCw, Settings, Sun, Moon, Table2, FolderOpen, Layers, BarChart3, HardDrive
} from 'lucide-react';
import { useDatabaseStore } from '../../stores/databaseStore';
import { useTabStore } from '../../stores/tabStore';

interface ToolbarProps {
  onNewQuery?: () => void;
  onNewTable?: () => void;
  onBackup?: () => void;
}

export function Toolbar({ onNewQuery, onNewTable, onBackup }: ToolbarProps) {
  const { connection, executeQuery, loadTables, queryResult } = useDatabaseStore();
  const { addTab } = useTabStore();
  const [executing, setExecuting] = useState(false);

  const handleExecute = async () => {
    const query = useDatabaseStore.getState().query;
    if (!query.trim()) return;
    setExecuting(true);
    try {
      await executeQuery(query);
    } finally {
      setExecuting(false);
    }
  };

  const refreshTables = async () => {
    await loadTables();
  };

  const openChartPanel = () => {
    // 如果有查询结果，打开图表面板
    if (queryResult && queryResult.isSelect) {
      addTab({
        title: '数据图表',
        type: 'chart',
      });
    }
  };

  return (
    <div className="h-10 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center px-2 gap-1 shrink-0">
      {/* Connection */}
      <div className="flex items-center gap-1 px-2 border-r border-[var(--border-color)] mr-2">
        <Database size={14} className="text-[var(--accent)]" />
        <span className="text-xs text-[var(--text-muted)]">
          {connection ? connection.name : '未连接'}
        </span>
      </div>

      {/* File Operations */}
      <ToolbarButton icon={FolderOpen} label="打开" title="打开数据库文件" />
      <ToolbarButton icon={Table2} label="新建表" title="创建新表" onClick={onNewTable} />
      <ToolbarButton icon={FileText} label="新建查询" title="新建查询窗口" onClick={onNewQuery} />
      
      <div className="w-px h-5 bg-[var(--bg-tertiary)] mx-1" />

      {/* Execute */}
      <ToolbarButton 
        icon={Play} 
        label="执行" 
        title="执行查询 (Ctrl+Enter)"
        onClick={handleExecute}
        variant="primary"
        loading={executing}
      />
      
      <div className="w-px h-5 bg-[var(--bg-tertiary)] mx-1" />

      {/* Data Operations */}
      <ToolbarButton icon={Download} label="导出" title="导出数据" />
      <ToolbarButton icon={Upload} label="导入" title="导入数据" />
      
      <div className="w-px h-5 bg-[var(--bg-tertiary)] mx-1" />

      {/* Refresh */}
      <ToolbarButton 
        icon={RefreshCw} 
        label="刷新" 
        title="刷新表列表" 
        onClick={refreshTables}
      />
      <ToolbarButton icon={HardDrive} label="备份" title="备份/还原数据库" onClick={onBackup} />

      <div className="flex-1" />

      {/* Right Side */}
      <ToolbarButton 
        icon={BarChart3} 
        label="图表" 
        title="查看查询结果图表" 
        onClick={openChartPanel}
        disabled={!queryResult || !queryResult.isSelect}
      />
      <ToolbarButton icon={Layers} label="ER图" title="查看ER图" />
      <ToolbarButton icon={Settings} label="设置" title="设置" />
      <ThemeToggleButton />
    </div>
  );
}

interface ToolbarButtonProps {
  icon: React.ElementType;
  label?: string;
  title?: string;
  onClick?: () => void;
  variant?: 'default' | 'primary';
  loading?: boolean;
  disabled?: boolean;
}

function ToolbarButton({ icon: Icon, label, title, onClick, variant = 'default', loading, disabled }: ToolbarButtonProps) {
  const baseClass = variant === 'primary' 
    ? 'bg-blue-600 hover:bg-[var(--accent)] text-white' 
    : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]';
  
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={loading || disabled}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${baseClass} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? (
        <RefreshCw size={14} className="animate-spin" />
      ) : (
        <Icon size={14} />
      )}
      {label && <span>{label}</span>}
    </button>
  );
}

function ThemeToggleButton() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  const toggle = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDark(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDark(true);
    }
  };

  return (
    <button
      onClick={toggle}
      title={dark ? '切换到浅色模式' : '切换到深色模式'}
      className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
    >
      {dark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
