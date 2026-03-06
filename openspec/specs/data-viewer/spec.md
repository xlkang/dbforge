# Data Viewer Specification

## Overview
Display query results in a tabular format with pagination support.

## Features

### 1. Result Table
- Display column headers
- Display data rows
- Row numbers column
- NULL value display (italicized gray "NULL")
- Horizontal scroll for wide tables
- Vertical scroll for many rows

### 2. Pagination
- 100 rows per page
- First/Previous/Next/Last buttons
- Current page / Total pages display

### 3. Result Information
- Total row count
- Execution time (milliseconds)
- Current table name (if applicable)

### 4. Non-SELECT Results
- Display affected row count for INSERT/UPDATE/DELETE
- Show execution time

### 5. Error Display
- Error message in red box
- Clear button to dismiss error

## UI Components

### Results Header
- Row count display
- Execution time display
- Table name (when applicable)

### Data Table
- Sticky header row
- Alternating row colors (subtle)
- Hover highlight

### Pagination Bar
- Page navigation buttons
- Page number display
- Disabled state for first/last page

### Empty States
- "执行查询查看结果" - before any query
- "查询返回空结果" - for zero rows

## Acceptance Criteria

1. ✅ SELECT results display in table format
2. ✅ NULL values show as italicized "NULL"
3. ✅ Pagination works correctly
4. ✅ Row count and execution time are shown
5. ✅ Non-SELECT shows affected rows count
6. ✅ Errors display in styled message box