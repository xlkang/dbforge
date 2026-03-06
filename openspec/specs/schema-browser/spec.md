# Schema Browser Specification

## Overview
Display database schema including tables, columns, indexes, and relationships.

## Features

### 1. Table List
- Display all user tables (exclude sqlite system tables)
- Show row count for each table
- Highlight currently selected table

### 2. Column Information
- Column name
- Data type
- Primary key indicator (🔑)
- NOT NULL constraint indicator
- Default value (if any)

### 3. Index Information
- Index name
- Unique constraint indicator
- Indexed columns list

### 4. Row Count
- Display total row count for selected table

## UI Components

### Schema Panel
- Panel header "表结构"
- Table list with row counts
- Expandable table details:
  - Columns section
  - Row count section
  - Indexes section (if any)

## Acceptance Criteria

1. ✅ All non-system tables are listed
2. ✅ Clicking a table shows its details
3. ✅ Column names, types, and constraints are displayed
4. ✅ Indexes are listed with column information
5. ✅ Row count is shown for each table