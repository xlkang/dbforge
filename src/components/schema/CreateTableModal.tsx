import { useState } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';

interface ColumnDef {
  name: string;
  type: string;
  notnull: boolean;
  pk: boolean;
  defaultValue: string;
}

export function CreateTableModal() {
  const { connection, loadTables } = useDatabaseStore();
  const [isOpen, setIsOpen] = useState(false);
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<ColumnDef[]>([
    { name: 'id', type: 'INTEGER', notnull: true, pk: true, defaultValue: '' }
  ]);
  const [creating, setCreating] = useState(false);

  if (!connection) return null;

  const addColumn = () => {
    setColumns([...columns, { name: '', type: 'TEXT', notnull: false, pk: false, defaultValue: '' }]);
  };

  const removeColumn = (idx: number) => {
    setColumns(columns.filter((_, i) => i !== idx));
  };

  const updateColumn = (idx: number, field: keyof ColumnDef, value: any) => {
    const updated = [...columns];
    updated[idx] = { ...updated[idx], [field]: value };
    setColumns(updated);
  };

  const generateCreateSQL = () => {
    const cols = columns.map(col => {
      let sql = `\`${col.name}\` ${col.type}`;
      if (col.pk) sql += ' PRIMARY KEY';
      if (col.notnull && !col.pk) sql += ' NOT NULL';
      if (col.defaultValue) sql += ` DEFAULT '${col.defaultValue}'`;
      return sql;
    }).join(',\n  ');
    
    return `CREATE TABLE \`${tableName}\` (\n  ${cols}\n);`;
  };

  const handleCreate = async () => {
    if (!tableName.trim()) return;
    
    setCreating(true);
    const sql = generateCreateSQL();
    
    // 通过 store 执行
    const store = useDatabaseStore.getState();
    await store.executeQuery(sql);
    await loadTables();
    
    setCreating(false);
    setIsOpen(false);
    setTableName('');
    setColumns([{ name: 'id', type: 'INTEGER', notnull: true, pk: true, defaultValue: '' }]);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        新建表
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-auto">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold">新建表</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">表名</label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                  placeholder="my_table"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-gray-400">字段</label>
                  <button onClick={addColumn} className="text-xs text-blue-400 hover:text-blue-300">
                    + 添加字段
                  </button>
                </div>
                
                <div className="space-y-2">
                  {columns.map((col, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={col.name}
                        onChange={(e) => updateColumn(idx, 'name', e.target.value)}
                        className="flex-1 px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-sm"
                        placeholder="字段名"
                      />
                      <select
                        value={col.type}
                        onChange={(e) => updateColumn(idx, 'type', e.target.value)}
                        className="px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-sm"
                      >
                        <option value="INTEGER">INTEGER</option>
                        <option value="TEXT">TEXT</option>
                        <option value="REAL">REAL</option>
                        <option value="BLOB">BLOB</option>
                      </select>
                      <label className="flex items-center gap-1 text-xs text-gray-400">
                        <input
                          type="checkbox"
                          checked={col.notnull}
                          onChange={(e) => updateColumn(idx, 'notnull', e.target.checked)}
                        />
                        NOT NULL
                      </label>
                      <label className="flex items-center gap-1 text-xs text-gray-400">
                        <input
                          type="checkbox"
                          checked={col.pk}
                          onChange={(e) => updateColumn(idx, 'pk', e.target.checked)}
                        />
                        PK
                      </label>
                      <button
                        onClick={() => removeColumn(idx)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">预览 SQL</label>
                <pre className="p-3 bg-gray-900 rounded text-xs font-mono overflow-auto max-h-32">
                  {generateCreateSQL()}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !tableName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded"
              >
                {creating ? '创建中...' : '创建表'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}