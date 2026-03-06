import { useDatabaseStore } from '../../stores/databaseStore';

export function StatusBar() {
  const { connection, tables, selectedTable, queryResult, isExecuting } = useDatabaseStore();

  return (
    <footer className="h-6 bg-gray-800 border-t border-gray-700 flex items-center px-3 text-xs text-gray-400 shrink-0">
      <div className="flex items-center gap-4">
        {/* Connection status */}
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${connection ? 'bg-green-500' : 'bg-gray-500'}`}></span>
          {connection ? '已连接' : '未连接'}
        </span>

        {/* Database name */}
        {connection && (
          <span className="text-gray-300">{connection.name}</span>
        )}

        {/* Tables count */}
        {tables.length > 0 && (
          <span>{tables.length} 个表</span>
        )}

        {/* Selected table */}
        {selectedTable && (
          <span className="text-blue-400">当前: {selectedTable}</span>
        )}

        {/* Query result */}
        {queryResult && (
          <span>{queryResult.rowCount} 行 ({queryResult.executionTime.toFixed(1)}ms)</span>
        )}

        {/* Loading */}
        {isExecuting && (
          <span className="text-blue-400">执行中...</span>
        )}
      </div>
    </footer>
  );
}