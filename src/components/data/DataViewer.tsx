import { useMemo, useState, useEffect } from 'react';
import { Table2, BarChart3, Search, Filter, X, ArrowUpDown, ArrowUp, ArrowDown, AlertCircle, CheckCircle, Clock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useDatabaseStore } from '../../stores/databaseStore';

const DEFAULT_PAGE_SIZE = 50;
const PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 500];

interface DataViewerProps {
  tableName?: string;
}

export function DataViewer({ tableName }: DataViewerProps) {
  const storeTableName = useDatabaseStore((s) => s.selectedTable);
  const displayTable = tableName || storeTableName;
  const { queryResult, queryError, clearResult } = useDatabaseStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterText, setFilterText] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [quickFilter, setQuickFilter] = useState<{ col: string; val: unknown } | null>(null);

  if (!queryResult && !queryError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900/50">
        <div className="text-center">
          <Table2 className="w-12 h-12 text-gray-700 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-gray-500">执行 SQL 查询查看结果</p>
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="p-4 bg-gray-900">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-400" strokeWidth={2} />
            <h4 className="text-red-400 font-semibold">查询错误</h4>
          </div>
          <pre className="text-red-300/80 text-sm whitespace-pre-wrap bg-red-500/5 rounded-lg p-3 font-mono">{queryError}</pre>
        </div>
        <button
          onClick={clearResult}
          className="mt-3 flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700"
        >
          <X className="w-4 h-4" />
          清除结果
        </button>
      </div>
    );
  }

  if (!queryResult) return null;

  const { columns, rows, rowCount, affectedRows = 0, executionTime, isSelect } = queryResult;

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
      <div className="p-6 bg-gray-900">
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" strokeWidth={2} />
            </div>
            <div>
              <h4 className="text-green-400 font-semibold text-lg">执行成功</h4>
              <p className="text-gray-500 text-sm">语句已成功执行</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-500/5 rounded-lg p-3">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">受影响行数</p>
              <p className="text-green-400 text-2xl font-bold">{affectedRows.toLocaleString()}</p>
            </div>
            <div className="bg-green-500/5 rounded-lg p-3">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">执行时间</p>
              <p className="text-green-400 text-2xl font-bold">{executionTime.toFixed(2)}ms</p>
            </div>
          </div>
        </div>
        <button
          onClick={clearResult}
          className="mt-4 flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700"
        >
          <X className="w-4 h-4" />
          清除结果
        </button>
      </div>
    );
  }

  // SELECT query result
  if (columns.length === 0) {
    return (
      <div className="p-6 bg-gray-900">
        <div className="text-gray-500 text-center py-8">
          <Table2 className="w-10 h-10 text-gray-700 mx-auto mb-2" strokeWidth={1.5} />
          <p>查询返回空结果</p>
        </div>
      </div>
    );
  }

  // Use sorted/filtered rows for display
  const displayRows = sortColumn || filterText || quickFilter ? sortedRows : rows;
  // Reset to page 1 when query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [queryResult]);

  const totalPages = Math.ceil(displayRows.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = displayRows.slice(startIndex, startIndex + pageSize);

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
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-gray-900/80 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Table2 className="w-4 h-4 text-blue-400" strokeWidth={2} />
            <span className="text-gray-300 font-medium text-sm">查询结果</span>
          </div>
          <div className="h-4 w-px bg-gray-800"></div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-500">
              显示 <span className="text-gray-300 font-medium">{displayRows.length.toLocaleString()}</span> 行
              {(filterText || quickFilter) && (
                <span className="text-blue-400 ml-1">(已筛选)</span>
              )}
            </span>
            <span className="text-gray-600">原始: <span className="text-gray-400">{rowCount.toLocaleString()}</span></span>
            <span className="text-gray-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className="text-gray-400">{executionTime.toFixed(2)}ms</span>
            </span>
          </div>
          {displayTable && (
            <>
              <div className="h-4 w-px bg-gray-800"></div>
              <span className="text-blue-400 text-sm bg-blue-500/10 px-2 py-0.5 rounded">{displayTable}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" strokeWidth={2} />
            <input
              type="text"
              placeholder="搜索..."
              value={filterText}
              onChange={(e) => {
                setFilterText(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 w-36"
            />
            {filterText && (
              <button
                onClick={() => setFilterText('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          
          {/* Stats Toggle */}
          <button
            onClick={() => setShowStats(!showStats)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              showStats 
                ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-300'
            }`}
            title="字段统计"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            统计
          </button>
          
          {/* Quick Filter Clear */}
          {quickFilter && (
            <button
              onClick={() => setQuickFilter(null)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all"
            >
              <Filter className="w-3.5 h-3.5" />
              清除
            </button>
          )}
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && (
        <div className="border-b border-gray-800 bg-gray-800/30 p-3 max-h-48 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            {columns.map(col => {
              const stats = columnStats[col];
              const nullPercent = ((stats.nulls / rows.length) * 100).toFixed(1);
              const topVals = getTopValues(col, 3);
              return (
                <div key={col} className="bg-gray-800/50 hover:bg-gray-800/80 rounded-lg p-3 transition-colors border border-gray-700/50">
                  <div className="font-mono text-blue-400 font-medium text-sm truncate mb-2" title={col}>{col}</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">唯一值</span>
                      <span className="text-gray-300 font-medium">{stats.unique.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">NULL</span>
                      <span className={`font-medium ${stats.nulls > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        {stats.nulls} <span className="text-gray-600">({nullPercent}%)</span>
                      </span>
                    </div>
                  </div>
                  {topVals.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-700/50">
                      <div className="text-gray-600 text-[10px] uppercase tracking-wider mb-1">热门值</div>
                      <div className="flex flex-wrap gap-1">
                        {topVals.map((t, i) => (
                          <button
                            key={i}
                            onClick={() => setQuickFilter({ col, val: t.val })}
                            className="text-xs px-1.5 py-0.5 bg-gray-700 hover:bg-purple-500/30 hover:text-purple-400 text-gray-400 rounded transition-colors"
                            title={`过滤: ${t.val}`}
                          >
                            {String(t.val).slice(0, 8)}
                            <span className="ml-1 text-gray-600">{t.percent}%</span>
                          </button>
                        ))}
                      </div>
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
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-800/80 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="px-3 py-2.5 text-left text-gray-500 font-medium text-xs border-b border-gray-700 w-14">#</th>
              {columns.map(col => (
                <th 
                  key={col} 
                  className="px-3 py-2.5 text-left text-gray-400 font-medium text-xs border-b border-gray-700 font-mono min-w-[120px] cursor-pointer hover:bg-gray-700/50 transition-colors group"
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
                  <div className="flex items-center gap-1.5">
                    {col}
                    {sortColumn === col ? (
                      sortDirection === 'asc' ? 
                        <ArrowUp className="w-3 h-3 text-blue-400" /> : 
                        <ArrowDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-700 opacity-0 group-hover:opacity-100" />
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
                className="hover:bg-gray-800/50 border-b border-gray-800/50 transition-colors"
              >
                <td className="px-3 py-2.5 text-gray-600 text-xs text-right font-mono">{startIndex + idx + 1}</td>
                {columns.map(col => (
                  <td 
                    key={col} 
                    className="px-3 py-2.5 text-gray-300 font-mono max-w-[300px] truncate"
                  >
                    {row[col] === null ? (
                      <span className="text-gray-600 italic">NULL</span>
                    ) : quickFilter?.col === col && quickFilter?.val === row[col] ? (
                      <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                        {highlightText(String(row[col]))}
                      </span>
                    ) : (
                      <button
                        onClick={() => setQuickFilter({ col, val: row[col] })}
                        className="hover:text-purple-400 text-left w-full"
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
        <div className="px-4 py-2 border-t border-gray-800 flex items-center justify-between bg-gray-900/80 shrink-0">
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500">
              <span className="text-gray-400">{displayRows.length.toLocaleString()}</span> 条记录
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">每页</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded border border-gray-700 outline-none"
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span className="text-xs text-gray-500">条</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-600 mr-2">
              {startIndex + 1}-{Math.min(startIndex + pageSize, displayRows.length)}
            </span>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed rounded text-gray-500 hover:text-gray-300"
              title="首页"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed rounded text-gray-500 hover:text-gray-300"
              title="上一页"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-gray-400 text-sm font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed rounded text-gray-500 hover:text-gray-300"
              title="下一页"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed rounded text-gray-500 hover:text-gray-300"
              title="末页"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
