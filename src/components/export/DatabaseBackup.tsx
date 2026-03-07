import { useState } from 'react';
import { DatabaseBackup as BackupIcon, Download, RotateCcw, X } from 'lucide-react';
import { useDatabaseStore } from '../../stores/databaseStore';
import { useToastStore } from '../../stores/toastStore';

interface DatabaseBackupProps {
  onClose: () => void;
}

export function DatabaseBackup({ onClose }: DatabaseBackupProps) {
  const { connection, tables } = useDatabaseStore();
  const { addToast } = useToastStore();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());

  const handleSelectAll = () => {
    if (selectedTables.size === tables.length) {
      setSelectedTables(new Set());
    } else {
      setSelectedTables(new Set(tables.map(t => t.name)));
    }
  };

  const handleToggleTable = (tableName: string) => {
    const newSet = new Set(selectedTables);
    if (newSet.has(tableName)) {
      newSet.delete(tableName);
    } else {
      newSet.add(tableName);
    }
    setSelectedTables(newSet);
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      let response;
      let filename;
      
      if (connection?.type === 'mysql') {
        // MySQL backup
        response = await fetch('/api/mysql/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: connection.host,
            port: connection.port,
            user: connection.user,
            password: connection.password,
            database: connection.database,
            tables: selectedTables.size > 0 ? Array.from(selectedTables) : undefined,
          }),
        });
        filename = `${connection.database}-backup.sql`;
      } else if (connection?.type === 'postgresql') {
        // PostgreSQL backup
        response = await fetch('/api/pg/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: connection.host,
            port: connection.port,
            user: connection.user,
            password: connection.password,
            database: connection.database,
            tables: selectedTables.size > 0 ? Array.from(selectedTables) : undefined,
          }),
        });
        filename = `${connection.database}-backup.sql`;
      } else if (connection?.type === 'sqlite') {
        // SQLite backup
        response = await fetch('/api/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connection,
            tables: selectedTables.size > 0 ? Array.from(selectedTables) : undefined,
          }),
        });
        filename = `dbforge-backup-${new Date().toISOString().slice(0, 10)}.sqlite`;
      } else {
        addToast('不支持的数据库类型', 'error');
        return;
      }

      if (!response.ok) throw new Error('Backup failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      addToast('数据库备份成功', 'success');
      onClose();
    } catch (err) {
      addToast(`备份失败: ${err}`, 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sqlite,.db';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsRestoring(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/restore', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Restore failed');
        
        addToast('数据库还原成功', 'success');
        window.location.reload();
      } catch (err) {
        addToast(`还原失败: ${err}`, 'error');
      } finally {
        setIsRestoring(false);
      }
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-primary)] rounded-lg shadow-xl w-[480px] max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <BackupIcon className="w-5 h-5 text-[var(--accent-color)]" />
            <h2 className="text-lg font-semibold">数据库备份与还原</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[var(--bg-hover)] rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Backup Section */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Download className="w-4 h-4" />
              备份数据库
            </h3>
            {connection?.type ? (
              <div className="space-y-2">
                <p className="text-sm text-[var(--text-muted)]">
                  选择要备份的表（留空则备份整个数据库）
                </p>
                <div className="border border-[var(--border-color)] rounded-md max-h-40 overflow-y-auto">
                  <label className="flex items-center gap-2 p-2 hover:bg-[var(--bg-hover)] border-b border-[var(--border-color)]">
                    <input
                      type="checkbox"
                      checked={selectedTables.size === tables.length && tables.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                    <span className="font-medium">全选 ({tables.length} 个表)</span>
                  </label>
                  {tables.map(table => (
                    <label
                      key={table.name}
                      className="flex items-center gap-2 p-2 hover:bg-[var(--bg-hover)]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTables.has(table.name)}
                        onChange={() => handleToggleTable(table.name)}
                        className="rounded"
                      />
                      <span>{table.name}</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        ({table.rowCount} 行)
                      </span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleBackup}
                  disabled={isBackingUp}
                  className="w-full py-2 px-4 bg-[var(--accent-color)] text-white rounded-md hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isBackingUp ? (
                    <>处理中...</>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      下载备份文件
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)] p-3 bg-[var(--bg-secondary)] rounded">
                当前连接类型不支持备份功能
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--border-color)]" />

          {/* Restore Section */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              还原数据库
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              从备份文件还原数据库（将覆盖当前数据）
            </p>
            <button
              onClick={handleRestore}
              disabled={isRestoring}
              className="w-full py-2 px-4 border border-[var(--border-color)] rounded-md hover:bg-[var(--bg-hover)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isRestoring ? (
                <>处理中...</>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  选择备份文件还原
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
