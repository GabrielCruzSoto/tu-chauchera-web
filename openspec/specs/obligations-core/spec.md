# Delta Specification: obligations-core

## MODIFIED Requirements

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
