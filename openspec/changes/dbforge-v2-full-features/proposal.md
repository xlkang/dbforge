# Proposal: DBForge V2 全功能版本

## Why

当前 DBForge MVP 已完成基础功能，但缺少一些关键的企业级特性（如表管理、数据编辑、多标签页等），限制了其在实际工作场景中的使用。本次迭代将补全这些核心功能，使 DBForge 成为真正可替代 Navicat 的网页版数据库管理工具。

## What Changes

### 1. 表管理功能
- 删除/重命名表（右键菜单操作）
- ALTER TABLE 支持（增删字段、修改字段属性）

### 2. 数据编辑功能
- 数据增删改（按钮操作）
- 表格内联编辑优化

### 3. 多标签页
- 同时打开多个表/查询
- 标签页切换与管理

### 4. 查询增强
- SQL 自动补全（CodeMirror 智能提示）
- 查询结果排序（点击列头）
- 结果快速筛选

### 5. 连接管理
- 保存连接配置（本地存储）
- 多数据库快速切换
- SSH 隧道支持（可选）

### 6. 高级功能
- 索引管理（创建/删除索引）
- 视图/触发器管理
- 数据库备份/恢复
- ER 图生成（可视化表关系）

## Capabilities

| Capability | 类型 |
|-------------|------|
| table-management | NEW |
| data-editing | NEW |
| multi-tabs | NEW |
| query-enhancement | NEW |
| connection-manager | NEW |
| advanced-objects | NEW |

## Impact

- 前端代码量预计增加 30-40%
- 需要新增多个 React 组件
- 状态管理复杂度提升
- 后端可能需要扩展 API

## Risks

- 功能过多可能导致单次 PR 过大
- ER 图生成需要额外的图形库依赖
- SSH 隧道实现复杂度较高