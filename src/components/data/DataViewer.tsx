import { useState } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';

const PAGE_SIZE = 100;

interface DataViewerProps {
  tableName?: string;
}

export function DataViewer({ tableName }: DataViewerProps) {
  const storeTableName = useDatabaseStore((s) => s.selectedTable);
  const displayTable = tableName || storeTableName;
  const { queryResult, queryError, clearResult } = useDatabaseStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterText, setFilterText] = useState('');

  if (!queryResult && !queryError) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>执行查询查看结果</p>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="p-4">
        <div className="bg-red-900/30 border border-red-600 rounded-lg p-4">
          <h4 className="text-red-400 font-semibold mb-2">查询错误</h4>
          <pre className="text-red-300 text-sm whitespace-pre-wrap">{queryError}</pre>
        </div>
        <button
          onClick={clearResult}
          className="mt-3 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
        >
          清除
        </button>
      </div>
    );
  }

  if (!queryResult) return null;

  const { columns, rows, rowCount, affectedRows, executionTime, isSelect } = queryResult;

  // Apply filtering
  let filteredRows = rows;
  if (filterText) {
    const lower = filterText.toLowerCase();
    filteredRows = rows.filter(row => 
      columns.some(col => {
        const val = row[col];
        return val !== null && String(val).toLowerCase().includes(lower);
      })
    );
  }

  // Apply sorting
  let sortedRows = filteredRows;
  if (sortColumn) {
    sortedRows = [...filteredRows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal === null) return sortDirection === 'asc' ? 1 : -1;
      if (bVal === null) return sortDirection === 'asc' ? -1 : 1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }

  // Non-SELECT query result
  if (!isSelect) {
    return (
      <div className="p-4">
        <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
          <h4 className="text-green-400 font-semibold mb-2">执行成功</h4>
          <p className="text-green-300">
            影响了 <span className="font-bold">{affectedRows}</span> 行
          </p>
          <p className="text-gray-400 text-sm mt-2">执行时间: {executionTime.toFixed(2)}ms</p>
        </div>
        <button
          onClick={clearResult}
          className="mt-3 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
        >
          清除
        </button>
      </div>
    );
  }

  // SELECT query result
  if (columns.length === 0) {
    return (
      <div className="p-4">
        <div className="text-gray-400">查询返回空结果</div>
      </div>
    );
  }

  // Use sorted/filtered rows for display
  const displayRows = sortColumn || filterText ? sortedRows : rows;
  const totalPages = Math.ceil(displayRows.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedRows = displayRows.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="flex flex-col h-full">
      {/* Header with sort and filter */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between bg-gray-800">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">
            结果: <span className="text-gray-200">{displayRows.length.toLocaleString()} 行</span>
            {filterText && <span className="text-blue-400 ml-1">(筛选)</span>}
            {sortColumn && <span className="text-blue-400 ml-1">(排序)</span>}
          </span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400">
            原始: <span className="text-gray-200">{rowCount.toLocaleString()} 行</span>
          </span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400">
            时间: <span className="text-gray-200">{executionTime.toFixed(2)}ms</span>
          </span>
          {displayTable && (
            <>
              <span className="text-gray-500">|</span>
              <span className="text-blue-400">表: {displayTable}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="筛选..."
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-700 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-gray-300 font-medium border-b border-gray-600">#</th>
              {columns.map(col => (
                <th 
                  key={col} 
                  className="px-3 py-2 text-left text-gray-300 font-medium border-b border-gray-600 font-mono cursor-pointer hover:bg-gray-600"
                  onClick={() => {
                    if (sortColumn === col) {
                      if (sortDirection === 'asc') {
                        setSortDirection('desc');
                      } else {
                        setSortColumn(null);
                        setSortDirection('asc');
                      }
                    } else {
                      setSortColumn(col);
                      setSortDirection('asc');
                    }
                    setCurrentPage(1);
                  }}
                >
                  <div className="flex items-center gap-1">
                    {col}
                    {sortColumn === col && (
                      <span className="text-blue-400">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, idx) => (
              <tr 
                key={startIndex + idx} 
                className="hover:bg-gray-800 border-b border-gray-700/50"
              >
                <td className="px-3 py-2 text-gray-500 text-xs">{startIndex + idx + 1}</td>
                {columns.map(col => (
                  <td key={col} className="px-3 py-2 text-gray-300 font-mono max-w-xs truncate">
                    {row[col] === null ? (
                      <span className="text-gray-500 italic">NULL</span>
                    ) : (
                      String(row[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-gray-700 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-2 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
          >
            ««
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
          >
            « 上一页
          </button>
          <span className="px-3 text-gray-400 text-sm">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
          >
            下一页 »
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
          >
            »»
          </button>
        </div>
      )}
    </div>
  );
}