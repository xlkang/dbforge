import { Database, Table2, Activity, Loader2, Wifi, WifiOff } from 'lucide-react';
import { useDatabaseStore } from '../../stores/databaseStore';

export function StatusBar() {
  const { connection, tables, selectedTable, queryResult, isExecuting } = useDatabaseStore();

  return (
    <footer className="h-8 bg-gray-900/90 backdrop-blur-sm border-t border-gray-800 flex items-center justify-between px-4 text-xs shrink-0">
      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className="flex items-center gap-2">
          {connection ? (
            <>
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3 h-3 text-green-500" strokeWidth={2} />
                <span className="text-green-400/80">已连接</span>
              </div>
              <span className="text-gray-700">|</span>
              <span className="text-gray-500 flex items-center gap-1.5">
                <Database className="w-3 h-3" strokeWidth={2} />
                {connection.name}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <WifiOff className="w-3 h-3 text-gray-600" strokeWidth={2} />
              <span className="text-gray-600">未连接</span>
            </div>
          )}
        </div>

        {connection && (
          <>
            <div className="h-3 w-px bg-gray-800"></div>
            
            {/* Tables count */}
            <div className="flex items-center gap-1.5 text-gray-500">
              <Table2 className="w-3 h-3" strokeWidth={2} />
              <span>{tables.length} 个表</span>
            </div>

            {/* Selected table */}
            {selectedTable && (
              <>
                <div className="h-3 w-px bg-gray-800"></div>
                <span className="text-blue-400/80 bg-blue-500/10 px-1.5 py-0.5 rounded">
                  {selectedTable}
                </span>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Query result */}
        {queryResult && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <Activity className="w-3 h-3" strokeWidth={2} />
            <span>{queryResult.rowCount.toLocaleString()} 行</span>
            <span className="text-gray-700">•</span>
            <span>{queryResult.executionTime.toFixed(2)}ms</span>
          </div>
        )}

        {/* Loading */}
        {isExecuting && (
          <div className="flex items-center gap-1.5 text-blue-400">
            <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2} />
            <span>执行中...</span>
          </div>
        )}
      </div>
    </footer>
  );
}
