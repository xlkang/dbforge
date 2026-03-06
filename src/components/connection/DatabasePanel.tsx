import { useRef, useState, useCallback } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';

export function DatabasePanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { connection, isConnecting, error, openDatabase, closeDatabase } = useDatabaseStore();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await openDatabase(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const validExtensions = ['.db', '.sqlite', '.sqlite3'];
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      
      if (validExtensions.includes(ext)) {
        await openDatabase(file);
      }
    }
  }, [openDatabase]);

  return (
    <div className="p-4 border-b border-gray-700">
      <h2 className="text-lg font-semibold mb-3 text-gray-100">数据库连接</h2>
      
      {!connection ? (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".db,.sqlite,.sqlite3"
            onChange={handleFileSelect}
            className="hidden"
            id="db-file-input"
          />
          <label
            htmlFor="db-file-input"
            className={`block w-full px-4 py-3 text-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isDragging 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-gray-600 hover:border-blue-500 hover:bg-gray-800'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isConnecting ? (
              <span className="text-blue-400">连接中...</span>
            ) : (
              <span className="text-gray-400">
                点击选择或拖拽数据库文件<br />
                <span className="text-xs text-gray-500">.db, .sqlite, .sqlite3</span>
              </span>
            )}
          </label>
          
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-green-400 font-medium">{connection.name}</span>
          </div>
          <button
            onClick={closeDatabase}
            className="w-full px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            关闭连接
          </button>
        </div>
      )}
    </div>
  );
}