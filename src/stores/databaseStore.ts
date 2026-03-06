import { create } from 'zustand';
import type { DatabaseConnection, TableInfo, ColumnInfo, IndexInfo, QueryResult } from '../types/database';
import * as db from '../lib/database';

const API_BASE = 'http://localhost:3001/api';

interface DatabaseState {
  // Connection state
  connection: DatabaseConnection | null;
  isConnecting: boolean;
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
}

export const useDatabaseStore = create<DatabaseState>((set, get) => ({
  // Initial state
  connection: null,
  isConnecting: false,
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
      
      set({
        connection: {
          id: crypto.randomUUID(),
          type: 'sqlite',
          name: file.name,
          path: URL.createObjectURL(file),
          isConnected: true,
        },
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
    set({ 
      connection: conn, 
      tables: [],
      selectedTable: null,
      tableColumns: [],
      tableIndexes: [],
      tableRowCount: 0,
    });
    // 加载 MySQL 表
    if (conn.type === 'mysql') {
      get().loadTables();
    }
  },
  
  loadTables: async () => {
    const { connection } = get();
    if (!connection || connection.type !== 'mysql') return;
    
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
      
      if (data.success) {
        // 获取每个表的行数
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
        
        set({ tables });
      }
    } catch (error) {
      set({ error: '加载表失败' });
    }
  },
  
  closeDatabase: () => {
    if (get().connection?.type === 'sqlite') {
      db.closeDatabase();
    }
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
    
    set({ selectedTable: tableName, query: `SELECT * FROM \`${tableName}\` LIMIT 100` });
    
    if (connection?.type === 'mysql') {
      // 加载 MySQL 表结构
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
          });
        }
      } catch (error) {
        set({ error: '加载表结构失败' });
      }
    } else {
      // SQLite
      const info = db.getTableInfo(tableName);
      const indexes = db.getIndexes(tableName);
      set({
        tableColumns: info.columns,
        tableIndexes: indexes,
        tableRowCount: info.rowCount,
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
        // MySQL 查询
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
        // SQLite 查询
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