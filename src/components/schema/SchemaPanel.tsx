import { useState, useMemo } from 'react';
import { Table2, Columns3, Hash, Key, Plus, Network, ChevronDown, ChevronRight, GripVertical, Search, X } from 'lucide-react';
import { useDatabaseStore } from '../../stores/databaseStore';
import { useTabStore } from '../../stores/tabStore';
import { useToastStore } from '../../stores/toastStore';
import { useContextMenu, type MenuItem } from '../common/ContextMenu';
import { CreateTableModal } from './CreateTableModal';
import { IndexModal } from './IndexModal';
import { AlterTableModal } from './AlterTableModal';
import { SchemaSkeleton } from '../common/Skeleton';

export function SchemaPanel() {
  const { 
    connection, 
    tables, 
    selectedTable, 
    tableColumns, 
    tableIndexes, 
    tableRowCount,
    isLoading,
    selectTable,
    executeQuery,
    loadTables,
    setQuery,
  } = useDatabaseStore();
  const { addTab } = useTabStore();
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();
  const addToast = useToastStore((state) => state.addToast);
  const [showIndexModal, setShowIndexModal] = useState(false);
  const [showAlterTableModal, setShowAlterTableModal] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tables by search query
  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return tables;
    const query = searchQuery.toLowerCase();
    return tables.filter(t => t.name.toLowerCase().includes(query));
  }, [tables, searchQuery]);

  const toggleExpand = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const handleDoubleClick = (tableName: string) => {
    addTab({
      title: tableName,
      type: 'table',
      tableName,
    });
  };

  const handleContextMenu = (e: React.MouseEvent, tableName: string) => {
    const items: MenuItem[] = [
      {
        label: '在新标签页中打开',
        onClick: () => {
          addTab({ title: tableName, type: 'table', tableName });
        },
      },
      {
        label: '查看数据',
        onClick: () => selectTable(tableName),
      },
      { label: '', onClick: () => {}, divider: true },
      {
        label: '修改表结构',
        onClick: () => {
          selectTable(tableName);
          setShowAlterTableModal(true);
        },
      },
      {
        label: '创建索引',
        onClick: () => {
          selectTable(tableName);
          setShowIndexModal(true);
        },
      },
      { label: '', onClick: () => {}, divider: true },
      {
        label: '重命名表',
        onClick: () => {
          const newName = prompt('输入新表名:', tableName);
          if (newName && newName !== tableName) {
            executeQuery(`ALTER TABLE \`${tableName}\` RENAME TO \`${newName}\``).then(() => {
              loadTables();
              addToast(`表 "${tableName}" 已重命名为 "${newName}"`, 'success');
            }).catch((err) => {
              addToast('重命名失败: ' + err.message, 'error');
            });
          }
        },
      },
      {
        label: '删除表',
        danger: true,
        onClick: () => {
          if (confirm(`确定要删除表 "${tableName}" 吗？此操作不可恢复！`)) {
            executeQuery(`DROP TABLE \`${tableName}\``).then(() => {
              loadTables();
              addToast(`表 "${tableName}" 已删除`, 'success');
            }).catch((err) => {
              addToast('删除失败: ' + err.message, 'error');
            });
          }
        },
      },
    ];
    showContextMenu(e, items);
  };

  const handleDeleteIndex = async (indexName: string) => {
    if (!selectedTable) return;
    
    if (confirm(`确定要删除索引 "${indexName}" 吗？`)) {
      try {
        await executeQuery(`DROP INDEX \`${indexName}\``);
        await loadTables();
      } catch (err) {
        alert(`删除索引失败: ${err}`);
      }
    }
  };

  // 字段右键菜单
  const handleColumnContextMenu = (e: React.MouseEvent, columnName: string) => {
    e.preventDefault();
    const items: MenuItem[] = [
      {
        label: '复制字段名',
        onClick: () => {
          navigator.clipboard.writeText(columnName);
          addToast(`已复制: ${columnName}`, 'success');
        },
      },
      {
        label: '复制 SELECT 语句',
        onClick: () => {
          const sql = `SELECT \`${columnName}\` FROM \`${selectedTable}\` LIMIT 100`;
          navigator.clipboard.writeText(sql);
          addToast('已复制 SELECT 语句', 'success');
        },
      },
      { label: '', onClick: () => {}, divider: true },
      {
        label: '查看该字段数据',
        onClick: () => {
          setQuery(`SELECT \`${columnName}\` FROM \`${selectedTable}\` LIMIT 100`);
          executeQuery(`SELECT \`${columnName}\` FROM \`${selectedTable}\` LIMIT 100`);
        },
      },
      {
        label: '查看非空值',
        onClick: () => {
          setQuery(`SELECT \`${columnName}\` FROM \`${selectedTable}\` WHERE \`${columnName}\` IS NOT NULL LIMIT 100`);
          executeQuery(`SELECT \`${columnName}\` FROM \`${selectedTable}\` WHERE \`${columnName}\` IS NOT NULL LIMIT 100`);
        },
      },
      { label: '', onClick: () => {}, divider: true },
      {
        label: '按该字段排序（ DESC）',
        onClick: () => {
          const currentQuery = useDatabaseStore.getState().query;
          if (currentQuery.includes('ORDER BY')) {
            setQuery(currentQuery.replace(/ORDER BY .*?(ASC|DESC)?/i, `ORDER BY \`${columnName}\` DESC`));
          } else {
            setQuery(currentQuery + ` ORDER BY \`${columnName}\` DESC`);
          }
        },
      },
      {
        label: '按该字段排序（ ASC）',
        onClick: () => {
          const currentQuery = useDatabaseStore.getState().query;
          if (currentQuery.includes('ORDER BY')) {
            setQuery(currentQuery.replace(/ORDER BY .*?(ASC|DESC)?/i, `ORDER BY \`${columnName}\` ASC`));
          } else {
            setQuery(currentQuery + ` ORDER BY \`${columnName}\` ASC`);
          }
        },
      },
    ];
    showContextMenu(e, items);
  };

  if (!connection) {
    return (
      <div className="p-4 text-[var(--text-muted)] text-sm">
        请先连接数据库
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-[var(--border-color)]/50">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Table2 className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={2} />
            <h3 className="text-sm font-semibold text-[var(--text-secondary)]">数据表</h3>
            <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">{filteredTables.length}/{tables.length}</span>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => addTab({ title: 'ER图', type: 'diagram' })}
              className="p-1.5 hover:bg-purple-500/20 text-[var(--text-muted)] hover:text-purple-400 rounded-lg transition-colors"
              title="查看 ER 图"
            >
              <Network className="w-4 h-4" strokeWidth={2} />
            </button>
            <CreateTableModal />
          </div>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="搜索表..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Table List */}
      <div className="flex-1 overflow-auto">
        {filteredTables.length === 0 ? (
          <div className="p-6 text-center">
            <Table2 className="w-8 h-8 text-gray-700 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-[var(--text-muted)] text-sm">{searchQuery ? '没有匹配的表' : '暂无数据表'}</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredTables.map(table => {
              const isExpanded = expandedTables.has(table.name) || selectedTable === table.name;
              const isSelected = selectedTable === table.name;
              
              return (
                <div key={table.name}>
                  {/* Table Row */}
                  <button
                    onClick={() => {
                      selectTable(table.name);
                      toggleExpand(table.name);
                    }}
                    onDoubleClick={() => handleDoubleClick(table.name)}
                    onContextMenu={(e) => handleContextMenu(e, table.name)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2 transition-all group ${
                      isSelected 
                        ? 'bg-[var(--accent)]/20 border border-blue-500/30' 
                        : 'hover:bg-[var(--bg-secondary)]/50 border border-transparent'
                    }`}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-gray-700 opacity-0 group-hover:opacity-100" strokeWidth={2} />
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={2} />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={2} />
                    )}
                    <Table2 className={`w-4 h-4 ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} strokeWidth={1.5} />
                    <span className={`flex-1 font-mono text-sm truncate ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
                      {table.name}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)]/80 px-1.5 py-0.5 rounded">
                      {table.rowCount}
                    </span>
                  </button>
                  
                  {/* Expanded Table Details */}
                  {isSelected && (
                    <div className="ml-6 mt-2 space-y-3 pl-3 border-l-2 border-gray-800">
                      {isLoading ? (
                        <SchemaSkeleton />
                      ) : (
                        <>
                    {/* Columns */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Columns3 className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={2} />
                        <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">字段</h4>
                      </div>
                      <div className="space-y-1.5">
                        {tableColumns.map(col => (
                          <div 
                            key={col.name} 
                            className="flex items-center gap-2 text-sm group/col"
                            onContextMenu={(e) => handleColumnContextMenu(e, col.name)}
                          >
                            {col.pk ? (
                              <Key className="w-3.5 h-3.5 text-yellow-500/70" strokeWidth={2} />
                            ) : (
                              <div className="w-3.5"></div>
                            )}
                            <span className="font-mono text-[var(--text-secondary)]">{col.name}</span>
                            <span className="text-[var(--text-muted)] text-xs">{col.type}</span>
                            {col.notnull && (
                              <span className="text-[10px] text-red-400/70 bg-red-400/10 px-1 rounded">NOT NULL</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Row Count */}
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={2} />
                      <span className="text-xs text-[var(--text-muted)]">共</span>
                      <span className="text-sm text-[var(--text-secondary)] font-medium">{tableRowCount.toLocaleString()}</span>
                      <span className="text-xs text-[var(--text-muted)]">条记录</span>
                    </div>
                    
                    {/* Indexes */}
                    {tableIndexes.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Network className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={2} />
                            <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">索引</h4>
                          </div>
                          <button
                            onClick={() => setShowIndexModal(true)}
                            className="text-xs text-[var(--accent)]/70 hover:text-[var(--accent)] flex items-center gap-0.5"
                          >
                            <Plus className="w-3 h-3" />
                            新建
                          </button>
                        </div>
                        <div className="space-y-1">
                          {tableIndexes.map(idx => (
                            <div key={idx.name} className="flex items-center justify-between text-sm group/idx">
                              <div className="flex items-center gap-2">
                                <Hash className="w-3 h-3 text-[var(--text-muted)]" strokeWidth={2} />
                                <span className="font-mono text-[var(--text-muted)]">{idx.name}</span>
                                <span className="text-xs text-[var(--text-muted)]">
                                  ({idx.columns.join(', ')})
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteIndex(idx.name)}
                                className="opacity-0 group-hover/idx:opacity-100 text-red-400/70 hover:text-red-400 text-xs"
                              >
                                删除
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {tableIndexes.length === 0 && (
                      <button
                        onClick={() => setShowIndexModal(true)}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-muted)] flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        创建索引
                      </button>
                    )}
                      </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showIndexModal && selectedTable && (
        <IndexModal tableName={selectedTable} onClose={() => setShowIndexModal(false)} />
      )}
      {showAlterTableModal && selectedTable && (
        <AlterTableModal tableName={selectedTable} onClose={() => setShowAlterTableModal(false)} isOpen={showAlterTableModal} />
      )}

      {contextMenu && (
        <div
          className="fixed z-50 bg-[var(--bg-primary)]/95 backdrop-blur-sm border border-[var(--border-color)]/50 rounded-xl shadow-2xl py-1.5 min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.items.map((item, index) =>
            item.divider ? (
              <div key={index} className="my-1.5 border-t border-gray-800" />
            ) : (
              <button
                key={index}
                onClick={() => {
                  item.onClick?.();
                  hideContextMenu();
                }}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 transition-colors ${
                  item.danger
                    ? 'text-red-400 hover:bg-red-500/20'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
