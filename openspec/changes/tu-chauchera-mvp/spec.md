# Functional Specification — tu-chauchera-mvp

## Change Name
`tu-chauchera-mvp`

## Source
Based on: `openspec/changes/tu-chauchera-mvp/proposal.md`

---

## Assumptions (finalized — user decisions 2026-08-31)
- **A1 REVISED**: Encryption key derived from a **user-defined master password** via PBKDF2 (100,000 iterations, SHA-256). The password is set at first use and never stored. If forgotten, all Drive data is permanently inaccessible. UI must display this warning prominently at password setup and on every login.
- **A2 REVISED**: Installments generated **eagerly** — when an Obligation is created, all N installment records are written to Drive immediately. If the Obligation is edited (amount, installments, dueDay), affected installment records must be regenerated/updated. This enables direct status queries per installment and per month without on-the-fly projection.
- **A3**: Currency is CLP (Chilean Peso), single-currency for MVP
- **A4**: RENEGOTIATED keeps old installments archived (status = RENEGOTIATED, not deleted)
- **A5**: Fixed incomes marked as recurring create N individual records (up to 24 months). Each can be edited independently.
- **A6**: No CSV/PDF export in MVP — Drive-only storage

---

## Module 1 — Obligation Management

### FR-1.1: Create Obligation
**Given** the user is authenticated,  
**When** they submit the Create Obligation form with all required fields,  
**Then** the system creates an Obligation record with status = PENDING, persists it encrypted to Drive, and updates the Zustand store.

Required fields:
- `categoryId` — must reference an existing Category
- `subcategory` — free text, max 100 chars
- `detail` — free text, max 255 chars
- `totalAmountCents` — positive integer > 0
- `totalInstallments` — positive integer ≥ 1 (use 1 for lump-sum)
- `currentInstallment` — integer 1 ≤ currentInstallment ≤ totalInstallments
- `installmentAmountCents` — positive integer > 0
- `startDate` — ISO 8601 date (YYYY-MM-DD)
- `dueDay` — integer 1–31

**Then** (eager generation): The system immediately generates all N Installment records (from `currentInstallment` to `totalInstallments`) and persists them alongside the Obligation in Drive. Each Installment record is pre-populated with its computed `dueDate` and `amountCents`; initial status = PENDING.

> **Performance note:** For `totalInstallments = 600` (max), 600 records are generated. These are small JSON objects (~200 bytes each); 600 × 200B = 120KB — acceptable for Drive upload.

### FR-1.2: Edit Obligation
**Given** an existing PENDING obligation,  
**When** user edits and saves fields that affect installment schedule (installmentAmountCents, dueDay, totalInstallments),  
**Then:**
1. Obligation record is updated, `updatedAt` refreshed
2. All future PENDING installment records (installmentNumber ≥ currentInstallment) are regenerated with new values
3. Already PAID or RENEGOTIATED installments are preserved unchanged
4. Drive write queued for both obligations and installments domains

**Constraint:** Cannot edit an obligation with status = RENEGOTIATED. UI disables edit form.

