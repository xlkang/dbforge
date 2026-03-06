import { useState } from 'react';
import { X, Server, Loader2, Eye, EyeOff } from 'lucide-react';
import { useConnectionStore, type MySQLConnection } from '../../stores/connectionStore';
import { useDatabaseStore } from '../../stores/databaseStore';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editConnection?: MySQLConnection;
}

export function ConnectionModal({ isOpen, onClose, editConnection }: ConnectionModalProps) {
  const { addConnection, updateConnection } = useConnectionStore();
  const { setConnection, setError } = useDatabaseStore();
  const [connecting, setConnecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [form, setForm] = useState<Omit<MySQLConnection, 'id'>>({
    name: editConnection?.name || '',
    host: editConnection?.host || 'localhost',
    port: editConnection?.port || 3306,
    user: editConnection?.user || 'root',
    password: editConnection?.password || '',
    database: editConnection?.database || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:3001/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      
      if (!data.success) {
        setError(data.message || '连接失败');
        setConnecting(false);
        return;
      }

      if (editConnection) {
        updateConnection(editConnection.id, form);
      } else {
        addConnection(form);
      }

      setConnection({
        id: editConnection?.id || crypto.randomUUID(),
        type: 'mysql',
        name: form.name || form.database,
        host: form.host,
        port: form.port,
        user: form.user,
        password: form.password,
        database: form.database,
        isConnected: true,
      });
      
      onClose();
    } catch (err) {
      setError('无法连接到服务器 (http://localhost:3001)，请确保后端服务已启动：npm run server');
      console.error('连接错误:', err);
    } finally {
      setConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[var(--bg-primary)] rounded-2xl w-[420px] border border-gray-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[var(--bg-primary)]/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
              <Server className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {editConnection ? '编辑连接' : '新建 MySQL 连接'}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">配置数据库连接参数</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Connection Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">连接名称</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="我的数据库"
              className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          
          {/* Host & Port */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">主机地址</label>
              <input
                type="text"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                placeholder="localhost"
                required
                className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">端口</label>
              <input
                type="number"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) })}
                required
                className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
          
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">用户名</label>
            <input
              type="text"
              value={form.user}
              onChange={(e) => setForm({ ...form, user: e.target.value })}
              placeholder="root"
              required
              className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">密码</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 pr-12 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {/* Database */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">数据库名</label>
            <input
              type="text"
              value={form.database}
              onChange={(e) => setForm({ ...form, database: e.target.value })}
              placeholder="test_db"
              required
              className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-secondary)] rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={connecting}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
            >
              {connecting && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
              {connecting ? '连接中...' : (editConnection ? '保存连接' : '连接数据库')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
