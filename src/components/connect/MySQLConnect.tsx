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

  const handleSubmit = async (e: FormEvent) => {
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
    } catch (err) {
      setError('无法连接到服务器 (http://localhost:3001)，请确保后端服务已启动：npm run server');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="p-3 bg-gray-800/30 rounded-xl border border-gray-800">
      <div className="flex items-center gap-2 mb-3">
        <Server className="w-4 h-4 text-orange-400" strokeWidth={2} />
        <span className="text-xs font-medium text-gray-400">快速连接</span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={form.host}
            onChange={(e) => setForm({ ...form, host: e.target.value })}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
            placeholder="主机"
          />
          <input
            type="number"
            value={form.port}
            onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) })}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
            placeholder="端口"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={form.user}
            onChange={(e) => setForm({ ...form, user: e.target.value })}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
            placeholder="用户名"
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
            placeholder="密码"
          />
        </div>

        <input
          type="text"
          value={form.database}
          onChange={(e) => setForm({ ...form, database: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
          placeholder="数据库名"
          required
        />

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

        <p className="text-[10px] text-gray-600 text-center">
          需要先启动后端服务
        </p>
      </form>
    </div>
  );
}
