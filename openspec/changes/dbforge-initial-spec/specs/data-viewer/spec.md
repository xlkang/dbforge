## ADDED Requirements

### Requirement: Table Data Display
The system SHALL display table data in a tabular format with pagination.

#### Scenario: Display table rows
- **GIVEN** a table is selected from the schema browser
- **WHEN** the data viewer loads
- **THEN** the system SHALL display up to 100 rows per page
- **AND** SHALL display column headers matching the table schema

#### Scenario: Navigate pages
- **GIVEN** a table has more than 100 rows
- **WHEN** the user clicks "Next" or a page number
- **THEN** the system SHALL load and display the next set of rows

#### Scenario: Sort by column
- **GIVEN** table data is displayed
- **WHEN** the user clicks a column header
- **THEN** the system SHALL sort the data by that column
- **AND** SHALL toggle between ascending and descending order

### Requirement: Data Editing
The system SHALL allow users to edit cell values in the data viewer.

#### Scenario: Edit cell value
- **GIVEN** a cell is double-clicked for editing
- **WHEN** the user types a new value and presses Enter
- **THEN** the system SHALL update the database with the new value
- **AND** SHALL display a success indicator

#### Scenario: Add new row
- **GIVEN** the user clicks "Add Row" button
- **WHEN** the user fills in values and clicks "Save"
- **THEN** the system SHALL insert a new row into the table
- **AND** SHALL refresh the data viewer

#### Scenario: Delete row
- **GIVEN** a row is selected
- **WHEN** the user clicks "Delete" and confirms
- **THEN** the system SHALL delete the row from the table
- **AND** SHALL refresh the data viewer

### Requirement: Data Filtering
The system SHALL allow users to filter displayed data.

#### Scenario: Filter by column value
- **GIVEN** the user enters a filter value in a column filter input
- **WHEN** the user presses Enter or clicks Apply
- **THEN** the system SHALL display only rows matching the filter