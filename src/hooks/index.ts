import { useCallback, useState } from 'react';
import { useDatabaseStore } from '../stores/databaseStore';
import type { DatabaseConnection, QueryResult } from '../types/database';

// 请求超时默认30秒
const DEFAULT_TIMEOUT = 30000;

const fetchWithTimeout = async (
  url: string, 
  options: RequestInit = {}, 
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if ((error as Error).name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接');
    }
    throw error;
  }
};

const API_BASE = '/api';

/**
 * 数据库连接管理 Hook
 */
export function useConnection() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    connection, 
    setConnection: setStoreConnection,
    closeDatabase,
    reconnect,
    loadTables,
    loadViews,
    loadTriggers
  } = useDatabaseStore();

  const connect = useCallback(async (conn: DatabaseConnection) => {
    setIsConnecting(true);
    setError(null);
    
    try {
      if (conn.type === 'mysql' || conn.type === 'postgresql') {
        const res = await fetchWithTimeout(`${API_BASE}/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dbType: conn.type,
            host: conn.host,
            port: conn.port,
            user: conn.user,
            password: conn.password,
            database: conn.database,
          }),
        });
        
        const data = await res.json();
        
        if (data.success) {
          const connectedConn = { ...conn, isConnected: true };
          setStoreConnection(connectedConn);
          await loadTables();
          return { success: true };
        } else {
          setError(data.message || '连接失败');
          return { success: false, error: data.message };
        }
      } else {
        setStoreConnection(conn);
        return { success: true };
      }
    } catch (err) {
      const message = (err as Error).message || '连接失败';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsConnecting(false);
    }
  }, [setStoreConnection, loadTables]);

  const disconnect = useCallback(() => {
    closeDatabase();
  }, [closeDatabase]);

  return {
    connection,
    isConnecting,
    error,
    connect,
    disconnect,
    reconnect,
    loadTables,
    loadViews,
    loadTriggers,
  };
}

/**
 * SQL 查询执行 Hook
 */
export function useQuery() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  
  const {
    connection: _connection,
    query,
    queryResult,
    queryHistory,
    setQuery,
    executeQuery,
    clearResult,
    clearHistory,
  } = useDatabaseStore();

  const execute = useCallback(async (sql?: string): Promise<QueryResult | null> => {
    const queryToExecute = sql || query;
    if (!queryToExecute.trim()) return null;
    
    setIsExecuting(true);
    setQueryError(null);
    
    try {
      await executeQuery(queryToExecute);
      return useDatabaseStore.getState().queryResult;
    } catch (err) {
      const message = (err as Error).message || '查询执行失败';
      setQueryError(message);
      return null;
    } finally {
      setIsExecuting(false);
    }
  }, [query, executeQuery]);

  const executeMultiple = useCallback(async (sqlStatements: string[]): Promise<QueryResult[]> => {
    const results: QueryResult[] = [];
    
    for (const sql of sqlStatements) {
      const result = await execute(sql.trim());
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  }, [execute]);

  const formatQuery = useCallback((sql: string): string => {
    // 简单的 SQL 格式化
    const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 
                      'HAVING', 'LIMIT', 'OFFSET', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
                      'INNER JOIN', 'ON', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET',
                      'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE'];
    
    let formatted = sql;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      formatted = formatted.replace(regex, `\n${keyword}`);
    });
    
    return formatted.trim();
  }, []);

  return {
    query,
    queryResult,
    queryHistory,
    isExecuting,
    queryError,
    setQuery,
    execute,
    executeMultiple,
    clearResult,
    clearHistory,
    formatQuery,
  };
}

/**
 * 表操作 Hook
 */
export function useTable() {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    connection,
    tables,
    selectedTable,
    tableColumns,
    tableIndexes,
    tableRowCount,
    selectTable,
  } = useDatabaseStore();

  const loadTableData = useCallback(async (tableName: string) => {
    setIsLoading(true);
    try {
      await selectTable(tableName);
    } finally {
      setIsLoading(false);
    }
  }, [selectTable]);

  const getTableInfo = useCallback((tableName: string) => {
    return tables.find(t => t.name === tableName);
  }, [tables]);

  const refreshTables = useCallback(async () => {
    if (!connection || connection.type === 'sqlite') return;
    
    setIsLoading(true);
    try {
      await useDatabaseStore.getState().loadTables();
    } finally {
      setIsLoading(false);
    }
  }, [connection]);

  return {
    tables,
    selectedTable,
    tableColumns,
    tableIndexes,
    tableRowCount,
    isLoading,
    selectTable: loadTableData,
    getTableInfo,
    refreshTables,
  };
}

/**
 * 数据导出 Hook
 */
export function useExport() {
  const exportToCSV = useCallback((data: any[], filename: string) => {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // 处理包含逗号或换行的值
          if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  const exportToJSON = useCallback((data: any[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  const exportToSQL = useCallback((tableName: string, data: any[]) => {
    if (!data.length) return '';
    
    const columns = Object.keys(data[0]);
    const statements = data.map(row => {
      const values = columns.map(col => {
        const value = row[col];
        if (value === null) return 'NULL';
        if (typeof value === 'number') return value;
        return `'${String(value).replace(/'/g, "''")}'`;
      });
      return `INSERT INTO \`${tableName}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${values.join(', ')});`;
    });
    
    return statements.join('\n');
  }, []);

  return {
    exportToCSV,
    exportToJSON,
    exportToSQL,
  };
}

/**
 * 数据导入 Hook
 */
export function useImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const parseCSV = useCallback((file: File): Promise<{ headers: string[]; data: any[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (!lines.length) {
            reject(new Error('CSV文件为空'));
            return;
          }
          
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          const data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || null;
            });
            return row;
          });
          
          resolve({ headers, data });
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }, []);

  const importData = useCallback(async (
    tableName: string, 
    data: any[], 
    onProgress?: (p: number) => void
  ) => {
    setIsImporting(true);
    setProgress(0);
    
    try {
      const batchSize = 100;
      const total = data.length;
      
      for (let i = 0; i < total; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const values = batch.map(row => {
          const vals = Object.values(row).map(v => {
            if (v === null) return 'NULL';
            if (typeof v === 'number') return v;
            return `'${String(v).replace(/'/g, "''")}'`;
          }).join(', ');
          return `(${vals})`;
        }).join(', ');
        
        const sql = `INSERT INTO \`${tableName}\` VALUES ${values}`;
        await useDatabaseStore.getState().executeUpdate(sql);
        
        const currentProgress = Math.min(((i + batchSize) / total) * 100, 100);
        setProgress(currentProgress);
        onProgress?.(currentProgress);
      }
      
      return { success: true, count: total };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    } finally {
      setIsImporting(false);
      setProgress(100);
    }
  }, []);

  return {
    isImporting,
    progress,
    parseCSV,
    importData,
  };
}

/**
 * 键盘快捷键 Hook
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = [
      e.ctrlKey ? 'Ctrl' : '',
      e.shiftKey ? 'Shift' : '',
      e.altKey ? 'Alt' : '',
      e.key.toUpperCase()
    ].filter(Boolean).join('+');
    
    const handler = shortcuts[key];
    if (handler) {
      e.preventDefault();
      handler();
    }
  }, [shortcuts]);

  return handleKeyDown;
}

/**
 * 本地存储 Hook
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (err) {
      console.error('保存到localStorage失败:', err);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

/**
 * 窗口大小 Hook
 */
export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useState(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  return size;
}
