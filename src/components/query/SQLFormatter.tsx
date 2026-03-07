import { useState } from 'react';
import { Wand2, X, Copy, Check } from 'lucide-react';

interface SQLFormatterProps {
  isOpen: boolean;
  onClose: () => void;
  initialSQL?: string;
}

export function SQLFormatter({ isOpen, onClose, initialSQL = '' }: SQLFormatterProps) {
  const [input, setInput] = useState(initialSQL);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [uppercase, setUppercase] = useState(true);
  const [indentSize, setIndentSize] = useState(2);

  const formatSQL = (sql: string): string => {
    if (!sql.trim()) return '';
    
    let formatted = sql;
    
    // 关键字大写化
    if (uppercase) {
      const keywords = [
        'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
        'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'ON', 'AS', 'ORDER',
        'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT', 'INTO', 'VALUES',
        'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'INDEX', 'VIEW', 'DROP',
        'ALTER', 'ADD', 'COLUMN', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
        'UNIQUE', 'DEFAULT', 'NULL', 'NOT', 'EXISTS', 'CASE', 'WHEN', 'THEN',
        'ELSE', 'END', 'UNION', 'ALL', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
        'ASC', 'DESC', 'IS', 'TRUE', 'FALSE', 'INTEGER', 'TEXT', 'REAL', 'BLOB'
      ];
      
      keywords.forEach(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        formatted = formatted.replace(regex, kw);
      });
    }
    
    // 缩进
    const indent = ' '.repeat(indentSize);
    const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 
                      'HAVING', 'LIMIT', 'OFFSET', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
                      'INNER JOIN', 'OUTER JOIN', 'SET', 'VALUES', 'ON'];
    
    keywords.forEach(kw => {
      const regex = new RegExp(`\\s+${kw}\\s+`, 'gi');
      formatted = formatted.replace(regex, `\n${indent}${kw} `);
    });
    
    // 清理多余空格
    formatted = formatted.replace(/\n\s*\n/g, '\n').trim();
    
    return formatted;
  };

  const handleFormat = () => {
    const result = formatSQL(input);
    setOutput(result);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">SQL 格式化</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Options */}
        <div className="flex items-center gap-4 p-4 border-b border-[var(--border-color)]">
          <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="w-4 h-4 accent-[var(--accent)]"
            />
            关键字大写
          </label>
          
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <span>缩进:</span>
            <select
              value={indentSize}
              onChange={(e) => setIndentSize(Number(e.target.value))}
              className="px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
            >
              <option value={2}>2 空格</option>
              <option value={4}>4 空格</option>
              <option value={8}>8 空格</option>
            </select>
          </div>
          
          <button
            onClick={handleFormat}
            className="ml-auto px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
          >
            格式化
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 flex gap-4 p-4 min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            <label className="text-sm text-[var(--text-muted)] mb-2">输入 SQL</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="粘贴 SQL 语句..."
              className="flex-1 min-h-[200px] p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] font-mono resize-none focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-[var(--text-muted)]">格式化结果</label>
              <div className="flex gap-1">
                <button
                  onClick={handleClear}
                  className="p-1 hover:bg-[var(--bg-secondary)] rounded text-[var(--text-muted)]"
                  title="清空"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className="p-1 hover:bg-[var(--bg-secondary)] rounded text-[var(--text-muted)] disabled:opacity-50"
                  title="复制"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="格式化结果..."
              className="flex-1 min-h-[200px] p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] font-mono resize-none focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook
export function useSQLFormatter() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialSQL, setInitialSQL] = useState('');
  
  return {
    isOpen,
    setIsOpen,
    initialSQL,
    setInitialSQL,
    SQLFormatter: () => (
      <SQLFormatter isOpen={isOpen} onClose={() => setIsOpen(false)} initialSQL={initialSQL} />
    ),
    openFormatter: (sql?: string) => {
      setInitialSQL(sql || '');
      setIsOpen(true);
    },
  };
}
