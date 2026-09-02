# Technical Design — make-site-responsive

## Technical Approach

Make the Tu Chauchera application fully responsive across mobile (`< 640px`), tablet (`640px – 1023px`), and desktop (`≥ 1024px`) viewports. We adopt a mobile-first Tailwind utility strategy, refactoring dense tabular layouts (Financial Matrix) into sticky-column scrollable containers with optional card views, standardizing modals as mobile bottom-sheets / full-screen dialogs, introducing a mobile hamburger navigation drawer in `App.tsx`, and making list/toolbar grids adaptive.

## Architecture Decisions

| Option | Tradeoffs | Decision |
|---|---|---|
| **Mobile Navigation**: Collapsible Drawer vs Bottom Tab Bar | Bottom tabs require fixed bottom spacing and complicate modal overlays; drawer scales to arbitrary navigation items cleanly. | **Drawer Menu**: Hamburger toggle at `< 1024px` opening a backdrop-anchored drawer; persistent horizontal tabs at `≥ 1024px`. |
| **Financial Matrix on Mobile**: Responsive Card View vs Horizontal Scroll | Full table on mobile causes extreme horizontal scroll; pure cards lose month-over-month cross-tabulation. | **Dual Mode**: Sticky category/total column scrollable table by default with a quick toggle to stacked category summary cards for mobile screens (`< 640px`). |
| **Modal Container UX**: Centered Dialog vs Responsive Bottom-Sheet | Fixed desktop modals clip inputs on mobile virtual keyboards; full-screen / bottom-sheet provides native app feel. | **Adaptive Dialog**: Bottom-sheet / full viewport (`inset-x-0 bottom-0 sm:inset-auto sm:rounded-2xl`) with `max-h-[90vh] overflow-y-auto` and ≥ 44px tap targets. |
| **Form Inputs & Tap Targets**: CSS Global Scale vs Component Utilities | Global CSS rules can break third-party elements; explicit Tailwind utility classes ensure local predictability. | **Tailwind Utility Classes**: Explicit `min-h-[44px]` and `py-2.5` touch padding across form elements and action buttons. |

## Data Flow

```
[ Viewport Resize / MatchMedia ]
             │
             ▼
   [ App Shell / Nav Drawer ]
   ├── (Desktop ≥1024px) ──→ Inline Tab Bar & User Info
   └── (Mobile <1024px)  ──→ Hamburger Button ──→ Sliding Drawer Menu
             │
   [ View Container ]
   ├── FinancialMatrix ──→ [ View Mode State: Table / Card ] ──→ Sticky Table or Stacked Cards
   ├── ObligationsList  ──→ [ CSS Grid: 1 col (sm) / 2 cols (md) / 3 cols (lg) ]
   └── Modals           ──→ [ Responsive Dialog: Bottom Sheet (mobile) / Center Box (desktop) ]
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/app/App.tsx` | Modify | Add mobile menu toggle, backdrop overlay, and drawer navigation for `< 1024px`. |
| `src/features/matrix/components/FinancialMatrix.tsx` | Modify | Implement sticky first/last columns, horizontal scroll indicator, and mobile card toggle mode. |
| `src/features/obligations/components/ObligationsList.tsx` | Modify | Adaptive header toolbar, stacked buttons on mobile, responsive card grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`). |
| `src/features/obligations/components/MonthlyInstallmentsView.tsx` | Modify | Stacked month selector, wrap metric chips, touch-friendly installment action buttons. |
| `src/features/income/components/IncomeListView.tsx` | Modify | Responsive header layout, stacked metric summary banner, full-width action trigger on mobile. |
| `src/features/obligations/components/ObligationFormModal.tsx` | Modify | Bottom-sheet dialog container on mobile, sticky action footer, touch-sized inputs. |
| `src/features/obligations/components/PaymentModal.tsx` | Modify | Bottom-sheet dialog container on mobile, scrollable form body. |
| `src/features/obligations/components/RenegotiationModal.tsx` | Modify | Mobile dialog container, flexible grid for date and amount inputs. |
| `src/features/obligations/components/CategorySettingsModal.tsx` | Modify | Responsive modal container and touch-friendly category item delete/edit rows. |
| `src/features/income/components/IncomeModal.tsx` | Modify | Mobile bottom-sheet layout with touch target input heights. |
| `src/features/auth/components/LoginPage.tsx` | Modify | Viewport-safe horizontal padding and responsive card width bounds. |

## Interfaces / Contracts

```typescript
// Shared Responsive Modal Wrapper Contract
export interface ModalWrapperProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

// Mobile Card Presentation for Matrix
export interface MatrixCategoryCardProps {
  category: { id: string; name: string }
  periods: string[]
  cells: Record<string, number>
  total: number
}
```

```html
<!-- Modal Container Standard Class Structure -->
<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md">
  <div className="w-full sm:max-w-xl max-h-[90vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col">
    <!-- Header (fixed) -->
    <!-- Body (overflow-y-auto p-4 sm:p-6) -->
    <!-- Footer (fixed/sticky p-4) -->
  </div>
</div>
```

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| **Unit / Component** | Navigation drawer open/close state, Matrix card/table toggle mode | Vitest + React Testing Library testing rendering under mocked states. |
| **Component Layout** | Modal rendering classes across mobile and desktop wrappers | Verify presence of responsive classes (`sm:items-center`, `min-h-[44px]`). |
| **Visual / Responsive** | Viewport widths 375px (mobile), 768px (tablet), 1280px (desktop) | Manual and automated viewport assertions ensuring no horizontal scroll on root container. |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. All changes are frontend layout and styling adjustments preserving existing data models and state management.

## Open Questions

- None.
