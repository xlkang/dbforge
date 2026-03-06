import { useState } from 'react';
import { useConnectionStore, type MySQLConnection } from '../../stores/connectionStore';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editConnection?: MySQLConnection;
}

export function ConnectionModal({ isOpen, onClose, editConnection }: ConnectionModalProps) {
  const { addConnection, updateConnection } = useConnectionStore();
  const [form, setForm] = useState<Omit<MySQLConnection, 'id'>>({
    name: editConnection?.name || '',
    host: editConnection?.host || 'localhost',
    port: editConnection?.port || 3306,
    user: editConnection?.user || 'root',
    password: editConnection?.password || '',
    database: editConnection?.database || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editConnection) {
      updateConnection(editConnection.id, form);
    } else {
      addConnection(form);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          {editConnection ? '编辑连接' : '新建 MySQL 连接'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">连接名称</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="我的数据库"
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">主机</label>
              <input
                type="text"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                placeholder="localhost"
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">端口</label>
              <input
                type="number"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) })}
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">用户名</label>
            <input
              type="text"
              value={form.user}
              onChange={(e) => setForm({ ...form, user: e.target.value })}
              placeholder="root"
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">密码</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">数据库名</label>
            <input
              type="text"
              value={form.database}
              onChange={(e) => setForm({ ...form, database: e.target.value })}
              placeholder="test_db"
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              {editConnection ? '保存' : '连接'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
