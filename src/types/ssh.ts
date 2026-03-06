// SSH 隧道连接配置
export interface SSHConfig {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  authType: 'password' | 'key';
  password?: string;
  privateKey?: string;
  passphrase?: string;
  // 跳板机配置
  jumpHost?: string;
  jumpPort?: number;
  jumpUsername?: string;
}

// 默认SSH配置
export const defaultSSHConfig: SSHConfig = {
  enabled: false,
  host: '',
  port: 22,
  username: '',
  authType: 'password',
};

// MySQL连接配置（包含SSH）
export interface MySQLConnection {
  id: string;
  name: string;
  type: 'mysql' | 'postgresql' | 'sqlite';
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssh?: SSHConfig;
}
