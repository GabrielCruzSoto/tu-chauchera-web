# Exploration Report — tu-chauchera-mvp

## Status
STATUS: complete

## 1. Architecture Decisions

### Google OAuth 2.0 PKCE in a Pure SPA
**Recommended approach:** Authorization Code Flow with PKCE (RFC 7636).

- Never use Implicit Flow (deprecated, token in URL fragment, no refresh token).
- Use `@react-oauth/google` or the `google.accounts.oauth2` JS library for PKCE.
- PKCE eliminates the need for a client secret; only `client_id` is exposed (safe for SPAs).
- Access token stored in **memory only** (Zustand store); never in localStorage.
- Refresh token is NOT available for pure SPA OAuth flows without a backend — sessions expire after 1 hour unless user re-authenticates.
- Mitigation: Store encrypted Drive session metadata in sessionStorage for UX continuity within a tab session. Prompt re-auth gracefully on expiry.

### Google Drive appDataFolder vs Regular Folder
| Factor | appDataFolder | Regular Folder |
|---|---|---|
| Visibility | Hidden from user's Drive UI | Visible, user can delete |
| Deletion risk | Low (app data, not user-facing) | High (accidental delete) |
| Access scope | `drive.appdata` (narrower) | `drive.file` or broader |
| **Recommendation** | Use appDataFolder | Not recommended |

**Verdict:** `appDataFolder` with scope `https://www.googleapis.com/auth/drive.appdata`. Smaller OAuth permission surface, safer for financial data.

### Local-First Sync Strategy
- In-memory Zustand state is source of truth during session.
- Writes: On every mutation, queue a Drive write (async, with retry + exponential backoff).
- Reads: On app load, fetch from Drive, decrypt, hydrate state.
- Conflict model: Single-user app — Last-write-wins per file acceptable for MVP.
- Offline: Queue writes in memory; apply on reconnect. Show sync status indicator.
- File structure: One JSON file per data domain — encrypted before upload.

---

## 2. State Management Recommendation

### Verdict: Zustand

| Factor | Zustand | Redux Toolkit |
|---|---|---|
| Bundle size | ~8KB | ~40KB+ |
| Boilerplate | Minimal | Moderate |
| TypeScript support | Excellent | Excellent |
| Async actions | Simple (async functions) | Requires thunks |
| Local-first pattern | Natural | More ceremony |

**Rationale:** For this financial SPA with no server-side API queries (all data comes from encrypted Drive files loaded at startup), Zustand is a better fit. RTK Query's cache management is unnecessary overhead when the "API" is just decrypted JSON loaded once per session.

---

## 3. Data Model Sketch

### Core Entities (TypeScript)

```typescript
interface Obligation {
  id: string;                           // UUID
  categoryId: string;
  subcategory: string;
  detail: string;
  totalAmountCents: number;             // Integer cents — NO floating point
  totalInstallments: number;            // e.g., 48
  currentInstallment: number;           // e.g., 12
  installmentAmountCents: number;
  startDate: string;                    // ISO 8601
  dueDay: number;                       // 1-31
  status: 'PENDING' | 'PAID' | 'RENEGOTIATED';
  createdAt: string;
  updatedAt: string;
  renegotiatedFromId?: string;
}

interface Installment {
  id: string;
  obligationId: string;
  installmentNumber: number;
  dueDate: string;
  amountCents: number;
  status: 'PENDING' | 'PAID' | 'RENEGOTIATED';
  paidDate?: string;                    // Required when PAID
  period?: string;                      // "YYYY-MM" — assigned on payment
  notes?: string;
}

interface Income {
  id: string;
  description: string;
  amountCents: number;
  type: 'FIXED' | 'VARIABLE';
  period: string;                       // "YYYY-MM"
  receivedDate?: string;
  categoryId?: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface SyncMeta {
  lastSyncedAt: string;
  driveFileIds: Record<string, string>;
  pendingChanges: boolean;
  version: number;
}
```

### Drive File Structure
```
appDataFolder/tu-chauchera/
  obligations.enc    <- AES-256-GCM encrypted JSON
  incomes.enc        <- AES-256-GCM encrypted JSON
  categories.enc     <- AES-256-GCM encrypted JSON
  settings.enc       <- AES-256-GCM encrypted JSON
  meta.json          <- Unencrypted sync metadata only
```

---

## 4. AES-256-GCM Key Management Strategy

### Key Derivation (MVP Approach)
- Derive 256-bit key: `PBKDF2(userSub + APP_SALT, 100_000 iterations, SHA-256)`
- Key lives in memory only (Zustand store)
- Re-derived on every OAuth login — no persistence
- `APP_SALT` is a fixed per-app string in the build (acceptable for MVP)

### Browser Storage Decision
| Storage | XSS Risk | Verdict |
|---|---|---|
| memory (Zustand) | None | Use for AES key |
| sessionStorage | High | Use only for non-sensitive sync state |
| localStorage | High | Avoid for key material |
| IndexedDB | High | Avoid for key material |

---

## 5. Risk Register

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | OAuth token expires after 1hr (no refresh token in SPA) | HIGH | Graceful re-auth UX prompt |
| R2 | Floating-point errors in financial math | HIGH | Integer cents for all money values |
| R3 | Drive API rate limits (100 req/user/100s) | MEDIUM | Batch writes, debounce sync triggers |
| R4 | No test runner installed | MEDIUM | First change: project scaffold with Vitest |
| R5 | Installment auto-generation for 48+ months = large payload | MEDIUM | Lazy generation per month view |
| R6 | Key derivation tied to OAuth sub (stable, but document) | LOW | Document sub stability in architecture notes |
| R7 | CORS from localhost during dev | LOW | Drive API supports localhost |
| R8 | User clears appDataFolder manually | LOW | Recovery UX: re-create folder, no data loss if cached |

---

## 6. Open Questions

1. **Key derivation**: Password-derived (more secure) vs OAuth sub-derived (better UX)? Proposal implies OAuth-derived.
2. **Installment generation**: Eager (all upfront, 48 records) or lazy (computed per month view)?
3. **Currency**: All amounts in CLP (Chilean Peso)? Confirm single-currency for MVP.
4. **Renegotiation**: When RENEGOTIATED, are old installments archived (kept) or deleted?
5. **Income recurrence**: Manual per-month entry or auto-repeat for fixed incomes?
6. **Export**: CSV/PDF export in MVP scope or Drive-only?

---

## 7. Exploration Summary

### Key Findings
1. Greenfield project — empty directory, pure start.
2. OAuth session limit (1hr) is the top UX risk.
3. Zustand is the right state manager for local-first pattern.
4. AES key must live in memory only, derived from PBKDF2(sub + salt).
5. appDataFolder is the right Drive scope — narrower permission surface.
6. Integer arithmetic (cents) is mandatory for financial correctness.
7. Installment generation should be lazy to avoid large Drive payloads.
8. Financial matrix is a pure derived computation — compute on the fly.
9. First implementation change must be project scaffold.

### Recommended Change Decomposition
1. `project-scaffold` — Vite + React + TS + Tailwind + Vitest
2. `auth-drive-layer` — OAuth PKCE + Drive API + AES-256-GCM layer
3. `obligations-core` — Obligation CRUD + installment projection
4. `payment-states` — Payment lifecycle management
5. `financial-matrix` — Dashboard + consolidation matrix
6. `income-budget` — Income tracking + cash flow
7. `sync-indicators` — Drive sync status UI
