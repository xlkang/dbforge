import { useState, useEffect } from 'react';
import { X, Server, Loader2, Eye, EyeOff, Database, Terminal, Key, Lock } from 'lucide-react';
import { useConnectionStore, type MySQLConnection } from '../../stores/connectionStore';
import { useDatabaseStore } from '../../stores/databaseStore';
import type { DatabaseType } from '../../types/database';
import type { SSHConfig } from '../../types/ssh';

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
  const [dbType, setDbType] = useState<DatabaseType>(editConnection?.type || 'mysql');
  
  const [form, setForm] = useState<Omit<MySQLConnection, 'id' | 'type'>>({
    name: editConnection?.name || '',
    host: editConnection?.host || 'localhost',
    port: editConnection?.port || 3306,
    user: editConnection?.user || 'root',
    password: editConnection?.password || '',
    database: editConnection?.database || '',
  });

  // SSH 配置状态
  const [useSSH, setUseSSH] = useState(editConnection?.ssh?.enabled || false);
  const [sshConfig, setSSHConfig] = useState<SSHConfig>(editConnection?.ssh || {
    enabled: false,
    host: '',
    port: 22,
    username: '',
    authType: 'password',
  });

  // ESC 键关闭模态框
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Update form port when dbType changes
  useState(() => {
    if (!editConnection) {
      setForm(prev => ({ ...prev, port: dbType === 'postgresql' ? 5432 : 3306 }));
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:3001/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type: dbType }),
      });
      const data = await res.json();
      
      if (!data.success) {
        setError(data.message || '连接失败');
        setConnecting(false);
        return;
      }

      if (editConnection) {
        updateConnection(editConnection.id, { ...form, type: dbType });
      } else {
        addConnection({ ...form, type: dbType });
      }

      setConnection({
        id: editConnection?.id || crypto.randomUUID(),
        type: dbType,
        name: form.name || form.database,
        host: form.host,
        port: form.port,
        user: form.user,
        password: form.password,
        database: form.database,
        ssh: useSSH ? { ...sshConfig, enabled: true } : undefined,
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
                {editConnection ? '编辑连接' : `新建 ${dbType === 'postgresql' ? 'PostgreSQL' : 'MySQL'} 连接`}
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
          {/* Database Type Selector */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">数据库类型</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setDbType('mysql'); setForm(f => ({ ...f, port: 3306 })); }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                  dbType === 'mysql' 
                    ? 'bg-orange-500/20 border-orange-500 text-orange-400' 
                    : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-orange-500/50'
                }`}
              >
                <Database className="w-4 h-4" />
                MySQL
              </button>
              <button
                type="button"
                onClick={() => { setDbType('postgresql'); setForm(f => ({ ...f, port: 5432 })); }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                  dbType === 'postgresql' 
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                    : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-blue-500/50'
                }`}
              >
                <Database className="w-4 h-4" />
                PostgreSQL
              </button>
            </div>
          </div>
          
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

          {/* SSH Tunnel Toggle */}
          <div className="border-t border-[var(--border-color)] pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div 
                className={`relative w-11 h-6 rounded-full transition-colors ${useSSH ? 'bg-green-500' : 'bg-[var(--bg-secondary)]'}`}
                onClick={() => setUseSSH(!useSSH)}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${useSSH ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <span className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <Terminal className="w-4 h-4" />
                启用 SSH 隧道连接
              </span>
            </label>
          </div>

          {/* SSH Configuration */}
          {useSSH && (
            <div className="space-y-4 p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                <Key className="w-3 h-3" />
                SSH 隧道将加密你的数据库连接，适用于远程服务器
              </p>
              
              {/* SSH Host & Port */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-[var(--text-muted)] mb-1">SSH 服务器</label>
                  <input
                    type="text"
                    value={sshConfig.host}
                    onChange={(e) => setSSHConfig({ ...sshConfig, host: e.target.value })}
                    placeholder="ssh.example.com"
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-green-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">端口</label>
                  <input
                    type="number"
                    value={sshConfig.port}
                    onChange={(e) => setSSHConfig({ ...sshConfig, port: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-green-500/50"
                  />
                </div>
              </div>

              {/* SSH Username */}
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">SSH 用户名</label>
                <input
                  type="text"
                  value={sshConfig.username}
                  onChange={(e) => setSSHConfig({ ...sshConfig, username: e.target.value })}
                  placeholder="root"
                  className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-green-500/50"
                />
              </div>

              {/* Auth Type */}
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">认证方式</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSSHConfig({ ...sshConfig, authType: 'password' })}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs border transition-colors ${
                      sshConfig.authType === 'password' 
                        ? 'bg-green-500/20 border-green-500 text-green-400' 
                        : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Lock className="w-3 h-3" /> 密码
                  </button>
                  <button
                    type="button"
                    onClick={() => setSSHConfig({ ...sshConfig, authType: 'key' })}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs border transition-colors ${
                      sshConfig.authType === 'key' 
                        ? 'bg-green-500/20 border-green-500 text-green-400' 
                        : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Key className="w-3 h-3" /> 密钥
                  </button>
                </div>
              </div>

              {/* Password or Private Key */}
              {sshConfig.authType === 'password' ? (
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">SSH 密码</label>
                  <input
                    type="password"
                    value={sshConfig.password || ''}
                    onChange={(e) => setSSHConfig({ ...sshConfig, password: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-green-500/50"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">私钥内容</label>
                  <textarea
                    value={sshConfig.privateKey || ''}
                    onChange={(e) => setSSHConfig({ ...sshConfig, privateKey: e.target.value })}
                    placeholder="-----BEGIN RSA PRIVATE KEY-----"
                    rows={3}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-green-500/50 resize-none"
                  />
                </div>
              )}
            </div>
          )}
          
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
