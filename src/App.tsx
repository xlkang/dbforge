import { DatabasePanel } from './components/connection/DatabasePanel';
import { SchemaPanel } from './components/schema/SchemaPanel';
import { QueryEditor } from './components/query/QueryEditor';
import { DataViewer } from './components/data/DataViewer';
import { ExportPanel } from './components/export/ExportPanel';
import { StatusBar } from './components/layout/StatusBar';
import { ThemeToggle } from './components/layout/ThemeToggle';

function App() {
  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100 dark:bg-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center">
          <h1 className="text-lg font-bold text-blue-400">DBForge</h1>
          <span className="ml-2 text-xs text-gray-500">SQLite 数据库管理工具</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col shrink-0 overflow-hidden">
          <DatabasePanel />
          <div className="flex-1 overflow-hidden">
            <SchemaPanel />
          </div>
          <ExportPanel />
        </aside>

        {/* Main Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Query Editor */}
          <div className="h-56 border-b border-gray-700 shrink-0 overflow-hidden">
            <QueryEditor />
          </div>

          {/* Results */}
          <div className="flex-1 overflow-hidden bg-gray-900">
            <DataViewer />
          </div>
        </main>
      </div>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}

export default App;