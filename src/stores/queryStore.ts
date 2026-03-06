import { create } from 'zustand';
import type { QueryResult } from '../types/database';
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

interface QueryState {
  query: string;
  queryHistory: string[];
  queryResult: QueryResult | null;
  isExecuting: boolean;
  queryError: string | null;
  setQuery: (query: string) => void;
  executeQuery: (sql?: string, connection?: any) => Promise<void>;
  clearResult: () => void;
  clearHistory: () => void;
}

export const useQueryStore = create<QueryState>((set, get) => ({
  query: 'SELECT * FROM ',
  queryHistory: [],
  queryResult: null,
  isExecuting: false,
  queryError: null,

  setQuery: (query: string) => set({ query }),

  executeQuery: async (sql?: string, connection?: any) => {
    const queryToExecute = sql || get().query;
    if (!queryToExecute.trim()) return;
    const conn = connection;
    set({ isExecuting: true, queryError: null });
    try {
      let result: QueryResult;
      if (conn?.type === 'mysql' || conn?.type === 'postgresql') {
        const res = await fetchWithTimeout(`${API_BASE}/query`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dbType: conn.type, host: conn.host, port: conn.port, user: conn.user, password: conn.password, database: conn.database, sql: queryToExecute }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        const columns = data.fields?.map((f: any) => f.name) || [];
        const isSelect = queryToExecute.trim().toUpperCase().startsWith('SELECT');
        result = { columns, rows: data.rows || [], rowCount: data.rows?.length || 0, executionTime: 0, isSelect };
      } else {
        result = db.executeQuery(queryToExecute);
      }
      const history = get().queryHistory;
      const newHistory = [queryToExecute, ...history.filter(q => q !== queryToExecute)].slice(0, 50);
      set({ queryResult: result, isExecuting: false, queryHistory: newHistory });
    } catch (error) {
      set({ queryError: (error as Error).message, isExecuting: false, queryResult: null });
    }
  },

  clearResult: () => set({ queryResult: null, queryError: null }),
  clearHistory: () => set({ queryHistory: [] }),
}));
