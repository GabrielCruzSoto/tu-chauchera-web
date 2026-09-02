# Tasks: Custom Financial Obligation Categories

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~320-380 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Category presets, constants, and store updates | PR 1 | `npm test -- src/features/obligations/store/obligationsSlice.test.ts` | Store unit test runner | `src/features/obligations/constants/categories.ts`, `src/features/obligations/store/obligationsSlice.ts` |
| 2 | CategoryBadge & CategorySettingsModal with tests | PR 1 | `npm test -- src/features/obligations/components/CategorySettingsModal.test.tsx` | Vitest / RTL component harness | `src/features/obligations/components/CategoryBadge.tsx`, `src/features/obligations/components/CategorySettingsModal.tsx` |
| 3 | Form quick-add integration and list views | PR 1 | `npm test -- src/features/obligations/` | Dev web server (`npm run dev`) | `src/features/obligations/components/ObligationFormModal.tsx`, `ObligationsList.tsx`, `MonthlyInstallmentsView.tsx` |

## Phase 1: Foundation & State

- [x] 1.1 Create [`categories.ts`](file:///home/gabrielcruzsoto/Proyectos/Tu-chauchera-web/src/features/obligations/constants/categories.ts) with `CATEGORY_PALETTE` and expanded Chilean `DEFAULT_CATEGORIES` presets.
- [x] 1.2 Update [`obligationsSlice.ts`](file:///home/gabrielcruzsoto/Proyectos/Tu-chauchera-web/src/features/obligations/store/obligationsSlice.ts) to seed `DEFAULT_CATEGORIES` on initialization and trigger sync domain on category mutations.
- [x] 1.3 Update unit tests in [`obligationsSlice.test.ts`](file:///home/gabrielcruzsoto/Proyectos/Tu-chauchera-web/src/features/obligations/store/obligationsSlice.test.ts) to verify preset seeding, CRUD actions, and sync queuing.

## Phase 2: Category Components & Management Modal

- [x] 2.1 Create [`CategoryBadge.tsx`](file:///home/gabrielcruzsoto/Proyectos/Tu-chauchera-web/src/features/obligations/components/CategoryBadge.tsx) supporting color dot, Tailwind classes, and fallback rendering for unknown IDs.
- [x] 2.2 Create [`CategorySettingsModal.tsx`](file:///home/gabrielcruzsoto/Proyectos/Tu-chauchera-web/src/features/obligations/components/CategorySettingsModal.tsx) with category list, creation/editing inputs, color selector, and delete blocking for categories in active use.
- [x] 2.3 Create component tests in [`CategorySettingsModal.test.tsx`](file:///home/gabrielcruzsoto/Proyectos/Tu-chauchera-web/src/features/obligations/components/CategorySettingsModal.test.tsx) testing empty-name rejection, color changes, and in-use deletion prevention.

## Phase 3: Integration & View Updates

- [x] 3.1 Update [`ObligationFormModal.tsx`](file:///home/gabrielcruzsoto/Proyectos/Tu-chauchera-web/src/features/obligations/components/ObligationFormModal.tsx) category selector to include "+ Crear nueva categoría..." and inline quick-add without form reset.
- [x] 3.2 Update [`ObligationsList.tsx`](file:///home/gabrielcruzsoto/Proyectos/Tu-chauchera-web/src/features/obligations/components/ObligationsList.tsx) to include the "Configurar Categorías" button and use `CategoryBadge`.
- [x] 3.3 Update [`MonthlyInstallmentsView.tsx`](file:///home/gabrielcruzsoto/Proyectos/Tu-chauchera-web/src/features/obligations/components/MonthlyInstallmentsView.tsx) to replace hardcoded badge styles with `CategoryBadge`.

## Phase 4: Verification & Verification Polish

- [x] 4.1 Run full obligations test suite (`npm test -- src/features/obligations`) and typecheck (`npm run typecheck` or `npx tsc --noEmit`).
- [x] 4.2 Verify end-to-end category lifecycle (creation, inline form select, edit, delete guard) in browser dev mode.
