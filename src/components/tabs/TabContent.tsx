import { lazy, Suspense } from 'react';
import { useTabStore } from '../../stores/tabStore';
import { QueryEditor } from '../query/QueryEditor';
import { DataPanel } from '../data/DataPanel';
import { Loader2 } from 'lucide-react';

// 懒加载大型组件 - 代码分割优化
const ERDiagram = lazy(() => import('../diagram/ERDiagram').then(m => ({ default: m.ERDiagram })));
const ChartPanel = lazy(() => import('../query/ChartPanel').then(m => ({ default: m.ChartPanel })));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
    </div>
  );
}

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
        <Suspense fallback={<LoadingSpinner />}>
          <ERDiagram width={900} height={600} />
        </Suspense>
      </div>
    );
  }

  if (activeTab.type === 'chart') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Suspense fallback={<LoadingSpinner />}>
          <ChartPanel />
        </Suspense>
      </div>
    );
  }

  return null;
}