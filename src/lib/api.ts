import type { DatabaseConnection, QueryResult, TableInfo, ColumnInfo, IndexInfo } from '../types/database';

const API_BASE = '/api';
const DEFAULT_TIMEOUT = 30000;

/**
 * 统一错误处理
 */
export class ApiError extends Error {
  status?: number;
  code?: string;
  
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * 带超时的 fetch 封装
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    
    if (!response.ok) {
      console.error(`[API] HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    clearTimeout(id);
    if ((error as Error).name === 'AbortError') {
      throw new ApiError('请求超时，请检查网络连接', 408, 'TIMEOUT');
    }
    throw error;
  }
}

/**
 * 统一请求处理
 */
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
  timeout?: number
): Promise<T> {
  const response = await fetchWithTimeout(
    `${API_BASE}${endpoint}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    },
    timeout
  );
  
  const data = await response.json();
  
  if (!data.success) {
    throw new ApiError(data.message || '请求失败', response.status, data.code);
  }
  
  return data;
}

// ==================== 连接管理 ====================

/**
 * 建立数据库连接
 */
export async function connectToDatabase(conn: Omit<DatabaseConnection, 'id' | 'isConnected'> & { type: 'mysql' | 'postgresql' | 'sqlite' }): Promise<{ success: boolean; message?: string }> {
  if (conn.type === 'sqlite') {
    return { success: true };
  }
  
  return request('/connect', {
    method: 'POST',
    body: JSON.stringify(conn),
  });
}

/**
 * 断开数据库连接
 */
export async function disconnectDatabase(): Promise<void> {
  // SQLite 不需要特殊处理
}

/**
 * 测试数据库连接
 */
export async function testConnection(conn: Omit<DatabaseConnection, 'id' | 'isConnected'> & { type: 'mysql' | 'postgresql' | 'sqlite' }): Promise<{ success: boolean; message?: string }> {
  if (conn.type === 'sqlite') {
    return { success: true };
  }
  
  return request('/test', {
    method: 'POST',
    body: JSON.stringify(conn),
  });
}

// ==================== 表结构操作 ====================

/**
 * 获取数据库表列表
 */
export async function getTables(conn: DatabaseConnection): Promise<TableInfo[]> {
  if (conn.type === 'sqlite') {
    return [];
  }
  
  const data = await request('/tables', {
    method: 'POST',
    body: JSON.stringify(conn),
  });
  
  return data.tables || [];
}

/**
 * 获取表结构信息
 */
export async function getTableSchema(conn: DatabaseConnection, tableName: string): Promise<{
  columns: ColumnInfo[];
  indexes: IndexInfo[];
}> {
  if (conn.type === 'sqlite') {
    return { columns: [], indexes: [] };
  }
  
  const data = await request('/schema', {
    method: 'POST',
    body: JSON.stringify({ ...conn, table: tableName }),
  });
  
  return {
    columns: data.columns || [],
    indexes: data.indexes || [],
  };
}

/**
 * 获取表行数
 */
export async function getTableRowCount(conn: DatabaseConnection, tableName: string): Promise<number> {
  if (conn.type === 'sqlite') {
    return 0;
  }
  
  const data = await request('/count', {
    method: 'POST',
    body: JSON.stringify({ ...conn, table: tableName }),
  });
  
  return data.count || 0;
}

/**
 * 创建表
 */
export async function createTable(conn: DatabaseConnection, sql: string): Promise<{ success: boolean }> {
  if (conn.type === 'sqlite') {
    return { success: true };
  }
  
  return request('/execute', {
    method: 'POST',
    body: JSON.stringify({ ...conn, sql }),
  });
}

/**
 * 删除表
 */
export async function dropTable(conn: DatabaseConnection, tableName: string): Promise<{ success: boolean }> {
  return request('/execute', {
    method: 'POST',
    body: JSON.stringify({ ...conn, sql: `DROP TABLE \`${tableName}\`` }),
  });
}

/**
 * 重命名表
 */
export async function renameTable(conn: DatabaseConnection, oldName: string, newName: string): Promise<{ success: boolean }> {
  return request('/execute', {
    method: 'POST',
    body: JSON.stringify({ ...conn, sql: `RENAME TABLE \`${oldName}\` TO \`${newName}\`` }),
  });
}

/**
 * 修改表结构 (ALTER TABLE)
 */
export async function alterTable(conn: DatabaseConnection, sql: string): Promise<{ success: boolean }> {
  return request('/execute', {
    method: 'POST',
    body: JSON.stringify({ ...conn, sql }),
  });
}

// ==================== 索引操作 ====================

/**
 * 创建索引
 */
export async function createIndex(conn: DatabaseConnection, tableName: string, indexName: string, columns: string[], unique: boolean = false): Promise<{ success: boolean }> {
  const uniqueStr = unique ? 'UNIQUE ' : '';
  const columnsStr = columns.map(c => `\`${c}\``).join(', ');
  const sql = `CREATE ${uniqueStr}INDEX \`${indexName}\` ON \`${tableName}\` (${columnsStr})`;
  
  return request('/execute', {
    method: 'POST',
    body: JSON.stringify({ ...conn, sql }),
  });
}

/**
 * 删除索引
 */
export async function dropIndex(conn: DatabaseConnection, indexName: string): Promise<{ success: boolean }> {
  return request('/execute', {
    method: 'POST',
    body: JSON.stringify({ ...conn, sql: `DROP INDEX \`${indexName}\`` }),
  });
}

