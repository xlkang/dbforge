## ADDED Requirements

### Requirement: Database File Connection
The system SHALL allow users to open a local SQLite database file by selecting a .db, .sqlite, or .sqlite3 file from their local filesystem.

#### Scenario: Open existing database file
- **GIVEN** the user has a valid SQLite database file on their local system
- **WHEN** the user clicks "Open Database" and selects the file
- **THEN** the system SHALL display the database name in the connection panel
- **AND** the system SHALL load and display the list of tables in the schema browser

#### Scenario: Invalid file format
- **GIVEN** the user has selected a file that is not a valid SQLite database
- **WHEN** the user attempts to open the file
- **THEN** the system SHALL display an error message: "Invalid SQLite database file"
- **AND** the system SHALL NOT change the current connection state

### Requirement: Connection State Management
The system SHALL maintain the current database connection state and display it in the UI.

#### Scenario: Display connection status
- **GIVEN** a database is currently open
- **WHEN** the UI renders
- **THEN** the system SHALL display the database file name in the header
- **AND** SHALL display a green "Connected" indicator

#### Scenario: Close database connection
- **GIVEN** a database is currently open
- **WHEN** the user clicks "Close" or "Disconnect"
- **THEN** the system SHALL clear all connection state
- **AND** the system SHALL display the "Open Database" prompt