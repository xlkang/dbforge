import { useState } from 'react';
import { type FormEvent } from 'react';
import { Server, Loader2, Play } from 'lucide-react';
import { useDatabaseStore } from '../../stores/databaseStore';

export function MySQLConnect() {
  const { setConnection, setError } = useDatabaseStore();
  const [form, setForm] = useState({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: '',
  });
  const [connecting, setConnecting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 表单验证
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!form.host.trim()) {
      newErrors.host = '请输入主机地址';
    }
    if (!form.port || form.port < 1 || form.port > 65535) {
      newErrors.port = '端口无效';
    }
    if (!form.user.trim()) {
      newErrors.user = '请输入用户名';
    }
    if (!form.database.trim()) {
      newErrors.database = '请输入数据库名';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
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

      setConnection({
        id: crypto.randomUUID(),
        type: 'mysql',
        name: form.database,
        host: form.host,
        port: form.port,
        user: form.user,
        password: form.password,
        database: form.database,
        isConnected: true,
      });
    } catch {
      setError('无法连接到服务器 (http://localhost:3001)，请确保后端服务已启动：npm run server');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="p-3 bg-[var(--bg-secondary)]/30 rounded-xl border border-gray-800">
      <div className="flex items-center gap-2 mb-3">
        <Server className="w-4 h-4 text-orange-400" strokeWidth={2} />
        <span className="text-xs font-medium text-[var(--text-muted)]">快速连接</span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              type="text"
              value={form.host}
              onChange={(e) => setForm({ ...form, host: e.target.value })}
              className={`px-3 py-2 bg-[var(--bg-secondary)] border rounded-lg text-sm text-[var(--text-secondary)] placeholder-gray-600 focus:outline-none focus:border-blue-500/50 ${errors.host ? 'border-red-500' : 'border-[var(--border-color)]'}`}
              placeholder="主机"
            />
            {errors.host && <p className="text-red-400 text-[10px] mt-1">{errors.host}</p>}
          </div>
          <div>
            <input
              type="number"
              value={form.port}
              onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 3306 })}
              className={`px-3 py-2 bg-[var(--bg-secondary)] border rounded-lg text-sm text-[var(--text-secondary)] focus:outline-none focus:border-blue-500/50 ${errors.port ? 'border-red-500' : 'border-[var(--border-color)]'}`}
              placeholder="端口"
            />
            {errors.port && <p className="text-red-400 text-[10px] mt-1">{errors.port}</p>}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              type="text"
              value={form.user}
              onChange={(e) => setForm({ ...form, user: e.target.value })}
              className={`px-3 py-2 bg-[var(--bg-secondary)] border rounded-lg text-sm text-[var(--text-secondary)] placeholder-gray-600 focus:outline-none focus:border-blue-500/50 ${errors.user ? 'border-red-500' : 'border-[var(--border-color)]'}`}
              placeholder="用户名"
            />
            {errors.user && <p className="text-red-400 text-[10px] mt-1">{errors.user}</p>}
          </div>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-secondary)] focus:outline-none focus:border-blue-500/50"
            placeholder="密码"
          />
        </div>

        <div>
          <input
            type="text"
            value={form.database}
            onChange={(e) => setForm({ ...form, database: e.target.value })}
            className={`w-full px-3 py-2 bg-[var(--bg-secondary)] border rounded-lg text-sm text-[var(--text-secondary)] placeholder-gray-600 focus:outline-none focus:border-blue-500/50 ${errors.database ? 'border-red-500' : 'border-[var(--border-color)]'}`}
            placeholder="数据库名 *"
            required
          />
          {errors.database && <p className="text-red-400 text-[10px] mt-1">{errors.database}</p>}
        </div>

        <button
          type="submit"
          disabled={connecting}
          className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:from-gray-700 disabled:to-gray-700 text-white text-sm font-medium rounded-lg transition-all"
        >
          {connecting ? (
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
          ) : (
            <Play className="w-4 h-4" strokeWidth={2} />
          )}
          {connecting ? '连接中...' : '连接'}
        </button>

        <p className="text-[10px] text-[var(--text-muted)] text-center">
          需要先启动后端服务
        </p>
      </form>
    </div>
  );
}
