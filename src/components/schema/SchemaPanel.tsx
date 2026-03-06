import { useDatabaseStore } from '../../stores/databaseStore';
import { useTabStore } from '../../stores/tabStore';
import { useContextMenu, type MenuItem } from '../common/ContextMenu';
import { CreateTableModal } from './CreateTableModal';

export function SchemaPanel() {
  const { 
    connection, 
    tables, 
    selectedTable, 
    tableColumns, 
    tableIndexes, 
    tableRowCount,
    selectTable,
    executeQuery,
    loadTables 
  } = useDatabaseStore();
  const { addTab } = useTabStore();
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();

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
        label: '打开',
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
        label: '重命名',
        onClick: () => {
          const newName = prompt('输入新表名:', tableName);
          if (newName && newName !== tableName) {
            executeQuery(`ALTER TABLE \`${tableName}\` RENAME TO \`${newName}\``).then(() => {
              loadTables();
            });
          }
        },
      },
      {
        label: '删除',
        danger: true,
        onClick: () => {
          if (confirm(`确定要删除表 "${tableName}" 吗？此操作不可恢复！`)) {
            executeQuery(`DROP TABLE \`${tableName}\``).then(() => {
              loadTables();
            });
          }
        },
      },
    ];
    showContextMenu(e, items);
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
      <div className="p-3 border-b border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold text-gray-100">表结构</h3>
        <CreateTableModal />
      </div>
      
      <div className="flex-1 overflow-auto">
        {tables.length === 0 ? (
          <p className="p-3 text-gray-500 text-sm">No tables found</p>
        ) : (
          <div className="p-2">
            {tables.map(table => (
              <div key={table.name}>
                <button
                  onClick={() => selectTable(table.name)}
                  onDoubleClick={() => handleDoubleClick(table.name)}
                  onContextMenu={(e) => handleContextMenu(e, table.name)}
                  className={`w-full text-left px-3 py-2 rounded flex items-center justify-between ${
                    selectedTable === table.name 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="font-mono text-sm">{table.name}</span>
                  <span className="text-xs opacity-70">{table.rowCount} rows</span>
                </button>
                
                {selectedTable === table.name && (
                  <div className="ml-4 mt-2 space-y-4">
                    {/* Columns */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Columns</h4>
                      <div className="space-y-1">
                        {tableColumns.map(col => (
                          <div key={col.name} className="flex items-center gap-2 text-sm">
                            {col.pk && <span className="text-yellow-400" title="Primary Key">🔑</span>}
                            <span className="font-mono text-gray-300">{col.name}</span>
                            <span className="text-gray-500">{col.type}</span>
                            {col.notnull && <span className="text-red-400 text-xs">NOT NULL</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Row Count */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Rows</h4>
                      <p className="text-gray-300">{tableRowCount.toLocaleString()}</p>
                    </div>
                    
                    {/* Indexes */}
                    {tableIndexes.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Indexes</h4>
                        <div className="space-y-1">
                          {tableIndexes.map(idx => (
                            <div key={idx.name} className="text-sm">
                              <span className="font-mono text-gray-300">{idx.name}</span>
                              {idx.unique && <span className="text-blue-400 text-xs ml-1">UNIQUE</span>}
                              <span className="text-gray-500 text-xs ml-1">({idx.columns.join(', ')})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.items.map((item, index) =>
            item.divider ? (
              <div key={index} className="my-1 border-t border-gray-700" />
            ) : (
              <button
                key={index}
                onClick={() => {
                  item.onClick();
                  hideContextMenu();
                }}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                  item.danger
                    ? 'text-red-400 hover:bg-red-900/30'
                    : 'text-gray-300 hover:bg-gray-700'
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