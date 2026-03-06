import { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { autocompletion } from '@codemirror/autocomplete';
import { sql, SQLite, MySQL } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { useDatabaseStore } from '../../stores/databaseStore';
import { QueryHistory } from './QueryHistory';
import { formatSQL } from '../../lib/sqlFormatter';

interface QueryEditorProps {
  initialSql?: string;
  tabId?: string;
}

export function QueryEditor({ initialSql, tabId }: QueryEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [localQuery, setLocalQuery] = useState(initialSql || '');
  
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

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current) return;

    const executeKeymap = keymap.of([
      {
        key: 'Ctrl-Enter',
        mac: 'Cmd-Enter',
        run: () => {
          executeQuery();
          return true;
        }
      }
    ]);

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
        executeKeymap,
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
          <button
            onClick={() => setQuery(formatSQL(query))}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
            title="格式化 SQL"
          >
            格式化
          </button>
          <span className="text-xs text-gray-500">Ctrl+Enter 运行</span>
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