import { Wifi, WifiOff, Loader2, Database, Clock, Table } from 'lucide-react';
import { useDatabaseStore } from '../../stores/databaseStore';

export function ConnectionStatus() {
  const { connection, tables, isConnecting, isLoading, error, reconnect } = useDatabaseStore();
  
  if (!connection) return null;
  
  const isConnected = connection.isConnected;
  const dbType = connection.type === 'mysql' ? 'MySQL' : connection.type === 'postgresql' ? 'PostgreSQL' : 'SQLite';
  
  return (
    <div className="flex items-center gap-4 px-3 py-1.5 bg-[var(--bg-secondary)] rounded-lg">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        {isConnecting || isLoading ? (
          <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
        ) : isConnected ? (
          <Wifi className="w-4 h-400 text-green-400" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-400" />
        )}
        <span className={`text-xs font-medium ${
          isConnecting || isLoading 
            ? 'text-yellow-400' 
            : isConnected 
              ? 'text-green-400' 
              : 'text-red-400'
        }`}>
          {isConnecting ? '连接中...' : isLoading ? '加载中...' : isConnected ? '已连接' : '未连接'}
        </span>
      </div>
      
      <div className="h-4 w-px bg-[var(--border-color)]" />
      
      {/* Database Type */}
      <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <Database className="w-3.5 h-3.5" />
        <span>{dbType}</span>
      </div>
      
      <div className="h-4 w-px bg-[var(--border-color)]" />
      
      {/* Table Count */}
      <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <Table className="w-3.5 h-3.5" />
        <span>{tables.length} 表</span>
      </div>
      
      {/* Reconnect Button */}
      {!isConnected && !isConnecting && connection.type !== 'sqlite' && (
        <>
          <div className="h-4 w-px bg-[var(--border-color)]" />
          <button
            onClick={reconnect}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <Clock className="w-3 h-3" />
            重连
          </button>
        </>
      )}
      
      {/* Error Display */}
      {error && (
        <>
          <div className="h-4 w-px bg-[var(--border-color)]" />
          <span className="text-xs text-red-400 max-w-[200px] truncate" title={error}>
            {error}
          </span>
        </>
      )}
    </div>
  );
}
