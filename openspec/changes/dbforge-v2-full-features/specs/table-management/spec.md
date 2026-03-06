# Spec: Table Management

## ADDED Requirements

### Requirement: 删除表
用户可以删除数据库中的表。

#### Scenario: 删除确认
- **Given** 用户在表列表中右键点击某个表
- **When** 选择"删除表"选项
- **Then** 弹出确认对话框，显示表名
- **And** 用户确认后，执行 DROP TABLE 并刷新表列表
- **And** 显示成功提示

#### Scenario: 取消删除
- **Given** 删除确认对话框显示
- **When** 用户点击"取消"
- **Then** 对话框关闭，无任何操作

### Requirement: 重命名表
用户可以重命名数据库中的表。

#### Scenario: 重命名成功
- **Given** 用户右键点击表，选择"重命名"
- **When** 输入新表名并确认
- **Then** 执行 ALTER TABLE ... RENAME TO 并刷新列表
- **And** 显示成功提示

#### Scenario: 重命名冲突
- **Given** 重命名对话框显示
- **When** 输入已存在的表名
- **Then** 显示错误提示，禁止提交

### Requirement: ALTER TABLE - 添加字段
用户可以向现有表添加新字段。

#### Scenario: 添加字段
- **Given** 用户在表详情页点击"添加字段"
- **When** 填写字段名、类型、是否可为 NULL 等属性
- **Then** 执行 ALTER TABLE ADD COLUMN 并刷新表结构
- **And** 显示成功提示

### Requirement: ALTER TABLE - 删除字段
用户可以删除表中的字段。

#### Scenario: 删除字段
- **Given** 用户在表结构视图中点击字段旁的删除按钮
- **When** 确认删除操作
- **Then** 执行 ALTER TABLE DROP COLUMN 并刷新
- **And** 显示成功提示

### Requirement: ALTER TABLE - 修改字段
用户可以修改字段属性（类型、是否可为 NULL、默认值）。

#### Scenario: 修改字段
- **Given** 用户点击字段编辑按钮
- **When** 修改字段属性并确认
- **Then** 执行 ALTER TABLE MODIFY/ALTER COLUMN 并刷新
