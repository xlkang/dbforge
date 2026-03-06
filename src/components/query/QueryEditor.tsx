import { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, type KeyBinding } from '@codemirror/view';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { sql, SQLite, MySQL } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
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
  { label: 'HAVING', detail: '分组筛选', sql: 'SELECT category, COUNT(*) as count FROM table_name GROUP BY category HAVING COUNT(*) > 1' },
  { label: 'ORDER BY', detail: '排序查询', sql: 'SELECT * FROM table_name ORDER BY created_at DESC' },
  { label: 'LIMIT', detail: '限制结果', sql: 'SELECT * FROM table_name LIMIT 100 OFFSET 0' },
  { label: 'LIKE', detail: '模糊查询', sql: "SELECT * FROM table_name WHERE name LIKE '%keyword%'" },
  { label: 'IN', detail: 'IN 查询', sql: 'SELECT * FROM table_name WHERE id IN (1, 2, 3)' },
  { label: 'BETWEEN', detail: '范围查询', sql: 'SELECT * FROM table_name WHERE created_at BETWEEN "2024-01-01" AND "2024-12-31"' },
  { label: 'CASE', detail: '条件表达式', sql: 'SELECT *, CASE WHEN status = 1 THEN "active" ELSE "inactive" END as status_text FROM table_name' },
  { label: 'UNION', detail: '合并结果', sql: 'SELECT * FROM table_a\nUNION ALL\nSELECT * FROM table_b' },
  { label: 'SUBQUERY', detail: '子查询', sql: 'SELECT * FROM table_name WHERE id IN (SELECT parent_id FROM other_table)' },
];

export function QueryEditor({ initialSql, tabId }: QueryEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [localQuery, setLocalQuery] = useState(initialSql || '');
  const [showTemplates, setShowTemplates] = useState(false);
  
  const globalQuery = useDatabaseStore((s) => s.query);
  const globalSetQuery = useDatabaseStore((s) => s.setQuery);
  const { executeQuery, connection, isExecuting, tableColumns, tables } = useDatabaseStore();

  // Use local state for tabbed editors, global state for legacy
  const query = tabId ? localQuery : globalQuery;
  const setQuery = tabId ? setLocalQuery : globalSetQuery;

  // Build schema from current database tables (CodeMirror format)
  const getSchema = () => {
    const schema: Record<string, string[]> = {};
    
    // Add tables with their columns
    tables.forEach(table => {
      const fields = tableColumns
        .filter(col => (col as any).table === table.name || col.name)
        .map(col => col.name);
      
      schema[table.name] = fields;
    });

    return schema;
  };

  // Custom SQL dialect based on connection type
  const getDialect = () => {
    if (connection?.type === 'mysql') {
      return MySQL;
    }
    return SQLite;
  };

  // Insert SQL template at cursor
  const insertTemplate = (template: string) => {
    const view = viewRef.current;
    if (!view) return;
    
    const pos = view.state.selection.main.head;
    view.dispatch({
      changes: { from: pos, insert: template },
      selection: { anchor: pos + template.length }
    });
    view.focus();
    setShowTemplates(false);
  };

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current) return;

    // Custom keybindings
    const customKeymap: KeyBinding[] = [
      {
        key: 'Ctrl-Enter',
        mac: 'Cmd-Enter',
        run: () => {
          executeQuery();
          return true;
        }
      },
      {
        key: 'Ctrl-Shift-F',
        mac: 'Cmd-Shift-F',
        run: () => {
          const view = viewRef.current;
          if (!view) return false;
          const currentQuery = view.state.doc.toString();
          const formatted = formatSQL(currentQuery);
          view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: formatted }
          });
          return true;
        }
      },
      {
        key: 'Ctrl-Space',
        mac: 'Cmd-Space',
        run: () => {
          setShowTemplates(true);
          return true;
        }
      }
    ];

    const state = EditorState.create({
      doc: query,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        historyKeymap,
        sql({ 
          dialect: getDialect(),
          schema: getSchema() as any,
          defaultTable: tables[0]?.name
        }),
        oneDark,
        autocompletion({
          defaultKeymap: true,
          activateOnTyping: true,
          maxRenderedOptions: 20,
        }),
        keymap.of([...customKeymap, ...completionKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setQuery(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-content': { fontFamily: 'monospace', fontSize: '14px' },
          '.cm-tooltip-autocomplete': {
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
          },
          '.cm-completionLabel': { color: '#d1d5db' },
          '.cm-completionMatchedText': { color: '#60a5fa', textDecoration: 'none' },
          '.cm-tooltip.cm-completionInfo': {
            backgroundColor: '#111827',
            borderLeft: '1px solid #374151',
            color: '#9ca3af',
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
  }, []); // Empty deps - only init once

  // Update editor content when query changes externally
  useEffect(() => {
    const view = viewRef.current;
    if (view && view.state.doc.toString() !== query) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: query }
      });
    }
  }, [query]);

  // Focus editor when connection is established
  useEffect(() => {
    if (connection && viewRef.current) {
      viewRef.current.focus();
    }
  }, [connection]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-700 flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-gray-100">SQL 查询</h3>
        <div className="flex items-center gap-2">
          {/* Template Button */}
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
              title="SQL 模板 (Ctrl+Space)"
            >
              📝 模板
            </button>
            
            {/* Template Dropdown */}
            {showTemplates && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowTemplates(false)} 
                />
                <div className="absolute right-0 top-full mt-1 w-80 max-h-96 overflow-auto bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20">
                  <div className="p-2 border-b border-gray-700">
                    <input
                      type="text"
                      placeholder="搜索模板..."
                      className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                  </div>
                  <div className="p-1">
                    {SQL_TEMPLATES.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => insertTemplate(t.sql)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded flex flex-col"
                      >
                        <span className="text-gray-200 text-sm">{t.label}</span>
                        <span className="text-gray-500 text-xs">{t.detail}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setQuery(formatSQL(query))}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
            title="格式化 SQL (Ctrl+Shift+F)"
          >
            格式化
          </button>
          <span className="text-xs text-gray-500">Ctrl+Enter</span>
          <button
            onClick={() => executeQuery()}
            disabled={!connection || isExecuting}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
          >
            {isExecuting ? '执行中...' : '运行'}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <div 
          ref={editorRef} 
          className="flex-1 overflow-hidden"
        />
        <QueryHistory />
      </div>
    </div>
  );
}

// Simple history keymap without importing from @codemirror/commands
const historyKeymap = keymap.of([]);
