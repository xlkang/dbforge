import { Plus, X, Table2, Code, Network, FileText } from 'lucide-react';
import { useTabStore } from '../../stores/tabStore';
import { ContextMenu, type MenuItem, useContextMenu } from '../common/ContextMenu';

const TabIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'table':
      return <Table2 className="w-3.5 h-3.5" strokeWidth={2} />;
    case 'query':
      return <Code className="w-3.5 h-3.5" strokeWidth={2} />;
    case 'diagram':
      return <Network className="w-3.5 h-3.5" strokeWidth={2} />;
    case 'chart':
      return <FileText className="w-3.5 h-3.5" strokeWidth={2} />;
    default:
      return <FileText className="w-3.5 h-3.5" strokeWidth={2} />;
  }
};

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, removeTab, addTab } = useTabStore();
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;

    const items: MenuItem[] = [
      {
        label: '关闭当前',
        onClick: () => removeTab(tabId),
      },
      {
        label: '关闭其他',
        onClick: () => {
          tabs.forEach((t) => {
            if (t.id !== tabId) removeTab(t.id);
          });
        },
      },
      {
        label: '关闭全部',
        onClick: () => {
          tabs.forEach((t) => removeTab(t.id));
        },
      },
    ];

    showContextMenu(e, items);
  };

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center bg-[var(--bg-primary)]/80 backdrop-blur-sm border-b border-gray-800 overflow-x-auto">
      <div className="flex items-center">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            onContextMenu={(e) => handleContextMenu(e, tab.id)}
            className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer border-r border-gray-800 min-w-[120px] max-w-[200px] group transition-all ${
              activeTabId === tab.id
                ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-b-2 border-b-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]/50 hover:text-[var(--text-secondary)] border-b-2 border-b-transparent'
            }`}
          >
            <TabIcon type={tab.type} />
            <span className="truncate flex-1 text-sm font-medium">{tab.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTab(tab.id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-tertiary)] p-0.5 rounded text-[var(--text-muted)] hover:text-red-400 transition-all"
            >
              <X className="w-3 h-3" strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() =>
          addTab({
            title: `查询 ${tabs.filter((t) => t.type === 'query').length + 1}`,
            type: 'query',
            sql: '',
          })
        }
        className="mx-2 p-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
        title="新建查询"
      >
        <Plus className="w-4 h-4" strokeWidth={2} />
      </button>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={hideContextMenu}
        />
      )}
    </div>
  );
}
