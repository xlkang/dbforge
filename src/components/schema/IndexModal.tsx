import { useState } from 'react';
import { X, Hash, Loader2, CheckSquare, Square } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl w-[480px] max-h-[80vh] flex flex-col border border-gray-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Hash className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">创建索引</h3>
              <p className="text-xs text-gray-500">表: {tableName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-5 overflow-auto">
          {/* Index Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">索引名称</label>
            <input
              type="text"
              value={indexName}
              onChange={(e) => setIndexName(e.target.value)}
              placeholder="idx_table_column"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Unique Checkbox */}
          <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-800">
            <input
              type="checkbox"
              id="unique-index"
              checked={isUnique}
              onChange={(e) => setIsUnique(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-0 focus:ring-offset-0"
            />
            <label htmlFor="unique-index" className="text-sm text-gray-300 cursor-pointer">
              唯一索引 (UNIQUE)
            </label>
            <span className="text-xs text-gray-600 ml-auto">不允许重复值</span>
          </div>

          {/* Column Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">选择列</label>
            <div className="bg-gray-800/30 rounded-xl border border-gray-800 max-h-48 overflow-auto">
              {tableCols.map(col => (
                <button
                  key={col.name}
                  onClick={() => toggleColumn(col.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors border-b border-gray-800/50 last:border-0"
                >
                  {selectedColumns.includes(col.name) ? (
                    <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" strokeWidth={2} />
                  ) : (
                    <Square className="w-4 h-4 text-gray-600 shrink-0" strokeWidth={2} />
                  )}
                  <span className="font-mono text-sm text-gray-300">{col.name}</span>
                  <span className="text-xs text-gray-600 ml-auto">{col.type}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              已选择 {selectedColumns.length} 个列
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">SQL 预览</label>
            <pre className="p-4 bg-gray-950 rounded-xl text-xs font-mono text-gray-400 border border-gray-800">
              {`CREATE ${isUnique ? 'UNIQUE ' : ''}INDEX \`${indexName || 'idx_name'}\` ON \`${tableName}\` (${selectedColumns.map(c => `\`${c}\``).join(', ') || 'column'});`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3 bg-gray-900/50 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
            {isLoading ? '创建中...' : '创建索引'}
          </button>
        </div>
      </div>
    </div>
  );
}
