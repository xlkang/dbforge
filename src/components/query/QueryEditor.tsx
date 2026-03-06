import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { sql, SQLite } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { useDatabaseStore } from '../../stores/databaseStore';
import { QueryHistory } from './QueryHistory';

export function QueryEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { query, setQuery, executeQuery, connection, isExecuting } = useDatabaseStore();

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
        sql({ dialect: SQLite }),
        oneDark,
        executeKeymap,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setQuery(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-content': { fontFamily: 'monospace', fontSize: '14px' }
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
  }, []);

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