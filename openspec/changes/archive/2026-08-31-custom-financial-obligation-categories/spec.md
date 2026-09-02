# Functional Specification — custom-financial-obligation-categories

## Change Name
`custom-financial-obligation-categories`

## Source
Based on: `openspec/changes/custom-financial-obligation-categories/proposal.md`

---

## Capability 1: category-management (New)

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

---

## Capability 2: obligations-core (Modified)

### Requirement: Category Management and Fixtures

The system MUST initialize with an expanded default fixture set tailored for Chilean household finances, and support dynamic category association for all financial obligations.
(Previously: System initialized with only three hardcoded categories: Bancos & Créditos, Servicios Básicos, Suscripciones)

#### Scenario: Expanded default presets on initialization
- GIVEN the application is initialized for the first time or categories store is empty
- WHEN default categories are seeded
- THEN the system MUST provide default categories including:
  - Bancos & Créditos (emerald)
  - Hipotecario (indigo)
  - Automotriz (cyan)
  - Tarjetas & Retail (orange)
  - Educación (violet)
  - Salud & Seguros (rose)
  - Servicios Básicos (sky)
  - Suscripciones (purple)
  - Impuestos & Contribuciones (amber)

#### Scenario: Dynamic Category Selection in Obligation Creation
- GIVEN user has both default and custom categories available in the store
- WHEN user opens the Obligation Form
- THEN the category selector MUST dynamically display all active categories grouped or ordered alphabetically
- AND saving the obligation MUST associate the selected `categoryId`

#### Scenario: Graceful fallback for undefined category rendering
- GIVEN an obligation with a categoryId that cannot be resolved in the store
- WHEN the obligation is rendered in the list or financial matrix
- THEN the system MUST display a fallback badge "General / Sin Categoría" with default styling without throwing runtime errors
