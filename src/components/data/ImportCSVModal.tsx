import { useState, useRef } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';

export function ImportCSVModal() {
  const { connection, tables, executeQuery, loadTables } = useDatabaseStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState('');
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!connection || connection.type !== 'sqlite') return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length > 0) {
        const parsed = lines.map(line => {
          const row: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (const char of line) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              row.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          row.push(current.trim());
          return row;
        });
        
        setHeaders(parsed[0]);
        setCsvData(parsed.slice(1));
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!selectedTable || csvData.length === 0) return;

    setImporting(true);
    let imported = 0;

    for (const row of csvData) {
      if (row.length !== headers.length) continue;
      
      const values = row.map(v => {
        const num = parseFloat(v);
        return isNaN(num) ? `'${v.replace(/'/g, "''")}'` : v;
      }).join(', ');
      
      const sql = `INSERT INTO \`${selectedTable}\` (${headers.map(h => `\`${h}\``).join(', ')}) VALUES (${values});`;
      
      try {
        await executeQuery(sql);
        imported++;
      } catch (e) {
        // 跳过错误行
      }
    }

    await loadTables();
    setImporting(false);
    setIsOpen(false);
    setCsvData([]);
    setHeaders([]);
    alert(`导入完成：${imported} 条记录`);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        导入 CSV
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg w-full max-w-lg">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold">导入 CSV</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">选择 CSV 文件</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm"
                />
              </div>

              {headers.length > 0 && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">目标表</label>
                    <select
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm"
                    >
                      <option value="">选择表...</option>
                      {tables.map(t => (
                        <option key={t.name} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="text-sm text-gray-400">
                    <p>预览：{csvData.length} 行数据</p>
                    <p>字段：{headers.join(', ')}</p>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
              >
                取消
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !selectedTable || csvData.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded"
              >
                {importing ? '导入中...' : '导入'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}