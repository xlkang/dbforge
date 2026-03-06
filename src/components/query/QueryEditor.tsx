import { useEffect, useRef, useState } from 'react';
import { Play, Code, Wand2, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars } from '@codemirror/view';
import { autocompletion } from '@codemirror/autocomplete';
import { sql, SQLite, MySQL } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { linter, type Diagnostic } from '@codemirror/lint';
import { useDatabaseStore } from '../../stores/databaseStore';
import { QueryHistory } from './QueryHistory';
import { formatSQL } from '../../lib/sqlFormatter';

interface QueryEditorProps {
  initialSql?: string;
  tabId?: string;
}

// SQL 模板
const SQL_TEMPLATES = [
  { label: 'SELECT *', detail: '查询所有列', sql: 'SELECT * FROM table_name WHERE 1=1' },
  { label: 'SELECT COUNT', detail: '统计行数', sql: 'SELECT COUNT(*) FROM table_name' },
  { label: 'SELECT DISTINCT', detail: '去重查询', sql: 'SELECT DISTINCT column FROM table_name' },
  { label: 'INSERT', detail: '插入数据', sql: "INSERT INTO table_name (col1, col2) VALUES ('value1', 'value2')" },
  { label: 'UPDATE', detail: '更新数据', sql: "UPDATE table_name SET column = 'value' WHERE id = 1" },
  { label: 'DELETE', detail: '删除数据', sql: 'DELETE FROM table_name WHERE id = 1' },
  { label: 'CREATE TABLE', detail: '创建表', sql: 'CREATE TABLE table_name (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n)' },
  { label: 'ALTER TABLE', detail: '修改表结构', sql: 'ALTER TABLE table_name ADD COLUMN new_column TEXT' },
  { label: 'CREATE INDEX', detail: '创建索引', sql: 'CREATE INDEX idx_name ON table_name (column)' },
  { label: 'JOIN', detail: '表连接查询', sql: 'SELECT a.*, b.* FROM table_a a INNER JOIN table_b b ON a.id = b.a_id' },
  { label: 'GROUP BY', detail: '分组统计', sql: 'SELECT category, COUNT(*) as count FROM table_name GROUP BY category' },
  { label: 'ORDER BY', detail: '排序查询', sql: 'SELECT * FROM table_name ORDER BY created_at DESC' },
  { label: 'LIMIT', detail: '限制结果', sql: 'SELECT * FROM table_name LIMIT 100 OFFSET 0' },
  { label: 'LIKE', detail: '模糊查询', sql: "SELECT * FROM table_name WHERE name LIKE '%keyword%'" },
  { label: 'BETWEEN', detail: '范围查询', sql: 'SELECT * FROM table_name WHERE created_at BETWEEN "2024-01-01" AND "2024-12-31"' },
];

