import { useState, useEffect, useRef } from 'react';

interface EditableCellProps {
  value: unknown;
  column: string;
  rowIndex: number;
  onSave: (column: string, rowIndex: number, newValue: unknown) => void;
  onCancel: () => void;
}

export function EditableCell({ value, column, rowIndex, onSave, onCancel }: EditableCellProps) {
  const [editValue, setEditValue] = useState(value === null ? '' : String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(column, rowIndex, editValue);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={() => onSave(column, rowIndex, editValue)}
      onKeyDown={handleKeyDown}
      className="w-full px-2 py-1 bg-blue-600 text-white border-none outline-none font-mono text-sm"
    />
  );
}

export interface EditedRow {
  rowIndex: number;
  column: string;
  originalValue: unknown;
  newValue: unknown;
}

export interface DataEditorProps {
  columns: string[];
  rows: Record<string, unknown>[];
  onSaveChanges: (updates: EditedRow[], deletedRows: number[], newRows?: Record<string, unknown>[]) => Promise<void>;
  onRefresh: () => void;
}

export function DataEditor({ columns, rows, onSaveChanges, onRefresh }: DataEditorProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editedValues, setEditedValues] = useState<Map<string, unknown>>(new Map());
  const [newRows, setNewRows] = useState<Record<string, unknown>[]>([]); // New empty rows
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const toggleRowSelection = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map((_, i) => i)));
    }
  };

  const handleCellDoubleClick = (rowIndex: number, column: string) => {
    setEditingCell({ row: rowIndex, col: column });
  };

  const handleCellSave = (column: string, rowIndex: number, newValue: any) => {
    const key = `${rowIndex}-${column}`;
    const originalValue = rows[rowIndex][column];
    
    if (newValue !== originalValue) {
      setEditedValues(prev => {
        const newMap = new Map(prev);
        newMap.set(key, newValue);
        return newMap;
      });
      setHasChanges(true);
    }
    
    setEditingCell(null);
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return;
    
    const rowIndices = Array.from(selectedRows);
    if (!confirm(`确定要删除选中的 ${rowIndices.length} 行吗？此操作不可恢复！`)) {
      return;
    }

    setIsSaving(true);
    try {
      await onSaveChanges([], rowIndices);
      setSelectedRows(new Set());
      setHasChanges(false);
      onRefresh();
    } catch (error) {
      alert(`删除失败: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRow = () => {
    // Add a new empty row that can be edited
    const emptyRow: Record<string, any> = {};
    columns.forEach(col => {
      emptyRow[col] = null; // null for new rows
    });
    setNewRows(prev => [...prev, emptyRow]);
    setHasChanges(true);
  };

  const handleNewRowChange = (rowIndex: number, column: string, value: unknown) => {
    setNewRows(prev => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], [column]: value };
      return updated;
    });
    setHasChanges(true);
  };

  const handleDeleteNewRow = (rowIndex: number) => {
    setNewRows(prev => prev.filter((_, i) => i !== rowIndex));
    if (newRows.length === 1) {
      setHasChanges(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      const updates: EditedRow[] = [];
      editedValues.forEach((newValue, key) => {
        const [rowIndex, column] = key.split('-');
        const rowIdx = parseInt(rowIndex);
        const originalValue = rows[rowIdx][column];
        updates.push({
          rowIndex: rowIdx,
          column,
          originalValue,
          newValue,
        });
      });

      await onSaveChanges(updates, [], newRows);
      setEditedValues(new Map());
      setNewRows([]);
      setHasChanges(false);
      onRefresh();
    } catch (error) {
      alert(`保存失败: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (confirm('确定要放弃所有未保存的更改吗？')) {
      setEditedValues(new Map());
      setHasChanges(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-2 border-b border-[var(--border-color)] flex items-center gap-2 bg-[var(--bg-secondary)]">
        <button
          onClick={handleAddRow}
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1"
        >
          <span>+</span> 添加行
        </button>
        
        <button
          onClick={handleDeleteSelected}
          disabled={selectedRows.size === 0 || isSaving}
          className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed text-white rounded flex items-center gap-1"
        >
          <span>🗑</span> 删除选中 ({selectedRows.size})
        </button>

        <div className="flex-1" />

        {hasChanges && (
          <>
            <button
              onClick={handleDiscardChanges}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm bg-[var(--bg-tertiary)] hover:bg-gray-500 text-white rounded"
            >
              放弃更改
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 disabled:bg-[var(--bg-tertiary)] text-white rounded flex items-center gap-1"
            >
              {isSaving ? '保存中...' : '💾 保存更改'}
            </button>
          </>
        )}
      </div>

      {/* Table with selection and inline editing */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-tertiary)] sticky top-0">
            <tr>
              <th className="px-2 py-2 text-center border-b border-[var(--border-color)] w-10">
                <input
                  type="checkbox"
                  checked={selectedRows.size === rows.length && rows.length > 0}
                  onChange={toggleAllRows}
                  className="w-4 h-4"
                />
              </th>
              <th className="px-2 py-2 text-left text-[var(--text-secondary)] font-medium border-b border-[var(--border-color)] w-12">#</th>
              {columns.map(col => (
                <th 
                  key={col} 
                  className="px-3 py-2 text-left text-[var(--text-secondary)] font-medium border-b border-[var(--border-color)] font-mono"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* New rows */}
            {newRows.map((newRow, rowIndex) => (
              <tr 
                key={`new-${rowIndex}`} 
                className="hover:bg-green-900/20 border-b border-[var(--border-color)]/50 bg-green-900/10"
              >
                <td className="px-2 py-1 text-center">
                  <button
                    onClick={() => handleDeleteNewRow(rowIndex)}
                    className="text-red-400 hover:text-red-300"
                    title="删除此行"
                  >
                    ×
                  </button>
                </td>
                <td className="px-2 py-1 text-green-400 text-xs">新行</td>
                {columns.map(col => (
                  <td 
                    key={col} 
                    className="px-3 py-1"
                  >
                    <input
                      type="text"
                      value={String(newRow[col] ?? '')}
                      onChange={(e) => handleNewRowChange(rowIndex, col, e.target.value || null)}
                      className="w-full px-2 py-1 bg-green-900/30 text-green-300 border border-green-700 rounded font-mono text-sm focus:outline-none focus:border-green-500"
                      placeholder="NULL"
                    />
                  </td>
                ))}
              </tr>
            ))}
            {/* Existing rows */}
            {rows.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={`hover:bg-[var(--bg-secondary)] border-b border-[var(--border-color)]/50 ${
                  selectedRows.has(rowIndex) ? 'bg-blue-900/30' : ''
                }`}
              >
                <td className="px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(rowIndex)}
                    onChange={() => toggleRowSelection(rowIndex)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="px-2 py-1 text-[var(--text-muted)] text-xs">{rowIndex + 1}</td>
                {columns.map(col => {
                  const key = `${rowIndex}-${col}`;
                  const isEditing = editingCell?.row === rowIndex && editingCell?.col === col;
                  const displayValue = editedValues.has(key) ? editedValues.get(key) : row[col];
                  
                  return (
                    <td 
                      key={col} 
                      className="px-3 py-1 text-[var(--text-secondary)] font-mono max-w-xs truncate"
                      onDoubleClick={() => handleCellDoubleClick(rowIndex, col)}
                    >
                      {isEditing ? (
                        <EditableCell
                          value={row[col]}
                          column={col}
                          rowIndex={rowIndex}
                          onSave={(newValue) => handleCellSave(col, rowIndex, newValue)}
                          onCancel={() => setEditingCell(null)}
                        />
                      ) : (
                        <span className={editedValues.has(key) ? 'text-yellow-400' : ''}>
                          {displayValue === null ? (
                            <span className="text-[var(--text-muted)] italic">NULL</span>
                          ) : (
                            String(displayValue)
                          )}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
