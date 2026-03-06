import { create } from 'zustand';
import type { DatabaseConnection, TableInfo, ColumnInfo, IndexInfo } from '../types/database';
import * as db from '../lib/database';

const API_BASE = '/api';

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 30000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if ((error as Error).name === 'AbortError') throw new Error('请求超时');
    throw error;
  }
};

function loadPersistedConnection(): DatabaseConnection | null {
  try {
    const saved = localStorage.getItem('dbforge-last-connection');
    return saved ? { ...JSON.parse(saved), isConnected: false } : null;
  } catch { return null; }
}

function saveConnection(conn: DatabaseConnection | null) {
  conn ? localStorage.setItem('dbforge-last-connection', JSON.stringify(conn))
      : localStorage.removeItem('dbforge-last-connection');
}

interface SchemaState {
  connection: DatabaseConnection | null;
  isConnecting: boolean;
  isLoading: boolean;
  error: string | null;
  tables: TableInfo[];
  selectedTable: string | null;
  tableColumns: ColumnInfo[];
  tableIndexes: IndexInfo[];
  tableRowCount: number;
  views: string[];
  triggers: string[];
  setConnection: (conn: DatabaseConnection) => void;
  closeDatabase: () => void;
  selectTable: (tableName: string) => void;
  loadTables: () => Promise<void>;
  loadViews: () => Promise<void>;
  loadTriggers: () => Promise<void>;
  reconnect: () => Promise<void>;
}

export const useSchemaStore = create<SchemaState>((set, get) => ({
  connection: loadPersistedConnection(),
  isConnecting: false,
  isLoading: false,
  error: null,
  tables: [],
  selectedTable: null,
  tableColumns: [],
  tableIndexes: [],
  tableRowCount: 0,
  views: [],
  triggers: [],

  setConnection: (conn: DatabaseConnection) => {
    saveConnection(conn);
    set({ connection: conn, tables: [], selectedTable: null, tableColumns: [], tableIndexes: [], tableRowCount: 0, isLoading: conn.type === 'mysql' });
    if (conn.type === 'mysql') get().loadTables();
  },

  reconnect: async () => {
    const { connection } = get();
    if (!connection || (connection.type !== 'mysql' && connection.type !== 'postgresql')) return;
    set({ isConnecting: true, error: null });
    try {
      const res = await fetchWithTimeout(`${API_BASE}/connect`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbType: connection.type, host: connection.host, port: connection.port, user: connection.user, password: connection.password, database: connection.database }),
      });
      const data = await res.json();
      if (data.success) {
        const conn = { ...connection, isConnected: true };
        saveConnection(conn);
        set({ connection: conn, isConnecting: false });
        get().loadTables();
      } else { set({ isConnecting: false, error: data.message }); }
    } catch (error) { set({ isConnecting: false, error: (error as Error).message }); }
  },

  loadTables: async () => {
    const { connection } = get();
    if (!connection || (connection.type !== 'mysql' && connection.type !== 'postgresql')) return;
    set({ isLoading: true, error: null });
    try {
      const res = await fetchWithTimeout(`${API_BASE}/tables`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbType: connection.type, host: connection.host, port: connection.port, user: connection.user, password: connection.password, database: connection.database }),
      });
      const data = await res.json();
      if (!data.success) { set({ error: data.message, isLoading: false }); return; }
      const tables = await Promise.all(data.tables.map(async (t: any) => {
        const countRes = await fetchWithTimeout(`${API_BASE}/count`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dbType: connection.type, host: connection.host, port: connection.port, user: connection.user, password: connection.password, database: connection.database, table: t.TABLE_NAME }),
        });
        const countData = await countRes.json();
        return { name: t.TABLE_NAME, comment: t.TABLE_COMMENT, rowCount: countData.success ? countData.count : 0 };
      }));
      set({ tables, isLoading: false });
    } catch (error) { set({ error: (error as Error).message, isLoading: false }); }
  },

  loadViews: async () => {
    const { connection } = get();
    if (!connection || (connection.type !== 'mysql' && connection.type !== 'postgresql')) return;
    try {
      const res = await fetch(`${API_BASE}/views`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbType: connection.type, host: connection.host, port: connection.port, user: connection.user, password: connection.password, database: connection.database }),
      });
      const data = await res.json();
      if (data.success) set({ views: data.views.map((v: any) => v.name || v.TABLE_NAME) });
    } catch (e) { console.error('加载视图失败:', e); }
  },

  loadTriggers: async () => {
    const { connection } = get();
    if (!connection || (connection.type !== 'mysql' && connection.type !== 'postgresql')) return;
    try {
      const res = await fetch(`${API_BASE}/triggers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbType: connection.type, host: connection.host, port: connection.port, user: connection.user, password: connection.password, database: connection.database }),
      });
      const data = await res.json();
      if (data.success) set({ triggers: data.triggers.map((t: any) => t.name || t.TRIGGER_NAME) });
    } catch (e) { console.error('加载触发器失败:', e); }
  },

  closeDatabase: () => {
    if (get().connection?.type === 'sqlite') db.closeDatabase();
    saveConnection(null);
    set({ connection: null, tables: [], selectedTable: null, tableColumns: [], tableIndexes: [], tableRowCount: 0, views: [], triggers: [] });
  },

  selectTable: async (tableName: string) => {
    const { connection } = get();
    set({ selectedTable: tableName, isLoading: true });
    if (connection?.type === 'mysql') {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/schema`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dbType: connection.type, host: connection.host, port: connection.port, user: connection.user, password: connection.password, database: connection.database, table: tableName }),
        });
        const data = await res.json();
        if (data.success) {
          const columns: ColumnInfo[] = data.columns.map((c: any) => ({ name: c.COLUMN_NAME, type: c.COLUMN_TYPE, notnull: c.IS_NULLABLE === 'NO', pk: c.COLUMN_KEY === 'PRI', dfltValue: c.COLUMN_DEFAULT, comment: c.COLUMN_COMMENT }));
          const indexes: IndexInfo[] = [];
          const indexMap = new Map();
          data.indexes.forEach((idx: any) => {
            if (!indexMap.has(idx.Key_name)) indexMap.set(idx.Key_name, { name: idx.Key_name, unique: !idx.Non_unique, columns: [] });
            indexMap.get(idx.Key_name).columns.push(idx.Column_name);
          });
          indexMap.forEach(v => indexes.push(v));
          set({ tableColumns: columns, tableIndexes: indexes, tableRowCount: get().tables.find(t => t.name === tableName)?.rowCount || 0, isLoading: false });
        } else { set({ isLoading: false }); }
      } catch { set({ isLoading: false }); }
    } else {
      const info = db.getTableInfo(tableName);
      set({ tableColumns: info.columns, tableIndexes: db.getIndexes(tableName), tableRowCount: info.rowCount, isLoading: false });
    }
  },
}));
