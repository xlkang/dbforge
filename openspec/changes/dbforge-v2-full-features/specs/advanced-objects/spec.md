# Spec: Advanced Objects

## ADDED Requirements

### Requirement: 索引管理
用户可以创建和删除索引。

#### Scenario: 创建索引
- **Given** 用户在表详情页点击"索引"标签
- **When** 点击"新建索引"
- **And** 填写索引名、选择列、选择索引类型（普通/唯一）
- **Then** 执行 CREATE INDEX 并刷新索引列表

#### Scenario: 删除索引
- **Given** 索引列表显示
- **When** 用户点击索引旁的删除按钮
- **Then** 弹出确认，确认后执行 DROP INDEX

### Requirement: 视图管理
用户可以查看和管理数据库视图。

#### Scenario: 查看视图列表
- **Given** 数据库中有视图
- **When** 切换到"视图"标签
- **Then** 显示所有视图名称

#### Scenario: 查看视图数据
- **Given** 视图列表显示
- **When** 双击某个视图
- **Then** 打开标签页显示视图数据（只读）

### Requirement: 触发器管理
用户可以查看触发器。

#### Scenario: 查看触发器列表
- **Given** 数据库中有触发器
- **When** 切换到"触发器"标签
- **Then** 显示所有触发器名称和关联表

### Requirement: 数据库备份
用户可以导出完整数据库。

#### Scenario: 导出数据库
- **Given** 已连接数据库
- **When** 用户点击"备份数据库"
- **Then** 弹出保存对话框
- **And** 导出为 .db 文件（SQLite）或 SQL 脚本（MySQL）

#### Scenario: 导入数据库
- **Given** 用户有数据库备份文件
- **When** 点击"导入数据库"
- **Then** 解析 SQL 脚本并执行

### Requirement: 简化 ER 图
以卡片形式展示表关系。

#### Scenario: 查看 ER 图
- **Given** 用户点击"ER 图"视图
- **Then** 显示所有表的卡片
- **And** 卡片显示表名和字段
- **And** 有外键关联的表之间显示连接线

#### Scenario: 表卡片交互
- **Given** ER 图显示
- **When** 双击表卡片
- **Then** 打开该表的标签页
