import { useState } from 'react';
import { ConnectionModal } from '../connection/ConnectionModal';

interface QuickStartProps {
  onFileSelect?: (file: File) => void;
}

export function QuickStart({ onFileSelect }: QuickStartProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showMySQLModal, setShowMySQLModal] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.db') || file.name.endsWith('.sqlite') || file.name.endsWith('.sqlite3'))) {
      onFileSelect?.(file);
    } else {
      alert('请选择 SQLite 数据库文件 (.db, .sqlite, .sqlite3)');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect?.(file);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-gray-900">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">DBForge</h1>
          <p className="text-gray-400">轻量级数据库管理工具</p>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            isDragging 
              ? 'border-blue-500 bg-blue-500/10' 
              : 'border-gray-600 hover:border-gray-500'
          }`}
        >
          <div className="text-4xl mb-4">🗃️</div>
          <p className="text-gray-300 mb-4">拖拽 SQLite 数据库文件到这里</p>
          <p className="text-gray-500 text-sm mb-4">或</p>
          <label className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
            选择文件
            <input 
              type="file" 
              accept=".db,.sqlite,.sqlite3" 
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
          <p className="text-gray-500 text-xs mt-4">支持 .db, .sqlite, .sqlite3 格式</p>
        </div>

        {/* Quick Tips */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="text-gray-200 font-medium mb-1">数据浏览</h3>
            <p className="text-gray-500 text-xs">查看、筛选、排序数据，支持分页和快速搜索</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl mb-2">✏️</div>
            <h3 className="text-gray-200 font-medium mb-1">数据编辑</h3>
            <p className="text-gray-500 text-xs">双击单元格直接编辑，支持批量保存</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="text-gray-200 font-medium mb-1">SQL 查询</h3>
            <p className="text-gray-500 text-xs">智能补全、语法高亮、模板快速插入</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl mb-2">📦</div>
            <h3 className="text-gray-200 font-medium mb-1">导入导出</h3>
            <p className="text-gray-500 text-xs">支持 CSV 导入导出，数据库完整备份</p>
          </div>
        </div>

        {/* MySQL Connect Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowMySQLModal(true)}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            连接 MySQL 数据库 →
          </button>
        </div>

        {/* MySQL Modal */}
        {showMySQLModal && (
          <ConnectionModal isOpen={showMySQLModal} onClose={() => setShowMySQLModal(false)} />
        )}
      </div>
    </div>
  );
}
