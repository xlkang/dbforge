import { useState } from 'react';
import { DataViewer } from './DataViewer';
import { DataEditor } from './DataEditor';
import { useDatabaseStore } from '../../stores/databaseStore';

interface DataPanelProps {
  tableName?: string;
  mode?: 'view' | 'edit';
}

export function DataPanel({ tableName, mode = 'view' }: DataPanelProps) {
  const storeTableName = useDatabaseStore((s) => s.selectedTable);
  const displayTable = tableName || storeTableName;
  const { queryResult, executeUpdate, selectTable, loadTables, tableColumns } = useDatabaseStore();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaveChanges = async (updates: any[], deletedRows: number[], newRows?: any[]) => {
    const table = displayTable;
    
    if (!table || !queryResult) return;

    // Handle deletions first
    for (const rowIndex of deletedRows) {
      const row = queryResult.rows[rowIndex];
      const pkColumns = queryResult.columns.filter((_, idx) => {
        const info = tableColumns[idx];
        return info?.pk;
      });
      
      if (pkColumns.length > 0) {
        const whereParts = pkColumns.map(col => {
          const val = row[col];
          return val === null ? `\`${col}\` IS NULL` : `\`${col}\` = ${typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val}`;
        });
        await executeUpdate(`DELETE FROM \`${table}\` WHERE ${whereParts.join(' AND ')}`);
      } else {
        const whereParts = queryResult.columns.map(col => {
          const val = row[col];
          return val === null ? `\`${col}\` IS NULL` : `\`${col}\` = ${typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val}`;
        });
        await executeUpdate(`DELETE FROM \`${table}\` WHERE ${whereParts.join(' AND ')}`);
      }
    }

    // Handle updates
    for (const update of updates) {
      const { rowIndex, column, newValue } = update;
      const row = queryResult.rows[rowIndex];
      const pkColumns = queryResult.columns.filter((_, idx) => {
        const info = tableColumns[idx];
        return info?.pk;
      });

      let setValue = '';
      if (newValue === null || newValue === '') {
        setValue = `\`${column}\` = NULL`;
      } else if (typeof newValue === 'number') {
        setValue = `\`${column}\` = ${newValue}`;
      } else {
        setValue = `\`${column}\` = '${String(newValue).replace(/'/g, "''")}'`;
      }

      if (pkColumns.length > 0) {
        const whereParts = pkColumns.map(col => {
          const val = row[col];
          return val === null ? `\`${col}\` IS NULL` : `\`${col}\` = ${typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val}`;
        });
        await executeUpdate(`UPDATE \`${table}\` SET ${setValue} WHERE ${whereParts.join(' AND ')}`);
      }
    }

    // Handle new rows (INSERT)
    if (newRows && newRows.length > 0) {
      for (const newRow of newRows) {
        const columnsList = Object.keys(newRow);
        const valuesList = columnsList.map(col => {
          const val = newRow[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number') return val;
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        
        if (columnsList.length > 0) {
          const sql = `INSERT INTO \`${table}\` (\`${columnsList.join('`, `')}\`) VALUES (${valuesList.join(', ')})`;
          await executeUpdate(sql);
        }
      }
    }
  };

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    if (displayTable) {
      selectTable(displayTable);
    }
    loadTables();
  };

  if (!displayTable) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
        <div className="text-center">
          <p className="text-lg mb-2">请选择一个表</p>
          <p className="text-sm">在左侧表结构面板选择表查看数据</p>
        </div>
      </div>
    );
  }

  if (mode === 'edit') {
    return (
      <DataEditor
        key={refreshKey}
        columns={queryResult?.columns || []}
        rows={queryResult?.rows || []}
        onSaveChanges={handleSaveChanges}
        onRefresh={handleRefresh}
      />
    );
  }

  return <DataViewer key={refreshKey} tableName={tableName} />;
}
