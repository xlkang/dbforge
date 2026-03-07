import { useState } from 'react';
import { GitCompare, X, ArrowLeft, ArrowRight, AlertCircle, CheckCircle, Table2 } from 'lucide-react';
import { useDatabaseStore } from '../../stores/databaseStore';
import { useToastStore } from '../../stores/toastStore';

interface DiffResult {
  tableName: string;
  status: 'equal' | 'different' | 'only_in_left' | 'only_in_right';
  leftCount: number;
  rightCount: number;
  differences?: string[];
}

interface DataComparePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataComparePanel({ isOpen, onClose }: DataComparePanelProps) {
  const [leftTable, setLeftTable] = useState('');
  const [rightTable, setRightTable] = useState('');
  const [isComparing, setIsComparing] = useState(false);
  const [results, setResults] = useState<DiffResult[]>([]);
  const addToast = useToastStore((state) => state.addToast);
  
  const tables = useDatabaseStore((s) => s.tables);
  const executeQuery = useDatabaseStore((s) => s.executeQuery);

  const handleCompare = async () => {
    if (!leftTable || !rightTable) {
      addToast('请选择两个表进行比对', 'warning');
      return;
    }
    
    setIsComparing(true);
    setResults([]);
    
    try {
      // 直接调用 SQL 执行 (因为 executeQuery 不返回值)
      const connection = useDatabaseStore.getState().connection;
      
      // 模拟执行查询获取结果
      let leftNum = 0;
      let rightNum = 0;
      
      if (connection?.type === 'mysql') {
        await executeQuery(`SELECT COUNT(*) as count FROM "${leftTable}"`);
        await executeQuery(`SELECT COUNT(*) as count FROM "${rightTable}"`);
        const result = useDatabaseStore.getState().queryResult;
        leftNum = result?.rows?.[0]?.count as number || 0;
      } else {
        // SQLite 直接查询
        const { getTableInfo } = await import('../../lib/database');
        const leftInfo = getTableInfo(leftTable);
        const rightInfo = getTableInfo(rightTable);
        leftNum = leftInfo.rowCount || 0;
        rightNum = rightInfo.rowCount || 0;
      }
      
      // 简单比对：比较记录数
      const diffResult: DiffResult = {
        tableName: `${leftTable} vs ${rightTable}`,
        status: leftNum === rightNum ? 'equal' : 'different',
        leftCount: leftNum as number,
        rightCount: rightNum as number,
        differences: leftNum !== rightNum 
          ? [`左表: ${leftNum} 条, 右表: ${rightNum} 条, 差异: ${Math.abs((leftNum as number) - (rightNum as number))} 条`] 
          : undefined,
      };
      
      setResults([diffResult]);
      addToast('比对完成', 'success');
    } catch (error) {
      addToast('比对失败: ' + (error as Error).message, 'error');
    } finally {
      setIsComparing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">数据比对</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Table Selection */}
        <div className="p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm text-[var(--text-muted)] mb-1">左表 (源)</label>
              <select
                value={leftTable}
                onChange={(e) => setLeftTable(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)]"
              >
                <option value="">选择表...</option>
                {tables.map(t => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col items-center gap-2 mt-5">
              <ArrowLeft className="w-4 h-4 text-[var(--text-muted)]" />
              <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm text-[var(--text-muted)] mb-1">右表 (目标)</label>
              <select
                value={rightTable}
                onChange={(e) => setRightTable(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)]"
              >
                <option value="">选择表...</option>
                {tables.map(t => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleCompare}
              disabled={isComparing || !leftTable || !rightTable}
              className="mt-5 px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isComparing ? '比对中...' : '开始比对'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto p-4">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)]">
              <Table2 className="w-12 h-12 mb-2 opacity-30" />
              <p>选择两个表进行比对</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    result.status === 'equal' 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-yellow-500/10 border-yellow-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.status === 'equal' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                      )}
                      <span className="font-medium text-[var(--text-primary)]">
                        {result.tableName}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      result.status === 'equal' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {result.status === 'equal' ? '相同' : '不同'}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex gap-6 text-sm">
                    <div>
                      <span className="text-[var(--text-muted)]">左表记录:</span>
                      <span className="ml-2 text-[var(--text-primary)]">{result.leftCount}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">右表记录:</span>
                      <span className="ml-2 text-[var(--text-primary)]">{result.rightCount}</span>
                    </div>
                  </div>
                  
                  {result.differences && result.differences.length > 0 && (
                    <div className="mt-2 text-sm text-yellow-400">
                      {result.differences[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook for using data compare
export function useDataCompare() {
  const [isOpen, setIsOpen] = useState(false);
  
  return {
    isOpen,
    setIsOpen,
    DataComparePanel: () => (
      <DataComparePanel 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    ),
  };
}
