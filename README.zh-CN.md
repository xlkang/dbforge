# DBForge 🛠️

[English](./README.md) | 中文

一个现代化的网页版数据库管理工具 —— 就像 Navicat，但运行在浏览器中。

<p align="center">
  <img src="https://img.shields.io/github/license/xlkang/dbforge" alt="license">
  <img src="https://img.shields.io/github/stars/xlkang/dbforge" alt="stars">
  <img src="https://img.shields.io/github/forks/xlkang/dbforge" alt="forks">
</p>

## ✨ 功能特性

- **多数据库支持** - SQLite (本地文件) & MySQL (通过代理)
- **结构浏览器** - 查看表、字段、索引、主键
- **强大的 SQL 编辑器** - 语法高亮、自动格式化、快捷键
- **数据查看器** - 表格视图、分页、内联编辑
- **查询历史** - 记录和复用查询
- **导入/导出** - 支持 CSV 和 JSON 格式

## 🚀 快速开始

```bash
# 克隆仓库
git clone https://github.com/xlkang/dbforge.git
cd dbforge

# 安装依赖
npm install

# 启动开发服务器 (前端 + 后端)
npm run dev:all

# 或者分别启动：
npm run dev      # 仅前端 (http://localhost:5173)
npm run server   # 后端代理 (http://localhost:3001)
```

## 📖 使用说明

1. **连接数据库**
   - 点击"打开 SQLite 文件"选择本地的 `.db`、`.sqlite` 或 `.sqlite3` 文件
   - 或通过后端代理连接 MySQL

2. **浏览表结构**
   - 在左侧面板选择要查看的表

3. **执行查询**
   - 在编辑器中编写 SQL，按 `Ctrl+Enter` 执行
   - 使用格式化按钮美化 SQL

4. **导出数据**
   - 将查询结果导出为 CSV 或 JSON

## 🛠️ 技术栈

- **前端**: React 19, TypeScript, Vite, TailwindCSS 4
- **编辑器**: CodeMirror 6
- **状态管理**: Zustand
- **SQL 引擎**: sql.js (SQLite WebAssembly)
- **后端**: Express, MySQL2

## 📁 项目结构

```
dbforge/
├── src/                 # 前端源代码
│   ├── components/      # React 组件
│   ├── stores/          # Zustand 状态管理
│   ├── lib/             # 工具函数
│   └── App.tsx          # 主应用组件
├── server/              # 后端 (MySQL 代理)
│   └── src/
│       └── server.js    # Express 服务
├── dist/                # 生产构建
└── openspec/            # OpenSpec 文档
```

## 🤝 贡献

欢迎贡献代码！请随时提交 Pull Request。

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件。

---

<p align="center">由 <a href="https://github.com/xlkang">xlkang</a> 用 ❤️ 构建</p>