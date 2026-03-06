# Spec: Query Enhancement

## ADDED Requirements

### Requirement: SQL 自动补全
编辑器支持 SQL 关键词和表名/列名补全。

#### Scenario: 关键词补全
- **Given** 用户在编辑器中输入 SQL
- **When** 输入前几个字符
- **Then** 显示下拉建议，包含匹配的 SQL 关键词

#### Scenario: 表名列名补全
- **Given** 用户连接到数据库
- **When** 输入 FROM 或 JOIN 后
- **Then** 显示数据库中的表名列表
- **And** 选择表后，输入列名前提示列名

### Requirement: 结果排序
查询结果可以按任意列排序。

#### Scenario: 点击列头排序
- **Given** 显示查询结果表格
- **When** 用户点击列头
- **Then** 按该列升序排序
- **And** 再次点击降序
- **And** 第三次点击取消排序

#### Scenario: 多列排序
- **Given** 用户按住 Shift 点击多列
- **Then** 按点击顺序组合排序

### Requirement: 结果筛选
用户可以快速筛选查询结果。

#### Scenario: 列筛选
- **Given** 查询结果加载完成
- **When** 用户点击列头的筛选图标
- **Then** 显示筛选输入框
- **And** 输入筛选条件后实时过滤显示

#### Scenario: 全局搜索
- **Given** 有查询结果
- **When** 用户在搜索框输入关键词
- **Then** 在所有列中搜索匹配行
- **And** 高亮匹配文本