**Constraint:** Editing `subcategory` or `detail` only (fields that don't affect schedule) does NOT trigger installment regeneration.

### FR-1.3: Delete Obligation
**Given** a PENDING obligation with no PAID installments,  
**When** user confirms deletion,  
**Then** obligation is soft-deleted (status marked `DELETED`, removed from active views). All its PENDING installment records are also marked `DELETED`.  
**Constraint:** Cannot delete an obligation that has ≥ 1 PAID installment record (history must be preserved).

### FR-1.4: Eager Installment Storage
**Given** an Obligation is created or its schedule fields are edited,  
**Then** the system generates/regenerates Installment records as follows:
- `id` = UUID
- `obligationId` = parent Obligation id
- `installmentNumber` = currentInstallment, currentInstallment+1, ..., totalInstallments
- `dueDate` = computed from `startDate` + offset months using `dueDay` (handle month-end overflow: e.g., dueDay=31 in Feb → last day of Feb)
- `amountCents` = obligation.installmentAmountCents
- `status` = PENDING (new records only; existing PAID/RENEGOTIATED records are not overwritten)

### FR-1.5: Category Management
**Given** the user opens Category settings,  
**When** they create/edit/delete a category,  
**Then** the category list in Drive (categories.enc) is updated.  
**Constraint:** Cannot delete a category that has active obligations.

---

## Module 2 — Payment State Management

### FR-2.1: Mark Installment as PAID
**Given** an installment with status = PENDING,  
**When** user selects PAID and provides a payment date,  
**Then:**
1. `paidDate` is set to the provided date
2. `period` is auto-assigned as `YYYY-MM` extracted from `paidDate`
3. An `InstallmentRecord` is created and persisted to Drive
4. If this is the last installment, parent Obligation status updated to PAID

**Validation:**
- `paidDate` must be a valid date ≤ today
- Payment date is required — cannot mark PAID without it

### FR-2.2: Mark Installment as RENEGOTIATED
**Given** an installment or obligation with status = PENDING,  
**When** user selects RENEGOTIATED,  
**Then:**
1. The existing Obligation's status is set to RENEGOTIATED
2. All its PENDING installments are marked RENEGOTIATED
3. User is prompted to create a new Obligation (the refinanced plan)
4. New Obligation has `renegotiatedFromId` pointing to the old one
5. Historical data (old obligation + old installments) preserved indefinitely

### FR-2.3: Revert PAID to PENDING
**Given** an installment with status = PAID,  
**When** user selects "Revert to Pending",  
**Then:**
1. `InstallmentRecord` for that installment is updated: status → PENDING, paidDate → null, period → null
2. Parent Obligation status re-evaluated

**Constraint:** Not available for obligations with status = RENEGOTIATED.

### FR-2.4: Reconciliation Period Assignment
- Period format: `YYYY-MM`
- Period is extracted from the actual payment date (paidDate), not the scheduled due date
- This ensures months with late payments reconcile to when money actually moved

---

## Module 3 — Financial Consolidation Matrix

### FR-3.1: Matrix View
**Given** the user opens the Dashboard,  
**When** the matrix renders,  
**Then** it displays:
- Rows: Categories (one row per category with active obligations in the period range)
- Columns: Months (YYYY-MM), user-selectable rolling window (default: current month ± 3 months)
- Cells: Sum of `installmentAmountCents` for obligations in that category for that month
- Row subtotal: Sum of all months for that category
- Column total: Sum of all categories for that month

**Computation:** Pure derived — no matrix state stored in Drive.

### FR-3.2: Alert Indicators
**Given** the matrix is displayed,  
**When** a month has total obligations > 80% of total income for that month (if income entered),  
**Then** that month's column header shows a HIGH LOAD visual indicator.

**When** an installment's due date is within 7 days and status = PENDING,  
**Then** the cell shows an UPCOMING DUE indicator.

### FR-3.3: Month Navigation
- User can scroll/navigate the month window (previous/next)
- Selected month range persisted in URL hash or local Zustand state

---

## Module 4 — Income & Budget

### FR-4.1: Create Income Entry
**Given** the user opens the Income module,  
**When** they submit an income entry with required fields,  
**Then** an Income record is created for the specified period.

Required fields:
- `description` — free text, max 100 chars
- `amountCents` — positive integer > 0
- `type` — FIXED | VARIABLE
- `period` — YYYY-MM (the month this income applies to)

Optional: `receivedDate`, `categoryId`

### FR-4.2: Recurring Fixed Income
**Given** an income entry with type = FIXED,  
**When** user enables "Repeat monthly",  
**Then** the system auto-creates copies for the next N months (user selects N, max 24).

### FR-4.3: Cash Flow Margin Calculation
**Given** a specific period (YYYY-MM),  
**When** the dashboard computes the period summary,  
**Then:**
```
cashFlowMargin = totalIncomeForPeriod - totalObligationsForPeriod
```
- Positive: Savings Capacity → displayed in green
- Negative: Deficit → displayed in red/orange with warning
- Computed in integer cents; displayed as formatted CLP currency

---

## Module 5 — Sync Status Indicators

### FR-5.1: Sync State Display
**Given** the user is authenticated,  
**When** viewing any page,  
**Then** a persistent sync status indicator shows one of:
- **SYNCED**: last Drive write was successful, no pending changes
- **SYNCING**: Drive write in progress
- **PENDING**: local changes exist that haven't been written to Drive
- **ERROR**: last Drive write failed (shows error reason, retry button)
- **OFFLINE**: no network connectivity detected

### FR-5.2: Force Re-Sync
**Given** the sync indicator is visible,  
**When** user clicks "Force Sync",  
**Then** all pending local changes are written to Drive immediately (bypassing debounce).

### FR-5.3: Conflict Detection
**Given** user opens the app in a new tab or after re-auth,  
**When** Drive's `meta.json` version > local state version,  
**Then** a conflict alert appears:
- Option A: "Load from Drive" — discards local pending changes, reloads from Drive
- Option B: "Keep local" — overwrites Drive with local state
- Last action taken is logged in `meta.json`

---

## Non-Functional Requirements

### NFR-1: Performance
- App initial load + Drive decrypt + Zustand hydration: < 3 seconds on 10Mbps connection
- Matrix re-computation for 12 months × 20 categories: < 100ms (synchronous in-memory)
- Drive write debounce: 1500ms after last mutation

### NFR-2: Security
- AES-256-GCM encryption for all financial data before Drive write
- Key derived via PBKDF2 (100,000 iterations, SHA-256) from `userSub + APP_SALT`
- Access token stored in Zustand memory only — never in localStorage or sessionStorage
- Content-Security-Policy headers configured in Vite build

### NFR-3: Correctness
- All money operations use integer arithmetic (cents); no `float` or `number` for currency values
- `Money` utility type enforces this at TypeScript level

### NFR-4: Offline
- App shell loads from browser cache when offline
- Pending mutations queued in memory; applied when connectivity restored
- Read-only access to locally cached data when offline

### NFR-5: Accessibility
- WCAG 2.1 AA contrast ratios maintained in Glassmorphism dark theme
- Keyboard navigation for all interactive elements
- ARIA labels on status indicators and matrix cells

---

## Data Validation Rules

| Field | Rule |
|---|---|
| amountCents / installmentAmountCents | Positive integer > 0; max 999_999_999_99 (CLP ~$1B) |
| totalInstallments | Integer 1–600 (max 50 years monthly) |
| currentInstallment | 1 ≤ value ≤ totalInstallments |
| dueDay | Integer 1–31; validated against month length at display |
| period | Regex: /^\d{4}-(0[1-9]|1[0-2])$/ |
| paidDate | Valid ISO date; ≤ today |
| startDate | Valid ISO date; any past or future date |

---

## Error Handling

| Error | Behavior |
|---|---|
| Drive write failure | Retry up to 3 times with exponential backoff; show ERROR sync state |
| OAuth token expired | Show re-auth prompt; preserve local state; no data loss |
| Drive file missing (first use) | Create new empty encrypted files; initialize with defaults |
| Decryption failure | Fatal error screen with "Contact support" + option to clear local data |
| Network offline | Show OFFLINE indicator; queue writes; continue with local data |

---

## Constraints and Assumptions Summary

| ID | Constraint | Source |
|---|---|---|
| A1 | Key = PBKDF2(sub + APP_SALT); no user password | Proposal + exploration |
| A2 | Installments generated lazily | Exploration recommendation |
| A3 | CLP only, single currency | Proposal + assumption |
| A4 | RENEGOTIATED preserves history | Proposal explicit |
| A5 | Fixed income can repeat monthly (max 24) | Exploration recommendation |
| A6 | No export in MVP | Proposal out-of-scope |
