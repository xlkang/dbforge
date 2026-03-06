## Why

开发者和数据分析师需要一款网页版的本地数据库管理工具，能够在浏览器中直接管理 SQLite 等本地数据库，类似 Navicat 的功能，但无需安装软件、跨平台使用。

## What Changes

- 创建全新的网页版数据库管理工具 DBForge
- 支持 SQLite 本地数据库连接与管理
- 提供 SQL 查询编辑器，支持语法高亮和自动补全
- 表结构浏览器，可视化查看数据库 schema
- 数据表格视图，支持增删改查
- 数据导出功能（CSV、JSON）
- 完整的 TypeScript 工程化项目结构

## Capabilities

### New Capabilities

- **database-connection**: 数据库连接管理（支持 SQLite 文件连接）
- **query-editor**: SQL 查询编辑器（语法高亮、自动补全、多标签页）
- **schema-browser**: 数据库结构浏览器（表列表、字段信息、索引）
- **data-viewer**: 数据查看与编辑器（表格视图、分页、筛选）
- **data-export**: 数据导出（CSV、JSON 格式）

### Modified Capabilities

- （无）这是全新项目

## Impact

- 新建项目：`~/project/dbforge/`
- 技术栈：TypeScript + React + Vite + better-sqlite3
- 依赖：SQL 解析库、表格组件、代码编辑器组件