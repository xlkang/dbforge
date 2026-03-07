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

// POST /api/schema - 获取表结构
router.post('/schema', async (req, res) => {
  const { type, connectionKey, table, database } = req.body;
  
  try {
    if (type === 'mysql' && mysqlPools.has(connectionKey)) {
      const pool = mysqlPools.get(connectionKey);
      
      // 获取列信息
      const [columns] = await pool!.query(
        `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA, COLUMN_DEFAULT, CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE
         FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [database, table]
      );
      
      // 获取索引信息
      const [indexes] = await pool!.query(
        `SELECT INDEX_NAME, NON_UNIQUE, COLUMN_NAME, SEQ_IN_INDEX 
         FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [database, table]
      );
      
      res.json({ success: true, columns, indexes });
    } else {
      res.json({ success: false, message: 'Invalid connection' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/count - 获取表行数
router.post('/count', async (req, res) => {
  const { type, connectionKey, table, database } = req.body;
  
  try {
    if (type === 'mysql' && mysqlPools.has(connectionKey)) {
      const pool = mysqlPools.get(connectionKey);
      const [rows] = await pool!.query(
        `SELECT COUNT(*) as count FROM \`${table}\``
      );
      res.json({ success: true, count: (rows as any)[0].count });
    } else {
      res.json({ success: false, message: 'Invalid connection' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/views - 获取视图列表
router.post('/views', async (req, res) => {
  const { type, connectionKey, database } = req.body;
  
  try {
    if (type === 'mysql' && mysqlPools.has(connectionKey)) {
      const pool = mysqlPools.get(connectionKey);
      const [rows] = await pool!.query(
        'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA = ?',
        [database]
      );
      res.json({ success: true, views: rows });
    } else {
      res.json({ success: false, message: 'Invalid connection' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/triggers - 获取触发器列表
router.post('/triggers', async (req, res) => {
  const { type, connectionKey, database } = req.body;
  
  try {
    if (type === 'mysql' && mysqlPools.has(connectionKey)) {
      const pool = mysqlPools.get(connectionKey);
      const [rows] = await pool!.query(
        'SELECT TRIGGER_NAME FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA = ?',
        [database]
      );
      res.json({ success: true, triggers: rows });
    } else {
      res.json({ success: false, message: 'Invalid connection' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/export - 导出数据
router.post('/export', async (req, res) => {
  const { type, connectionKey, table, format, database } = req.body;
  
  try {
    if (type === 'mysql' && mysqlPools.has(connectionKey)) {
      const pool = mysqlPools.get(connectionKey);
      const [rows] = await pool!.query(`SELECT * FROM \`${table}\``);
      
      if (format === 'json') {
        res.json({ success: true, data: rows });
      } else if (format === 'csv') {
        const data = rows as any[];
        if (data.length === 0) {
          res.json({ success: true, csv: '' });
          return;
        }
        const headers = Object.keys(data[0]).join(',');
        const csvRows = data.map(row => Object.values(row).join(','));
        res.json({ success: true, csv: [headers, ...csvRows].join('\n') });
      } else {
        res.json({ success: true, data: rows });
      }
    } else {
      res.json({ success: false, message: 'Invalid connection' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/backup - 备份数据库
router.post('/backup', async (req, res) => {
  const { type, connectionKey, database } = req.body;
  
  try {
    if (type === 'mysql' && mysqlPools.has(connectionKey)) {
      const pool = mysqlPools.get(connectionKey);
      
      // 获取所有表
      const [tables] = await pool!.query(
        'SHOW TABLES'
      );
      const tableNames = (tables as any[]).map(t => Object.values(t)[0]);
      
      const backup: Record<string, any[]> = {};
      
      for (const tableName of tableNames) {
        const [rows] = await pool!.query(`SELECT * FROM \`${tableName}\``);
        backup[tableName] = rows as any[];
      }
      
      res.json({ success: true, backup, database, timestamp: new Date().toISOString() });
    } else {
      res.json({ success: false, message: 'Invalid connection' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
