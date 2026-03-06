import { useMemo, useState, useEffect } from 'react';
import { ChartPanel } from './ChartPanel';
import { Virtuoso } from 'react-virtuoso';
import { Table2, BarChart3, Search, Filter, X, ArrowUpDown, ArrowUp, ArrowDown, AlertCircle, CheckCircle, Clock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from 'lucide-react';
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
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-primary)]/50">
        <div className="text-center">
          <Table2 className="w-12 h-12 text-gray-700 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-[var(--text-muted)]">执行 SQL 查询查看结果</p>
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="p-4 bg-[var(--bg-primary)]">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-400" strokeWidth={2} />
            <h4 className="text-red-400 font-semibold">查询错误</h4>
          </div>
          <pre className="text-red-300/80 text-sm whitespace-pre-wrap bg-red-500/5 rounded-lg p-3 font-mono">{queryError}</pre>
        </div>
        <button
          onClick={clearResult}
          className="mt-3 flex items-center gap-2 px-4 py-2 text-sm bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-lg transition-colors border border-[var(--border-color)]"
        >
          <X className="w-4 h-4" />
          清除结果
        </button>
      </div>
    );
  }

  const [showChart, setShowChart] = useState(false);

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
      <div className="p-6 bg-[var(--bg-primary)]">
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" strokeWidth={2} />
            </div>
            <div>
              <h4 className="text-green-400 font-semibold text-lg">执行成功</h4>
              <p className="text-[var(--text-muted)] text-sm">语句已成功执行</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-500/5 rounded-lg p-3">
              <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1">受影响行数</p>
              <p className="text-green-400 text-2xl font-bold">{affectedRows.toLocaleString()}</p>
            </div>
            <div className="bg-green-500/5 rounded-lg p-3">
              <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1">执行时间</p>
              <p className="text-green-400 text-2xl font-bold">{executionTime.toFixed(2)}ms</p>
            </div>
          </div>
        </div>
        <button
          onClick={clearResult}
          className="mt-4 flex items-center gap-2 px-4 py-2 text-sm bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-lg transition-colors border border-[var(--border-color)]"
        >
          <X className="w-4 h-4" />
          清除结果
        </button>
        {isSelect && columns.length > 0 && rows.length > 0 && (
          <button
            onClick={() => setShowChart(!showChart)}
            className="mt-4 ml-2 flex items-center gap-2 px-4 py-2 text-sm bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-lg transition-colors border border-[var(--border-color)]"
          >
            <BarChart3 className="w-4 h-4" />
            {showChart ? '隐藏图表' : '查看图表'}
          </button>
        )}
      </div>
    );
  }

  // SELECT query result
  if (columns.length === 0) {
    return (
      <div className="p-6 bg-[var(--bg-primary)]">
        <div className="text-[var(--text-muted)] text-center py-8">
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

  // Export function for query results
  const handleExport = (format: 'csv' | 'json') => {
    const { columns, rows } = queryResult;
    if (!columns.length || !rows.length) return;

    let content: string;
    let mimeType: string;
    let filename: string;

    if (format === 'csv') {
      const header = columns.map(col => {
        if (col.includes(',') || col.includes('"') || col.includes('\n')) {
          return `"${col.replace(/"/g, '""')}"`;
        }
        return col;
      }).join(',');
      const dataRows = rows.map(row => 
        columns.map(col => {
          const val = row[col];
          if (val === null) return '';
          const strVal = String(val);
          if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
            return `"${strVal.replace(/"/g, '""')}"`;
          }
          return strVal;
        }).join(',')
      );
      content = [header, ...dataRows].join('\n');
      mimeType = 'text/csv';
      filename = `${displayTable || 'query_result'}.csv`;
    } else {
      content = JSON.stringify(rows, null, 2);
      mimeType = 'application/json';
      filename = `${displayTable || 'query_result'}.json`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-[var(--bg-primary)]/80 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Table2 className="w-4 h-4 text-[var(--accent)]" strokeWidth={2} />
            <span className="text-[var(--text-secondary)] font-medium text-sm">查询结果</span>
          </div>
          <div className="h-4 w-px bg-[var(--bg-secondary)]"></div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-[var(--text-muted)]">
              显示 <span className="text-[var(--text-secondary)] font-medium">{displayRows.length.toLocaleString()}</span> 行
              {(filterText || quickFilter) && (
                <span className="text-[var(--accent)] ml-1">(已筛选)</span>
              )}
            </span>
            <span className="text-[var(--text-muted)]">原始: <span className="text-[var(--text-muted)]">{rowCount.toLocaleString()}</span></span>
            <span className="text-[var(--text-muted)] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className="text-[var(--text-muted)]">{executionTime.toFixed(2)}ms</span>
            </span>
          </div>
          {displayTable && (
            <>
              <div className="h-4 w-px bg-[var(--bg-secondary)]"></div>
              <span className="text-[var(--accent)] text-sm bg-[var(--accent)]/10 px-2 py-0.5 rounded">{displayTable}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={2} />
            <input
              type="text"
              placeholder="搜索..."
              value={filterText}
              onChange={(e) => {
                setFilterText(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)] placeholder-gray-600 focus:outline-none focus:border-blue-500/50 w-36"
            />
            {filterText && (
              <button
                onClick={() => setFilterText('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-muted)]"
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
                ? 'bg-[var(--accent)]/20 border-blue-500/30 text-[var(--accent)]' 
                : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
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
          
          {/* Export Dropdown */}
          {isSelect && columns.length > 0 && rows.length > 0 && (
            <div className="relative group">
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-green-600/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-all"
                title="导出查询结果"
              >
                <Download className="w-3.5 h-3.5" />
                导出
              </button>
              <div className="absolute right-0 top-full mt-1 w-28 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-3 py-2 text-xs text-left text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-t-lg"
                >
                  导出 CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full px-3 py-2 text-xs text-left text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-b-lg"
                >
                  导出 JSON
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && (
        <div className="border-b border-gray-800 bg-[var(--bg-secondary)]/30 p-3 max-h-48 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            {columns.map(col => {
              const stats = columnStats[col];
              const nullPercent = ((stats.nulls / rows.length) * 100).toFixed(1);
              const topVals = getTopValues(col, 3);
              return (
                <div key={col} className="bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)]/80 rounded-lg p-3 transition-colors border border-[var(--border-color)]/50">
                  <div className="font-mono text-[var(--accent)] font-medium text-sm truncate mb-2" title={col}>{col}</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">唯一值</span>
                      <span className="text-[var(--text-secondary)] font-medium">{stats.unique.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">NULL</span>
                      <span className={`font-medium ${stats.nulls > 0 ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>
                        {stats.nulls} <span className="text-[var(--text-muted)]">({nullPercent}%)</span>
                      </span>
                    </div>
                  </div>
                  {topVals.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[var(--border-color)]/50">
                      <div className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider mb-1">热门值</div>
                      <div className="flex flex-wrap gap-1">
                        {topVals.map((t, i) => (
                          <button
                            key={i}
                            onClick={() => setQuickFilter({ col, val: t.val })}
                            className="text-xs px-1.5 py-0.5 bg-[var(--bg-tertiary)] hover:bg-purple-500/30 hover:text-purple-400 text-[var(--text-muted)] rounded transition-colors"
                            title={`过滤: ${t.val}`}
                          >
                            {String(t.val).slice(0, 8)}
                            <span className="ml-1 text-[var(--text-muted)]">{t.percent}%</span>
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

      {/* Table - Use Virtuoso for large datasets */}
      <div className="flex-1 overflow-hidden">
        {displayRows.length > 500 ? (
          <Virtuoso
            style={{ height: '100%' }}
            totalCount={displayRows.length}
            overscan={20}
            itemContent={(idx) => {
              const row = displayRows[idx];
              return (
                <tr 
                  className="hover:bg-[var(--bg-secondary)]/50 border-b border-gray-800/50 transition-colors"
                >
                  <td className="px-3 py-2.5 text-[var(--text-muted)] text-xs text-right font-mono w-14">{idx + 1}</td>
                  {columns.map(col => (
                    <td 
                      key={col} 
                      className="px-3 py-2.5 text-[var(--text-secondary)] font-mono max-w-[300px] truncate"
                    >
                      {row[col] === null ? (
                        <span className="text-[var(--text-muted)] italic">NULL</span>
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
              );
            }}
          />
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-[var(--bg-secondary)]/80 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-3 py-2.5 text-left text-[var(--text-muted)] font-medium text-xs border-b border-[var(--border-color)] w-14">#</th>
                  {columns.map(col => (
                    <th 
                      key={col} 
                      className="px-3 py-2.5 text-left text-[var(--text-muted)] font-medium text-xs border-b border-[var(--border-color)] font-mono min-w-[120px] cursor-pointer hover:bg-[var(--bg-tertiary)]/50 transition-colors group"
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
                            <ArrowUp className="w-3 h-3 text-[var(--accent)]" /> : 
                            <ArrowDown className="w-3 h-3 text-[var(--accent)]" />
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
                    className="hover:bg-[var(--bg-secondary)]/50 border-b border-gray-800/50 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-[var(--text-muted)] text-xs text-right font-mono">{startIndex + idx + 1}</td>
                    {columns.map(col => (
                      <td 
                        key={col} 
                        className="px-3 py-2.5 text-[var(--text-secondary)] font-mono max-w-[300px] truncate"
                      >
                        {row[col] === null ? (
                          <span className="text-[var(--text-muted)] italic">NULL</span>
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
        )}
      </div>

      {/* Pagination - Hide when using Virtuoso */}
      {totalPages > 1 && displayRows.length <= 500 && (
        <div className="px-4 py-2 border-t border-gray-800 flex items-center justify-between bg-[var(--bg-primary)]/80 shrink-0">
          <div className="flex items-center gap-4">
            <div className="text-xs text-[var(--text-muted)]">
              <span className="text-[var(--text-muted)]">{displayRows.length.toLocaleString()}</span> 条记录
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-[var(--text-muted)]">每页</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs px-2 py-1 rounded border border-[var(--border-color)] outline-none"
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span className="text-xs text-[var(--text-muted)]">条</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-[var(--text-muted)] mr-2">
              {startIndex + 1}-{Math.min(startIndex + pageSize, displayRows.length)}
            </span>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1 hover:bg-[var(--bg-secondary)] disabled:opacity-30 disabled:cursor-not-allowed rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              title="首页"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 hover:bg-[var(--bg-secondary)] disabled:opacity-30 disabled:cursor-not-allowed rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              title="上一页"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-[var(--text-muted)] text-sm font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 hover:bg-[var(--bg-secondary)] disabled:opacity-30 disabled:cursor-not-allowed rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              title="下一页"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1 hover:bg-[var(--bg-secondary)] disabled:opacity-30 disabled:cursor-not-allowed rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              title="末页"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Chart View */}
      {showChart && isSelect && columns.length > 0 && rows.length > 0 && (
        <ChartPanel columns={columns} rows={rows} onClose={() => setShowChart(false)} />
      )}
    </div>
  );
}
