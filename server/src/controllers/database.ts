import type { Request, Response } from 'express';
import { getMysqlPool, getPgPool, createSSHTunnel } from '../services/database';
import type { SSHConfig } from '../types';

interface DatabaseRequest {
  dbType?: 'mysql' | 'postgresql' | 'sqlite';
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssh?: SSHConfig;
}

// 获取最终连接配置
async function resolveConnection(req: DatabaseRequest) {
  const { host, port, ssh } = req;
  
  if (ssh?.enabled && host && port) {
    const tunnel = await createSSHTunnel(ssh, host, port);
    return { finalHost: '127.0.0.1', finalPort: tunnel.localPort };
  }
  
  return { finalHost: host || 'localhost', finalPort: port || 3306 };
}

// POST /api/connect - 测试连接
export async function connect(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as DatabaseRequest;
    const { dbType = 'mysql', user = '', password = '', database, ssh } = body;
    const conn = await resolveConnection(body);
    
    if (dbType === 'mysql') {
      const pool = await getMysqlPool({ 
        host: conn.finalHost, 
        port: conn.finalPort, 
        user, 
        password, 
        database 
      });
      const connection = await pool.getConnection();
      connection.release();
      res.json({ success: true, message: 'MySQL连接成功', sshTunneled: !!ssh?.enabled });
    } else if (dbType === 'postgresql') {
      const pool = getPgPool({ 
        host: conn.finalHost, 
        port: conn.finalPort, 
        user, 
        password, 
        database 
      });
      const client = await pool.connect();
      client.release();
      res.json({ success: true, message: 'PostgreSQL连接成功', sshTunneled: !!ssh?.enabled });
    } else {
      res.status(400).json({ success: false, message: '不支持的数据库类型' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// POST /api/tables - 获取表列表
export async function getTables(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as DatabaseRequest;
    const { dbType = 'mysql', user = '', password = '', database, ssh } = body;
    const conn = await resolveConnection(body);
    
    if (dbType === 'mysql') {
      const pool = await getMysqlPool({ 
        host: conn.finalHost, 
        port: conn.finalPort, 
        user, 
        password, 
        database 
      });
      const [tables] = await pool.query(`
        SELECT TABLE_NAME, TABLE_COMMENT
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = ?
      `, [database]);
      res.json({ success: true, tables });
    } else if (dbType === 'postgresql') {
      const pool = getPgPool({ 
        host: conn.finalHost, 
        port: conn.finalPort, 
        user, 
        password, 
        database 
      });
      const result = await pool.query(`
        SELECT table_name as TABLE_NAME, obj_description(relname::regclass, 'pg_class') as TABLE_COMMENT
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `);
      res.json({ success: true, tables: result.rows });
    } else {
      res.status(400).json({ success: false, message: '不支持的数据库类型' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// POST /api/schema - 获取表结构
export async function getSchema(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as DatabaseRequest & { table?: string };
    const { dbType = 'mysql', user = '', password = '', database, table, ssh } = body;
    const conn = await resolveConnection(body);
    
    if (dbType === 'mysql') {
      const pool = await getMysqlPool({ 
        host: conn.finalHost, 
        port: conn.finalPort, 
        user, 
        password, 
        database 
      });
      
      const [columns] = await pool.query(`
        SELECT 
          COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, COLUMN_KEY, IS_NULLABLE,
          COLUMN_DEFAULT, EXTRA, COLUMN_COMMENT, CHARACTER_SET_NAME, COLLATION_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [database, table]);
      
      const [indexes] = await pool.query(`SHOW INDEX FROM \`${table}\``);
      
      const [foreignKeys] = await pool.query(`
        SELECT 
          CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME,
          REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [database, table]);
      
      res.json({ success: true, columns, indexes, foreignKeys });
    } else if (dbType === 'postgresql') {
      const pool = getPgPool({ 
        host: conn.finalHost, 
        port: conn.finalPort, 
        user, 
        password, 
        database 
      });
      
      const columnsResult = await pool.query(`
        SELECT 
          column_name, data_type, udt_name, is_nullable,
          column_default, column_position
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [table]);
      
      const indexResult = await pool.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = $1
      `, [table]);
      
      res.json({ success: true, columns: columnsResult.rows, indexes: indexResult.rows });
    } else {
      res.status(400).json({ success: false, message: '不支持的数据库类型' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// POST /api/query - 执行查询
export async function executeQuery(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as DatabaseRequest & { sql: string };
    const { dbType = 'mysql', user = '', password = '', database, sql, ssh } = body;
    const conn = await resolveConnection(body);
    
    if (dbType === 'mysql') {
      const pool = await getMysqlPool({ 
        host: conn.finalHost, 
        port: conn.finalPort, 
        user, 
        password, 
        database 
      });
      const [rows, fields] = await pool.query(sql);
      res.json({ 
        success: true, 
        rows: Array.isArray(rows) ? rows : [rows],
        fields: fields || []
      });
    } else if (dbType === 'postgresql') {
      const pool = getPgPool({ 
        host: conn.finalHost, 
        port: conn.finalPort, 
        user, 
        password, 
        database 
      });
      const result = await pool.query(sql);
      res.json({ 
        success: true, 
        rows: result.rows,
        fields: result.fields || []
      });
    } else {
      res.status(400).json({ success: false, message: '不支持的数据库类型' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// POST /api/count - 获取行数
export async function getCount(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as DatabaseRequest & { table: string };
    const { dbType = 'mysql', user = '', password = '', database, table, ssh } = body;
    const conn = await resolveConnection(body);
    
    if (dbType === 'mysql') {
      const pool = await getMysqlPool({ 
        host: conn.finalHost, 
        port: conn.finalPort, 
        user, 
        password, 
        database 
      });
      const mysqlResult = await pool.query(`SELECT COUNT(*) as count FROM \`${table}\``) as any;
      const [[{ count }]] = mysqlResult;
      res.json({ success: true, count });
    } else if (dbType === 'postgresql') {
      const pool = getPgPool({ 
        host: conn.finalHost, 
        port: conn.finalPort, 
        user, 
        password, 
        database 
      });
      const pgResult = await pool.query(`SELECT COUNT(*) as count FROM "${table}"`) as any;
      res.json({ success: true, count: parseInt(pgResult.rows[0].count) });
    } else {
      res.status(400).json({ success: false, message: '不支持的数据库类型' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// POST /api/views - 获取视图
export async function getViews(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as DatabaseRequest;
    const { dbType = 'mysql', user = '', password = '', database, ssh } = body;
    const conn = await resolveConnection(body);
    
    if (dbType === 'mysql') {
      const pool = await getMysqlPool({ 
        host: conn.finalHost, 
        port: conn.finalPort, 
        user, 
        password, 
        database 
      });
      const [views] = await pool.query(`
        SELECT TABLE_NAME as name, VIEW_DEFINITION as definition
        FROM INFORMATION_SCHEMA.VIEWS
        WHERE TABLE_SCHEMA = ?
      `, [database]);
      res.json({ success: true, views });
    } else if (dbType === 'postgresql') {
      const pool = getPgPool({ 
        host: conn.finalHost, 
        port: conn.finalPort, 
        user, 
        password, 
        database 
      });
      const result = await pool.query(`
        SELECT table_name as name, pg_get_viewdef(table_name, true) as definition
        FROM information_schema.views
        WHERE table_schema = 'public'
      `);
      res.json({ success: true, views: result.rows });
    } else {
      res.status(400).json({ success: false, message: '不支持的数据库类型' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// POST /api/triggers - 获取触发器
export async function getTriggers(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as DatabaseRequest;
    const { dbType = 'mysql', user = '', password = '', database, ssh } = body;
    const conn = await resolveConnection(body);
    
    if (dbType === 'mysql') {
      const pool = await getMysqlPool({ 
        host: conn.finalHost, 
        port: conn.finalPort, 
        user, 
        password, 
        database 
      });
      const [triggers] = await pool.query(`
        SELECT TRIGGER_NAME as name, EVENT_MANIPULATION as event,
          EVENT_OBJECT_TABLE as table_name, ACTION_TIMING as timing,
          ACTION_STATEMENT as statement
        FROM INFORMATION_SCHEMA.TRIGGERS
        WHERE TRIGGER_SCHEMA = ?
      `, [database]);
      res.json({ success: true, triggers });
    } else if (dbType === 'postgresql') {
      const pool = getPgPool({ 
        host: conn.finalHost, 
        port: conn.finalPort, 
        user, 
        password, 
        database 
      });
      const result = await pool.query(`
        SELECT trigger_name as name, event_manipulation as event,
          event_object_table as table_name, action_timing as timing,
          action_statement as statement
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
      `);
      res.json({ success: true, triggers: result.rows });
    } else {
      res.status(400).json({ success: false, message: '不支持的数据库类型' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}
