import initSqlJs, { Database } from 'sql.js';
import type { SqlJsStatic, SqlValue } from 'sql.js';
import type { ColumnInfo, IndexInfo, QueryResult } from '../types/database';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

export async function initSQL(): Promise<SqlJsStatic> {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    });
  }
  return SQL;
}

export async function openDatabase(file: File): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = await initSQL();
    
    const buffer = await file.arrayBuffer();
    db = new sql.Database(new Uint8Array(buffer));
    
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function openDatabaseFromPath(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = await initSQL();
    
    const response = await fetch(path);
    const buffer = await response.arrayBuffer();
    db = new sql.Database(new Uint8Array(buffer));
    
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export function getDatabase(): Database | null {
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function isConnected(): boolean {
  return db !== null;
}

export function getTables(): string[] {
  if (!db) return [];
  
  const result = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  
  if (result.length === 0) return [];
  return result[0].values.map(row => row[0] as string);
}

export function getTableInfo(tableName: string): { columns: ColumnInfo[]; rowCount: number } {
  if (!db) return { columns: [], rowCount: 0 };
  
  // Get columns
  const columnsResult = db.exec(`PRAGMA table_info("${tableName}")`);
  const columns: ColumnInfo[] = columnsResult.length > 0
    ? columnsResult[0].values.map((row: SqlValue[]) => ({
        name: row[1] as string,
        type: row[2] as string,
        notnull: row[3] === 1,
        pk: row[5] === 1,
        dfltValue: row[4] as string | null,
      }))
    : [];
  
  // Get row count
  const countResult = db.exec(`SELECT COUNT(*) FROM "${tableName}"`);
  const rowCount = countResult.length > 0 ? countResult[0].values[0][0] as number : 0;
  
  return { columns, rowCount };
}

export function getIndexes(tableName: string): IndexInfo[] {
  if (!db) return [];
  
  const result = db.exec(`PRAGMA index_list("${tableName}")`);
  
  if (result.length === 0) return [];
  
  return result[0].values.map((row: SqlValue[]) => {
    const indexName = row[1] as string;
    const indexInfoResult = db!.exec(`PRAGMA index_info("${indexName}")`);
    const columns = indexInfoResult.length > 0
      ? indexInfoResult[0].values.map((r: SqlValue[]) => r[2] as string)
      : [];
    
    return {
      name: indexName,
      unique: row[2] === 1,
      columns,
    };
  });
}

export function executeQuery(sql: string): QueryResult {
  if (!db) throw new Error('No database connected');
  
  const startTime = performance.now();
  
  const trimmedSql = sql.trim().toLowerCase();
  const isSelect = trimmedSql.startsWith('select') || trimmedSql.startsWith('pragma');
  
  if (isSelect) {
    const result = db.exec(sql);
    const endTime = performance.now();
    
    if (result.length === 0) {
      return { columns: [], rows: [], rowCount: 0, executionTime: endTime - startTime, isSelect: true };
    }
    
    const columns = result[0].columns;
    const rows = result[0].values.map((row: SqlValue[]) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col: string, i: number) => {
        obj[col] = row[i];
      });
      return obj;
    });
    
    return { 
      columns, 
      rows, 
      rowCount: rows.length,
      executionTime: endTime - startTime,
      isSelect: true,
    };
  } else {
    db.run(sql);
    const changes = db.getRowsModified();
    const endTime = performance.now();
    
    return { 
      columns: [], 
      rows: [], 
      rowCount: 0,
      affectedRows: changes,
      executionTime: endTime - startTime,
      isSelect: false,
    };
  }
}

export function insertRow(tableName: string, data: Record<string, unknown>): number {
  if (!db) throw new Error('No database connected');
  
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map(() => '?').join(', ');
  
  db.run(
    `INSERT INTO "${tableName}" (${columns.join(', ')}) VALUES (${placeholders})`,
    values as SqlValue[]
  );
  
  return db.getRowsModified();
}

export function updateRow(tableName: string, data: Record<string, unknown>, primaryKey: string, primaryKeyValue: unknown): number {
  if (!db) throw new Error('No database connected');
  
  const sets = Object.keys(data)
    .map(key => `"${key}" = ?`)
    .join(', ');
  const values = [...Object.values(data), primaryKeyValue] as SqlValue[];
  
  db.run(
    `UPDATE "${tableName}" SET ${sets} WHERE "${primaryKey}" = ?`,
    values
  );
  
  return db.getRowsModified();
}

export function deleteRow(tableName: string, primaryKey: string, primaryKeyValue: unknown): number {
  if (!db) throw new Error('No database connected');
  
  db.run(
    `DELETE FROM "${tableName}" WHERE "${primaryKey}" = ?`,
    [primaryKeyValue as SqlValue]
  );
  
  return db.getRowsModified();
}