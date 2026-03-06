import { useRef, useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Database, Server, Upload, X, Trash2, Edit3, Plus, FileText, FolderOpen, Wifi, Loader2 } from 'lucide-react';
import { useDatabaseStore } from '../../stores/databaseStore';
import { useConnectionStore } from '../../stores/connectionStore';
import { MySQLConnect } from '../connect/MySQLConnect';
import type { MySQLConnection } from '../../stores/connectionStore';

// Lazy load modals for better bundle size
const ConnectionModal = lazy(() => import('./ConnectionModal').then(m => ({ default: m.ConnectionModal })));

type ConnectMode = 'sqlite' | 'mysql';

export function DatabasePanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<ConnectMode>('sqlite');
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<MySQLConnection | undefined>();
  
  const { connection, isConnecting, error, openDatabase, closeDatabase, setConnection, isLoading } = useDatabaseStore();
  const { savedConnections, recentSQLiteFiles, removeConnection, addRecentSQLite } = useConnectionStore();

  // 显示错误提示
  useEffect(() => {
    if (error) {
      console.error('数据库错误:', error);
    }
  }, [error]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await openDatabase(file);
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

  // 已连接状态
  if (connection) {
    const isMysql = connection.type === 'mysql';
    return (
      <div className="p-3 border-b border-[var(--border-color)]/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)]">当前连接</h2>
          <button
            onClick={closeDatabase}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-colors"
            title="断开连接"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 rounded-xl p-3 border border-[var(--border-color)]/50">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${isMysql ? 'bg-orange-500/20' : 'bg-[var(--accent)]/20'}`}>
              {isMysql ? (
                <Server className="w-4 h-4 text-orange-400" strokeWidth={2} />
              ) : (
                <Database className="w-4 h-4 text-[var(--accent)]" strokeWidth={2} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Wifi className="w-3 h-3 text-green-400" strokeWidth={2} />
                <span className="text-white font-medium text-sm truncate">{connection.name}</span>
              </div>
              <div className="text-xs text-[var(--text-muted)]">{isMysql ? 'MySQL' : 'SQLite'}</div>
            </div>
          </div>
          
          {isMysql && (
            <div className="text-xs text-[var(--text-muted)] pl-11">
              {connection.host}:{connection.port}/{connection.database}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 未连接状态
  return (
    <div className="p-3 border-b border-[var(--border-color)]/50">
      <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">连接数据库</h2>
      
      {/* 模式切换 */}
      <div className="flex gap-1.5 p-1 bg-[var(--bg-secondary)]/60 rounded-lg mb-3">
        <button
          onClick={() => setMode('sqlite')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
            mode === 'sqlite' 
              ? 'bg-[var(--bg-tertiary)] text-white shadow-sm' 
              : 'text-[var(--text-muted)] hover:text-[var(--text-muted)]'
          }`}
        >
          <Database className="w-3.5 h-3.5" strokeWidth={2} />
          SQLite
        </button>
        <button
          onClick={() => setMode('mysql')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
            mode === 'mysql' 
              ? 'bg-[var(--bg-tertiary)] text-white shadow-sm' 
              : 'text-[var(--text-muted)] hover:text-[var(--text-muted)]'
          }`}
        >
          <Server className="w-3.5 h-3.5" strokeWidth={2} />
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
            className={`flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              isDragging 
                ? 'border-blue-500 bg-[var(--accent)]/10' 
                : 'border-[var(--border-color)] hover:border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isConnecting ? (
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <div className="p-2.5 bg-[var(--bg-secondary)] rounded-xl">
                  <Upload className="w-5 h-5 text-[var(--text-muted)]" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <span className="text-[var(--text-secondary)] text-sm">点击或拖拽文件</span>
                  <p className="text-[var(--text-muted)] text-xs mt-0.5">.db, .sqlite, .sqlite3</p>
                </div>
              </>
            )}
          </label>
          
          {/* 最近文件 */}
          {recentSQLiteFiles.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <FolderOpen className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={2} />
                <span className="text-xs text-[var(--text-muted)] font-medium">最近文件</span>
              </div>
              <div className="space-y-1">
                {recentSQLiteFiles.slice(0, 3).map((file, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-secondary)] rounded-lg transition-colors group"
                    title={file.path}
                  >
                    <FileText className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-muted)]" strokeWidth={1.5} />
                    <span className="truncate">{file.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {error && (
            <p className="text-red-400 text-xs px-2">{error}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* 保存的连接列表 */}
          {savedConnections.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Wifi className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={2} />
                <span className="text-xs text-[var(--text-muted)] font-medium">已保存的连接</span>
              </div>
              <div className="space-y-1.5">
                {savedConnections.map((conn) => (
                  <div
                    key={conn.id}
                    className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] rounded-lg cursor-pointer group transition-colors"
                    onClick={() => handleConnectSaved(conn)}
                  >
                    <div className="p-1.5 bg-orange-500/20 rounded">
                      <Server className="w-3.5 h-3.5 text-orange-400" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[var(--text-secondary)] truncate">{conn.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">{conn.host}:{conn.port}</div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEditConnection(conn, e)}
                        className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                        title="编辑"
                      >
                        <Edit3 className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteConnection(conn.id, e)}
                        className="p-1.5 hover:bg-red-500/20 rounded text-[var(--text-muted)] hover:text-red-400 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 加载中状态 */}
          {(isConnecting || isLoading) && (
            <div className="flex items-center justify-center gap-2 py-4 text-[var(--text-muted)]">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs">
                {isConnecting ? '正在连接...' : '正在加载表...'}
              </span>
            </div>
          )}
          
          {/* 新建连接按钮 */}
          {!isConnecting && !isLoading && (
            <button
              onClick={() => {
              setEditingConnection(undefined);
              setShowConnectionModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            新建 MySQL 连接
            </button>
          )}
          
          {/* MySQL 快速连接表单 */}
          {!isConnecting && !isLoading && <MySQLConnect />}
        </div>
      )}
      
      {/* 连接编辑弹窗 */}
      <Suspense fallback={<div className="flex items-center justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" /></div>}>
        <ConnectionModal
          isOpen={showConnectionModal}
          onClose={() => {
            setShowConnectionModal(false);
            setEditingConnection(undefined);
          }}
          editConnection={editingConnection}
        />
      </Suspense>
    </div>
  );
}
