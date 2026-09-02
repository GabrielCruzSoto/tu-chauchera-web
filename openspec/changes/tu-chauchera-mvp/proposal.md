# Product Proposal — tu-chauchera-mvp

## Change Name
`tu-chauchera-mvp`

## Problem Statement
Personal finance management in Chile requires tracking recurring obligations (bank debts, subscriptions, utilities) across many months, but existing tools either cost money, require sharing financial data with third-party servers, or lack the installment-tracking granularity needed for Chilean credit structures (cuotas). Users need a private, zero-cost, locally-controlled solution.

## Target Users
- Chilean individuals managing personal finances with multiple financed obligations (bank credits, consumer debts, service subscriptions)
- Users who prioritize data privacy and want zero-backend, self-sovereign financial tracking
- Single-user household finance managers

## Business Problem
1. No existing free tool tracks "cuotas" (installments) per obligation across a multi-month horizon with payment status management
2. Privacy concern: existing finance apps send data to third-party servers
3. Cost concern: paid finance apps have recurring subscription costs
4. Gap: no tool provides a cross-period consolidation matrix (Category × Month) that shows total monthly financial load

## Solution
**Tu Chauchera** — a local-first, zero-backend Single Page Application (SPA) that:
1. Authenticates via Google OAuth 2.0 (PKCE) — no passwords to manage
2. Stores all data encrypted (AES-256-GCM) in the user's own Google Drive (appDataFolder)
3. Tracks obligations with installment-level granularity and payment state lifecycle
4. Provides a financial consolidation matrix dashboard
5. Includes income tracking for cash flow margin calculation
6. Shows Drive sync status in real-time

## Product Outcome
- Users can see, at a glance, their total financial obligations for any month, broken down by category
- Users can track which installments were paid, when, and what the actual payment date was
- Users can see their savings capacity or deficit for any month
- All data stays private: encrypted on-device before reaching Google Drive

## MVP Scope

### In Scope
1. **Module 1 — Obligation Management (CRUD)**
   - Create/edit/delete obligations with: category, subcategory, detail, total amount, installments, installment amount, due day
   - Auto-generate installment records across months (lazy: computed per month view)
   - Status lifecycle: PENDING → PAID (requires payment date) | PENDING → RENEGOTIATED (links to new plan)

2. **Module 2 — Payment State Management**
   - Per-installment status selector (PENDING, PAID, RENEGOTIATED)
   - PAID state: mandatory payment date input + auto-assign reconciliation period (YYYY-MM)
   - RENEGOTIATED state: freeze/archive old plan, create new obligation linked by `renegotiatedFromId`
   - Full installment history preserved — no hard deletion

3. **Module 3 — Financial Consolidation Matrix (Dashboard)**
   - Interactive table: Category rows × Period/Month-Year columns
   - Auto-computed subtotals per category + grand total per month
   - Early payment alerts and projected financial load
   - Pure computed view — no stored state for matrix itself

4. **Module 4 — Income & Budget Module**
   - Register fixed/variable income entries per month
   - Auto-compute: Total Income - Total Obligations = Cash Flow Margin (savings/deficit)
   - Display margin prominently per month

5. **Module 5 — Sync Status Indicators**
   - Visual sync state: synced, syncing, pending changes, sync error
   - Force re-sync action
   - Conflict detection: version mismatch on load alerts user

### Out of Scope (MVP)
- Multi-currency support (CLP only)
- CSV/PDF export
- Multi-user or shared access
- Push notifications / reminders
- Budget limits / spending alerts beyond cash flow margin
- Tax calculation
- Investment tracking

## Key Business Rules
1. All money amounts stored and processed as integer cents (no floating point)
2. PAID status requires a payment date — system assigns reconciliation period from this date
3. RENEGOTIATED preserves full obligation history — old plan frozen, new plan linked
4. Installments generated lazily from Obligation data — not stored as individual Drive records per installment
5. Encryption happens before any Drive write — plaintext never reaches Google servers
6. OAuth access token in memory only — never persisted to localStorage

## Technical Constraints
- Zero backend — all logic runs client-side
- Google Drive appDataFolder as sole persistence layer
- AES-256-GCM encryption, key derived from PBKDF2(userSub + APP_SALT)
- React 18+ / TypeScript strict / Vite / Tailwind CSS / Zustand
- Glassmorphism dark theme UI

## Success Metrics (MVP)
- User can complete full obligation creation + payment marking flow without errors
- Financial matrix renders correctly for 6+ months of data
- App loads and decrypts Drive data in < 3 seconds on a standard connection
- All financial calculations are accurate (unit tested)
- AES encryption verified: Drive files are unreadable without the derived key

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| OAuth session expires after 1hr | HIGH | Graceful re-auth prompt; non-destructive UX |
| Floating-point money errors | HIGH | Integer cents throughout |
| Drive API rate limits | MEDIUM | Batched writes, exponential backoff |
| No project scaffold yet | MEDIUM | First change is `project-scaffold` |

## Implementation Strategy
Given the scope, implement as 7 sequential SDD changes:
1. `project-scaffold` — Vite + React + TS + Tailwind + Vitest + base structure
2. `auth-drive-layer` — OAuth PKCE + Drive API client + AES-256-GCM encryption layer
3. `obligations-core` — Obligation CRUD + lazy installment projection + Zustand store
4. `payment-states` — Installment status lifecycle (PENDING/PAID/RENEGOTIATED)
5. `financial-matrix` — Consolidation dashboard + category × month matrix
6. `income-budget` — Income module + cash flow margin calculation
7. `sync-indicators` — Drive sync status UI + force re-sync + conflict alerts

Each change is independently deliverable and can be reviewed separately.
