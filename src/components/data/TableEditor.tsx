import { useState } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';

export function TableEditor() {
  const { connection, tableColumns, selectedTable, executeQuery } = useDatabaseStore();
  const [editingCell, setEditingCell] = useState<{row: number; col: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  if (!connection || !selectedTable || tableColumns.length === 0) {
    return null;
  }

  const primaryKey = tableColumns.find(c => c.pk);

  const handleSave = async () => {
    if (!editingCell || !primaryKey) return;
    
    const { col } = editingCell;
    // 获取该行的主键值（需要从查询结果中获取，这里简化处理）
    setSaving(true);
    
    // 生成 UPDATE 语句
    const sql = `UPDATE \`${selectedTable}\` SET \`${col}\` = ${editValue === '' ? 'NULL' : `'${editValue}'`} WHERE \`${primaryKey.name}\` = ?`;
    
    await executeQuery(sql);
    setSaving(false);
    setEditingCell(null);
  };

  return (
    <div className="p-2 bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--text-muted)]">
          表数据编辑（点击单元格修改，仅支持有主键的表）
        </span>
        {editingCell && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditingCell(null)}
              className="px-2 py-1 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)] rounded"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        )}
      </div>
      
      {editingCell && (
        <div className="mb-2 p-2 bg-[var(--bg-primary)] rounded">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-sm"
            placeholder="输入新值（空为 NULL）"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}