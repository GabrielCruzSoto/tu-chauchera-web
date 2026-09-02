# Technical Design — custom-financial-obligation-categories

## Technical Approach

Extend the existing Zustand-based obligations domain to provide customizable and expanded Chilean financial obligation categories. A central `categories.ts` constant defines standard presets (Hipotecario, Automotriz, Tarjetas & Retail, Educación, Salud & Seguros, etc.) and a curated, dark-theme-safe Tailwind color palette. A dedicated `CategorySettingsModal` provides full CRUD management with safety guards against deleting categories in active use, while `ObligationFormModal` supports quick-creation without form reset. Sync to encrypted Google Drive (`categories.enc`) is triggered automatically on mutation.

## Architecture Decisions

| Decision | Choice | Alternatives Considered | Rationale |
|---|---|---|---|
| **State Management** | Zustand (`useObligationsStore`) | Redux Toolkit, React Context | The codebase standardizes on Zustand with direct synchronization to `categories.enc` via `useSyncStore`. |
| **Color Tokens** | Curated Tailwind color map (`CATEGORY_PALETTE`) | Arbitrary hex color picker | Eliminates dark-mode contrast issues and guarantees Tailwind JIT class generation without runtime purge failures. |
| **Deletion Guard** | Block deletion if referenced by active obligations (`status !== 'DELETED'`) | Cascade delete obligations, reassign to uncategorized | Prevents accidental loss of category tracking on historical and pending obligations. |
| **Quick-Add UX** | Inline modal dialog over `ObligationFormModal` | Navigation to separate settings screen, inline text input | Preserves existing partially completed form inputs and provides immediate selection upon creation. |

## Data Flow

```
[User Action: Settings / QuickAdd]
              │
              ▼
[Category CRUD: obligationsSlice] ──(Mutates categories Record)──→ [UI Components: Badges / Dropdowns]
              │
              ▼
[useSyncStore.queueSyncDomain('categories')]
              │
              ▼
[SyncService ── AES-256-GCM Encrypt ──→ Google Drive categories.enc]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/features/obligations/constants/categories.ts` | Create | Presets for Chilean finance categories and curated `CATEGORY_PALETTE` mapping with badge styles. |
| `src/features/obligations/components/CategoryBadge.tsx` | Create | Reusable badge rendering category name and color styles with graceful fallback for unmapped IDs. |
| `src/features/obligations/components/CategorySettingsModal.tsx` | Create | Modal for managing, adding, editing, and safely deleting custom categories with usage validation. |
| `src/features/obligations/store/obligationsSlice.ts` | Modify | Update default state with expanded Chilean categories and ensure sync triggers on category mutations. |
| `src/features/obligations/components/ObligationFormModal.tsx` | Modify | Add "+ Crear nueva categoría..." quick action and open category creation without resetting form. |
| `src/features/obligations/components/ObligationsList.tsx` | Modify | Add "Configurar Categorías" action button in header and use `CategoryBadge`. |
| `src/features/obligations/components/MonthlyInstallmentsView.tsx` | Modify | Replace hardcoded badge colors with `CategoryBadge` for visual consistency. |
| `src/features/obligations/store/obligationsSlice.test.ts` | Modify | Unit tests verifying category presets, CRUD actions, and sync domain triggering. |
| `src/features/obligations/components/CategorySettingsModal.test.tsx` | Create | Component tests verifying creation, edit, deletion blocking for in-use categories, and color selection. |

## Interfaces / Contracts

```typescript
// src/features/obligations/constants/categories.ts
export interface CategoryColorOption {
  key: string
  label: string
  badgeClass: string
  dotClass: string
}

export const CATEGORY_PALETTE: Record<string, CategoryColorOption> = {
  emerald: { key: "emerald", label: "Esmeralda", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30", dotClass: "bg-emerald-400" },
  indigo:  { key: "indigo",  label: "Índigo",    badgeClass: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30", dotClass: "bg-indigo-400" },
  cyan:    { key: "cyan",    label: "Cian",      badgeClass: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30", dotClass: "bg-cyan-400" },
  orange:  { key: "orange",  label: "Naranja",   badgeClass: "bg-orange-500/10 text-orange-300 border-orange-500/30", dotClass: "bg-orange-400" },
  violet:  { key: "violet",  label: "Violeta",   badgeClass: "bg-violet-500/10 text-violet-300 border-violet-500/30", dotClass: "bg-violet-400" },
  rose:    { key: "rose",    label: "Rosa",      badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/30", dotClass: "bg-rose-400" },
  sky:     { key: "sky",     label: "Cielo",     badgeClass: "bg-sky-500/10 text-sky-300 border-sky-500/30", dotClass: "bg-sky-400" },
  purple:  { key: "purple",  label: "Púrpura",   badgeClass: "bg-purple-500/10 text-purple-300 border-purple-500/30", dotClass: "bg-purple-400" },
  amber:   { key: "amber",   label: "Ámbar",     badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/30", dotClass: "bg-amber-400" },
}

export const DEFAULT_CATEGORIES: Record<string, Category> = {
  "cat-bancos":      { id: "cat-bancos",      name: "Bancos & Créditos",           color: "emerald", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  "cat-hipotecario": { id: "cat-hipotecario", name: "Hipotecario",                 color: "indigo",  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  "cat-automotriz":  { id: "cat-automotriz",  name: "Automotriz",                  color: "cyan",    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  "cat-retail":      { id: "cat-retail",      name: "Tarjetas & Retail",           color: "orange",  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  "cat-educacion":   { id: "cat-educacion",   name: "Educación",                   color: "violet",  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  "cat-salud":       { id: "cat-salud",       name: "Salud & Seguros",             color: "rose",    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  "cat-servicios":   { id: "cat-servicios",   name: "Servicios Básicos",           color: "sky",     createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  "cat-suscrip":     { id: "cat-suscrip",     name: "Suscripciones",               color: "purple",  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  "cat-impuestos":   { id: "cat-impuestos",   name: "Impuestos & Contribuciones",  color: "amber",   createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (Store) | Category additions, updates, deletions, and default seeding | Vitest testing `obligationsSlice` actions and state transitions. |
| Component | `CategorySettingsModal` validation (empty name, duplicate detection, delete blocking when in active use) | React Testing Library checking modal interaction and warning states. |
| Integration | `ObligationFormModal` quick-create integration | RTL test verifying creating category inline selects it without resetting other form fields. |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No database migration required. Existing categories loaded from Drive (`categories.enc`) merge seamlessly. When hydrating an empty store, default presets are initialized automatically. Fallback `CategoryBadge` ensures any legacy or unassigned IDs render safely as "General / Sin Categoría".

## Open Questions

None.
