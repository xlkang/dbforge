import { create } from 'zustand';
import type { DatabaseConnection, TableInfo, ColumnInfo, IndexInfo, QueryResult } from '../types/database';
import * as db from '../lib/database';

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
  
  // Actions
  openDatabase: (file: File) => Promise<void>;
  closeDatabase: () => void;
  selectTable: (tableName: string) => void;
  setQuery: (query: string) => void;
  executeQuery: (sql?: string) => Promise<void>;
  clearResult: () => void;
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
  
  closeDatabase: () => {
    db.closeDatabase();
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
  
  selectTable: (tableName: string) => {
    const info = db.getTableInfo(tableName);
    const indexes = db.getIndexes(tableName);
    
    set({
      selectedTable: tableName,
      tableColumns: info.columns,
      tableIndexes: indexes,
      tableRowCount: info.rowCount,
      query: `SELECT * FROM "${tableName}" LIMIT 100`,
    });
  },
  
  setQuery: (query: string) => set({ query }),
  
  executeQuery: async (sql?: string) => {
    const queryToExecute = sql || get().query;
    if (!queryToExecute.trim()) return;
    
    set({ isExecuting: true, queryError: null });
    
    try {
      const result = db.executeQuery(queryToExecute);
      
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
}));