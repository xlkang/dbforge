import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 连接池缓存
const pools = new Map();

// 创建连接池
async function getPool(config) {
  const key = `${config.host}:${config.port}:${config.database}`;
  
  if (!pools.has(key)) {
    pools.set(key, mysql.createPool({
      host: config.host,
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
    }));
  }
  
  return pools.get(key);
}

// 测试连接
app.post('/api/connect', async (req, res) => {
  try {
    const { host, port, user, password, database } = req.body;
    const pool = await getPool({ host, port, user, password, database });
    const connection = await pool.getConnection();
    connection.release();
    res.json({ success: true, message: '连接成功' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 获取所有表
app.post('/api/tables', async (req, res) => {
  try {
    const { host, port, user, password, database } = req.body;
    const pool = await getPool({ host, port, user, password, database });
    
    const [tables] = await pool.query(`
      SELECT TABLE_NAME, TABLE_COMMENT
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ?
    `, [database]);
    
    res.json({ success: true, tables });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 获取表结构
app.post('/api/schema', async (req, res) => {
  try {
    const { host, port, user, password, database, table } = req.body;
    const pool = await getPool({ host, port, user, password, database });
    
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
    
    const [indexes] = await pool.query(`
      SHOW INDEX FROM \`${table}\`
    `, []);
    
    res.json({ success: true, columns, indexes });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 执行查询
app.post('/api/query', async (req, res) => {
  try {
    const { host, port, user, password, database, sql } = req.body;
    const pool = await getPool({ host, port, user, password, database });
    
    const [rows, fields] = await pool.query(sql);
    
    res.json({ 
      success: true, 
      rows: Array.isArray(rows) ? rows : [rows],
      fields: fields || []
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 获取行数
app.post('/api/count', async (req, res) => {
  try {
    const { host, port, user, password, database, table } = req.body;
    const pool = await getPool({ host, port, user, password, database });
    
    const [[{ count }]] = await pool.query(`SELECT COUNT(*) as count FROM \`${table}\``);
    
    res.json({ success: true, count });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 DBForge Server running on http://localhost:${PORT}`);
});