import { useTabStore } from '../../stores/tabStore';
import { ContextMenu, type MenuItem, useContextMenu } from '../common/ContextMenu';

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
    <div className="flex bg-gray-900 border-b border-gray-700 overflow-x-auto scrollbar-thin">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          onContextMenu={(e) => handleContextMenu(e, tab.id)}
          className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer border-r border-gray-700 min-w-[100px] max-w-[200px] group ${
            activeTabId === tab.id
              ? 'bg-gray-800 text-white border-b-2 border-b-blue-500'
              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
          }`}
        >
          <span className="truncate flex-1">{tab.title}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeTab(tab.id);
            }}
            className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
          >
            ×
          </button>
        </div>
      ))}

      <button
        onClick={() =>
          addTab({
            title: `查询 ${tabs.filter((t) => t.type === 'query').length + 1}`,
            type: 'query',
            sql: '',
          })
        }
        className="px-3 py-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800"
        title="新建查询"
      >
        +
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
