import { useDatabaseStore } from '../../stores/databaseStore';

export function SchemaPanel() {
  const { 
    connection, 
    tables, 
    selectedTable, 
    tableColumns, 
    tableIndexes, 
    tableRowCount,
    selectTable 
  } = useDatabaseStore();

  if (!connection) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        请先连接数据库
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-700">
        <h3 className="font-semibold text-gray-100">表结构</h3>
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
    </div>
  );
}