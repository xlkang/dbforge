import { useState } from 'react';
import { X, Plus, Trash2, Key, Database, Loader2 } from 'lucide-react';
import { useDatabaseStore } from '../../stores/databaseStore';

interface ColumnDef {
  name: string;
  type: string;
  notnull: boolean;
  pk: boolean;
  defaultValue: string;
}

const COLUMN_TYPES = ['INTEGER', 'TEXT', 'REAL', 'BLOB', 'VARCHAR(255)', 'DATETIME', 'BOOLEAN'];

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

  const updateColumn = (idx: number, field: keyof ColumnDef, value: string | boolean) => {
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
    
    return `CREATE TABLE \`${tableName || 'table_name'}\` (\n  ${cols}\n);`;
  };

  const handleCreate = async () => {
    if (!tableName.trim()) return;
    
    setCreating(true);
    const sql = generateCreateSQL();
    
    const store = useDatabaseStore.getState();
    await store.executeQuery(sql);
    await loadTables();
    
    setCreating(false);
    setIsOpen(false);
    setTableName('');
    setColumns([{ name: 'id', type: 'INTEGER', notnull: true, pk: true, defaultValue: '' }]);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700 hover:border-gray-600"
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={2} />
        新建表
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl w-[600px] max-h-[85vh] flex flex-col border border-gray-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
              <Database className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">新建数据表</h3>
              <p className="text-xs text-gray-500">定义表结构和字段</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-5">
          {/* Table Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">表名</label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="my_table"
            />
          </div>

          {/* Columns */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-400">字段定义</label>
              <button 
                onClick={addColumn} 
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded-lg"
              >
                <Plus className="w-3 h-3" />
                添加字段
              </button>
            </div>
            
            <div className="space-y-2">
              {columns.map((col, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-gray-800/50 p-2 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
                  <input
                    type="text"
                    value={col.name}
                    onChange={(e) => updateColumn(idx, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                    placeholder="字段名"
                  />
                  <select
                    value={col.type}
                    onChange={(e) => updateColumn(idx, 'type', e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
                  >
                    {COLUMN_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={col.notnull}
                      onChange={(e) => updateColumn(idx, 'notnull', e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-0 focus:ring-offset-0"
                    />
                    NOT NULL
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={col.pk}
                      onChange={(e) => updateColumn(idx, 'pk', e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <Key className={`w-3 h-3 ${col.pk ? 'text-yellow-400' : 'text-gray-600'}`} strokeWidth={2} />
                  </label>
                  <button
                    onClick={() => removeColumn(idx)}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-gray-600 hover:text-red-400 transition-colors"
                    disabled={columns.length === 1}
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SQL Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">SQL 预览</label>
            <pre className="p-4 bg-gray-950 rounded-xl text-xs font-mono text-gray-400 overflow-auto max-h-40 border border-gray-800">
              {generateCreateSQL()}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3 bg-gray-900/50 shrink-0">
          <button
            onClick={() => setIsOpen(false)}
            className="px-5 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !tableName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
          >
            {creating && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
            {creating ? '创建中...' : '创建表'}
          </button>
        </div>
      </div>
    </div>
  );
}
