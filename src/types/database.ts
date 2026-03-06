export type DatabaseType = 'sqlite' | 'mysql';

export interface DatabaseConnection {
  id: string;
  type: DatabaseType;
  name: string;
  path?: string;        // SQLite 文件路径
  host?: string;        // MySQL 主机
  port?: number;        // MySQL 端口
  user?: string;        // MySQL 用户
  password?: string;    // MySQL 密码
  database?: string;    // MySQL 数据库名
  isConnected: boolean;
}

export interface TableInfo {
  name: string;
  comment?: string;
  rowCount: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  notnull: boolean;
  pk: boolean;
  dfltValue: string | null;
  comment?: string;
}

export interface IndexInfo {
  name: string;
  unique: boolean;
  columns: string[];
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  affectedRows?: number;
  executionTime: number;
  isSelect: boolean;
}

export interface QueryError {
  message: string;
  code?: string;
}

export type QueryResultData = QueryResult | QueryError;