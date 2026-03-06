export interface DatabaseConnection {
  id: string;
  name: string;
  path: string;
  isConnected: boolean;
}

export interface TableInfo {
  name: string;
  rowCount: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  notnull: boolean;
  pk: boolean;
  dfltValue: string | null;
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