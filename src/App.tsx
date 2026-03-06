import { useEffect, useCallback, useState } from 'react';
import { useDatabaseStore } from './stores/databaseStore';
import { useTabStore } from './stores/tabStore';
import { DatabasePanel } from './components/connection/DatabasePanel';
import { QuickStart } from './components/layout/QuickStart';
import { SchemaPanel } from './components/schema/SchemaPanel';
import { QueryEditor } from './components/query/QueryEditor';
import { SavedQueries } from './components/query/SavedQueries';
import { DataViewer } from './components/data/DataViewer';
import { TableEditor } from './components/data/TableEditor';
import { ExportPanel } from './components/export/ExportPanel';
import { StatusBar } from './components/layout/StatusBar';
import { ThemeToggle } from './components/layout/ThemeToggle';
import { ShortcutsPanel } from './components/layout/ShortcutsPanel';
import { TabBar } from './components/tabs/TabBar';
import { TabContent } from './components/tabs/TabContent';
import { ToastContainer } from './components/common/ToastContainer';
import { ErrorBoundary } from './components/common/Toast';
import { Toolbar } from './components/layout/Toolbar';
import { CommandPalette } from './components/layout/CommandPalette';
import { GlobalSearch } from './components/layout/GlobalSearch';
import { ConnectionStatus } from './components/layout/ConnectionStatus';

function App() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const connection = useDatabaseStore((s) => s.connection);
  const loadTables = useDatabaseStore((s) => s.loadTables);
  const connectionType = connection?.type;
  
  // 自动重连：页面加载时如果存在保存的连接，自动加载表结构
  useEffect(() => {
    if (connectionType === 'mysql') {
      loadTables();
    }
  }, [connectionType, loadTables]);
  
  // 全局键盘快捷键
  const { addTab, removeTab, setActiveTab, tabs, activeTabId } = useTabStore();
  const setQuery = useDatabaseStore((s) => s.setQuery);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl+Shift+P: 打开命令面板
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      setCommandPaletteOpen(true);
      return;
    }
    // Ctrl+N: 新建查询标签
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      addTab({ title: '新查询', type: 'query' });
    }
    // Ctrl+W: 关闭当前标签
    if (e.ctrlKey && e.key === 'w') {
      e.preventDefault();
      if (activeTabId) {
        removeTab(activeTabId);
      }
    }
    // Ctrl+Tab: 切换标签
    if (e.ctrlKey && e.key === 'Tab') {
      e.preventDefault();
      const currentIndex = tabs.findIndex(t => t.id === activeTabId);
      const nextIndex = e.shiftKey 
        ? (currentIndex - 1 + tabs.length) % tabs.length 
        : (currentIndex + 1) % tabs.length;
      if (tabs[nextIndex]) {
        setActiveTab(tabs[nextIndex].id);
      }
    }
    // Ctrl+L: 清空编辑器
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      setQuery('');
    }
  }, [addTab, removeTab, setActiveTab, activeTabId, tabs, setQuery]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  const dbType = connection?.type || 'sqlite';
  const dbName = connection?.name || '';
  const typeLabel = dbType === 'mysql' ? 'MySQL' : 'SQLite';
  const hasTabs = tabs.length > 0;

  // Handle file selection from QuickStart
  const handleFileSelect = async (file: File) => {
    try {
      await useDatabaseStore.getState().openDatabase(file);
    } catch (err) {
      console.error('连接失败:', err);
    }
  };

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <ToastContainer />
        
        {/* Header - Navicat style */}
        <header className="h-11 bg-[var(--header-bg)] border-b border-[var(--border-color)] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-md flex items-center justify-center">
                <span className="text-white text-xs font-bold">DB</span>
              </div>
              <h1 className="text-base font-semibold text-[var(--text-primary)]">DBForge</h1>
            </div>
            {connection && (
              <div className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-hover)] rounded-md">
                <span className="text-xs text-[var(--accent)]">{typeLabel}</span>
                <span className="text-xs text-[var(--text-muted)]">|</span>
                <span className="text-xs text-[var(--text-secondary)] font-mono">{dbName}</span>
              </div>
            )}
            {connection && <ConnectionStatus />}
          </div>
          <div className="flex items-center gap-1">
            <SavedQueries />
            <ShortcutsPanel />
            <ThemeToggle />
          </div>
        </header>

        {/* Toolbar */}
        {connection && <Toolbar />}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Navicat style */}
          <aside className="w-64 bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] flex flex-col shrink-0 overflow-hidden">
            {connection ? (
              <>
                <DatabasePanel />
                <div className="flex-1 overflow-hidden">
                  <SchemaPanel />
                </div>
                <ExportPanel />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-4">请先连接数据库</p>
                </div>
              </div>
            )}
          </aside>

          {/* Main Area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Bar */}
            {hasTabs && <TabBar />}

            {/* Content: Tabs or Legacy */}
            {hasTabs ? (
              <TabContent />
            ) : connection ? (
              <>
                {/* Legacy layout for backward compatibility */}
                <div className="h-56 border-b border-[var(--border-color)] shrink-0 overflow-hidden">
                  <QueryEditor />
                </div>
                <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-primary)]">
                  <div className="flex-1 overflow-hidden">
                    <DataViewer />
                  </div>
                  <TableEditor />
                </div>
              </>
            ) : (
              <QuickStart onFileSelect={handleFileSelect} />
            )}
          </main>
        </div>

        {/* Status Bar */}
        <StatusBar />

        {/* Command Palette */}
        <CommandPalette 
          isOpen={commandPaletteOpen} 
          onClose={() => setCommandPaletteOpen(false)} 
        />
        
        {/* Global Search */}
        <GlobalSearch />
      </div>
    </ErrorBoundary>
  );
}

export default App;
