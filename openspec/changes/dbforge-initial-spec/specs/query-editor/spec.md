## ADDED Requirements

### Requirement: SQL Query Input
The system SHALL provide a text editor where users can write and edit SQL queries.

#### Scenario: Type SQL query
- **GIVEN** the user has an open database connection
- **WHEN** the user types SQL in the query editor
- **THEN** the system SHALL display the typed text in real-time

#### Scenario: Execute query
- **GIVEN** the user has typed a valid SQL SELECT statement
- **WHEN** the user clicks "Run" or presses Cmd/Ctrl+Enter
- **THEN** the system SHALL execute the query against the database
- **AND** SHALL display the results in a table below the editor

#### Scenario: Execute non-SELECT query
- **GIVEN** the user has typed an INSERT, UPDATE, or DELETE statement
- **WHEN** the user executes the query
- **THEN** the system SHALL execute the statement
- **AND** SHALL display the number of affected rows

#### Scenario: Query execution error
- **GIVEN** the user has typed an invalid SQL statement
- **WHEN** the user executes the query
- **THEN** the system SHALL display the database error message
- **AND** SHALL NOT display any results

### Requirement: Query Editor Features
The system SHALL provide syntax highlighting and basic auto-completion for SQL.

#### Scenario: SQL syntax highlighting
- **GIVEN** the user is typing a SQL query
- **WHEN** the query contains SQL keywords (SELECT, FROM, WHERE, etc.)
- **THEN** the system SHALL display those keywords in a distinct color

#### Scenario: Query history
- **GIVEN** the user has executed queries in the current session
- **WHEN** the user opens the query history panel
- **THEN** the system SHALL display a list of previously executed queries
- **AND** SHALL allow the user to click to reload a previous query