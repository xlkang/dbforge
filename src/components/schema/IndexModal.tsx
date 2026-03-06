import { useState } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';

interface IndexModalProps {
  tableName: string;
  onClose: () => void;
}

export function IndexModal({ tableName, onClose }: IndexModalProps) {
  const { tableColumns, executeQuery, loadTables } = useDatabaseStore();
  
  const [indexName, setIndexName] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isUnique, setIsUnique] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Use columns from store (already filtered to selected table)
  const tableCols = tableColumns;

  const toggleColumn = (colName: string) => {
    setSelectedColumns(prev => 
      prev.includes(colName)
        ? prev.filter(c => c !== colName)
        : [...prev, colName]
    );
  };

  const handleCreate = async () => {
    if (!indexName.trim()) {
      setError('请输入索引名');
      return;
    }
    if (selectedColumns.length === 0) {
      setError('请至少选择一列');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const indexType = isUnique ? 'UNIQUE INDEX' : 'INDEX';
      const columns = selectedColumns.map(col => `\`${col}\``).join(', ');
      const sql = `CREATE ${indexType} \`${indexName}\` ON \`${tableName}\` (${columns})`;
      
      await executeQuery(sql);
      await loadTables();
      onClose();
    } catch (err: any) {
      setError(err.message || '创建索引失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-[480px] max-h-[80vh] overflow-auto">
        <h2 className="text-lg font-semibold text-white mb-4">创建索引 - {tableName}</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">索引名</label>
            <input
              type="text"
              value={indexName}
              onChange={(e) => setIndexName(e.target.value)}
              placeholder="idx_table_column"
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <input
                type="checkbox"
                checked={isUnique}
                onChange={(e) => setIsUnique(e.target.checked)}
                className="rounded"
              />
              唯一索引 (UNIQUE)
            </label>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">选择列</label>
            <div className="space-y-2 max-h-48 overflow-auto">
              {tableCols.map(col => (
                <label
                  key={col.name}
                  className="flex items-center gap-2 text-gray-300 cursor-pointer hover:bg-gray-700 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(col.name)}
                    onChange={() => toggleColumn(col.name)}
                    className="rounded"
                  />
                  <span className="font-mono">{col.name}</span>
                  <span className="text-gray-500 text-sm">{col.type}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? '创建中...' : '创建'}
          </button>
        </div>
      </div>
    </div>
  );
}
