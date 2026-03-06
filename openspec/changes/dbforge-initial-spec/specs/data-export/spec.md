## ADDED Requirements

### Requirement: Export to CSV
The system SHALL allow users to export table data or query results to CSV format.

#### Scenario: Export table to CSV
- **GIVEN** a table is selected in the data viewer
- **WHEN** the user clicks "Export" > "CSV"
- **THEN** the system SHALL download a CSV file containing all rows
- **AND** the file SHALL include column headers in the first row

#### Scenario: Export query results to CSV
- **GIVEN** query results are displayed
- **WHEN** the user clicks "Export" > "CSV"
- **THEN** the system SHALL download a CSV file with the result data

### Requirement: Export to JSON
The system SHALL allow users to export table data or query results to JSON format.

#### Scenario: Export table to JSON
- **GIVEN** a table is selected in the data viewer
- **WHEN** the user clicks "Export" > "JSON"
- **THEN** the system SHALL download a JSON file containing all rows as an array of objects

#### Scenario: Export query results to JSON
- **GIVEN** query results are displayed
- **WHEN** the user clicks "Export" > "JSON"
- **THEN** the system SHALL download a JSON file with the result data

### Requirement: Export Options
The system SHALL provide export options for customization.

#### Scenario: Export with custom filename
- **GIVEN** the export dialog is open
- **WHEN** the user enters a custom filename
- **THEN** the system SHALL use that filename for the downloaded file

#### Scenario: Export all rows vs current page
- **GIVEN** the export dialog is open
- **WHEN** the user selects "All rows" or "Current page"
- **THEN** the system SHALL export the corresponding data set