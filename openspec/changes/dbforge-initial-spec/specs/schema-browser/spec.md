## ADDED Requirements

### Requirement: Table List Display
The system SHALL display a list of all tables in the connected database.

#### Scenario: Display tables after connection
- **GIVEN** a database is successfully connected
- **WHEN** the schema browser panel is visible
- **THEN** the system SHALL display all table names in a hierarchical list

#### Scenario: Empty database
- **GIVEN** a database is connected but contains no tables
- **WHEN** the schema browser renders
- **THEN** the system SHALL display a message: "No tables found"

### Requirement: Table Details View
The system SHALL display detailed information about a selected table.

#### Scenario: View table columns
- **GIVEN** a table is selected in the schema browser
- **WHEN** the user clicks on the table name
- **THEN** the system SHALL display a list of columns with:
  - Column name
  - Data type (INTEGER, TEXT, REAL, BLOB)
  - Whether the column is PRIMARY KEY
  - Whether the column allows NULL

#### Scenario: View table indexes
- **GIVEN** a table is selected
- **WHEN** the user switches to the "Indexes" tab
- **THEN** the system SHALL display all indexes for that table
- **AND** SHALL show the indexed columns

#### Scenario: View table row count
- **GIVEN** a table is selected
- **WHEN** the table details are displayed
- **THEN** the system SHALL show the total number of rows in the table