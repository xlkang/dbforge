import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import initSqlJs from 'sql.js';
import apiRoutes from './routes/api';

// 中间件
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 文件上传
const upload = multer({ storage: multer.memoryStorage() });

// SQLite 内存数据库
let SQL: initSqlJs.SqlJsStatic;

// 初始化 SQL.js
async function initSQL() {
  SQL = await initSqlJs();
}

// API 路由
app.use('/api', apiRoutes);

// ==================== 错误处理中间件 ====================

// 404 处理
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API 端点不存在' });
});

// 全局错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  
  // Multer 上传错误
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `上传错误: ${err.message}` });
  }
  
  // JSON 解析错误
  if (err instanceof SyntaxError) {
    return res.status(400).json({ success: false, message: 'JSON 解析错误' });
  }
  
  // 默认错误
  res.status(500).json({ 
    success: false, 
    message: err.message || '服务器内部错误' 
  });
});

// ==================== SQLite 相关 ====================

// POST /api/sqlite/open - 打开 SQLite 文件
app.post('/api/sqlite/open', upload.single('file'), async (req, res) => {
  try {
    let db: initSqlJs.Database;
    
    if (req.file) {
      // 文件上传
      db = new SQL.Database(new Uint8Array(req.file.buffer));
    } else if (req.body.path) {
      // 文件路径
      const fs = await import('fs');
      const buffer = fs.readFileSync(req.body.path);
      db = new SQL.Database(buffer);
    } else {
      // 内存数据库
      db = new SQL.Database();
    }
    
    // 获取所有表
    const tables = db.exec(`
      SELECT name, type FROM sqlite_master 
      WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%'
    `);
    
    res.json({ 
      success: true, 
      tables: tables[0]?.values.map((row: any) => ({
        name: row[0],
        type: row[1]
      })) || []
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/sqlite/tables - 获取 SQLite 表
app.post('/api/sqlite/tables', async (req, res) => {
  try {
    const { path: filePath } = req.body;
    const fs = await import('fs');
    const buffer = fs.readFileSync(filePath);
    const db = new SQL.Database(buffer);
    
    const tables = db.exec(`
      SELECT name, type FROM sqlite_master 
      WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%'
    `);
    
    res.json({ 
      success: true, 
      tables: tables[0]?.values.map((row: any) => ({
        name: row[0],
        type: row[1]
      })) || []
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/sqlite/schema - 获取 SQLite 表结构
app.post('/api/sqlite/schema', async (req, res) => {
  try {
    const { path: filePath, table } = req.body;
    const fs = await import('fs');
    const buffer = fs.readFileSync(filePath);
    const db = new SQL.Database(buffer);
    
    // 表结构
    const schema = db.exec(`PRAGMA table_info("${table}")`);
    const columns = schema[0]?.values.map((row: any) => ({
      name: row[1],
      type: row[2],
      notnull: row[3],
      dflt_value: row[4],
      pk: row[5]
    })) || [];
    
    // 索引
    const indexes = db.exec(`PRAGMA index_list("${table}")`);
    const indexList = indexes[0]?.values.map((row: any) => ({
      name: row[1],
      unique: row[2]
    })) || [];
    
    res.json({ success: true, columns, indexes: indexList });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/sqlite/query - 执行 SQLite 查询
app.post('/api/sqlite/query', async (req, res) => {
  try {
    const { path: filePath, sql } = req.body;
    const fs = await import('fs');
    const buffer = fs.readFileSync(filePath);
    const db = new SQL.Database(buffer);
    
    const result = db.exec(sql);
    
    if (result.length === 0) {
      res.json({ success: true, rows: [], fields: [] });
      return;
    }
    
    const rows = result[0].values.map((row: any) => {
      const obj: Record<string, any> = {};
      result[0].columns.forEach((col: string, i: number) => {
        obj[col] = row[i];
      });
      return obj;
    });
    
    res.json({ success: true, rows, fields: result[0].columns });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/sqlite/count - 获取 SQLite 表行数
app.post('/api/sqlite/count', async (req, res) => {
  try {
    const { path: filePath, table } = req.body;
    const fs = await import('fs');
    const buffer = fs.readFileSync(filePath);
    const db = new SQL.Database(buffer);
    
    const result = db.exec(`SELECT COUNT(*) as count FROM "${table}"`);
    const count = result[0]?.values[0]?.[0] || 0;
    
    res.json({ success: true, count });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/sqlite/views - 获取视图
app.post('/api/sqlite/views', async (req, res) => {
  try {
    const { path: filePath } = req.body;
    const fs = await import('fs');
    const buffer = fs.readFileSync(filePath);
    const db = new SQL.Database(buffer);
    
    const views = db.exec(`
      SELECT name, sql FROM sqlite_master WHERE type = 'view'
    `);
    
    res.json({ 
      success: true, 
      views: views[0]?.values.map((row: any) => ({
        name: row[0],
        sql: row[1]
      })) || []
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/sqlite/triggers - 获取触发器
app.post('/api/sqlite/triggers', async (req, res) => {
  try {
    const { path: filePath } = req.body;
    const fs = await import('fs');
    const buffer = fs.readFileSync(filePath);
    const db = new SQL.Database(buffer);
    
    const triggers = db.exec(`
      SELECT name, sql, tbl_name FROM sqlite_master WHERE type = 'trigger'
    `);
    
    res.json({ 
      success: true, 
      triggers: triggers[0]?.values.map((row: any) => ({
        name: row[0],
        sql: row[1],
        table: row[2]
      })) || []
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/sqlite/export - 导出 SQLite
app.post('/api/sqlite/export', async (req, res) => {
  try {
    const { path: filePath, format = 'sql' } = req.body;
    const fs = await import('fs');
    const buffer = fs.readFileSync(filePath);
    const db = new SQL.Database(buffer);
    
    // 获取所有表
    const tables = db.exec(`
      SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
    `);
    
    let dump = '-- SQLite Database Export\n-- Generated by DBForge\n\n';
    
    for (const tableRow of tables[0]?.values || []) {
      const tableName = tableRow[0];
      
      // 表结构
      const create = db.exec(`SELECT sql FROM sqlite_master WHERE name = '${tableName}'`);
      dump += `\n${create[0]?.values[0]?.[0]};\n`;
      
      // 数据
      const data = db.exec(`SELECT * FROM "${tableName}"`);
      if (data[0]) {
        for (const row of data[0].values) {
          const values = row.map((v: any) => {
            if (v === null) return 'NULL';
            return typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : JSON.stringify(v);
          }).join(', ');
          dump += `INSERT INTO "${tableName}" VALUES (${values});\n`;
        }
      }
    }
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="export.sql"');
    res.send(dump);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/sqlite/backup - 备份 SQLite
app.post('/api/sqlite/backup', async (req, res) => {
  try {
    const { path: filePath } = req.body;
    const fs = await import('fs');
    const buffer = fs.readFileSync(filePath);
    const db = new SQL.Database(buffer);
    
    // 备份所有表
    const tables = db.exec(`
      SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
    `);
    
    const backup: Record<string, any[]> = {};
    
    for (const tableRow of tables[0]?.values || []) {
      const tableName = String(tableRow[0]);
      const data = db.exec(`SELECT * FROM "${tableName}"`);
      
      if (data[0]) {
        backup[tableName] = data[0].values.map((row: any) => {
          const obj: Record<string, any> = {};
          data[0].columns.forEach((col: string, i: number) => {
            obj[col] = row[i];
          });
          return obj;
        });
      }
    }
    
    res.json({ success: true, backup, timestamp: new Date().toISOString() });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 启动服务器
initSQL().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 DBForge Server running on http://localhost:${PORT}`);
  });
});

export default app;
