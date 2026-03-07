import { Router } from 'express';
import mysql from 'mysql2/promise';
import { Client as SSHClient } from 'ssh2';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// SSH隧道缓存
const sshTunnels = new Map<string, SSHClient>();
const mysqlPools = new Map();

// 连接接口
interface ConnectRequest {
  type: 'mysql' | 'postgresql';
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
  ssh?: {
    enabled: boolean;
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: string;
  };
}

// POST /api/connect - 创建数据库连接
router.post('/connect', async (req, res) => {
  const { type, host, port, user, password, database, ssh } = req.body as ConnectRequest;
  
  try {
    if (type === 'mysql') {
      const pool = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 5,
      });
      
      await pool.query('SELECT 1');
      const key = `${host}:${port}:${database}`;
      mysqlPools.set(key, pool);
      
      res.json({ success: true, message: 'Connected', key });
    } else {
      res.json({ success: false, message: 'PostgreSQL not implemented' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/tables - 获取表列表
router.post('/tables', async (req, res) => {
  const { type, connectionKey, database } = req.body;
  
  try {
    if (type === 'mysql' && mysqlPools.has(connectionKey)) {
      const pool = mysqlPools.get(connectionKey);
      const [rows] = await pool!.query(
        'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?',
        [database]
      );
      res.json({ success: true, tables: rows });
    } else {
      res.json({ success: false, message: 'Invalid connection' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/query - 执行查询
router.post('/query', async (req, res) => {
  const { type, connectionKey, sql, database } = req.body;
  
  try {
    if (type === 'mysql' && mysqlPools.has(connectionKey)) {
      const pool = mysqlPools.get(connectionKey);
      const [rows, fields] = await pool!.query(sql);
      res.json({ success: true, rows, fields });
    } else {
      res.json({ success: false, message: 'Invalid connection' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
