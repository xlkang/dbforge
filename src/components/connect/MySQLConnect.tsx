import { useState } from 'react';
import type { FormEvent } from 'react';
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
      // 测试连接
      const res = await fetch('http://localhost:3001/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      
      if (!data.success) {
        setError(data.message || '连接失败');
        return;
      }

      // 保存连接配置到 store
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
      setError('无法连接到服务器，请确保后端服务已启动');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">主机</label>
            <input
              type="text"
              value={form.host}
              onChange={(e) => setForm({ ...form, host: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
              placeholder="localhost"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">端口</label>
            <input
              type="number"
              value={form.port}
              onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
              placeholder="3306"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">用户名</label>
            <input
              type="text"
              value={form.user}
              onChange={(e) => setForm({ ...form, user: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
              placeholder="root"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">密码</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
              placeholder="••••••"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">数据库名</label>
          <input
            type="text"
            value={form.database}
            onChange={(e) => setForm({ ...form, database: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
            placeholder="mydb"
            required
          />
        </div>

        <button
          type="submit"
          disabled={connecting}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm font-medium"
        >
          {connecting ? '连接中...' : '连接'}
        </button>

        <p className="text-xs text-gray-500">
          需要先启动后端服务: <code className="bg-gray-800 px-1">cd server && npm start</code>
        </p>
      </form>
    </div>
  );
}