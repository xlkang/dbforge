import { useRef, useState, useCallback } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';
import { useConnectionStore } from '../../stores/connectionStore';
import { MySQLConnect } from '../connect/MySQLConnect';
import { ConnectionModal } from './ConnectionModal';
import type { MySQLConnection } from '../../stores/connectionStore';

type ConnectMode = 'sqlite' | 'mysql';

export function DatabasePanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<ConnectMode>('sqlite');
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<MySQLConnection | undefined>();
  
  const { connection, isConnecting, error, openDatabase, closeDatabase, setConnection } = useDatabaseStore();
  const { savedConnections, recentSQLiteFiles, removeConnection, addRecentSQLite } = useConnectionStore();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await openDatabase(file);
      // 记录最近文件
      addRecentSQLite(file.name, file.name);
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
        addRecentSQLite(file.name, file.name);
      }
    }
  }, [openDatabase, addRecentSQLite]);

  const handleConnectSaved = (conn: MySQLConnection) => {
    // 使用保存的连接信息连接 MySQL
    setConnection({
      id: conn.id,
      type: 'mysql',
      name: conn.name,
      host: conn.host,
      port: conn.port,
      user: conn.user,
      password: conn.password,
      database: conn.database,
      isConnected: true,
    });
  };

  const handleEditConnection = (conn: MySQLConnection, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConnection(conn);
    setShowConnectionModal(true);
  };

  const handleDeleteConnection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个连接配置吗？')) {
      removeConnection(id);
    }
  };

  // 已连接时显示连接信息
  if (connection) {
    const typeLabel = connection.type === 'mysql' ? 'MySQL' : 'SQLite';
    return (
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold mb-3 text-gray-100">数据库连接</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-green-400 font-medium">{connection.name}</span>
          </div>
          <div className="text-xs text-gray-500">{typeLabel}</div>
          {connection.type === 'mysql' && (
            <div className="text-xs text-gray-500">
              {connection.host}:{connection.port}/{connection.database}
            </div>
          )}
          <button
            onClick={closeDatabase}
            className="w-full px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            关闭连接
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-gray-700">
      <h2 className="text-lg font-semibold mb-3 text-gray-100">数据库连接</h2>
      
      {/* 模式切换 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('sqlite')}
          className={`flex-1 py-2 text-sm rounded transition-colors ${
            mode === 'sqlite' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          SQLite
        </button>
        <button
          onClick={() => setMode('mysql')}
          className={`flex-1 py-2 text-sm rounded transition-colors ${
            mode === 'mysql' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          MySQL
        </button>
      </div>

      {mode === 'sqlite' ? (
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
          
          {/* 最近文件 */}
          {recentSQLiteFiles.length > 0 && (
            <div>
              <h4 className="text-xs text-gray-500 mb-2">最近文件</h4>
              <div className="space-y-1">
                {recentSQLiteFiles.map((file, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      // TODO: 重新打开文件
                    }}
                    className="w-full text-left px-2 py-1.5 text-sm text-gray-400 hover:bg-gray-700 rounded truncate"
                    title={file.path}
                  >
                    📄 {file.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* 保存的连接列表 */}
          {savedConnections.length > 0 && (
            <div>
              <h4 className="text-xs text-gray-500 mb-2">保存的连接</h4>
              <div className="space-y-1">
                {savedConnections.map((conn) => (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 group cursor-pointer"
                    onClick={() => handleConnectSaved(conn)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-200 truncate">{conn.name}</div>
                      <div className="text-xs text-gray-500">{conn.host}:{conn.port}/{conn.database}</div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => handleEditConnection(conn, e)}
                        className="p-1 text-gray-400 hover:text-blue-400"
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => handleDeleteConnection(conn.id, e)}
                        className="p-1 text-gray-400 hover:text-red-400"
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 新建连接按钮 */}
          <button
            onClick={() => {
              setEditingConnection(undefined);
              setShowConnectionModal(true);
            }}
            className="w-full px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            + 新建连接
          </button>
          
          <MySQLConnect />
        </div>
      )}
      
      {/* 连接编辑弹窗 */}
      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={() => {
          setShowConnectionModal(false);
          setEditingConnection(undefined);
        }}
        editConnection={editingConnection}
      />
    </div>
  );
}
