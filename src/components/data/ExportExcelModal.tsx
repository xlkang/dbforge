import { useState, useCallback } from 'react';
import { FileSpreadsheet, X, Download, Check } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';
import type { QueryResult } from '../../types/database';

interface ExportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  queryResult?: QueryResult | null;
  tableName?: string;
}

// 简单 Excel 文件生成 (Biff5 format - 老的但兼容性最好)
function generateExcelSimple(columns: string[], rows: Record<string, unknown>[]): Blob {
  // 创建 CSV 格式内容
  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const headerRow = columns.map(escapeCSV).join(',');
  const dataRows = rows.map(row => columns.map((_, i) => escapeCSV(row[i])).join(','));
  
  // 添加 BOM 以支持中文
  const csvContent = '\ufeff' + [headerRow, ...dataRows].join('\n');
  
  // 返回 CSV Blob (Excel 可以打开 CSV)
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

// 生成真正的 Excel (XML Spreadsheet 2003)
function generateExcelXML(columns: string[], rows: Record<string, unknown>[]): string {
  const escapeXML = (val: any): string => {
    if (val === null || val === undefined) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
  xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
  xml += '<Worksheet ss:Name="Sheet1"><Table>';
  
  // Header
  xml += '<Row>';
  for (const col of columns) {
    xml += `<Cell><Data ss:Type="String">${escapeXML(col)}</Data></Cell>`;
  }
  xml += '</Row>';
  
  // Data rows
  for (const row of rows) {
    xml += '<Row>';
    for (let i = 0; i < columns.length; i++) {
      const val = row[i];
      const type = typeof val === 'number' ? 'Number' : 'String';
      xml += `<Cell><Data ss:Type="${type}">${escapeXML(val)}</Data></Cell>`;
    }
    xml += '</Row>';
  }
  
  xml += '</Table></Worksheet></Workbook>';
  return xml;
}

export function ExportExcelModal({ isOpen, onClose, queryResult, tableName }: ExportExcelModalProps) {
  const [format, setFormat] = useState<'csv' | 'xls'>('xls');
  const [filename, setFilename] = useState(tableName || 'export');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const handleExport = useCallback(async () => {
    if (!queryResult || !queryResult.rows.length) {
      addToast('没有可导出的数据', 'warning');
      return;
    }

    setIsExporting(true);
    try {
      const { columns, rows } = queryResult;
      let blob: Blob;
      let ext: string;

      if (format === 'csv') {
        blob = generateExcelSimple(columns, rows);
        ext = 'csv';
      } else {
        const xml = generateExcelXML(columns, rows);
        blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
        ext = 'xls';
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExported(true);
      addToast(`导出成功: ${filename}.${ext}`, 'success');
      setTimeout(() => {
        onClose();
        setExported(false);
      }, 1500);
    } catch (error) {
      addToast('导出失败: ' + (error as Error).message, 'error');
    } finally {
      setIsExporting(false);
    }
  }, [queryResult, format, filename, addToast, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">导出 Excel</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg">
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Preview */}
          {queryResult && (
            <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
              <div className="text-sm text-[var(--text-muted)]">预览</div>
              <div className="flex gap-4 mt-1">
                <span className="text-[var(--text-primary)]">{queryResult.columns.length} 列</span>
                <span className="text-[var(--text-primary)]">{queryResult.rows.length} 行</span>
              </div>
            </div>
          )}

          {/* Filename */}
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-1">文件名</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)]"
            />
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">格式</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormat('xls')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                  format === 'xls'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                Excel (.xls)
              </button>
              <button
                onClick={() => setFormat('csv')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                  format === 'csv'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                CSV (.csv)
              </button>
            </div>
          </div>

          {/* Include headers */}
          <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <input
              type="checkbox"
              checked={includeHeaders}
              onChange={(e) => setIncludeHeaders(e.target.checked)}
              className="w-4 h-4 accent-[var(--accent)]"
            />
            包含表头
          </label>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !queryResult?.rows.length}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {exported ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {isExporting ? '导出中...' : exported ? '已导出' : '导出'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook
export function useExportExcel() {
  const [isOpen, setIsOpen] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>();
  const [tableName, setTableName] = useState('');

  return {
    isOpen,
    setIsOpen,
    openExport: (result?: QueryResult | null, name?: string) => {
      setQueryResult(result);
      setTableName(name || 'export');
      setIsOpen(true);
    },
    ExportExcelModal: () => (
      <ExportExcelModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        queryResult={queryResult}
        tableName={tableName}
      />
    ),
  };
}
