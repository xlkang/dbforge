import { useState, lazy, Suspense } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';
import { Loader2 } from 'lucide-react';

// Lazy load modals
const ExportModal = lazy(() => import('./ExportModal').then(m => ({ default: m.ExportModal })));
const ImportCSVModal = lazy(() => import('../data/ImportCSVModal').then(m => ({ default: m.ImportCSVModal })));

type ExportFormat = 'csv' | 'json';

export function ExportPanel() {
  const { queryResult, selectedTable, tables, connection } = useDatabaseStore();
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

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
    <div className="p-3 border-t border-[var(--border-color)] space-y-2">
      <h4 className="text-sm font-semibold text-[var(--text-secondary)]">导出数据</h4>
      <div className="flex gap-2">
        <button
          onClick={() => handleExport('csv')}
          disabled={!canExport || isExporting}
          className="flex-1 px-3 py-1.5 text-sm bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-secondary)] rounded transition-colors"
        >
          CSV
        </button>
        <button
          onClick={() => handleExport('json')}
          disabled={!canExport || isExporting}
          className="flex-1 px-3 py-1.5 text-sm bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-secondary)] rounded transition-colors"
        >
          JSON
        </button>
      </div>
      <Suspense fallback={<div className="p-2"><Loader2 className="w-4 h-4 animate-spin" /></div>}>
        <ImportCSVModal />
      </Suspense>
      
      {/* Database Export */}
      {connection && tables.length > 0 && (
        <>
          <button
            onClick={() => setShowExportModal(true)}
            className="w-full px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            导出数据库
          </button>
          {showExportModal && (
            <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" /></div>}>
              <ExportModal onClose={() => setShowExportModal(false)} />
            </Suspense>
          )}
        </>
      )}
    </div>
  );
}