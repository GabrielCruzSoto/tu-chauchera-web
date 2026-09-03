# Proposal: Financial Matrix UX/UI Enhancements

## Intent

The Financial Consolidation Matrix (`FinancialMatrix.tsx`) provides key projection and multi-period financial insights. However, its current layout has UX/UI friction: cluttered top controls, lack of tabular alignment for monetary figures, decorative emoji noise in data grids, visual contrast issues in category bullets, and a disconnected "expand/collapse all" action. This change refines the Matrix UX/UI for clarity, scannability, and consistency.

## Scope

### In Scope
- **Control Bar Refactor**: Reorganize matrix controls (grouping tabs, view mode, period navigator, and horizon selector) into clean, balanced toolbar tiers.
- **Integrated Action Toolbar**: Relocate the "Desglosar/Contraer subcategorías" button directly into the main control/action header or table controls.
- **Table Alignment & Typography**: Enforce right-alignment (`text-right`) and `tabular-nums font-mono` for all period numeric values across categories, subcategories, P2P groups, and totals.
- **KPI Card Formatting**: Unify styling, labels, visual hierarchy, and exact CLP formatting across the 4 summary KPI cards.
- **Visual Polish**: Remove redundant decorative emojis/bullets in table rows where they create noise, improve category bullet contrast against dark backgrounds, and maintain sticky column readability.

### Out of Scope
- Modifications to underlying calculation logic in `useMatrixComputation.ts`.
- Changes to data schema or income store calculations.
- Altering the P2P debt model or adding new backend filters.

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `category-management`: Enhances presentation of categories and subcategories in the consolidation matrix view with consistent number alignment, expand/collapse ergonomics, and clean visual tokens.

## Approach

1. **Toolbar & Controls Organization**: Group controls into a structured header:
   - Primary: View selector (`Categorías` vs `Deudas Terceros`) and Presentation mode (`Tabla` vs `Tarjetas`).
   - Secondary / Actions: Period navigation (`← Periodo actual →`), Horizon select (`3 / 6 / 12 meses`), and the Global Expand/Collapse action button.
2. **Numeric Alignment & Tabular Figures**:
   - Update `th` and `td` for all period columns to `text-right tabular-nums font-mono`.
   - Ensure header period labels match column alignment and vertical rhythm.
   - Retain sticky left column styling for category/person names with clear hierarchy.
3. **Typography & Decorator Cleanup**:
   - Strip excessive inline emojis inside data cells, keeping semantic badges.
   - Ensure category indicator bullets use high-contrast emerald/slate colors suitable for dark themes.
4. **Verification**: Run existing unit tests (`FinancialMatrix.test.tsx`) and update UI assertions where classnames/structures changed.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/matrix/components/FinancialMatrix.tsx` | Modified | Reorganized toolbar, table column alignments (`text-right font-mono tabular-nums`), decorator cleanup, KPI card polish |
| `src/features/matrix/__tests__/FinancialMatrix.test.tsx` | Modified | Updated test assertions if button text or layout DOM selectors changed |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Horizontal overflow on narrow mobile screens | Low | Retain responsive `overflow-x-auto` container and sticky first column |
| Regression in Expand/Collapse All state | Low | Preserve `toggleExpandAll` and `expandedCategories` state logic intact with full test coverage |

## Rollback Plan

Revert changes in `src/features/matrix/components/FinancialMatrix.tsx` and related test files via git commit reversal.

## Dependencies

- None (pure frontend React + Tailwind UI refactor).

## Success Criteria

- [ ] All numeric columns in Matrix table are right-aligned and render with `tabular-nums font-mono`.
- [ ] Controls bar is clean, responsive, and contains the integrated expand/collapse action.
- [ ] Decorative bullets/emojis in data rows are cleaned up for better scannability.
- [ ] Summary KPI cards display consistent formatting and clear visual hierarchy.
- [ ] All unit and visual regression tests pass.
