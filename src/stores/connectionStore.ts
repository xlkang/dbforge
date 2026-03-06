import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MySQLConnection {
  id: string;
  type?: 'mysql' | 'postgresql' | 'sqlite';
  name: string;
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface SQLiteRecentFile {
  path: string;
  name: string;
  lastOpened: number;
}

interface ConnectionStore {
  savedConnections: MySQLConnection[];
  recentSQLiteFiles: SQLiteRecentFile[];
  addConnection: (conn: Omit<MySQLConnection, 'id'>) => void;
  removeConnection: (id: string) => void;
  updateConnection: (id: string, conn: Partial<MySQLConnection>) => void;
  addRecentSQLite: (path: string, name: string) => void;
  clearRecentSQLite: () => void;
}

let connectionCounter = 0;

// Simple encryption for passwords (not secure for production, but basic obfuscation)
const encrypt = (str: string) => btoa(str);
const decrypt = (str: string) => atob(str);

export const useConnectionStore = create<ConnectionStore>()(
  persist(
    (set) => ({
      savedConnections: [],
      recentSQLiteFiles: [],

      addConnection: (conn) => {
        const id = `conn-${++connectionCounter}`;
        const encrypted = {
          ...conn,
          password: encrypt(conn.password),
        };
        set((state) => ({
          savedConnections: [...state.savedConnections, { ...encrypted, id }],
        }));
      },

      removeConnection: (id) => {
        set((state) => ({
          savedConnections: state.savedConnections.filter((c) => c.id !== id),
        }));
      },

      updateConnection: (id, conn) => {
        set((state) => ({
          savedConnections: state.savedConnections.map((c) =>
            c.id === id
              ? {
                  ...c,
                  ...conn,
                  password: conn.password
                    ? encrypt(conn.password as string)
                    : c.password,
                }
              : c
          ),
        }));
      },

      addRecentSQLite: (path, name) => {
        set((state) => {
          const filtered = state.recentSQLiteFiles.filter((f) => f.path !== path);
          return {
            recentSQLiteFiles: [
              { path, name, lastOpened: Date.now() },
              ...filtered,
            ].slice(0, 5),
          };
        });
      },

      clearRecentSQLite: () => {
        set({ recentSQLiteFiles: [] });
      },
    }),
    {
      name: 'dbforge-connections',
      partialize: (state) => ({
        savedConnections: state.savedConnections.map((c) => ({
          ...c,
          password: decrypt(c.password),
        })),
        recentSQLiteFiles: state.recentSQLiteFiles,
      }),
    }
  )
);
