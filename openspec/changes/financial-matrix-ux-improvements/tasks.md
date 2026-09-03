# Tasks: Financial Matrix UX/UI Enhancements

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 120-180 lines |
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
| 1 | Toolbar, table alignment, and KPI cards UX polish | PR 1 | `npm test src/features/matrix/__tests__/FinancialMatrix.test.tsx` | Run dev server and navigate to `/matriz` | Revert `src/features/matrix/components/FinancialMatrix.tsx` and `FinancialMatrix.test.tsx` |

## Phase 1: Toolbar Structure & Action Integration

- [x] 1.1 Refactor matrix header container in [`FinancialMatrix.tsx`](file:///home/gabrielcruzsoto/Proyectos/Tu-chauchera-web/src/features/matrix/components/FinancialMatrix.tsx) into a two-tier layout (Tier 1: Title + Tabs/View switch, Tier 2: Navigator + Horizon + Action button).
- [x] 1.2 Relocate "Desglosar subcategorías" / "Contraer subcategorías" toggle button into secondary toolbar with `aria-expanded` and clear icon indicators.

## Phase 2: Table Numeric Alignment & Decorator Cleanup

- [x] 2.1 Update all table header (`<th>`) and data (`<td>`) period cells in [`FinancialMatrix.tsx`](file:///home/gabrielcruzsoto/Proyectos/Tu-chauchera-web/src/features/matrix/components/FinancialMatrix.tsx) to use `text-right tabular-nums font-mono`.
- [x] 2.2 Preserve left alignment (`text-left`) and sticky contrast (`bg-slate-950`, `border-r border-slate-800`) for the first category/entity column.
- [x] 2.3 Remove redundant inline decorative emojis inside period monetary cells while retaining semantic category badges and indicator bullets.
- [x] 2.4 Apply subtle muted styling (`text-slate-600`) for zero-value cells (`$0`).

## Phase 3: KPI Summary Cards Polish

- [x] 3.1 Standardize the 4 KPI summary cards (Egresos Propios, Por Cobrar Terceros, Ingresos, Margen Neto) in [`FinancialMatrix.tsx`](file:///home/gabrielcruzsoto/Proyectos/Tu-chauchera-web/src/features/matrix/components/FinancialMatrix.tsx) with uniform padding, `text-xl sm:text-2xl font-bold font-mono tracking-tight`, and `formatCLP()` formatting.
- [x] 3.2 Ensure semantic color tokens and badges for positive/negative net margins (`text-emerald-400` / `text-rose-400`).

## Phase 4: Verification & Test Updates

- [x] 4.1 Update [`FinancialMatrix.test.tsx`](file:///home/gabrielcruzsoto/Proyectos/Tu-chauchera-web/src/features/matrix/__tests__/FinancialMatrix.test.tsx) with assertions for two-tier toolbar layout, `aria-expanded` attributes on subcategory toggle, and right-aligned tabular formatting.
- [x] 4.2 Run test suite `npm test src/features/matrix/__tests__/FinancialMatrix.test.tsx` to verify all unit and component tests pass.
