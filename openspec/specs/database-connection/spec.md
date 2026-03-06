# Database Connection Specification

## Overview
Web-based SQLite database file upload and connection management.

## Features

### 1. File Selection
- Accept `.db`, `.sqlite`, `.sqlite3` file extensions
- Drag-and-drop support (optional enhancement)
- File size validation (max 100MB recommended)

### 2. Connection Management
- Display connection status (connected/disconnected)
- Show database file name when connected
- Close connection functionality

### 3. Error Handling
- Invalid file format error
- Corrupted database file error
- Connection timeout handling

## UI Components

### Connection Panel
- File input button (hidden, triggered by label)
- Connection status indicator (green dot = connected)
- Database name display
- Close connection button

## Acceptance Criteria

1. ✅ User can select a SQLite database file via file picker
2. ✅ Connection status shows green when database is open
3. ✅ Database name is displayed after successful connection
4. ✅ User can close the database connection
5. ✅ Error messages display for invalid files