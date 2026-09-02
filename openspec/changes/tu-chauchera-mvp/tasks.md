# Implementation Tasks — tu-chauchera-mvp

## Change Name
`tu-chauchera-mvp`

## Source
Based on: spec.md + design.md

## Delivery Strategy
`auto-chain` — 7 sequential PRs (one per SDD sub-change)
Each PR is independently reviewable and deployable.

## Review Workload Forecast
- **Estimated total changed lines**: ~4,000–5,500 lines
- **Budget per PR**: ~400–800 lines (within 800-line review budget)
- **Chained PRs recommended**: Yes (7 changes)
- **400-line budget risk**: High (total scope; individual PRs within budget)
- **Decision needed before apply**: No (auto-chain confirmed)

---

## PR #1: project-scaffold

**Goal**: Initialize the project with Vite + React 18 + TypeScript strict + Tailwind CSS + Vitest. No business logic — infrastructure only.

**Estimated changed lines**: ~300–400 lines

### Tasks

- [x] **T1.1** Run `npm create vite@latest . -- --template react-ts` in the workspace root
- [x] **T1.2** Install dependencies:
  - Production: `react-router-dom`, `zustand`, `date-fns`
  - Dev: `tailwindcss`, `@tailwindcss/vite`, `vitest`, `@vitest/ui`, `@testing-library/react`, `@testing-library/user-event`, `@types/node`, `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `prettier`
- [x] **T1.3** Configure `vite.config.ts`:
  - Add Tailwind CSS plugin
  - Configure test runner (vitest, jsdom)
  - Add `resolve.alias` for `@/` -> `src/`
- [x] **T1.4** Configure `tailwind.config.ts`:
  - Add glassmorphism color tokens (neon palette, surface colors, bg-deep/surface)
  - Add custom `glass-card` component class
- [x] **T1.5** Configure `tsconfig.json`:
  - Set `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`
  - Add path alias `@/*` -> `src/*`
- [x] **T1.6** Configure ESLint:
  - Enable `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-floating-promises`
  - Extend `plugin:@typescript-eslint/recommended-type-checked`
- [x] **T1.7** Create project directory structure (empty placeholder files with TODOs):
  - `src/app/`, `src/features/`, `src/shared/`, `src/store/`
  - All subdirectories per design.md project structure
- [x] **T1.8** Create `src/shared/types/domain.ts` with all TypeScript interfaces:
  - `Obligation`, `InstallmentRecord`, `Income`, `Category`, `SyncMeta`, `DataDomain`
- [x] **T1.9** Create `src/shared/types/money.ts`:
  - `Money` branded type, `toCents()`, `addMoney()`, `subtractMoney()`, `formatCLP()`
- [x] **T1.10** Create `src/main.tsx` + `src/app/App.tsx` (minimal shell — just renders "Tu Chauchera")
- [x] **T1.11** Create `.env.example` with `VITE_GOOGLE_CLIENT_ID=` and `VITE_APP_SALT=`
- [x] **T1.12** Add `.gitignore` entries for `.env.local`
- [x] **T1.13** Write unit tests for `money.ts` utilities (toCents, addMoney, subtractMoney, formatCLP)
- [x] **T1.14** Write unit tests for initial domain type structure (type-check tests via Vitest)
- [x] **T1.15** Verify: `npm run dev` starts; `npm test` passes; TypeScript compiles with zero errors

**Acceptance criteria:**
- `npm run dev` opens app in browser showing "Tu Chauchera"
- `npm test` runs Vitest with ≥ 1 passing test (money utils)
- `tsc --noEmit` exits with code 0
- `npm run lint` exits with code 0

---

## PR #2: auth-drive-layer

**Goal**: Implement Google OAuth 2.0 PKCE flow, Drive API client, AES-256-GCM encryption, and sync service. No UI beyond login page.

**Estimated changed lines**: ~500–650 lines

**Depends on**: PR #1

### Tasks

- [ ] **T2.1** Create `src/shared/utils/crypto.ts`:
  - `deriveKeyFromPassword(masterPassword: string): Promise<CryptoKey>` — PBKDF2(password, KEY_SALT, 100k, SHA-256) per design.md section 3
  - `encryptData(key: CryptoKey, data: unknown): Promise<ArrayBuffer>` — AES-256-GCM with random 96-bit IV
  - `decryptData<T>(key: CryptoKey, buffer: ArrayBuffer): Promise<T>` — strip IV, decrypt, parse; throws on wrong key
  - `createPasswordSentinel(key: CryptoKey): Promise<ArrayBuffer>` — encrypt a known magic value for password verification
  - `verifyPasswordSentinel(key: CryptoKey, sentinelBuffer: ArrayBuffer): Promise<boolean>` — try decrypt; return false if AES-GCM throws
- [ ] **T2.2** Write unit tests for `crypto.ts`:
  - Round-trip: encrypt then decrypt returns original data
  - Different IVs per encryption call (never reuse)
  - Key non-extractable (cannot call exportKey)
  - Wrong password → decryptData throws
  - Sentinel verification: correct password → true; wrong password → false
- [ ] **T2.3** Create `src/shared/services/driveClient.ts`:
  - `DriveClient` class with methods: `getAppFolderId()`, `getFileId(domain)`, `write(domain, buffer)`, `read(domain)`, `readMeta()`, `writeMeta(meta)`
  - All methods use `fetch` against Drive API v3 with Bearer token from `getToken` callback
- [ ] **T2.4** Create `src/shared/services/syncService.ts`:
  - `SyncService` class: `queueWrite(domain)`, `flush()`, `forceSync()`
  - 1500ms debounce implementation
  - Exponential backoff for Drive write failures (3 retries)
- [ ] **T2.5** Create `src/features/auth/services/googleOAuth.ts`:
  - `generateCodeVerifier()`: 128-char random string (safe URL chars)
  - `generateCodeChallenge(verifier)`: SHA-256 → base64url
  - `initiateOAuthFlow()`: build authorization URL + redirect
  - `handleOAuthCallback(code, verifier)`: POST to Google token endpoint + return tokens
  - `extractUserInfo(idToken)`: decode JWT payload, return `{ sub, email, name }`
- [ ] **T2.6** Create `src/store/index.ts` with Zustand store:
  - `AuthSlice`: user, accessToken (memory only), cryptoKey (memory only), isAuthenticated, isUnlocked, isFirstUse + actions: loginWithGoogle, unlockWithPassword, setupPassword, logout
  - `SyncSlice`: status, queueWrite, forceSync + sync middleware
  - Compose both slices
- [ ] **T2.7** Create `src/features/auth/hooks/useGoogleAuth.ts`:
  - Phase 1: `initiateLogin()` — start PKCE OAuth flow
  - Phase 1: `handleOAuthCallback()` — exchange code for token; set isAuthenticated; check Drive for sentinel (isFirstUse)
  - Phase 2: `unlockApp(password: string)` — derive key; verify sentinel; if correct set isUnlocked
  - Phase 2 (first use): `setupMasterPassword(password: string)` — derive key; create + upload sentinel in settings.enc
- [ ] **T2.8** Create `src/app/providers/AuthProvider.tsx`:
  - On mount: check for OAuth callback params in URL; call `handleOAuthCallback` if present
  - Provide auth + unlock state via context
- [ ] **T2.9** Create auth UI components:
  - `src/features/auth/components/LoginPage.tsx` — Glassmorphism dark card; "Conectar con Google" button
  - `src/features/auth/components/PasswordSetupPage.tsx` — First-use master password creation; confirm field; **prominent warning copy in Spanish** (from design.md section 3); min 12 chars enforcement
  - `src/features/auth/components/UnlockPage.tsx` — Returning user password entry; "Contraseña incorrecta" error on AES-GCM failure; no retry limit
- [ ] **T2.10** Create `src/app/Router.tsx`:
  - `/login` → LoginPage (unauthenticated)
  - `/setup` → PasswordSetupPage (authenticated but isFirstUse)
  - `/unlock` → UnlockPage (authenticated but !isUnlocked)
  - `/` → DashboardPage placeholder (authenticated + isUnlocked)
  - `/obligations` → placeholder
  - Guards: redirect based on auth/unlock state
- [ ] **T2.11** Create `src/app/providers/SyncProvider.tsx`:
  - Initialize `SyncService` instance
  - Expose `forceSync`, `syncStatus` via context
  - On drive write queue mutation: call `syncService.queueWrite(domain)`
- [ ] **T2.12** Write integration test for OAuth callback handler (mock token endpoint response)
- [ ] **T2.13** Write integration test for DriveClient (mock fetch responses for Drive API)
- [ ] **T2.14** Write integration tests for two-phase auth:
  - First use: OAuth → isFirstUse=true → setupPassword → sentinel created → isUnlocked=true
  - Return visit: OAuth → isFirstUse=false → unlockWithPassword(correct) → isUnlocked=true
  - Wrong password: unlockWithPassword(wrong) → isUnlocked stays false → error shown
- [ ] **T2.15** Verify: OAuth flow completes end-to-end in dev; master password flow works; no tokens or keys in localStorage; Drive encryption round-trip verified

**Acceptance criteria:**
- Clicking "Conectar con Google" redirects to Google OAuth
- After OAuth callback: first-use user sees PasswordSetupPage with prominent warning; returning user sees UnlockPage
- Wrong password shows error and does not unlock the app
- Correct password: all Drive data loads and decrypts successfully
- Access token is in Zustand memory (not in localStorage)
- `deriveKeyFromPassword` produces consistent CryptoKey for same password
- Encrypt→write→read→decrypt round-trip works with test data in Drive

---

## PR #3: obligations-core

**Goal**: Obligation CRUD, category management, eager installment generation, Zustand obligations slice.

**Estimated changed lines**: ~650–850 lines

**Depends on**: PR #2

### Tasks

- [ ] **T3.1** Create `src/features/obligations/store/obligationsSlice.ts`:
  - State: `obligations: Record<string, Obligation>`, `installments: Record<string, Installment>` (ALL records, eagerly), `categories: Record<string, Category>`
  - `addObligation(dto)`: creates Obligation + calls `generateInstallments()` to produce all N records; queues Drive write for 'obligations'
  - `updateObligation(id, updates)`: if schedule-affecting fields changed (installmentAmountCents, dueDay, totalInstallments), regenerates future PENDING installments (preserves PAID/RENEGOTIATED); queues Drive write
  - `softDeleteObligation(id)`: marks obligation + all its PENDING installments as DELETED; queues Drive write
  - `addCategory`, `updateCategory`, `deleteCategory` + Drive write queue for 'categories'
- [ ] **T3.2** Create `src/features/obligations/utils/installmentGenerator.ts`:
  - `generateInstallments(obligation, existingInstallments?)` — algorithm per design.md section 6
  - `computeDueDate(startDate, offsetMonths, dueDay)` — date-fns based, handles month-end overflow
  - `clampDueDay(year, month, dueDay)` — clamps to last day of month
  - `getInstallmentsForPeriod(installments, period)` — filter by dueDate.startsWith(period) + status != DELETED
- [ ] **T3.3** Write unit tests for `installmentGenerator.ts`:
  - Full generation: obligation with 12 installments → 12 records created
  - dueDay overflow: dueDay=31 in Feb → clamps to 28 (or 29 in leap year)
  - dueDay overflow: dueDay=31 in April → clamps to 30
  - Regeneration: existing PAID installments preserved; PENDING ones regenerated with new amounts
  - getInstallmentsForPeriod: correct filtering by YYYY-MM and excludes DELETED
  - Large generation: 600 installments generated in < 50ms
- [ ] **T3.4** Create `src/features/obligations/hooks/useObligations.ts`:
  - `activeObligations`: obligations where status != DELETED and status != RENEGOTIATED
  - `obligationsByCategory(categoryId)`: filter active obligations by category
  - `installmentsForObligation(obligationId)`: get all non-DELETED installments for an obligation
  - `nextDueInstallment(obligationId)`: first PENDING installment by dueDate ascending
- [ ] **T3.5** Create `src/features/obligations/components/ObligationForm.tsx`:
  - Glassmorphism form with all required fields from spec FR-1.1
  - Validation on submit (all required fields, constraints per spec)
  - Category selector (create new category inline)
  - Handles both Create and Edit modes
  - On edit: shows warning if installment count/amount/dueDay changed (triggers regeneration)
- [ ] **T3.6** Create `src/features/obligations/components/ObligationList.tsx`:
  - List all active obligations grouped by category
  - Per-obligation: show current installment / total, next due date + days remaining, installment amount
  - Actions: Edit, Delete (with confirmation; blocked if PAID installments exist)
  - Empty state illustration
- [ ] **T3.7** Create `src/features/obligations/components/CategoryManager.tsx`:
  - Inline category CRUD
  - Color picker for category
  - Cannot delete if obligations exist (show count)
- [ ] **T3.8** Add obligations route to Router.tsx: `/obligations` → ObligationsPage
- [ ] **T3.9** Create `/obligations` page: layout with list + FAB for add + drawer/modal for form
- [ ] **T3.10** On app load (after auth + unlock): fetch obligations.enc + categories.enc from Drive → decrypt → hydrate obligationsSlice (obligations + installments + categories)
- [ ] **T3.11** Write unit tests for obligationsSlice:
  - addObligation: generates correct number of installments; all start as PENDING
  - updateObligation on schedule change: regenerates PENDING installments; PAID ones unchanged
  - softDeleteObligation: blocked when PAID installments exist; marks PENDING ones DELETED
  - Category delete: blocked when active obligations exist
- [ ] **T3.12** Write integration test: create obligation with 12 installments → verify all 12 stored in slice → verify Drive write queued with correct encrypted payload

**Acceptance criteria:**
- User can create an obligation; all N installments immediately appear in store
- Editing installment amount regenerates future PENDING installments; PAID ones preserved
- Delete is blocked when obligation has PAID installments
- Category CRUD works; delete blocked when obligations exist
- App load correctly hydrates all obligations + installments from Drive

---

## PR #4: payment-states

**Goal**: Installment status lifecycle: PENDING → PAID (with payment date) | RENEGOTIATED (with new plan creation).

**Estimated changed lines**: ~500–600 lines

**Depends on**: PR #3

### Tasks

- [ ] **T4.1** Create `src/features/payments/store/paymentsSlice.ts`:
  - Actions: `markPaid(obligationId, installmentNumber, paidDate)`, `markRenegotiated(obligationId, newObligationData)`, `revertToPending(obligationId, installmentNumber)`
  - `markPaid`: creates/updates InstallmentRecord; derives period from paidDate; updates Obligation status if last installment paid
  - `markRenegotiated`: sets old obligation + all its PENDING installments to RENEGOTIATED; creates new Obligation with renegotiatedFromId
  - `revertToPending`: clears paidDate + period from InstallmentRecord; re-evaluates Obligation status
- [ ] **T4.2** Create `src/features/payments/hooks/usePaymentStateTransition.ts`:
  - `canMarkPaid(installment)`: true if status = PENDING
  - `canRenegotiate(obligation)`: true if obligation.status = PENDING
  - `canRevert(installment)`: true if status = PAID and obligation.status != RENEGOTIATED
- [ ] **T4.3** Create `src/features/obligations/components/InstallmentStatusSelector.tsx`:
  - Dropdown/button group: PENDING | PAID | RENEGOTIATED
  - PAID option opens PaymentDateModal
  - RENEGOTIATED option opens RenegotiationWizard
  - Current status shown with color coding per design.md section 10
- [ ] **T4.4** Create `src/features/payments/components/PaymentStatusModal.tsx`:
  - Modal with date picker for payment date
  - Validates date ≤ today
  - Shows computed reconciliation period
  - Confirm → calls `markPaid` action
- [ ] **T4.5** Create `src/features/payments/components/RenegotiationWizard.tsx`:
  - Multi-step: Step 1: Confirm renegotiation (show what gets archived); Step 2: Create new obligation form (pre-filled with old values)
  - On complete: calls `markRenegotiated` with both old ID and new obligation data
  - Shows linked obligation history note
- [ ] **T4.6** Create installment timeline view component:
  - For a selected obligation, show all installments across months
  - Past: with status badges
  - Current month: highlighted
  - Future: projected (status = PENDING)
  - Per-installment: status selector (`InstallmentStatusSelector`)
- [ ] **T4.7** Add period-based installment view page: `/obligations/:id/installments`
- [ ] **T4.8** Write unit tests for `paymentsSlice`:
  - markPaid: correct period derived from paidDate; InstallmentRecord created
  - markPaid last installment: obligation status → PAID
  - markRenegotiated: old obligation frozen; new linked correctly
  - revertToPending: clears paidDate, period
- [ ] **T4.9** Write unit tests for `usePaymentStateTransition`:
  - State transition guards (canMarkPaid, canRenegotiate, canRevert)
- [ ] **T4.10** Verify sync: every state transition queues a Drive write for 'obligations' domain

**Acceptance criteria:**
- Marking PAID requires and stores a payment date
- Period is correctly derived from paidDate (not dueDate)
- RENEGOTIATED correctly archives old plan and links to new obligation
- History is preserved — no hard deletes
- Revert PAID → PENDING clears payment data and re-queues sync

---

## PR #5: financial-matrix

**Goal**: Financial consolidation matrix dashboard — Category × Month table with subtotals, alerts, and navigation.

**Estimated changed lines**: ~500–600 lines

**Depends on**: PR #4

### Tasks

- [ ] **T5.1** Create `src/features/matrix/hooks/useMatrixComputation.ts`:
  - `computeMatrix(obligations, installmentRecords, categories, periods)`: returns `MatrixData` per design.md section 7
  - Handles lazy installment projection per-cell
  - Performance: memoized with `useMemo` on obligations, installmentRecords, periods deps
- [ ] **T5.2** Write unit tests for `useMatrixComputation.ts`:
  - Empty state: all zeros
  - Single obligation × 3 periods: correct cell values
  - Multiple categories: correct row grouping
  - RENEGOTIATED obligations: excluded from active cells
  - Column totals and row totals correct
  - Performance test: 20 categories × 12 months with 50 obligations < 100ms
- [ ] **T5.3** Create `src/features/matrix/components/ConsolidationMatrix.tsx`:
  - Responsive table: Category rows, Month columns
  - Sticky first column (category name) + sticky header row (months)
  - Cells display formatted CLP amounts
  - Row subtotals (last column), column totals (last row), grand total
  - Month navigation (prev/next arrows)
  - Default window: current month ± 3 months (7 months visible)
- [ ] **T5.4** Create `src/features/matrix/components/MatrixCell.tsx`:
  - Displays formatted amount
  - UPCOMING DUE indicator (due date ≤ 7 days, status = PENDING) — yellow pulse
  - Zero-amount cells: muted/empty display
  - Click to drill down to obligation detail
- [ ] **T5.5** Create `src/features/matrix/components/MatrixAlerts.tsx`:
  - HIGH LOAD indicator: total obligations > 80% of total income for that month
  - Summary bar above matrix: month total vs income vs margin
  - Cash flow pill: green (savings) or red (deficit) per month column header
- [ ] **T5.6** Create `src/features/matrix/components/MonthNavigator.tsx`:
  - Prev/Next month range navigation
  - Jump-to-month selector
  - Persist selected range in Zustand UI state (not in Drive)
- [ ] **T5.7** Create `/` (home) route as the main Dashboard page:
  - `ConsolidationMatrix` as the primary component
  - Summary cards: Total Obligations (current month), Total Income (current month), Cash Flow Margin
  - Quick-add FAB for new obligation
- [ ] **T5.8** Add matrix-specific Zustand slice:
  - `uiSlice.selectedPeriodRange: { start: string; end: string }`
  - Not persisted to Drive
- [ ] **T5.9** Write integration test: populate 10 obligations across 3 categories × 6 months; verify matrix totals

**Acceptance criteria:**
- Matrix renders correctly for 6+ months with multiple categories
- Row/column totals are mathematically correct (integer cents)
- Month navigation works; selected range persists during session
- UPCOMING DUE indicator appears for installments due within 7 days
- HIGH LOAD indicator appears when obligations > 80% of income
- Matrix re-computes in < 100ms for 20 categories × 12 months

---

## PR #6: income-budget

**Goal**: Income tracking module, fixed/variable entries, recurring income, and cash flow margin display.

**Estimated changed lines**: ~400–500 lines

**Depends on**: PR #5

### Tasks

- [ ] **T6.1** Create `src/features/income/store/incomeSlice.ts`:
  - State: `incomes: Record<string, Income>`
  - Actions: `addIncome`, `addRecurringIncome(income, months)`, `updateIncome`, `removeIncome`
  - `addRecurringIncome`: generates N income records with consecutive periods; max 24
  - On every mutation: `syncSlice.queueWrite('incomes')`
- [ ] **T6.2** Create `src/features/income/hooks/useIncome.ts`:
  - `getIncomeForPeriod(period)`: sum of all income.amountCents for that period
  - `getAllPeriods()`: returns all unique YYYY-MM periods with income data
- [ ] **T6.3** Create `src/features/income/components/IncomeForm.tsx`:
  - Fields: description, amountCents (CLP formatted input), type (FIXED/VARIABLE), period (month picker)
  - Conditional: if FIXED, show "Repeat monthly for N months" checkbox + N selector (1–24)
  - Validation per spec FR-4.1
- [ ] **T6.4** Create `src/features/income/components/IncomeList.tsx`:
  - Group by period (YYYY-MM)
  - Per-entry: type badge, description, formatted amount, edit/delete actions
  - Period total shown per group
  - Recurring entries visually indicated
- [ ] **T6.5** Add income route: `/income` → Income management page
- [ ] **T6.6** Integrate cash flow margin into Dashboard:
  - Per-period summary card: Income | Obligations | Margin
  - Margin: green pill with ▲ (savings) or red pill with ▼ (deficit) + formatted CLP amount
  - Matrix column headers: add margin indicator below month name
- [ ] **T6.7** On app load (after auth): fetch incomes.enc from Drive → decrypt → hydrate incomeSlice
- [ ] **T6.8** Write unit tests for `incomeSlice`:
  - addRecurringIncome generates correct N consecutive periods
  - addRecurringIncome respects max 24 months
  - getIncomeForPeriod sums correctly
- [ ] **T6.9** Write unit tests for cash flow margin calculation:
  - Savings capacity (positive margin)
  - Deficit (negative margin)
  - Zero income period shows deficit = total obligations

**Acceptance criteria:**
- User can create fixed/variable income entries per month
- Fixed income can be auto-repeated for up to 24 months
- Cash flow margin displays correctly in matrix dashboard
- Deficit shows in red, savings in green
- Income data persists to Drive encrypted

---

## PR #7: sync-indicators

**Goal**: Visual Drive sync status indicator, force re-sync button, conflict detection on load.

**Estimated changed lines**: ~350–450 lines

**Depends on**: PR #6

### Tasks

- [ ] **T7.1** Finalize `src/features/sync/store/syncSlice.ts`:
  - Status state machine: SYNCED | SYNCING | PENDING | ERROR | OFFLINE transitions
  - `pendingMutations: number` counter (incremented on queueWrite, decremented on flush success)
  - `errorMessage: string | null`
  - `lastSyncedAt: string | null`
  - Network status detection: `window.addEventListener('online'/'offline')`
- [ ] **T7.2** Create `src/features/sync/components/SyncStatusIndicator.tsx`:
  - Persistent in TopBar (always visible when authenticated)
  - Icons + text per state:
    - SYNCED: green checkmark, "Sincronizado"
    - SYNCING: spinning icon, "Sincronizando..."
    - PENDING: yellow dot, "Cambios pendientes"
    - ERROR: red ×, error message, "Reintentar" button
    - OFFLINE: gray wifi-off icon, "Sin conexión"
  - Force sync button (hidden when SYNCED/SYNCING/OFFLINE)
- [ ] **T7.3** Create `src/features/sync/hooks/useSyncStatus.ts`:
  - Exposes sync state from store
  - `handleForceSync()`: calls `syncService.forceSync()`
  - `getPendingCount()`: returns pendingMutations count
- [ ] **T7.4** Implement conflict detection in `SyncProvider.tsx`:
  - On app load after Drive fetch: compare `meta.json.version` vs local state version
  - If mismatch (remote > local): show `ConflictResolutionModal`
- [ ] **T7.5** Create `src/features/sync/components/ConflictResolutionModal.tsx`:
  - Modal with clear explanation: "Detected changes on another device"
  - Option A: "Cargar desde Drive" (discard local, reload from Drive)
  - Option B: "Mantener local" (overwrite Drive with local state)
  - No "Cancel" — user must choose; both choices are safe
- [ ] **T7.6** Implement automatic retry in SyncService:
  - On Drive write failure: retry with 1s, 2s, 4s exponential backoff (max 3 attempts)
  - After 3 failures: set SyncSlice status to ERROR with error message
  - On network reconnect (online event): auto-retry pending writes
- [ ] **T7.7** Create `src/shared/components/layout/TopBar.tsx`:
  - App name + logo (left)
  - `SyncStatusIndicator` (center-right)
  - User avatar + logout button (right)
- [ ] **T7.8** Create `src/shared/components/layout/Sidebar.tsx`:
  - Navigation links: Dashboard (matrix), Obligations, Income
  - Current route highlighted
  - Glassmorphism sidebar style
- [ ] **T7.9** Create `src/shared/components/layout/AppShell.tsx`:
  - Composes TopBar + Sidebar + main content area
  - Responsive: sidebar collapses to bottom nav on mobile
- [ ] **T7.10** Write unit tests for syncSlice state machine:
  - PENDING → SYNCING → SYNCED transition
  - PENDING → SYNCING → ERROR transition
  - OFFLINE detection; queue preserved
- [ ] **T7.11** Write unit test for conflict detection:
  - meta.json version > local → conflict modal triggered
  - meta.json version === local → no conflict
- [ ] **T7.12** Final integration sweep:
  - Verify all Drive writes are encrypted before upload (check Content-Type and payload format)
  - Verify no auth tokens in localStorage/sessionStorage
  - Verify matrix totals with a realistic 6-month dataset
  - Run full test suite: all tests pass
  - Run `tsc --noEmit`: zero errors
  - Run `npm run lint`: zero errors

**Acceptance criteria:**
- Sync status indicator reflects real Drive sync state
- Force re-sync writes all pending changes immediately
- Conflict modal appears when meta.json version mismatch
- Both conflict resolution choices work correctly (Drive wins or local wins)
- Auto-retry on failure with exponential backoff
- Auto-resume sync on network reconnect
- Full test suite passes
- TypeScript and lint are clean

---

## Summary

| PR | Change | Lines | Status |
|---|---|---|---|
| #1 | project-scaffold | ~350 | ✅ Complete |
| #2 | auth-drive-layer | ~575 | ⬜ Not started |
| #3 | obligations-core | ~700 | ⬜ Not started |
| #4 | payment-states | ~550 | ⬜ Not started |
| #5 | financial-matrix | ~550 | ⬜ Not started |
| #6 | income-budget | ~450 | ⬜ Not started |
| #7 | sync-indicators | ~400 | ⬜ Not started |
| **Total** | | **~3,575** | |

All PRs are within the 800-line review budget individually.
