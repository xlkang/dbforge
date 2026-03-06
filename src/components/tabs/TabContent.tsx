import { useTabStore } from '../../stores/tabStore';
import { QueryEditor } from '../query/QueryEditor';
import { DataPanel } from '../data/DataPanel';
import { ERDiagram } from '../diagram/ERDiagram';
import { ChartPanel } from '../query/ChartPanel';

export function TabContent() {
  const { getActiveTab } = useTabStore();
  
  const activeTab = getActiveTab();

  if (!activeTab) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">请选择一个表或创建查询</p>
          <p className="text-sm">双击表名打开新标签页，或点击 + 创建查询</p>
        </div>
      </div>
    );
  }

  if (activeTab.type === 'query') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <QueryEditor initialSql={activeTab.sql} tabId={activeTab.id} />
      </div>
    );
  }

  if (activeTab.type === 'table' && activeTab.tableName) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <DataPanel tableName={activeTab.tableName} mode="edit" />
      </div>
    );
  }

  if (activeTab.type === 'diagram') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden p-2">
        <ERDiagram width={900} height={600} />
      </div>
    );
  }

  if (activeTab.type === 'chart') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChartPanel />
      </div>
    );
  }

  return null;
}