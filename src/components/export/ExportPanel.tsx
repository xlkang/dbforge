import { useState } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';

type ExportFormat = 'csv' | 'json';

export function ExportPanel() {
  const { queryResult, selectedTable } = useDatabaseStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    if (!queryResult || !queryResult.isSelect || queryResult.rows.length === 0) {
      alert('没有可导出的数据');
      return;
    }

    setIsExporting(true);

    try {
      const { columns, rows } = queryResult;
      let content: string;
      let mimeType: string;
      let extension: string;

      if (format === 'csv') {
        const header = columns.join(',');
        const dataRows = rows.map(row => 
          columns.map(col => {
            const val = row[col];
            if (val === null) return '';
            if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return String(val);
          }).join(',')
        );
        content = [header, ...dataRows].join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
      } else {
        content = JSON.stringify(rows, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTable || 'query_result'}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const canExport = queryResult && queryResult.isSelect && queryResult.rows.length > 0;

  return (
    <div className="p-3 border-t border-gray-700">
      <h4 className="text-sm font-semibold text-gray-300 mb-2">导出数据</h4>
      <div className="flex gap-2">
        <button
          onClick={() => handleExport('csv')}
          disabled={!canExport || isExporting}
          className="flex-1 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded transition-colors"
        >
          导出 CSV
        </button>
        <button
          onClick={() => handleExport('json')}
          disabled={!canExport || isExporting}
          className="flex-1 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded transition-colors"
        >
          导出 JSON
        </button>
      </div>
    </div>
  );
}