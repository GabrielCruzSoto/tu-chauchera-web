# Tasks: make-site-responsive

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 250–350 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Responsive App Navigation, Matrix & Views, Modals | PR 1 | `npm test` | Responsive viewport test at 375px / 768px / 1280px | Revert responsive utility classes in `src/app/` and `src/features/` |

## Phase 1: Navigation & App Shell Foundation

- [x] 1.1 Add mobile hamburger toggle (`min-h-[44px]`), drawer state, and sliding overlay in `src/app/App.tsx`.
- [x] 1.2 Hide mobile trigger and preserve inline horizontal tabs on `lg:` (`≥1024px`) in `src/app/App.tsx`.
- [x] 1.3 Add responsive padding (`px-4 sm:px-6`) and fluid card scaling in `src/features/auth/components/LoginPage.tsx`.

## Phase 2: Dense Tables & List Views

- [x] 2.1 Implement sticky category column, sticky totals, and scroll hints in `src/features/matrix/components/FinancialMatrix.tsx`.
- [x] 2.2 Add mobile card view toggle with category summary cards for `< 640px` in `src/features/matrix/components/FinancialMatrix.tsx`.
- [x] 2.3 Apply responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) and stacked action buttons in `src/features/obligations/components/ObligationsList.tsx`.
- [x] 2.4 Make month selector and summary metric chips wrap/stack cleanly in `src/features/obligations/components/MonthlyInstallmentsView.tsx`.
- [x] 2.5 Stack metric summary banner and use full-width action button on mobile in `src/features/income/components/IncomeListView.tsx`.

## Phase 3: Modal Dialogs & Touch Form UX

- [x] 3.1 Update `src/features/obligations/components/ObligationFormModal.tsx` to adaptive bottom-sheet (`inset-x-0 bottom-0 sm:inset-auto`) with scrollable body.
- [x] 3.2 Standardize `src/features/obligations/components/PaymentModal.tsx` and `src/features/obligations/components/RenegotiationModal.tsx` with bottom-sheet container and `min-h-[44px]` inputs.
- [x] 3.3 Apply responsive bottom-sheet layout to `src/features/obligations/components/CategorySettingsModal.tsx` and `src/features/income/components/IncomeModal.tsx`.

## Phase 4: Testing & Verification

- [x] 4.1 Add component tests for navigation drawer open/close behavior in `src/app/__tests__/App.test.tsx`.
- [x] 4.2 Add unit/component tests for matrix card vs table toggle in `src/features/matrix/__tests__/FinancialMatrix.test.tsx`.
- [x] 4.3 Run full test suite with `npm test` and verify zero layout overflow across 375px, 768px, and 1280px viewports.
