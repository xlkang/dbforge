# DBForge

网页版 SQLite 数据库管理工具

## 功能特性

- 📂 **数据库连接** - 支持打开本地 SQLite 数据库文件 (.db, .sqlite, .sqlite3)
- 📋 **表结构浏览** - 查看所有表、字段信息、索引、主键
- ✏️ **SQL 查询编辑器** - 语法高亮支持，支持 Ctrl+Enter 执行
- 📊 **数据查看器** - 表格视图、分页、排序
- 📥 **数据导出** - 支持导出 CSV 和 JSON 格式

## 技术栈

- React + TypeScript + Vite
- Tailwind CSS
- sql.js (SQLite WebAssembly)
- Zustand (状态管理)

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
```

## 使用说明

1. 点击左侧面板选择 SQLite 数据库文件
2. 在左侧"表结构"中点击要查看的表
3. 在 SQL 编辑器中编写查询，按 Ctrl+Enter 执行
4. 可导出查询结果为 CSV 或 JSON

## 注意事项

- 所有数据操作在浏览器中完成，不会上传至服务器
- 支持的数据库：SQLite (仅本地文件)