export function QueryEditor({ initialSql, tabId }: QueryEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [localQuery, setLocalQuery] = useState(initialSql || '');
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  
  const globalQuery = useDatabaseStore((s) => s.query);
  const globalSetQuery = useDatabaseStore((s) => s.setQuery);
  const { executeQuery, connection, isExecuting, tableColumns, tables } = useDatabaseStore();

  // Use local state for tabbed editors, global state for legacy
  const query = tabId ? localQuery : (globalQuery || localQuery);
  const setQuery = tabId ? setLocalQuery : globalSetQuery;

  const filteredTemplates = SQL_TEMPLATES.filter(t => 
    t.label.toLowerCase().includes(templateSearch.toLowerCase()) ||
    t.detail.toLowerCase().includes(templateSearch.toLowerCase())
  );

  const insertTemplate = (sql: string) => {
    setQuery(sql);
    setShowTemplates(false);
    viewRef.current?.focus();
  };

  const handleFormat = () => {
    const formatted = formatSQL(query);
    setQuery(formatted);
  };

  const handleExecute = () => {
    if (!tabId) {
      globalSetQuery(query);
    }
    executeQuery(tabId ? localQuery : query);
  };

  // CodeMirror setup
  useEffect(() => {
    if (!editorRef.current) return;

    const dialect = connection?.type === 'mysql' ? MySQL : SQLite;
    const schema = tables.reduce((acc, t) => {
      acc[t.name] = tableColumns.map(c => c.name);
      return acc;
    }, {} as Record<string, string[]>);

    const state = EditorState.create({
      doc: query,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        // SQL 语法检查器
        linter((view) => {
          const diagnostics: Diagnostic[] = [];
          const text = view.state.doc.toString();
          
          // 检查括号匹配
          const lines = text.split('\n');
          let parenCount = 0;
          let bracketCount = 0;
          
          lines.forEach((line, lineIndex) => {
            for (const char of line) {
              if (char === '(') parenCount++;
              if (char === ')') parenCount--;
              if (char === '[') bracketCount++;
              if (char === ']') bracketCount--;
            }
            
            // 检查不匹配的括号 (单行)
            const openParens = (line.match(/\(/g) || []).length;
            const closeParens = (line.match(/\)/g) || []).length;
            if (openParens !== closeParens) {
              const from = view.state.doc.line(lineIndex + 1).from;
              diagnostics.push({
                from,
                to: from + line.length,
                severity: 'error',
                message: `括号不匹配: ${openParens} 个开括号，${closeParens} 个闭括号`
              });
            }
          });
          
          // 检查未闭合的括号 (全局)
          if (parenCount !== 0) {
            diagnostics.push({
              from: view.state.doc.length - 1,
              to: view.state.doc.length,
              severity: 'warning',
              message: `有 ${Math.abs(parenCount)} 个括号未闭合`
            });
          }
          
          return diagnostics;
        }),
        autocompletion({
          override: [
            (context) => {
              const word = context.matchBefore(/\w*/);
              if (!word || (word.from === word.to && !context.explicit)) return null;
              return {
                from: word.from,
                options: Object.entries(schema).flatMap(([table, cols]) => [
                  { label: table, type: 'table', detail: '表' },
                  ...cols.map(col => ({ label: col, type: 'field', detail: table, apply: `\`${table}\`.\`${col}\`` }))
                ])
              };
            }
          ]
        }),
        sql({ dialect, schema }),
        oneDark,
        keymap.of([
          {
            key: 'Ctrl-Enter',
            run: () => { handleExecute(); return true; }
          },
          {
            key: 'Shift-Ctrl-f',
            run: () => { handleFormat(); return true; }
          }
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString();
            setQuery(newValue);
          }
        })
      ]
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [connection?.type]);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-800 flex items-center justify-between shrink-0 bg-[var(--bg-primary)]/50">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-[var(--accent)]" strokeWidth={2} />
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">SQL 编辑器</h3>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">Ctrl+Enter 运行</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Template Button */}
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-xs font-medium rounded-lg transition-colors border border-[var(--border-color)] hover:border-[var(--border-color)]"
              title="SQL 模板 (Ctrl+Space)"
            >
              <Wand2 className="w-3.5 h-3.5" strokeWidth={2} />
              模板
              {showTemplates ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            
            {/* Template Dropdown */}
            {showTemplates && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowTemplates(false)} 
                />
                <div className="absolute right-0 top-full mt-1.5 w-72 max-h-80 overflow-hidden bg-[var(--bg-primary)] border border-[var(--border-color)]/50 rounded-xl shadow-2xl z-20">
                  <div className="p-2 border-b border-gray-800">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={2} />
                      <input
                        type="text"
                        placeholder="搜索模板..."
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)] placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="p-1.5 max-h-56 overflow-auto">
                    {filteredTemplates.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => insertTemplate(t.sql)}
                        className="w-full text-left px-3 py-2 hover:bg-[var(--bg-secondary)] rounded-lg flex flex-col gap-0.5 transition-colors"
                      >
                        <span className="text-[var(--text-secondary)] text-sm font-medium">{t.label}</span>
                        <span className="text-[var(--text-muted)] text-xs">{t.detail}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleFormat}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-xs font-medium rounded-lg transition-colors border border-[var(--border-color)] hover:border-[var(--border-color)]"
            title="格式化 SQL (Shift+Ctrl+F)"
          >
            <Code className="w-3.5 h-3.5" strokeWidth={2} />
            格式化
          </button>

          <button
            onClick={handleExecute}
            disabled={!connection || isExecuting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-all shadow-lg shadow-blue-500/20"
          >
            {isExecuting ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" strokeWidth={2} />
            )}
            {isExecuting ? '执行中...' : '运行'}
          </button>
        </div>
      </div>
      
      {/* Editor */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div 
          ref={editorRef} 
          className="flex-1 overflow-hidden text-sm"
        />
        <QueryHistory />
      </div>
    </div>
  );
}
