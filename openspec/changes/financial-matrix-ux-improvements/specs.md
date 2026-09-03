# Specifications: Financial Matrix UX/UI Enhancements

## Purpose

Define the functional, accessibility, and visual requirements for the UX/UI refinement of the Financial Consolidation Matrix (`FinancialMatrix.tsx`), addressing toolbar layout structure, expand/collapse integration, numerical data scannability, KPI cards hierarchy, and visual polish.

---

## Deliverable 1: Control Bar Architecture & Responsive Layout

### Requirement: Structured Multi-Tier Matrix Toolbar
The system MUST arrange matrix controls into a clear, responsive, multi-tier layout separating high-level view toggles from period navigation and view actions.

#### Scenario: Desktop multi-tier rendering
- GIVEN the user views the Financial Matrix on a desktop viewport (>= 1024px)
- WHEN the component renders
- THEN the toolbar MUST display primary view mode selectors (`Categorías` / `Deudas Terceros`, `Tabla` / `Tarjetas`) and period controls (`Horizonte`, `Period Navigator`, `Acciones`) with structured grouping and balanced alignment
- AND each interactive control SHALL have a minimum touch/click target of at least 36px height

#### Scenario: Mobile and tablet responsive wrapping
- GIVEN the user views the Financial Matrix on a viewport < 1024px
- WHEN the component renders
- THEN controls MUST wrap gracefully using flex/grid layout without horizontal clipping
- AND period navigation and horizon selectors SHALL remain accessible with full-width or auto-stretched rows

---

## Deliverable 2: Integrated Action Toolbar & Expand/Collapse Ergonomics

### Requirement: Integrated Subcategory Toggle Action
The system MUST integrate the global "Expand/Collapse all subcategories" action directly into the secondary control bar or table header controls rather than leaving it isolated or floating.

#### Scenario: Toggle all subcategories expanded
- GIVEN the matrix is in Category view with subcategories collapsed
- WHEN the user clicks the "Desglosar subcategorías" button
- THEN the system MUST expand all categories with subcategories simultaneously
- AND the button label/state MUST update to "Contraer subcategorías" with an accessible icon indicator
- AND the button MUST have an explicit `aria-expanded="true"` and `aria-label`

#### Scenario: Toggle all subcategories collapsed
- GIVEN all categories are currently expanded
- WHEN the user clicks "Contraer subcategorías"
- THEN the system MUST collapse all subcategory rows
- AND the button label/state MUST update to "Desglosar subcategorías" with `aria-expanded="false"`

---

## Deliverable 3: Table Alignment, Typography & Tabular Figures

### Requirement: Right-Aligned Monospace Tabular Figures
The system MUST format all monetary figures and numerical period values across table headers, category rows, subcategory rows, P2P rows, and total summary rows using right-alignment (`text-right`), monospace numbers (`font-mono`), and tabular numeric glyphs (`tabular-nums`).

#### Scenario: Consistent numeric column alignment
- GIVEN the Financial Matrix table view is displayed with multiple monthly periods
- WHEN numeric values for personal expenses, P2P obligations, or totals are rendered in `<th>` and `<td>` cells
- THEN all period data cells and period column headers MUST use `text-right tabular-nums font-mono`
- AND the left sticky column containing category and person names MUST remain left-aligned (`text-left`)

#### Scenario: Zero and negative value formatting
- GIVEN a period has an expense amount of `$0` or a negative net cashflow
- WHEN the cell renders
- THEN `$0` values MUST be displayed with subtle muted styling (`text-slate-500` or `text-slate-600`)
- AND negative values MUST retain the `font-mono tabular-nums` styling with high-contrast indicator color (e.g. `text-rose-400`)

---

## Deliverable 4: KPI Summary Cards Formatting & Visual Hierarchy

### Requirement: Unified Financial KPI Cards
The system MUST render the 4 summary KPI cards (Ingresos Proyectados, Gastos Personales, Por Cobrar a Terceros, Margen Neto Proyectado) with unified card geometry, standardized CLP currency formatting, and unambiguous semantic color coding.

#### Scenario: Rendering KPI card metrics with CLP format
- GIVEN calculated values for income, expenses, receivables, and net margin across the selected period horizon
- WHEN the KPI summary section renders
- THEN each card MUST display its primary value using `formatCLP()` in high-visibility font weight (`text-xl font-bold font-mono tracking-tight`)
- AND positive net margin MUST be highlighted with emerald accent tokens (`text-emerald-400 bg-emerald-500/10 border-emerald-500/30`)
- AND negative net margin MUST be highlighted with rose accent tokens (`text-rose-400 bg-rose-500/10 border-rose-500/30`)

#### Scenario: KPI Card accessibility and labels
- GIVEN the KPI summary grid
- WHEN inspected by assistive technologies
- THEN each metric card MUST include clear semantic headings (`<h3>` or `aria-label`) and descriptive subtitle copy indicating the active date horizon

---

## Deliverable 5: Visual Polish, Noise Reduction & Dark Theme Contrast

### Requirement: Removal of Decorative Noise & Enhanced Contrast
The system MUST remove redundant decorative emojis within repeating data grid cells and ensure all category badges, indicator bullets, and sticky columns comply with WCAG AA contrast standards (> 4.5:1) against dark slate backgrounds (`bg-slate-900`, `bg-slate-950`).

#### Scenario: Data table cell cleanliness
- GIVEN a rendered table row for a category or subcategory
- WHEN the row displays period amounts
- THEN cells MUST NOT contain decorative emojis (e.g. 💳, 🛒, ⚡) inside monetary values
- AND semantic category indicator dots MUST use high-contrast theme color tokens with minimum 3:1 graphical contrast against `bg-slate-900`

#### Scenario: Sticky column contrast and depth
- GIVEN the user scrolls horizontally across wide multi-period tables (6 to 12 months)
- WHEN the first column (Category/Person Name) remains fixed in place
- THEN the sticky column MUST maintain a solid background (`bg-slate-900` / `bg-slate-950`) with an explicit border separator (`border-r border-slate-800`) to prevent text overlap and visual ghosting
