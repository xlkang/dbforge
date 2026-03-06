# Query Editor Specification

## Overview
SQL query input and execution interface for SQLite databases.

## Features

### 1. Query Input
- Multi-line text input for SQL queries
- Placeholder text when no database connected
- Monospace font for code readability

### 2. Query Execution
- Execute query via button click
- Execute query via Ctrl+Enter keyboard shortcut
- Show loading state during execution
- Disable execution when not connected

### 3. Query History
- Store last 50 executed queries
- Display query history in collapsible panel
- Click history item to load query into editor

### 4. Error Display
- Show SQL error messages in result panel
- Clear error display on new query execution

## UI Components

### Query Editor Panel
- Panel header with title
- Run button (disabled when not connected)
- Textarea for SQL input
- Keyboard shortcut hint

### Query History Panel
- Collapsible section
- Truncated query preview (50 chars)
- Click to load query

## Acceptance Criteria

1. ✅ User can type SQL queries in the editor
2. ✅ Ctrl+Enter executes the current query
3. ✅ Run button executes the current query
4. ✅ Query history is saved and displayable
5. ✅ Clicking history item loads query into editor