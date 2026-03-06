import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { useDatabaseStore } from '../../stores/databaseStore';
import { useToastStore } from '../../stores/toastStore';

interface Column {
  name: string;
  type: string;
  pk: boolean;
  notnull: boolean;
  default?: string;
}

interface AlterTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
}

export function AlterTableModal({ isOpen, onClose, tableName }: AlterTableModalProps) {
  const { tableColumns, loadTables, executeQuery } = useDatabaseStore();
  const addToast = useToastStore((state) => state.addToast);
  const [columns, setColumns] = useState<Column[]>([]);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('TEXT');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && tableName) {
      setColumns(tableColumns.map(col => ({
        name: col.name,
        type: col.type || 'TEXT',
        pk: col.pk || false,
        notnull: col.notnull || false,
        default: col.dfltValue || undefined,
      })));
    }
  }, [isOpen, tableName, tableColumns]);

  if (!isOpen) return null;

  const handleAddColumn = () => {
    if (!newColumnName.trim()) {
      addToast('请输入列名', 'warning');
      return;
    }
    setColumns([...columns, {
      name: newColumnName.trim(),
      type: newColumnType,
      pk: false,
      notnull: false,
    }]);
    setNewColumnName('');
  };

  const handleRemoveColumn = (index: number) => {
    const col = columns[index];
    if (confirm(`确定要删除列 "${col.name}" 吗？`)) {
      setColumns(columns.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Get original columns
      const originalColumns = tableColumns.map(c => c.name);
      const newColumns = columns.map(c => c.name);

      // Drop columns that are no longer needed
      for (const colName of originalColumns) {
        if (!newColumns.includes(colName)) {
          await executeQuery(`ALTER TABLE \`${tableName}\` DROP COLUMN \`${colName}\``);
        }
      }

      // Add new columns
      for (const col of columns) {
        if (!originalColumns.includes(col.name)) {
          const notnull = col.notnull ? ' NOT NULL' : '';
          const def = col.default ? ` DEFAULT '${col.default}'` : '';
          await executeQuery(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${col.name}\` ${col.type}${notnull}${def}`);
        }
      }

      addToast('表结构已更新', 'success');
      await loadTables();
      onClose();
    } catch (err) {
      addToast('更新失败: ' + (err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-[600px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">修改表结构 - {tableName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">现有列</h3>
            <div className="space-y-2">
              {columns.map((col, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg">
                  <input
                    value={col.name}
                    onChange={(e) => {
                      const newCols = [...columns];
                      newCols[index].name = e.target.value;
                      setColumns(newCols);
                    }}
                    className="flex-1 bg-transparent text-white text-sm outline-none"
                    placeholder="列名"
                  />
                  <select
                    value={col.type}
                    onChange={(e) => {
                      const newCols = [...columns];
                      newCols[index].type = e.target.value;
                      setColumns(newCols);
                    }}
                    className="bg-gray-700 text-white text-sm px-2 py-1 rounded outline-none"
                  >
                    <option value="TEXT">TEXT</option>
                    <option value="INTEGER">INTEGER</option>
                    <option value="REAL">REAL</option>
                    <option value="BLOB">BLOB</option>
                    <option value="VARCHAR(255)">VARCHAR(255)</option>
                  </select>
                  <label className="flex items-center gap-1 text-xs text-gray-400">
                    <input
                      type="checkbox"
                      checked={col.pk}
                      onChange={(e) => {
                        const newCols = [...columns];
                        newCols[index].pk = e.target.checked;
                        setColumns(newCols);
                      }}
                      className="rounded"
                    />
                    PK
                  </label>
                  <label className="flex items-center gap-1 text-xs text-gray-400">
                    <input
                      type="checkbox"
                      checked={col.notnull}
                      onChange={(e) => {
                        const newCols = [...columns];
                        newCols[index].notnull = e.target.checked;
                        setColumns(newCols);
                      }}
                      className="rounded"
                    />
                    NOT NULL
                  </label>
                  <button
                    onClick={() => handleRemoveColumn(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">添加新列</h3>
            <div className="flex gap-2">
              <input
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="新列名"
                className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newColumnType}
                onChange={(e) => setNewColumnType(e.target.value)}
                className="bg-gray-800 text-white px-3 py-2 rounded-lg outline-none"
              >
                <option value="TEXT">TEXT</option>
                <option value="INTEGER">INTEGER</option>
                <option value="REAL">REAL</option>
                <option value="BLOB">BLOB</option>
                <option value="VARCHAR(255)">VARCHAR(255)</option>
              </select>
              <button
                onClick={handleAddColumn}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-1"
              >
                <Plus size={16} /> 添加
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 text-amber-400 text-xs">
            <AlertCircle size={14} className="mt-0.5" />
            <span>SQLite 不支持直接修改列类型，如需修改建议删除后重建</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
