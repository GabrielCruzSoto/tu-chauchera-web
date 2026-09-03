# Technical Design: Financial Matrix UX/UI Enhancements

## Technical Approach

Refactor [`FinancialMatrix.tsx`](file:///home/gabrielcruzsoto/Proyectos/Tu-chauchera-web/src/features/matrix/components/FinancialMatrix.tsx) to deliver a modern, scannable, and ergonomically balanced consolidation view without modifying underlying calculations in [`useMatrixComputation.ts`](file:///home/gabrielcruzsoto/Proyectos/Tu-chauchera-web/src/features/matrix/hooks/useMatrixComputation.ts). 

Key design elements:
1. **Multi-Tier Toolbar**: Split controls into Primary Navigation (`Categorías` vs `Deudas Terceros`, `Tabla` vs `Tarjetas`) and Secondary Operations (`Horizonte`, `Period Navigator`, integrated `Desglosar/Contraer subcategorías` button).
2. **Numeric Scannability**: Enforce `text-right font-mono tabular-nums` on all period amounts and totals; keep sticky entity column left-aligned (`text-left`).
3. **Card & Table Polish**: Standardize KPI summary metrics with explicit CLP formatting and contrast tokens; remove noisy repeating emojis in table cells while preserving semantic status badges.
4. **Accessible Expand/Collapse**: Integrate category toggle actions with clear `aria-expanded` attributes and high-contrast indicators.

---

## Architecture Decisions

| Decision Area | Options Considered | Tradeoffs | Chosen Solution & Rationale |
|---------------|-------------------|-----------|-----------------------------|
| **Toolbar Architecture** | (A) Single crowded flex row<br>(B) Two-tier toolbar with flex wrap | Option A causes overflow/clipping on 1024px-1366px screens. Option B provides consistent visual hierarchy. | **Option B**: Two-tier header. Tier 1: Title + View switches. Tier 2: Date navigation, projection range selector, and table action buttons. |
| **Expand/Collapse Action Placement** | (A) Floating button above table<br>(B) Integrated in toolbar & table header | Option A feels disconnected and misaligned. Option B unifies action controls. | **Option B**: Primary action integrated in secondary toolbar/table subheader with responsive icon + text. |
| **Numeric Typography & Alignment** | (A) Centered normal font<br>(B) `text-right font-mono tabular-nums` | Centered text causes jagged visual scanning for currency. | **Option B**: Tabular monospace numbers right-aligned with fixed column widths and clear column headers. |
| **Color Tokens & Contrast** | (A) Hardcoded ad-hoc opacity hexes<br>(B) Standardized Tailwind Slate/Emerald/Rose/Sky palette | Option A fails WCAG AA on dark backgrounds. Option B ensures >4.5:1 contrast. | **Option B**: Semantic slate/emerald/amber/sky/rose tokens with high-contrast text and subtle border tints. |

---

## Component Structure & Data Flow

```
FinancialMatrix Container (src/features/matrix/components/FinancialMatrix.tsx)
 ├── 1. Matrix Header & Multi-Tier Toolbar
 │    ├── Tier 1 (Primary): Title/Subtitle + [Categorías | Deudas] TabGroup + [Tabla | Tarjetas] ViewToggle
 │    └── Tier 2 (Actions): [← Periodo →] Navigator + [3/6/12m] HorizonSelect + [🔽/🔼 Desglosar] Action
 ├── 2. Summary KPI Cards (4-Column Responsive Grid)
 │    ├── Card 1: Egresos Propios (Rose accent) -> formatCLP(totalPersonalOutflow)
 │    ├── Card 2: Por Cobrar Terceros (Amber accent) -> formatCLP(totalReceivables)
 │    ├── Card 3: Total Ingresos (Sky accent) -> formatCLP(totalIncomesInRange)
 │    └── Card 4: Margen Neto Real (Emerald/Rose dynamic) -> formatCLP(totalNetMargin)
 └── 3. Main Data Presentation
      ├── Mode "cards": CategoryCard / P2PGroupCard Grid
      └── Mode "table": Responsive Scrollable Matrix Table
           ├── Sticky 1st Col: Categoría / Subcategoría / Persona (text-left, bg-slate-950, border-r)
           ├── Dynamic Cols: Period Months (text-right, font-mono, tabular-nums)
           ├── Total Col: Total Fila / Periodo (text-right, font-mono, bold)
           └── Footers (tfoot): Total Egresos, Total Ingresos, Margen Neto (font-mono, text-right)
```

---

## JSX & Tailwind CSS Specifications

### 1. Multi-Tier Control Bar
- **Container**: `bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800 backdrop-blur-xl flex flex-col gap-4`
- **Tier 1 (Header & Views)**: `flex flex-col lg:flex-row lg:items-center justify-between gap-3`
  - Group Selector: `bg-slate-950 border border-slate-800 rounded-xl p-1 flex items-center`
  - Active Tab: `bg-slate-800 text-emerald-400 font-semibold shadow-sm min-h-[36px]`
  - Inactive Tab: `text-slate-400 hover:text-slate-200 transition min-h-[36px]`
- **Tier 2 (Navigation & Actions)**: `flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-800/60`
  - Period Navigator: `flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1`
  - Horizon Selector: `min-h-[36px] px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300`
  - Expand/Collapse All: `min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5`

### 2. Summary KPI Cards
- **Card Container**: `p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col justify-between`
- **Value Typography**: `text-xl sm:text-2xl font-bold font-mono tracking-tight`
- **Color Mapping**:
  - Outflow: `text-rose-400`, badge `bg-rose-500/10 text-rose-400 border-rose-500/20`
  - Receivables: `text-amber-300`, badge `bg-amber-500/10 text-amber-300 border-amber-500/20`
  - Income: `text-sky-300`, badge `bg-sky-500/10 text-sky-300 border-sky-500/20`
  - Positive Net Margin: `text-emerald-400`, badge `bg-emerald-500/10 text-emerald-400 border-emerald-500/20`
  - Negative Net Margin: `text-rose-400`, badge `bg-rose-500/10 text-rose-400 border-rose-500/20`

### 3. Matrix Table Alignment & Cells
- **Sticky First Column (`th`, `td`)**:
  - `sticky left-0 bg-slate-950/95 z-20 px-4 sm:px-5 py-3 text-left border-r border-slate-800 shadow-[2px_0_6px_-1px_rgba(0,0,0,0.4)]`
  - Subcategory row indent: `pl-7 sm:pl-9 pr-4 py-2 text-xs text-slate-300`
- **Period Numeric Cells (`th`, `td`)**:
  - `px-3 sm:px-4 py-3 text-right font-mono tabular-nums text-xs whitespace-nowrap min-w-[100px] sm:min-w-[120px]`
  - Active positive amount: `text-slate-200 font-medium`
  - Zero amount ($0 / empty): `text-slate-600 font-normal` (rendered as `—` or `$0`)
- **Total Row & Column**:
  - Header/Cell: `text-right font-mono font-bold text-white px-4 sm:px-5`

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/features/matrix/components/FinancialMatrix.tsx` | Modify | Reorganize toolbar layout into two tiers, integrate toggle all button, update table headers and cells to `text-right font-mono tabular-nums`, clean up inline cell emojis, and polish KPI cards. |
| `src/features/matrix/__tests__/FinancialMatrix.test.tsx` | Modify | Update or extend test assertions for new toolbar tiers, ARIA attributes (`aria-expanded`), and right-aligned tabular formatting. |

---

## Interfaces / Contracts

No backend or store interfaces change. Existing component state and props remain consistent:

```typescript
// Component internal state contracts preserved:
type GroupByMode = "category" | "p2p"
type ViewMode = "table" | "cards"
type ExpandedCategoriesState = Record<string, boolean>

// Key helper contracts:
// formatCLP(toMoney(amountCents)) => string ($1.200.000)
// useMatrixComputation(baseDate: Date, monthsCount: number) => MatrixComputationResult
```

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| **Unit / Component** | Render table vs cards default state | Verify `matrix-table-view` and `matrix-cards-view` test IDs in [`FinancialMatrix.test.tsx`](file:///home/gabrielcruzsoto/Proyectos/Tu-chauchera-web/src/features/matrix/__tests__/FinancialMatrix.test.tsx). |
| **Unit / Component** | Expand / Collapse All subcategories | Verify button text toggles between "Desglosar subcategorías" and "Contraer subcategorías" and rows toggle visibility. |
| **Unit / Component** | Tab switching (Categorías / Deudas) | Test clicking P2P tab renders P2P consolidation table/cards. |
| **Unit / Component** | Period navigator & Month select | Fire click events on previous/next buttons and change projection count. |
| **A11y / Alignment** | Numeric alignment & ARIA attributes | Verify `aria-expanded` on category expand triggers and right-aligned tabular class presence. |

---

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

---

## Migration / Rollout

No migration required. Client-side presentation refactor.

---

## Open Questions

- None. Requirements and scope are fully specified in `proposal.md` and `specs.md`.
