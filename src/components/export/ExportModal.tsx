import { useState } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';

const API_BASE = 'http://localhost:3001/api';

interface ExportModalProps {
  onClose: () => void;
}

export function ExportModal({ onClose }: ExportModalProps) {
  const { connection, tables } = useDatabaseStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!connection) return;
    
    setIsExporting(true);
    
    try {
      if (connection.type === 'sqlite' && connection.path) {
        // SQLite: download the .db file directly
        const response = await fetch(connection.path);
        const blob = await response.blob();
        downloadFile(blob, `${connection.name}`, 'application/octet-stream');
      } else if (connection.type === 'mysql') {
        // MySQL: generate SQL dump via API
        const res = await fetch(`${API_BASE}/export`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: connection.host,
            port: connection.port,
            user: connection.user,
            password: connection.password,
            database: connection.database,
          }),
        });
        
        const data = await res.json();
        if (data.success) {
          const blob = new Blob([data.sql], { type: 'text/plain;charset=utf-8' });
          downloadFile(blob, `${connection.database}_${Date.now()}.sql`, 'text/plain');
        } else {
          throw new Error(data.message);
        }
      }
      
      onClose();
    } catch (error) {
      alert(`导出失败: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadFile = (blob: Blob, filename: string, _mimeType: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-[400px]">
        <h2 className="text-lg font-semibold text-white mb-4">导出数据库</h2>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-400">
            <p>将导出 {tables.length} 个表的数据</p>
            {connection?.type === 'mysql' && (
              <p className="text-xs mt-1 text-gray-500">* MySQL 导出为 SQL 脚本</p>
            )}
            {connection?.type === 'sqlite' && (
              <p className="text-xs mt-1 text-gray-500">* SQLite 导出为 .db 文件</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isExporting ? '导出中...' : '导出'}
          </button>
        </div>
      </div>
    </div>
  );
}
