# Spec: Data Editing

## ADDED Requirements

### Requirement: 添加新数据
用户可以通过按钮添加新的数据行。

#### Scenario: 添加空行
- **Given** 用户在数据查看器中
- **When** 点击"添加行"按钮
- **Then** 表格底部插入一行空数据
- **And** 用户可编辑各字段
- **And** 点击"保存"执行 INSERT

#### Scenario: 取消添加
- **Given** 用户编辑新行时
- **When** 点击"取消"按钮
- **Then** 撤销所有更改，恢复原状态

### Requirement: 删除数据
用户可以删除数据行。

#### Scenario: 删除单行
- **Given** 用户在数据查看器中
- **When** 选中一行，点击删除按钮
- **Then** 弹出确认对话框
- **And** 确认后执行 DELETE 并刷新数据

#### Scenario: 批量删除
- **Given** 用户选中多行
- **When** 点击批量删除
- **Then** 执行多条 DELETE 并刷新

### Requirement: 修改数据
用户可以直接编辑单元格数据。

#### Scenario: 单元格编辑
- **Given** 用户双击数据单元格
- **When** 进入编辑模式
- **And** 修改值后按 Enter 或失去焦点
- **Then** 执行 UPDATE 并刷新

#### Scenario: 取消编辑
- **Given** 单元格处于编辑模式
- **When** 按 Escape 键
- **Then** 撤销更改，恢复原值

### Requirement: 保存更改
用户可以批量保存所有修改。

#### Scenario: 批量保存
- **Given** 用户有多处修改（增删改）
- **When** 点击"保存更改"按钮
- **Then** 按顺序执行所有 SQL（先删后增先改）
- **And** 成功后刷新数据
- **And** 显示成功/失败提示
