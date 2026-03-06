import { useState } from 'react';
import { Eye, Zap, ChevronRight, ChevronDown, RefreshCw, Trash2, Edit2 } from 'lucide-react';
import { useDatabaseStore } from '../../stores/databaseStore';

export function ViewsTriggersPanel() {
  const { connection, views, triggers, loadViews, loadTriggers } = useDatabaseStore();
  const [activeTab, setActiveTab] = useState<'views' | 'triggers'>('views');
  const [expanded, setExpanded] = useState(true);

  if (!connection) return null;

  return (
    <div className="bg-[#1e3a5f] border border-[#2a4a6f] rounded-lg overflow-hidden">
      <div 
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-[#2a4a6f] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown size={16} className="text-[#7cb3e0]" /> : <ChevronRight size={16} className="text-[#7cb3e0]" />}
          <span className="text-[#7cb3e0] text-sm font-medium">视图和触发器</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); loadViews(); loadTriggers(); }} className="p-1 hover:bg-[#3a5a7f] rounded" title="刷新">
            <RefreshCw size={14} className="text-[#7cb3e0]" />
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="border-t border-[#2a4a6f]">
          <div className="flex border-b border-[#2a4a6f]">
            <button
              onClick={() => setActiveTab('views')}
              className={`flex-1 px-3 py-2 text-sm flex items-center gap-2 ${activeTab === 'views' ? 'bg-[#2a4a6f] text-[#7cb3e0]' : 'text-[#a0c4e8] hover:bg-[#2a4a6f]'}`}
            >
              <Eye size={14} /> 视图 ({views.length})
            </button>
            <button
              onClick={() => setActiveTab('triggers')}
              className={`flex-1 px-3 py-2 text-sm flex items-center gap-2 ${activeTab === 'triggers' ? 'bg-[#2a4a6f] text-[#7cb3e0]' : 'text-[#a0c4e8] hover:bg-[#2a4a6f]'}`}
            >
              <Zap size={14} /> 触发器 ({triggers.length})
            </button>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {activeTab === 'views' ? (
              views.length === 0 ? (
                <div className="p-4 text-center text-[#6a9cc8] text-sm">暂无视图</div>
              ) : (
                <div className="p-2">
                  {views.map((view: string) => (
                    <div key={view} className="flex items-center justify-between px-2 py-1.5 hover:bg-[#2a4a6f] rounded text-sm group">
                      <div className="flex items-center gap-2 text-[#a0c4e8]">
                        <Eye size={12} /> {view}
                      </div>
                      <div className="hidden group-hover:flex gap-1">
                        <button className="p-1 hover:bg-[#3a5a7f] rounded"><Edit2 size={12} className="text-[#7cb3e0]" /></button>
                        <button className="p-1 hover:bg-[#3a5a7f] rounded"><Trash2 size={12} className="text-[#e07070]" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              triggers.length === 0 ? (
                <div className="p-4 text-center text-[#6a9cc8] text-sm">暂无触发器</div>
              ) : (
                <div className="p-2">
                  {triggers.map((trigger: string) => (
                    <div key={trigger} className="flex items-center justify-between px-2 py-1.5 hover:bg-[#2a4a6f] rounded text-sm group">
                      <div className="flex items-center gap-2 text-[#a0c4e8]">
                        <Zap size={12} /> {trigger}
                      </div>
                      <div className="hidden group-hover:flex gap-1">
                        <button className="p-1 hover:bg-[#3a5a7f] rounded"><Trash2 size={12} className="text-[#e07070]" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
