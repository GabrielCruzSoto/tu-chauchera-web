# Proposal: Make Site Responsive

## Intent

The application currently relies heavily on desktop-centric layouts with horizontal navigation headers, large multi-column matrices, fixed table widths, and fixed desktop modal patterns. On mobile and tablet screens, navigation tabs clip, horizontal overflow causes layout jitter, and key actions in matrices and installment views are difficult to tap. This change introduces comprehensive responsive designs across mobile, tablet, and desktop viewports.

## Scope

### In Scope
- **Responsive Layout & Navigation**: Mobile hamburger menu or bottom navigation bar, collapsible header, and adaptive padding/containers.
- **Financial Matrix Adaptation**: Card/summary view for mobile, scroll hints, sticky column headers, and month-range picker responsive adjustments.
- **Installments & Obligations Views**: Responsive grid layouts (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`), mobile-friendly card actions, and responsive header toolbars.
- **Modals & Forms**: Fullscreen/drawer modal behavior on mobile (`<640px`) with touch-friendly tap targets (minimum 44px).
- **Typography & Spacing**: Fluid typography and spacing adjustments using Tailwind responsive breakpoints (`sm:`, `md:`, `lg:`).

### Out of Scope
- Native mobile application wrappers (Capacitor/Cordova/React Native).
- PWA offline caching service workers (deferred to a dedicated offline sync change).
- Redesigning business logic or calculation engines.

## Capabilities

### New Capabilities
- `responsive-ui`: Layout responsiveness standards, adaptive navigation, mobile card views for dense data, and mobile-friendly modal/form UX.

### Modified Capabilities
- None

## Approach

1. **Header & Navigation**: Implement an adaptive header in `src/app/App.tsx` that switches between desktop tab navigation and a mobile drawer / tab bar on smaller screens.
2. **Matrix Component**: In `src/features/matrix/components/FinancialMatrix.tsx`, enhance horizontal scroll indicators, preserve category pin on left, and offer an alternate collapsed list/card view on narrow mobile viewports.
3. **Lists & Grids**: Refactor `ObligationsList`, `MonthlyInstallmentsView`, and `IncomeListView` headers into stacked flex layouts on mobile, optimizing button groups.
4. **Modal Dialogs**: Standardize modal containers across `ObligationFormModal`, `PaymentModal`, `RenegotiationModal`, `CategorySettingsModal`, and `IncomeModal` to render as responsive bottom-sheets or full-screen dialogs on mobile screens.
5. **Tailwind Tokens**: Verify viewport meta tags in `index.html` and leverage standard Tailwind breakpoints (`sm`, `md`, `lg`, `xl`).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/App.tsx` | Modified | Responsive header, mobile navigation menu / bottom tabs, user menu collapse |
| `src/features/matrix/components/FinancialMatrix.tsx` | Modified | Responsive table scrolling, mobile card view toggle, sticky headers |
| `src/features/obligations/components/ObligationsList.tsx` | Modified | Adaptive grid, stacked action buttons on mobile |
| `src/features/obligations/components/MonthlyInstallmentsView.tsx` | Modified | Responsive month navigator, card metrics wrap |
| `src/features/income/components/IncomeListView.tsx` | Modified | Responsive summary bar and action triggers |
| `src/features/obligations/components/*Modal.tsx` | Modified | Mobile bottom sheet / responsive modal dialogs |
| `src/features/auth/components/LoginPage.tsx` | Modified | Mobile padding and card scaling |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Financial matrix readability on small screens | Medium | Provide toggle between scrollable matrix and per-category mobile cards |
| Complex form clipping on small virtual keyboards | Medium | Add scrollable modal bodies and auto-scroll focused input into view |
| Regressing desktop layout density | Low | Use mobile-first Tailwind utility overrides without altering desktop classes |

## Rollback Plan

Revert Git commits modifying `src/app/App.tsx`, feature component templates, and modal wrappers to restore original desktop layout styles.

## Dependencies

- Tailwind CSS (already integrated)

## Success Criteria

- [ ] Header and navigation adapt smoothly from 320px width up to 4K displays without horizontal clipping.
- [ ] Financial Matrix, Obligations List, and Monthly Installments render cleanly on mobile (375px), tablet (768px), and desktop (1024px+).
- [ ] All modals and forms are fully usable on mobile screens with interactive elements meeting minimum touch target requirements.
- [ ] No regression in desktop functionality, layout density, or performance.
