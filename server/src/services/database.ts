import mysql from 'mysql2/promise';
import pg, { Pool as PgPool } from 'pg';
import { Client as SSHClient } from 'ssh2';
import type { SSHConfig } from '../types';

const { Pool: PgPoolConstructor } = pg;

// 连接池缓存
const mysqlPools = new Map<string, mysql.Pool>();
const pgPools = new Map<string, PgPool>();
const sshTunnels = new Map<string, SSHClient>();

// 生成连接池 key
export function getConnectionKey(host: string, port: number, database: string): string {
  return `${host}:${port}:${database}`;
}

// 创建 SSH 隧道
export async function createSSHTunnel(ssh: SSHConfig, targetHost: string, targetPort: number): Promise<{ localPort: number }> {
  return new Promise((resolve, reject) => {
    const tunnelKey = `${ssh.host}:${ssh.port}:${targetHost}:${targetPort}`;
    
    // 复用已有隧道
    if (sshTunnels.has(tunnelKey)) {
      const existing = sshTunnels.get(tunnelKey)!;
      if ((existing as any).connected) {
        resolve({ localPort: targetPort + 10000 });
        return;
      }
    }
    
    const client = new SSHClient();
    
    client.on('ready', () => {
      client.forwardOut(
        '127.0.0.1',
        0,
        targetHost,
        targetPort,
        (err, stream) => {
          if (err) {
            reject(err);
            return;
          }
          const localPort = (stream as any).localPort || targetPort + 10000;
          sshTunnels.set(tunnelKey, client);
          resolve({ localPort });
        }
      );
    });
    
    client.on('error', (err) => {
      reject(err);
    });
    
    const connectConfig: any = {
      host: ssh.host,
      port: ssh.port,
      username: ssh.username,
    };
    
    if (ssh.privateKey) {
      connectConfig.privateKey = ssh.privateKey;
    } else if (ssh.password) {
      connectConfig.password = ssh.password;
    }
    
    client.connect(connectConfig);
  });
}

// MySQL 连接池
export async function getMysqlPool(config: {
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
}): Promise<mysql.Pool> {
  const key = getConnectionKey(config.host, config.port, config.database || '');
  
  if (mysqlPools.has(key)) {
    const existing = mysqlPools.get(key)!;
    // 验证连接
    try {
      await existing.query('SELECT 1');
      return existing;
    } catch {
      mysqlPools.delete(key);
    }
  }
  
  const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
  });
  
  mysqlPools.set(key, pool);
  return pool;
}

// PostgreSQL 连接池
export function getPgPool(config: {
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
}): PgPool {
  const key = getConnectionKey(config.host, config.port, config.database || '');
  
  if (pgPools.has(key)) {
    return pgPools.get(key)!;
  }
  
  const pool = new PgPoolConstructor({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
  });
  
  pgPools.set(key, pool);
  return pool;
}

// 关闭所有连接
export async function closeAllConnections(): Promise<void> {
  for (const pool of mysqlPools.values()) {
    await pool.end();
  }
  mysqlPools.clear();
  
  for (const pool of pgPools.values()) {
    await pool.end();
  }
  pgPools.clear();
  
  for (const client of sshTunnels.values()) {
    client.end();
  }
  sshTunnels.clear();
}
