import { useState, useEffect } from 'react';

const SHORTCUTS = [
  { key: 'Ctrl + Enter', desc: '执行查询', category: '查询' },
  { key: 'Ctrl + S', desc: '保存当前查询', category: '查询' },
  { key: 'Ctrl + L', desc: '清空编辑器', category: '编辑器' },
  { key: 'Ctrl + /', desc: '注释/取消注释', category: '编辑器' },
  { key: 'Escape', desc: '关闭弹窗', category: '通用' },
  { key: 'Ctrl + H', desc: '显示/隐藏历史', category: '查询' },
  { key: 'Ctrl + D', desc: '格式化 SQL', category: '查询' },
  { key: 'Ctrl + Shift + C', desc: '复制选中结果', category: '结果' },
  { key: 'Ctrl + N', desc: '新建查询标签', category: '标签' },
  { key: 'Ctrl + W', desc: '关闭当前标签', category: '标签' },
  { key: 'Ctrl + Tab', desc: '切换标签', category: '标签' },
];

export function ShortcutsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  // 按分类组织快捷键
  const categories = SHORTCUTS.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, typeof SHORTCUTS>);

  // ESC 键关闭面板
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded"
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
          <div className="absolute right-0 top-full mt-2 w-72 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl z-20">
            <div className="p-3 border-b border-[var(--border-color)]">
              <h3 className="font-semibold text-sm">快捷键</h3>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {Object.entries(categories).map(([category, items]) => (
                <div key={category} className="mb-3 last:mb-0">
                  <div className="text-xs text-[var(--accent)] font-medium mb-1 px-2">{category}</div>
                  {items.map((s, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 px-2 hover:bg-[var(--bg-tertiary)]/50 rounded">
                      <span className="text-[var(--text-muted)] text-sm">{s.desc}</span>
                      <kbd className="px-2 py-0.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-xs font-mono">
                        {s.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}