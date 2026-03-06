import { useState } from 'react';

const SHORTCUTS = [
  { key: 'Ctrl + Enter', desc: '执行查询' },
  { key: 'Ctrl + S', desc: '保存/导出数据' },
  { key: 'Ctrl + L', desc: '清空编辑器' },
  { key: 'Ctrl + /', desc: '注释/取消注释' },
  { key: 'Escape', desc: '关闭弹窗' },
  { key: 'Ctrl + H', desc: '显示/隐藏历史' },
];

export function ShortcutsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"
        title="快捷键"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20">
            <div className="p-3 border-b border-gray-700">
              <h3 className="font-semibold text-sm">快捷键</h3>
            </div>
            <div className="p-2">
              {SHORTCUTS.map((s, i) => (
                <div key={i} className="flex justify-between items-center py-2 px-2 hover:bg-gray-700/50 rounded">
                  <span className="text-gray-400 text-sm">{s.desc}</span>
                  <kbd className="px-2 py-1 bg-gray-900 border border-gray-600 rounded text-xs font-mono">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}