import { create } from 'zustand';
import type { DatabaseConnection, TableInfo, ColumnInfo, IndexInfo, QueryResult } from '../types/database';
import * as db from '../lib/database';

const API_BASE = '/api';

// 从 localStorage 恢复连接
function loadPersistedConnection(): DatabaseConnection | null {
  try {
    const saved = localStorage.getItem('dbforge-last-connection');
    if (saved) {
      const conn = JSON.parse(saved);
      // 标记为需要重新验证
      return { ...conn, isConnected: false };
    }
  } catch {}
  return null;
}

// 保存连接到 localStorage
function saveConnection(conn: DatabaseConnection | null) {
  if (conn) {
    localStorage.setItem('dbforge-last-connection', JSON.stringify(conn));
  } else {
    localStorage.removeItem('dbforge-last-connection');
  }
}

interface DatabaseState {
  // Connection state
  connection: DatabaseConnection | null;
  isConnecting: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Schema state
  tables: TableInfo[];
  selectedTable: string | null;
  tableColumns: ColumnInfo[];
  tableIndexes: IndexInfo[];
  tableRowCount: number;
  
  // Query state
  query: string;
  queryHistory: string[];
  queryResult: QueryResult | null;
  isExecuting: boolean;
  queryError: string | null;
  
  // Data editing
  executeUpdate: (sql: string) => Promise<number>;
  
  // Actions
  openDatabase: (file: File) => Promise<void>;
  setConnection: (conn: DatabaseConnection) => void;
  closeDatabase: () => void;
  selectTable: (tableName: string) => void;
  setQuery: (query: string) => void;
  setError: (error: string | null) => void;
  executeQuery: (sql?: string) => Promise<void>;
  clearResult: () => void;
  clearHistory: () => void;
  loadTables: () => Promise<void>;
  loadViews: () => Promise<void>;
  loadTriggers: () => Promise<void>;
  reconnect: () => Promise<void>;
}