// ==================== 视图操作 ====================

/**
 * 获取视图列表
 */
export async function getViews(conn: DatabaseConnection): Promise<any[]> {
  if (conn.type === 'sqlite') {
    return [];
  }
  
  const data = await request('/views', {
    method: 'POST',
    body: JSON.stringify(conn),
  });
  
  return data.views || [];
}

/**
 * 创建视图
 */
export async function createView(conn: DatabaseConnection, viewName: string, sql: string): Promise<{ success: boolean }> {
  return request('/execute', {
    method: 'POST',
    body: JSON.stringify({ ...conn, sql: `CREATE VIEW \`${viewName}\` AS ${sql}` }),
  });
}

/**
 * 删除视图
 */
export async function dropView(conn: DatabaseConnection, viewName: string): Promise<{ success: boolean }> {
  return request('/execute', {
    method: 'POST',
    body: JSON.stringify({ ...conn, sql: `DROP VIEW \`${viewName}\`` }),
  });
}

// ==================== 触发器操作 ====================

/**
 * 获取触发器列表
 */
export async function getTriggers(conn: DatabaseConnection): Promise<any[]> {
  if (conn.type === 'sqlite') {
    return [];
  }
  
  const data = await request('/triggers', {
    method: 'POST',
    body: JSON.stringify(conn),
  });
  
  return data.triggers || [];
}

/**
 * 创建触发器
 */
export async function createTrigger(conn: DatabaseConnection, sql: string): Promise<{ success: boolean }> {
  return request('/execute', {
    method: 'POST',
    body: JSON.stringify({ ...conn, sql }),
  });
}

/**
 * 删除触发器
 */
export async function dropTrigger(conn: DatabaseConnection, triggerName: string): Promise<{ success: boolean }> {
  return request('/execute', {
    method: 'POST',
    body: JSON.stringify({ ...conn, sql: `DROP TRIGGER \`${triggerName}\`` }),
  });
}

// ==================== 查询执行 ====================

/**
 * 执行 SQL 查询
 */
export async function executeQuery(conn: DatabaseConnection, sql: string): Promise<QueryResult> {
  const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
  
  if (conn.type === 'sqlite') {
    // SQLite 在前端执行
    const { executeQuery } = await import('../lib/database');
    return executeQuery(sql);
  }
  
  const data = await request('/query', {
    method: 'POST',
    body: JSON.stringify({ ...conn, sql }),
  });
  
  const columns = data.fields?.map((f: any) => f.name) || [];
  
  return {
    columns,
    rows: data.rows || [],
    rowCount: data.rows?.length || 0,
    executionTime: data.executionTime || 0,
    isSelect,
    affectedRows: data.affectedRows,
  };
}

/**
 * 执行更新/删除操作
 */
export async function executeUpdate(conn: DatabaseConnection, sql: string): Promise<number> {
  if (conn.type === 'sqlite') {
    const result = await import('../lib/database').then(db => db.executeQuery(sql));
    return result.affectedRows || 0;
  }
  
  const data = await request('/execute', {
    method: 'POST',
    body: JSON.stringify({ ...conn, sql }),
  });
  
  return data.affectedRows || 0;
}

// ==================== 数据导出/导入 ====================

/**
 * 导出数据库
 */
export async function exportDatabase(conn: DatabaseConnection, options: {
  tables?: string[];
  format: 'sql' | 'json' | 'csv';
}): Promise<Blob> {
  const data = await request('/export', {
    method: 'POST',
    body: JSON.stringify({ ...conn, ...options }),
  });
  
  return new Blob([data.content], { type: 'text/plain' });
}

// ==================== 工具函数 ====================

/**
 * SQL 格式化
 */
export function formatSQL(sql: string): string {
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY',
    'HAVING', 'LIMIT', 'OFFSET', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
    'INNER JOIN', 'OUTER JOIN', 'ON', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET',
    'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
    'CREATE INDEX', 'DROP INDEX', 'PRIMARY KEY', 'FOREIGN KEY',
    'NOT NULL', 'DEFAULT', 'UNIQUE', 'AUTO_INCREMENT',
    'IF NOT EXISTS', 'IF EXISTS'
  ];
  
  let formatted = sql;
  
  // 大写关键字
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    formatted = formatted.replace(regex, keyword);
  });
  
  // 换行处理
  const lineBreaks = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 
                      'HAVING', 'LIMIT', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
                      'INNER JOIN', 'SET', 'VALUES'];
  
  lineBreaks.forEach(keyword => {
    const regex = new RegExp(`\\s+(${keyword})\\s+`, 'gi');
    formatted = formatted.replace(regex, `\n$1 `);
  });
  
  return formatted.trim();
}

/**
 * 生成随机 ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * 深度克隆对象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 导出所有函数
export default {
  connectToDatabase,
  disconnectDatabase,
  testConnection,
  getTables,
  getTableSchema,
  getTableRowCount,
  createTable,
  dropTable,
  renameTable,
  alterTable,
  createIndex,
  dropIndex,
  getViews,
  createView,
  dropView,
  getTriggers,
  createTrigger,
  dropTrigger,
  executeQuery,
  executeUpdate,
  exportDatabase,
  formatSQL,
  generateId,
  deepClone,
  debounce,
  throttle,
  ApiError,
};
