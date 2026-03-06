import { useMemo, useState } from 'react';
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
  const [showStats, setShowStats] = useState(false);
  const [quickFilter, setQuickFilter] = useState<{ col: string; val: unknown } | null>(null);

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

  // Calculate column statistics
  const columnStats = useMemo(() => {
    const stats: Record<string, { unique: number; nulls: number; values: Map<unknown, number> }> = {};
    columns.forEach(col => {
      const values = new Map<unknown, number>();
      let nulls = 0;
      rows.forEach(row => {
        const val = row[col];
        if (val === null) {
          nulls++;
        } else {
          values.set(val, (values.get(val) || 0) + 1);
        }
      });
      stats[col] = { unique: values.size, nulls, values };
    });
    return stats;
  }, [columns, rows]);

  // Get top values for a column
  const getTopValues = (col: string, limit = 5) => {
    const stats = columnStats[col];
    if (!stats) return [];
    return [...stats.values.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([val, count]) => ({ val, count, percent: ((count / rows.length) * 100).toFixed(1) }));
  };

  // Apply quick filter
  let filteredRows = rows;
  if (quickFilter) {
    filteredRows = rows.filter(row => row[quickFilter.col] === quickFilter.val);
  }
  
  // Apply text filtering
  if (filterText) {
    const lower = filterText.toLowerCase();
    filteredRows = filteredRows.filter(row => 
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
  const displayRows = sortColumn || filterText || quickFilter ? sortedRows : rows;
  const totalPages = Math.ceil(displayRows.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedRows = displayRows.slice(startIndex, startIndex + PAGE_SIZE);

  // Highlight matching text
  const highlightText = (text: string) => {
    if (!filterText) return text;
    const parts = String(text).split(new RegExp(`(${filterText})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === filterText.toLowerCase() 
        ? <mark key={i} className="bg-yellow-500/50 text-white rounded px-0.5">{part}</mark>
        : part
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with stats toggle */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between bg-gray-800">
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <span className="text-gray-400">
            结果: <span className="text-gray-200">{displayRows.length.toLocaleString()} 行</span>
            {filterText && <span className="text-blue-400 ml-1">(筛选)</span>}
            {sortColumn && <span className="text-blue-400 ml-1">(排序)</span>}
            {quickFilter && <span className="text-purple-400 ml-1">(快速过滤)</span>}
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
          <button
            onClick={() => setShowStats(!showStats)}
            className={`px-2 py-1 text-sm rounded border ${
              showStats ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
            }`}
            title="字段统计"
          >
            📊 统计
          </button>
          {quickFilter && (
            <button
              onClick={() => setQuickFilter(null)}
              className="px-2 py-1 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded"
            >
              清除过滤
            </button>
          )}
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && (
        <div className="border-b border-gray-700 bg-gray-800/50 p-3 max-h-48 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            {columns.map(col => {
              const stats = columnStats[col];
              const nullPercent = ((stats.nulls / rows.length) * 100).toFixed(1);
              const topVals = getTopValues(col, 3);
              return (
                <div key={col} className="bg-gray-700/50 rounded p-2 text-xs">
                  <div className="font-mono text-blue-400 font-medium truncate" title={col}>{col}</div>
                  <div className="text-gray-400 mt-1">
                    <div>唯一值: <span className="text-gray-200">{stats.unique.toLocaleString()}</span></div>
                    <div>NULL: <span className={`${stats.nulls > 0 ? 'text-red-400' : 'text-gray-200'}`}>{stats.nulls} ({nullPercent}%)</span></div>
                  </div>
                  {topVals.length > 0 && (
                    <div className="mt-1 text-gray-500">
                      热门: {topVals.map((t, i) => (
                        <span key={i} className="mr-1">
                          <button
                            onClick={() => setQuickFilter({ col, val: t.val })}
                            className="hover:text-purple-400 hover:underline"
                            title={`过滤: ${t.val}`}
                          >
                            {String(t.val).slice(0, 10)}
                          </button>
                          ({t.percent}%)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-700 sticky top-0 z-10">
            <tr>
              <th className="px-2 py-2 text-left text-gray-300 font-medium border-b border-gray-600 w-12">#</th>
              {columns.map(col => (
                <th 
                  key={col} 
                  className="px-2 py-2 text-left text-gray-300 font-medium border-b border-gray-600 font-mono min-w-[100px] cursor-pointer hover:bg-gray-600"
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
                      <span className="text-blue-400 text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
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
                <td className="px-2 py-2 text-gray-500 text-xs text-right">{startIndex + idx + 1}</td>
                {columns.map(col => (
                  <td 
                    key={col} 
                    className="px-2 py-2 text-gray-300 font-mono max-w-xs truncate"
                  >
                    {row[col] === null ? (
                      <span className="text-gray-500 italic">NULL</span>
                    ) : quickFilter?.col === col && quickFilter?.val === row[col] ? (
                      <span className="bg-purple-500/30 text-purple-200 px-1 rounded">
                        {highlightText(String(row[col]))}
                      </span>
                    ) : (
                      <button
                        onClick={() => setQuickFilter({ col, val: row[col] })}
                        className="hover:text-purple-400 text-left"
                        title="点击快速过滤"
                      >
                        {highlightText(String(row[col]))}
                      </button>
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
        <div className="p-3 border-t border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
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
              «
            </button>
          </div>
          <span className="px-3 text-gray-400 text-sm">
            第 {currentPage} / {totalPages} 页 ({(startIndex + 1).toLocaleString()}-{Math.min(startIndex + PAGE_SIZE, displayRows.length).toLocaleString()} 条)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
            >
              »
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
            >
              »»
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
