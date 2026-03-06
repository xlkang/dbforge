# Spec: Connection Manager

## ADDED Requirements

### Requirement: 保存连接配置
用户可以保存数据库连接配置，下次快速连接。

#### Scenario: 保存 MySQL 连接
- **Given** 用户填写 MySQL 连接信息（主机、端口、用户名、密码、数据库）
- **When** 点击"保存连接"
- **Then** 配置加密存储到 localStorage
- **And** 显示在连接列表中

#### Scenario: 编辑连接配置
- **Given** 连接已保存
- **When** 用户点击编辑
- **Then** 弹出预填的表单
- **And** 用户可修改并保存

#### Scenario: 删除连接配置
- **Given** 连接列表中有保存的配置
- **When** 用户点击删除
- **Then** 弹出确认，确认后删除

### Requirement: 快速切换连接
用户可以在已保存的连接之间快速切换。

#### Scenario: 切换数据库
- **Given** 有多个保存的连接
- **When** 用户点击另一个连接
- **Then** 自动连接并切换
- **And** 刷新表列表

#### Scenario: 显示连接状态
- **Given** 已连接到数据库
- **When** 查看状态栏
- **Then** 显示当前连接类型、名称、数据库名

### Requirement: SQLite 最近文件
记录最近打开的 SQLite 文件。

#### Scenario: 显示最近文件
- **Given** 用户打开过 SQLite 文件
- **When** 打开数据库面板
- **Then** 显示最近 5 个文件列表
- **And** 点击可快速打开

### Requirement: (可选) SSH 隧道
通过 SSH 隧道连接远程 MySQL。

#### Scenario: SSH 隧道连接
- **Given** 用户配置 SSH 信息（主机、端口、用户名、密钥）
- **When** 点击连接
- **Then** 建立 SSH 隧道后连接 MySQL
