// 数据库连接请求
export interface ConnectRequest {
  dbType?: 'mysql' | 'postgresql' | 'sqlite';
  type?: 'mysql' | 'postgresql' | 'sqlite';
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  path?: string;
  ssh?: SSHConfig;
}

export interface SSHConfig {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}

export interface TableRequest {
  dbType?: 'mysql' | 'postgresql';
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  table?: string;
  ssh?: SSHConfig;
}

export interface SchemaRequest extends TableRequest {}

export interface QueryRequest extends TableRequest {
  sql: string;
}

export interface ExportRequest extends TableRequest {
  tables?: string[];
  format?: 'sql' | 'json' | 'csv';
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  [key: string]: any;
}