export const useDatabaseStore = create<DatabaseState>((set, get) => ({
  // Initial state - 尝试恢复上次连接
  connection: loadPersistedConnection(),
  isConnecting: false,
  isLoading: false,
  error: null,
  
  tables: [],
  selectedTable: null,
  tableColumns: [],
  tableIndexes: [],
  tableRowCount: 0,
  
  query: 'SELECT * FROM ',
  queryHistory: [],
  queryResult: null,
  isExecuting: false,
  queryError: null,
  
  // Actions
  openDatabase: async (file: File) => {
    set({ isConnecting: true, error: null });
    
    const result = await db.openDatabase(file);
    
    if (result.success) {
      const tables = db.getTables().map(name => {
        const info = db.getTableInfo(name);
        return { name, rowCount: info.rowCount };
      });
      
      const connection: DatabaseConnection = {
        id: crypto.randomUUID(),
        type: 'sqlite',
        name: file.name,
        path: URL.createObjectURL(file),
        isConnected: true,
      };
      
      saveConnection(connection);
      set({
        connection,
        isConnecting: false,
        tables,
        error: null,
      });
    } else {
      set({
        isConnecting: false,
        error: result.error || 'Failed to open database',
      });
    }
  },
  
  setConnection: (conn: DatabaseConnection) => {
    saveConnection(conn);
    set({ 
      connection: conn, 
      tables: [],
      selectedTable: null,
      tableColumns: [],
      tableIndexes: [],
      tableRowCount: 0,
      isLoading: conn.type === 'mysql', // MySQL 需要加载
    });
    // 加载 MySQL 表
    if (conn.type === 'mysql') {
      get().loadTables();
    }
  },
  
  reconnect: async () => {
    const { connection } = get();
    if (!connection || connection.type !== 'mysql') return;
    
    set({ isConnecting: true, error: null });
    
    try {
      const res = await fetch(`${API_BASE}/connect`, {
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
        const connectedConn = { ...connection, isConnected: true };
        saveConnection(connectedConn);
        set({ connection: connectedConn, isConnecting: false });
        get().loadTables();
      } else {
        set({ isConnecting: false, error: data.message });
      }
    } catch (error) {
      set({ isConnecting: false, error: (error as Error).message });
    }
  },
  
  loadTables: async () => {
    const { connection } = get();
    if (!connection || connection.type !== 'mysql') return;
    
    set({ isLoading: true, error: null });
    
    try {
      const res = await fetch(`${API_BASE}/tables`, {
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
      
      if (!data.success) {
        set({ error: data.message || '加载表失败', isLoading: false });
        return;
      }
      
      if (data.success) {
        const tables: TableInfo[] = await Promise.all(
          data.tables.map(async (t: any) => {
            const countRes = await fetch(`${API_BASE}/count`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                host: connection.host,
                port: connection.port,
                user: connection.user,
                password: connection.password,
                database: connection.database,
                table: t.TABLE_NAME,
              }),
            });
            const countData = await countRes.json();
            return {
              name: t.TABLE_NAME,
              comment: t.TABLE_COMMENT,
              rowCount: countData.success ? countData.count : 0,
            };
          })
        );
        
        set({ tables, isLoading: false });
      }
    } catch (error) {
      console.error('加载表失败:', error);
      set({ error: '加载表失败: ' + (error as Error).message, isLoading: false });
    }
  },
  
  loadViews: async () => {
    const { connection } = get();
    if (!connection || connection.type !== 'mysql') return;
    
    try {
      const res = await fetch(`${API_BASE}/views`, {
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
        console.log('Views:', data.views);
      }
    } catch (error) {
      console.error('加载视图失败:', error);
    }
  },
  
  loadTriggers: async () => {
    const { connection } = get();
    if (!connection || connection.type !== 'mysql') return;
    
    try {
      const res = await fetch(`${API_BASE}/triggers`, {
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
        console.log('Triggers:', data.triggers);
      }
    } catch (error) {
      console.error('加载触发器失败:', error);
    }
  },
  
  closeDatabase: () => {
    if (get().connection?.type === 'sqlite') {
      db.closeDatabase();
    }
    saveConnection(null);
    set({
      connection: null,
      tables: [],
      selectedTable: null,
      tableColumns: [],
      tableIndexes: [],
      tableRowCount: 0,
      queryResult: null,
      queryError: null,
      query: 'SELECT * FROM ',
    });
  },
  
  selectTable: async (tableName: string) => {
    const { connection } = get();
    
    set({ selectedTable: tableName, query: `SELECT * FROM \`${tableName}\` LIMIT 100`, isLoading: true });
    
    if (connection?.type === 'mysql') {
      try {
        const res = await fetch(`${API_BASE}/schema`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: connection.host,
            port: connection.port,
            user: connection.user,
            password: connection.password,
            database: connection.database,
            table: tableName,
          }),
        });
        const data = await res.json();
        
        if (data.success) {
          const columns: ColumnInfo[] = data.columns.map((c: any) => ({
            name: c.COLUMN_NAME,
            type: c.COLUMN_TYPE,
            notnull: c.IS_NULLABLE === 'NO',
            pk: c.COLUMN_KEY === 'PRI',
            dfltValue: c.COLUMN_DEFAULT,
            comment: c.COLUMN_COMMENT,
          }));
          
          const indexes: IndexInfo[] = [];
          const indexMap = new Map();
          data.indexes.forEach((idx: any) => {
            if (!indexMap.has(idx.Key_name)) {
              indexMap.set(idx.Key_name, {
                name: idx.Key_name,
                unique: !idx.Non_unique,
                columns: [],
              });
            }
            indexMap.get(idx.Key_name).columns.push(idx.Column_name);
          });
          indexMap.forEach((v) => indexes.push(v));
          
          set({ 
            tableColumns: columns, 
            tableIndexes: indexes,
            tableRowCount: get().tables.find(t => t.name === tableName)?.rowCount || 0,
            isLoading: false,
          });
        }
      } catch (error) {
        set({ error: '加载表结构失败', isLoading: false });
      }
    } else {
      const info = db.getTableInfo(tableName);
      const indexes = db.getIndexes(tableName);
      set({
        tableColumns: info.columns,
        tableIndexes: indexes,
        tableRowCount: info.rowCount,
        isLoading: false,
      });
    }
  },
  
  setQuery: (query: string) => set({ query }),
  
  executeQuery: async (sql?: string) => {
    const queryToExecute = sql || get().query;
    if (!queryToExecute.trim()) return;
    
    const { connection } = get();
    set({ isExecuting: true, queryError: null });
    
    try {
      let result: QueryResult;
      
      if (connection?.type === 'mysql') {
        const res = await fetch(`${API_BASE}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: connection.host,
            port: connection.port,
            user: connection.user,
            password: connection.password,
            database: connection.database,
            sql: queryToExecute,
          }),
        });
        const data = await res.json();
        
        if (!data.success) {
          throw new Error(data.message);
        }
        
        const columns = data.fields?.map((f: any) => f.name) || [];
        const isSelect = queryToExecute.trim().toUpperCase().startsWith('SELECT');
        
        result = {
          columns,
          rows: data.rows || [],
          rowCount: data.rows?.length || 0,
          executionTime: 0,
          isSelect,
        };
      } else {
        result = db.executeQuery(queryToExecute);
      }
      
      const history = get().queryHistory;
      const newHistory = [queryToExecute, ...history.filter(q => q !== queryToExecute)].slice(0, 50);
      
      set({
        queryResult: result,
        isExecuting: false,
        queryHistory: newHistory,
      });
    } catch (error) {
      set({
        queryError: (error as Error).message,
        isExecuting: false,
        queryResult: null,
      });
    }
  },
  
  clearResult: () => set({ queryResult: null, queryError: null }),
  
  clearHistory: () => set({ queryHistory: [] }),
  
  setError: (error: string | null) => set({ error }),
  
  executeUpdate: async (sql: string) => {
    const { connection } = get();
    
    try {
      if (connection?.type === 'mysql') {
        const res = await fetch(`${API_BASE}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: connection.host,
            port: connection.port,
            user: connection.user,
            password: connection.password,
            database: connection.database,
            sql,
          }),
        });
        const data = await res.json();
        
        if (!data.success) {
          throw new Error(data.message);
        }
        
        return data.affectedRows || 0;
      } else {
        const result = db.executeQuery(sql);
        return result.affectedRows;
      }
    } catch (error) {
      throw error;
    }
  },
}));
