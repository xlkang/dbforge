## Context

DBForge 是一款网页版本地数据库管理工具，目标是为开发者提供类似 Navicat 的数据库管理体验，但运行在浏览器中。主要用户场景：
- 开发者快速查看/编辑本地 SQLite 数据库
- 数据分析师进行轻量级数据探索
- 无需安装桌面软件，跨平台使用

## Goals / Non-Goals

**Goals:**
- 支持 SQLite 数据库的文件级连接（.db, .sqlite, .sqlite3）
- 提供功能完整的 SQL 查询编辑器
- 可视化展示数据库结构（表、字段、索引）
- 数据表格视图，支持基本 CRUD 操作
- 数据导出为 CSV/JSON 格式
- 完整的 TypeScript 工程化结构

**Non-Goals:**
- 不支持远程数据库连接（MySQL、PostgreSQL 等）
- 不支持数据库用户权限管理
- 不支持数据库创建/删除操作（只管理现有数据库）
- 不支持存储过程、触发器等高级特性

## Decisions

### 1. 前端框架：React + Vite
- **选择原因**: 生态成熟、TypeScript 支持优秀、开发体验好
- **替代考虑**: Vue 3 - 同样优秀，但团队更熟悉 React

### 2. 数据库访问：better-sqlite3 + Web Worker
- **选择原因**: better-sqlite3 是 Node.js 下最快的 SQLite 封装，通过 Web Worker 避免阻塞主线程
- **替代考虑**: sql.js (WebAssembly) - 纯前端但性能较差

### 3. SQL 编辑器：CodeMirror 6
- **选择原因**: 成熟的代码编辑器，支持 SQL 语法高亮、自动补全
- **替代考虑**: Monaco Editor - 功能强大但体积较大

### 4. 状态管理：Zustand
- **选择原因**: 轻量、简洁、TypeScript 友好
- **替代考虑**: Redux - 过于复杂

### 5. UI 组件：Tailwind CSS + Radix UI
- **选择原因**: Tailwind 快速样式、Radix 提供无障碍交互组件
- **替代考虑**: Material UI - 过于笨重

### 6. 项目结构：Monorepo
- **选择原因**: 清晰分离前端(server) 和核心逻辑(core)
- **替代考虑**: 单仓库 - 简单但难以扩展

## Risks / Trade-offs

- [Risk] 大文件数据库可能导致内存问题 → [Mitigation] 分页加载、限制单次查询行数
- [Risk] Web Worker 调试困难 → [Mitigation] 开发环境提供热重载、生产环境详细日志
- [Risk] SQLite 特定语法兼容 → [Mitigation] 限制支持标准 SQL 方言

## Migration Plan

本项目为全新开发，无需迁移。

## Open Questions

- 是否需要支持多个数据库文件同时打开？（后续版本）
- 是否需要支持查询历史记录？（后续版本）
- 是否需要支持自定义 SQL 片段保存？（后续版本）