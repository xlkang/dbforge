import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import pg from 'pg';

const { Pool } = pg;

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 连接池缓存
const mysqlPools = new Map();
const pgPools = new Map();

// 创建MySQL连接池
interface MysqlConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

async function getMysqlPool(config: MysqlConfig) {
  const key = `${config.host}:${config.port}:${config.database}`;
  
  if (!mysqlPools.has(key)) {
    mysqlPools.set(key, mysql.createPool({
      host: config.host,
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
    }));
  }
  
  return mysqlPools.get(key);
}

// 创建PostgreSQL连接池
interface PgConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

function getPgPool(config: PgConfig) {
  const key = `${config.host}:${config.port}:${config.database}`;
  
  if (!pgPools.has(key)) {
    pgPools.set(key, new Pool({
      host: config.host,
      port: config.port || 5432,
      user: config.user,
      password: config.password,
      database: config.database,
      max: 10,
    }));
  }
  
  return pgPools.get(key);
}

// 测试连接
app.post('/api/connect', async (req, res) => {
  try {
    const { dbType = 'mysql', host, port, user, password, database } = req.body;
    
    if (dbType === 'mysql') {
      const pool = await getMysqlPool({ host, port, user, password, database });
      const connection = await pool.getConnection();
      connection.release();
      res.json({ success: true, message: 'MySQL连接成功' });
    } else if (dbType === 'postgresql') {
      const pool = getPgPool({ host, port, user, password, database });
      const client = await pool.connect();
      client.release();
      res.json({ success: true, message: 'PostgreSQL连接成功' });
    } else {
      res.status(400).json({ success: false, message: '不支持的数据库类型' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 获取所有表
app.post('/api/tables', async (req, res) => {
  try {
    const { dbType = 'mysql', host, port, user, password, database } = req.body;
    
    if (dbType === 'mysql') {
      const pool = await getMysqlPool({ host, port, user, password, database });
      const [tables] = await pool.query(`
        SELECT TABLE_NAME, TABLE_COMMENT
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = ?
      `, [database]);
      res.json({ success: true, tables });
    } else if (dbType === 'postgresql') {
      const pool = getPgPool({ host, port, user, password, database });
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
});

// 获取表结构
app.post('/api/schema', async (req, res) => {
  try {
    const { dbType = 'mysql', host, port, user, password, database, table } = req.body;
    
    if (dbType === 'mysql') {
      const pool = await getMysqlPool({ host, port, user, password, database });
      
      const [columns] = await pool.query(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          COLUMN_TYPE,
          IS_NULLABLE,
          COLUMN_KEY,
          COLUMN_DEFAULT,
          EXTRA,
          COLUMN_COMMENT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [database, table]);
      
      const [indexes] = await pool.query(`SHOW INDEX FROM \`${table}\``);
      res.json({ success: true, columns, indexes });
    } else if (dbType === 'postgresql') {
      const pool = getPgPool({ host, port, user, password, database });
      
      const columnsResult = await pool.query(`
        SELECT 
          column_name as COLUMN_NAME,
          data_type as DATA_TYPE,
          udt_name as COLUMN_TYPE,
          is_nullable as IS_NULLABLE,
          column_default as COLUMN_DEFAULT
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [table]);
      
      const indexesResult = await pool.query(`
        SELECT 
          indexname as Key_name,
          indexdef as Non_unique
        FROM pg_indexes
        WHERE tablename = $1
      `, [table]);
      
      res.json({ success: true, columns: columnsResult.rows, indexes: indexesResult.rows });
    } else {
      res.status(400).json({ success: false, message: '不支持的数据库类型' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 执行查询
app.post('/api/query', async (req, res) => {
  try {
    const { dbType = 'mysql', host, port, user, password, database, sql } = req.body;
    
    if (dbType === 'mysql') {
      const pool = await getMysqlPool({ host, port, user, password, database });
      const [rows, fields] = await pool.query(sql);
      res.json({ 
        success: true, 
        rows: Array.isArray(rows) ? rows : [rows],
        fields: fields || []
      });
    } else if (dbType === 'postgresql') {
      const pool = getPgPool({ host, port, user, password, database });
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
});

// 获取行数
app.post('/api/count', async (req, res) => {
  try {
    const { dbType = 'mysql', host, port, user, password, database, table } = req.body;
    
    if (dbType === 'mysql') {
      const pool = await getMysqlPool({ host, port, user, password, database });
      const [[{ count }]] = await pool.query(`SELECT COUNT(*) as count FROM \`${table}\``);
      res.json({ success: true, count });
    } else if (dbType === 'postgresql') {
      const pool = getPgPool({ host, port, user, password, database });
      const result = await pool.query(`SELECT COUNT(*) as count FROM "${table}"`);
      res.json({ success: true, count: parseInt(result.rows[0].count) });
    } else {
      res.status(400).json({ success: false, message: '不支持的数据库类型' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 获取所有视图
app.post('/api/views', async (req, res) => {
  try {
    const { dbType = 'mysql', host, port, user, password, database } = req.body;
    
    if (dbType === 'mysql') {
      const pool = await getMysqlPool({ host, port, user, password, database });
      const [views] = await pool.query(`
        SELECT TABLE_NAME as name, VIEW_DEFINITION as definition
        FROM INFORMATION_SCHEMA.VIEWS
        WHERE TABLE_SCHEMA = ?
      `, [database]);
      res.json({ success: true, views });
    } else if (dbType === 'postgresql') {
      const pool = getPgPool({ host, port, user, password, database });
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
});

// 获取所有触发器
app.post('/api/triggers', async (req, res) => {
  try {
    const { dbType = 'mysql', host, port, user, password, database } = req.body;
    
    if (dbType === 'mysql') {
      const pool = await getMysqlPool({ host, port, user, password, database });
      const [triggers] = await pool.query(`
        SELECT TRIGGER_NAME as name, EVENT_MANIPULATION as event,
          EVENT_OBJECT_TABLE as table_name, ACTION_TIMING as timing,
          ACTION_STATEMENT as statement
        FROM INFORMATION_SCHEMA.TRIGGERS
        WHERE TRIGGER_SCHEMA = ?
      `, [database]);
      res.json({ success: true, triggers });
    } else if (dbType === 'postgresql') {
      const pool = getPgPool({ host, port, user, password, database });
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
});

// 导出数据库
app.post('/api/export', async (req, res) => {
  try {
    const { dbType = 'mysql', host, port, user, password, database } = req.body;
    
    if (dbType === 'mysql') {
      const pool = await getMysqlPool({ host, port, user, password, database });
      let sqlDump = '';
      
      sqlDump += `-- DBForge MySQL Dump\n`;
      sqlDump += `-- Generated: ${new Date().toISOString()}\n`;
      sqlDump += `-- Database: ${database}\n\n`;
      sqlDump += `SET FOREIGN_KEY_CHECKS=0;\n\n`;
      
      const [tables] = await pool.query(`SHOW TABLES`);
      
      for (const tableRow of tables) {
        const tableName = tableRow[`Tables_in_${database}`];
        const [createResult] = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
        if (createResult[0]) {
          sqlDump += `\n-- Table: ${tableName}\n`;
          sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
          sqlDump += `${createResult[0]['Create Table']};\n\n`;
        }
        
        const [dataResult] = await pool.query(`SELECT * FROM \`${tableName}\``);
        const dataList = dataResult;
        
        if (dataList.length > 0) {
          const columns = Object.keys(dataList[0]).map(col => `\`${col}\``).join(', ');
          
          for (const row of dataList) {
            const values = Object.values(row).map(val => {
              if (val === null) return 'NULL';
              if (typeof val === 'number') return val;
              return `'${String(val).replace(/'/g, "''")}'`;
            }).join(', ');
            sqlDump += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
          }
          sqlDump += '\n';
        }
      }
      
      sqlDump += `SET FOREIGN_KEY_CHECKS=1;\n`;
      res.json({ success: true, sql: sqlDump });
    } else if (dbType === 'postgresql') {
      const pool = getPgPool({ host, port, user, password, database });
      let sqlDump = '';
      
      sqlDump += `-- DBForge PostgreSQL Dump\n`;
      sqlDump += `-- Generated: ${new Date().toISOString()}\n`;
      sqlDump += `-- Database: ${database}\n\n`;
      
      const tablesResult = await pool.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `);
      
      for (const row of tablesResult.rows) {
        const tableName = row.table_name;
        
        const createResult = await pool.query(`
          SELECT pg_get_tabledef($1)
        `, [tableName]);
        
        if (createResult.rows[0]?.pg_get_tabledef) {
          sqlDump += `\n-- Table: ${tableName}\n`;
          sqlDump += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`;
          sqlDump += `${createResult.rows[0].pg_get_tabledef};\n\n`;
        }
        
        const dataResult = await pool.query(`SELECT * FROM "${tableName}"`);
        
        if (dataResult.rows.length > 0) {
          const columns = Object.keys(dataResult.rows[0]).map(col => `"${col}"`).join(', ');
          
          for (const row of dataResult.rows) {
            const values = Object.values(row).map(val => {
              if (val === null) return 'NULL';
              if (typeof val === 'number') return val;
              return `'${String(val).replace(/'/g, "''")}'`;
            }).join(', ');
            sqlDump += `INSERT INTO "${tableName}" (${columns}) VALUES (${values});\n`;
          }
          sqlDump += '\n';
        }
      }
      
      res.json({ success: true, sql: sqlDump });
    } else {
      res.status(400).json({ success: false, message: '不支持的数据库类型' });
    }
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 DBForge Server running on http://localhost:${PORT} (MySQL + PostgreSQL)`);
});
