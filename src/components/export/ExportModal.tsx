import { useState } from 'react';
import { X, Download, Database, Loader2, FileJson, FileText } from 'lucide-react';
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
        const response = await fetch(connection.path);
        const blob = await response.blob();
        downloadFile(blob, `${connection.name}`, 'application/octet-stream');
      } else if (connection.type === 'mysql') {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl w-[420px] border border-gray-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
              <Download className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">导出数据库</h3>
              <p className="text-xs text-gray-500">备份您的数据</p>
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
        <div className="p-6 space-y-5">
          {/* Info Card */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Database className="w-5 h-5 text-blue-400" strokeWidth={2} />
              </div>
              <div>
                <p className="text-gray-200 font-medium">{connection?.name}</p>
                <p className="text-xs text-gray-500">{connection?.type === 'mysql' ? 'MySQL' : 'SQLite'} 数据库</p>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              将导出 <span className="text-white font-medium">{tables.length}</span> 个表
            </div>
          </div>

          {/* Export Format */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-400">导出格式</label>
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-4 rounded-xl border-2 transition-all ${
                connection?.type === 'sqlite' 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-gray-800 bg-gray-800/30'
              }`}>
                <FileText className={`w-6 h-6 mb-2 ${connection?.type === 'sqlite' ? 'text-blue-400' : 'text-gray-600'}`} strokeWidth={1.5} />
                <p className="text-sm font-medium text-gray-300">
                  {connection?.type === 'sqlite' ? '.db 文件' : 'SQL 脚本'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {connection?.type === 'sqlite' ? '完整数据库备份' : 'CREATE + INSERT 语句'}
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
            <div className="p-1 bg-yellow-500/20 rounded">
              <FileJson className="w-4 h-4 text-yellow-400" strokeWidth={2} />
            </div>
            <div className="text-xs text-yellow-400/80">
              导出的文件包含完整的数据库结构和数据，请妥善保管
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3 bg-gray-900/50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-green-500/20"
          >
            {isExporting && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
            {isExporting ? '导出中...' : '开始导出'}
          </button>
        </div>
      </div>
    </div>
  );
}
