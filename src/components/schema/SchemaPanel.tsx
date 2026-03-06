import { useState } from 'react';
import { Table2, Columns3, Hash, Key, Plus, Network, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
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
    loadTables 
  } = useDatabaseStore();
  const { addTab } = useTabStore();
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();
  const addToast = useToastStore((state) => state.addToast);
  const [showIndexModal, setShowIndexModal] = useState(false);
  const [showAlterTableModal, setShowAlterTableModal] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

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

  if (!connection) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        请先连接数据库
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-700/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Table2 className="w-4 h-4 text-gray-500" strokeWidth={2} />
          <h3 className="text-sm font-semibold text-gray-300">数据表</h3>
          <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">{tables.length}</span>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => addTab({ title: 'ER图', type: 'diagram' })}
            className="p-1.5 hover:bg-purple-500/20 text-gray-500 hover:text-purple-400 rounded-lg transition-colors"
            title="查看 ER 图"
          >
            <Network className="w-4 h-4" strokeWidth={2} />
          </button>
          <CreateTableModal />
        </div>
      </div>
      
      {/* Table List */}
      <div className="flex-1 overflow-auto">
        {tables.length === 0 ? (
          <div className="p-6 text-center">
            <Table2 className="w-8 h-8 text-gray-700 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-gray-600 text-sm">暂无数据表</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {tables.map(table => {
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
                        ? 'bg-blue-500/20 border border-blue-500/30' 
                        : 'hover:bg-gray-800/50 border border-transparent'
                    }`}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-gray-700 opacity-0 group-hover:opacity-100" strokeWidth={2} />
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2} />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-600" strokeWidth={2} />
                    )}
                    <Table2 className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-gray-500'}`} strokeWidth={1.5} />
                    <span className={`flex-1 font-mono text-sm truncate ${isSelected ? 'text-blue-300' : 'text-gray-400'}`}>
                      {table.name}
                    </span>
                    <span className="text-xs text-gray-600 bg-gray-800/80 px-1.5 py-0.5 rounded">
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
                        <Columns3 className="w-3.5 h-3.5 text-gray-600" strokeWidth={2} />
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">字段</h4>
                      </div>
                      <div className="space-y-1.5">
                        {tableColumns.map(col => (
                          <div key={col.name} className="flex items-center gap-2 text-sm group/col">
                            {col.pk ? (
                              <Key className="w-3.5 h-3.5 text-yellow-500/70" strokeWidth={2} />
                            ) : (
                              <div className="w-3.5"></div>
                            )}
                            <span className="font-mono text-gray-300">{col.name}</span>
                            <span className="text-gray-600 text-xs">{col.type}</span>
                            {col.notnull && (
                              <span className="text-[10px] text-red-400/70 bg-red-400/10 px-1 rounded">NOT NULL</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Row Count */}
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-gray-600" strokeWidth={2} />
                      <span className="text-xs text-gray-500">共</span>
                      <span className="text-sm text-gray-300 font-medium">{tableRowCount.toLocaleString()}</span>
                      <span className="text-xs text-gray-500">条记录</span>
                    </div>
                    
                    {/* Indexes */}
                    {tableIndexes.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Network className="w-3.5 h-3.5 text-gray-600" strokeWidth={2} />
                            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">索引</h4>
                          </div>
                          <button
                            onClick={() => setShowIndexModal(true)}
                            className="text-xs text-blue-400/70 hover:text-blue-400 flex items-center gap-0.5"
                          >
                            <Plus className="w-3 h-3" />
                            新建
                          </button>
                        </div>
                        <div className="space-y-1">
                          {tableIndexes.map(idx => (
                            <div key={idx.name} className="flex items-center justify-between text-sm group/idx">
                              <div className="flex items-center gap-2">
                                <Hash className="w-3 h-3 text-gray-600" strokeWidth={2} />
                                <span className="font-mono text-gray-400">{idx.name}</span>
                                <span className="text-xs text-gray-600">
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
                        className="text-xs text-gray-600 hover:text-gray-400 flex items-center gap-1"
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
          className="fixed z-50 bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-2xl py-1.5 min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.items.map((item, index) =>
            item.divider ? (
              <div key={index} className="my-1.5 border-t border-gray-800" />
            ) : (
              <button
                key={index}
                onClick={() => {
                  item.onClick();
                  hideContextMenu();
                }}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 transition-colors ${
                  item.danger
                    ? 'text-red-400 hover:bg-red-500/20'
                    : 'text-gray-300 hover:bg-gray-800'
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
