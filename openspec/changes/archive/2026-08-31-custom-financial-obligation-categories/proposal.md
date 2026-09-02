# Proposal: Custom and Expanded Financial Obligation Categories

## Intent
The current obligation creation form offers only three hardcoded categories (Bancos & Créditos, Servicios Básicos, Suscripciones), limiting financial tracking fidelity. Users need a richer set of standard categories (e.g., Salud, Educación, Seguros, Retail, Préstamos) and the ability to define, customize, and manage their own categories with custom colors.

## Scope

### In Scope
- **Expanded Preset Categories**: Add default Chilean finance categories (Hipotecario, Automotriz, Tarjetas/Retail, Educación, Salud & Seguros, Impuestos/Contribuciones).
- **Custom Category Management**: Add UI (Modal / Settings view) to create, edit, and delete custom categories with name and color selection.
- **Quick-Add from Form**: Allow creating a custom category directly from the `ObligationFormModal` dropdown.
- **Drive Persistence & UI Integration**: Ensure custom categories persist to Drive sync and render seamlessly in Financial Matrix and lists.

### Out of Scope
- Hierarchical multi-level category trees (parent-child categories).
- Category budget allocation limits (belongs to budget module).
- Bulk migration tool for reclassifying historical obligations across deleted categories.

## Capabilities

### New Capabilities
- `category-management`: UI and workflow to create, customize, and manage custom obligation categories with custom visual tags and colors.

### Modified Capabilities
- `obligations-core`: Expand default category fixtures and support dynamic category options within obligation creation and editing forms.

## Approach
1. Expand default categories in `obligationsSlice.ts` with Chilean financial categories and distinct Tailwind colors.
2. Build `CategorySettingsModal` allowing users to view, add, edit, and delete custom categories.
3. Enhance `ObligationFormModal` category select with a "+ Crear nueva categoría..." quick action that opens the category creation prompt/modal inline.
4. Prevent orphaned obligations when deleting a category by offering reassignment or validation checks.

### Alternatives Considered
- *Freeform text input for category*: Rejected because it leads to typos and breaks matrix aggregation.
- *Strict hardcoded presets only*: Rejected because users require custom groupings (e.g., family loans, specific business debt).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/obligations/store/obligationsSlice.ts` | Modified | Expand default categories seed data and verify persistence hooks |
| `src/features/obligations/components/ObligationFormModal.tsx` | Modified | Add quick-create category trigger and improved dropdown rendering |
| `src/features/obligations/components/CategorySettingsModal.tsx` | New | Modal for managing, creating, editing, and deleting categories |
| `src/features/obligations/components/ObligationsList.tsx` | Modified | Add "Configurar Categorías" action button in header |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Deletion of a category in use by active obligations | Med | Block deletion if category has active obligations or prompt for fallback category |
| Category color contrast issues in dark theme | Low | Provide predefined curated palette of accessible Tailwind badge colors |

## Rollback Plan
Revert changes to `ObligationFormModal.tsx`, `obligationsSlice.ts`, and remove `CategorySettingsModal.tsx`. Existing obligations fallback to remaining default categories.

## Dependencies
- Existing `useObligationsStore` and encrypted Google Drive sync layer (`useSyncStore`).

## Success Criteria
- [ ] Form includes comprehensive default Chilean categories out of the box.
- [ ] Users can create custom categories with custom name & color from settings and directly from the obligation form.
- [ ] Newly added categories immediately appear in the matrix, obligation list, and dropdowns.
- [ ] Custom categories persist across sessions via encrypted Drive sync.
