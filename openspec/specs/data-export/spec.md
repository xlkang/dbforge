# Data Export Specification

## Overview
Export query results to standard file formats (CSV, JSON).

## Features

### 1. Export Formats
- **CSV**: Comma-separated values with proper escaping
- **JSON**: Array of objects with key-value pairs

### 2. Export Trigger
- Export buttons in Export Panel
- Disabled when no data to export

### 3. File Naming
- Default: `{table_name}_result.{format}`
- Fallback: `query_result.{format}`

### 4. CSV Formatting
- Header row with column names
- Proper escaping for:
  - Commas → wrap in quotes
  - Quotes → double quotes
  - Newlines → wrap in quotes

### 5. JSON Formatting
- Pretty-printed (2-space indent)
- Full object representation

## UI Components

### Export Panel
- Panel header "导出数据"
- CSV export button
- JSON export button
- Disabled state when no results

## Acceptance Criteria

1. ✅ CSV export produces valid CSV file
2. ✅ JSON export produces valid JSON file
3. ✅ Buttons disabled when no data to export
4. ✅ Files download with appropriate names
5. ✅ Special characters are properly escaped