# Capability Specification: category-management

## Purpose
Provides management interfaces and workflows to create, update, and delete custom obligation categories with associated visual color themes, both from a dedicated management view and inline from obligation forms.

## Requirements

### Requirement: Category Creation and Customization
The system MUST allow users to create new categories by specifying a non-empty name and selecting a color from a predefined curated palette. Category identifiers MUST be unique UUIDs.

#### Scenario: Successful category creation via management modal
- GIVEN the user is on the Category Settings view
- WHEN the user inputs a name "Seguros Médicos", selects color "rose", and confirms creation
- THEN the system MUST persist the new category in the categories store
- AND the new category SHALL be immediately available for selection across all obligation workflows

#### Scenario: Validation of duplicate or empty category names
- GIVEN the user is creating a category
- WHEN the user attempts to submit an empty name or whitespace-only name
- THEN the system MUST reject the submission and display a validation error message

### Requirement: Inline Quick Category Creation
The system MUST allow creating custom categories directly from the obligation creation/editing form without losing existing form input state.

#### Scenario: Quick create category from obligation modal
- GIVEN the user has partially filled out the Obligation Form Modal
- WHEN the user selects the "+ Crear nueva categoría..." option in the Category dropdown
- THEN the system MUST prompt for category name and color selection
- AND upon creation, the system MUST select the newly created category in the form without resetting other fields

### Requirement: Category Editing and Color Update
The system MUST allow users to update the display name and badge color of existing custom and default categories.

#### Scenario: Updating category name and color
- GIVEN an existing category with name "Servicios Básicos" and color "sky"
- WHEN the user changes the name to "Cuentas del Hogar" and color to "amber"
- THEN the system MUST update the category record
- AND all obligation views and badges displaying this category MUST reflect the updated name and color immediately

### Requirement: Category Deletion with Safety Validation
The system MUST prevent accidental data loss when deleting categories and MUST prohibit deleting categories assigned to active obligations.

#### Scenario: Block deletion of category in use
- GIVEN a category currently assigned to one or more active (PENDING) obligations
- WHEN the user attempts to delete the category
- THEN the system MUST block deletion and notify the user that active obligations depend on it

#### Scenario: Successful deletion of unused category
- GIVEN a category with zero assigned obligations
- WHEN the user confirms deletion of the category
- THEN the system MUST remove the category from the store and sync state
