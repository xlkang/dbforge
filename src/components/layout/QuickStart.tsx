import { useState, useEffect, useRef } from 'react';
import { Database, Server, Upload, FileText, Search, Download, Edit3, Code, ArrowRight, Sparkles } from 'lucide-react';
import { ConnectionModal } from '../connection/ConnectionModal';
import { useDatabaseStore } from '../../stores/databaseStore';

interface QuickStartProps {
  onFileSelect?: (file: File) => void;
}

export function QuickStart({ onFileSelect }: QuickStartProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showMySQLModal, setShowMySQLModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { isConnecting, error } = useDatabaseStore();

  useEffect(() => {
    if (error) {
      alert('连接失败: ' + error);
    }
  }, [error]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.db') || file.name.endsWith('.sqlite') || file.name.endsWith('.sqlite3'))) {
      onFileSelect?.(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect?.(file);
    }
  };

  const isLoading = isConnecting;

  const features = [
    { icon: Search, title: '智能浏览', desc: '表结构、索引、关系可视化' },
    { icon: Edit3, title: '便捷编辑', desc: '双击单元格直接修改数据' },
    { icon: Code, title: 'SQL 工坊', desc: '语法高亮 + 智能补全' },
    { icon: Download, title: '导入导出', desc: 'CSV/JSON 数据轻松迁移' },
  ];

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-2xl w-full">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[var(--border-color)] rounded-full mx-auto mb-6"></div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-[var(--text-muted)] text-lg">正在连接数据库...</p>
          </div>
        ) : (
          <>
            {/* Logo & Title */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-5 shadow-lg shadow-blue-500/20">
                <Database className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <h1 className="text-4xl font-bold text-white tracking-tight mb-2">DBForge</h1>
              <p className="text-[var(--text-muted)] text-lg">现代数据库管理工具</p>
            </div>

            {/* Drop Zone - Glassmorphism Style */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative overflow-hidden rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
                isDragging 
                  ? 'bg-[var(--accent)]/10 border-2 border-blue-500 scale-[1.02]' 
                  : 'bg-[var(--bg-secondary)]/50 border border-[var(--border-color)]/50 hover:border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/70'
              }`}
            >
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
              
              <div className="relative">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-5 transition-colors ${
                  isDragging ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'
                }`}>
                  <Upload className={`w-7 h-7 ${isDragging ? 'text-white' : 'text-[var(--text-muted)]'}`} strokeWidth={1.5} />
                </div>
                
                <p className="text-white text-lg font-medium mb-2">
                  {isDragging ? '释放以打开文件' : '拖拽 SQLite 数据库文件到这里'}
                </p>
                <p className="text-[var(--text-muted)] mb-5">或点击选择文件</p>
                
                <div className="flex items-center justify-center gap-2 text-[var(--text-muted)] text-sm">
                  <FileText className="w-4 h-4" />
                  <span>支持 .db, .sqlite, .sqlite3 格式</span>
                </div>
              </div>
              
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".db,.sqlite,.sqlite3" 
                onChange={handleFileInput}
                className="hidden"
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
              <span className="text-[var(--text-muted)] text-sm">或者</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
            </div>

            {/* Connect MySQL Button */}
            <button
              onClick={() => setShowMySQLModal(true)}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[var(--bg-secondary)]/80 hover:bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--border-color)] rounded-xl transition-all group"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                <Server className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">连接 MySQL</p>
                <p className="text-[var(--text-muted)] text-sm">远程数据库服务器</p>
              </div>
              <ArrowRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-muted)] group-hover:translate-x-1 transition-all ml-auto" strokeWidth={2} />
            </button>

            {/* Features Grid */}
            <div className="mt-10">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-[var(--text-muted)] text-sm font-medium">功能亮点</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {features.map((feature, i) => (
                  <div key={i} className="bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 border border-[var(--border-color)]/30 hover:border-[var(--border-color)]/50 rounded-xl p-4 transition-all">
                    <feature.icon className="w-5 h-5 text-[var(--accent)] mb-3" strokeWidth={1.5} />
                    <h3 className="text-[var(--text-primary)] font-medium text-sm mb-1">{feature.title}</h3>
                    <p className="text-[var(--text-muted)] text-xs">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* MySQL Modal */}
            {showMySQLModal && (
              <ConnectionModal isOpen={showMySQLModal} onClose={() => setShowMySQLModal(false)} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
