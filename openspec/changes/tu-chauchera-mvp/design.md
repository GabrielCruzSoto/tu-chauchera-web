# Technical Design — tu-chauchera-mvp

## Change Name
`tu-chauchera-mvp`

## Source
Based on: `openspec/changes/tu-chauchera-mvp/spec.md` + `openspec/changes/tu-chauchera-mvp/explore.md`

---

## 1. Project Structure

```
tu-chauchera-web/
├── public/
│   └── favicon.svg
├── src/
│   ├── app/
│   │   ├── App.tsx                    # Root router + auth guard
│   │   ├── Router.tsx                 # React Router routes
│   │   └── providers/
│   │       ├── AuthProvider.tsx       # OAuth context + token management
│   │       └── SyncProvider.tsx       # Drive sync context
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   └── LoginPage.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useGoogleAuth.ts
│   │   │   └── services/
│   │   │       └── googleOAuth.ts     # PKCE flow implementation
│   │   ├── obligations/
│   │   │   ├── components/
│   │   │   │   ├── ObligationList.tsx
│   │   │   │   ├── ObligationForm.tsx
│   │   │   │   └── InstallmentStatusSelector.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useObligations.ts
│   │   │   │   └── useInstallmentProjection.ts
│   │   │   └── store/
│   │   │       └── obligationsSlice.ts  # Zustand slice
│   │   ├── payments/
│   │   │   ├── components/
│   │   │   │   ├── PaymentStatusModal.tsx  # PAID date input modal
│   │   │   │   └── RenegotiationWizard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── usePaymentStateTransition.ts
│   │   │   └── store/
│   │   │       └── paymentsSlice.ts
│   │   ├── matrix/
│   │   │   ├── components/
│   │   │   │   ├── ConsolidationMatrix.tsx
│   │   │   │   ├── MatrixCell.tsx
│   │   │   │   └── MatrixAlerts.tsx
│   │   │   └── hooks/
│   │   │       └── useMatrixComputation.ts
│   │   ├── income/
│   │   │   ├── components/
│   │   │   │   ├── IncomeList.tsx
│   │   │   │   └── IncomeForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useIncome.ts
│   │   │   └── store/
│   │   │       └── incomeSlice.ts
│   │   └── sync/
│   │       ├── components/
│   │       │   └── SyncStatusIndicator.tsx
│   │       ├── hooks/
│   │       │   └── useSyncStatus.ts
│   │       └── store/
│   │           └── syncSlice.ts
│   ├── shared/
│   │   ├── types/
│   │   │   ├── domain.ts              # Obligation, Installment, Income, Category, SyncMeta
│   │   │   └── money.ts               # Money branded type + utilities
│   │   ├── utils/
│   │   │   ├── crypto.ts              # AES-256-GCM encrypt/decrypt + key derivation
│   │   │   ├── money.ts               # Integer cent arithmetic utilities
│   │   │   ├── dates.ts               # Date utilities (no floating point dates)
│   │   │   └── period.ts              # YYYY-MM period utilities
│   │   ├── services/
│   │   │   ├── driveClient.ts         # Google Drive API client (appDataFolder)
│   │   │   └── syncService.ts         # Sync queue + debounced write logic
│   │   └── components/
│   │       ├── ui/                    # Glassmorphism design system components
│   │       │   ├── Button.tsx
│   │       │   ├── Card.tsx
│   │       │   ├── Modal.tsx
│   │       │   ├── Input.tsx
│   │       │   ├── Badge.tsx
│   │       │   └── Tooltip.tsx
│   │       └── layout/
│   │           ├── AppShell.tsx
│   │           ├── Sidebar.tsx
│   │           └── TopBar.tsx
│   ├── store/
│   │   └── index.ts                   # Zustand root store composition
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
└── package.json
```

---

## 2. State Architecture (Zustand)

### Store Slices

```typescript
// store/index.ts — composed store
interface AppStore {
  auth: AuthSlice;
  obligations: ObligationsSlice;
  payments: PaymentsSlice;
  income: IncomeSlice;
  categories: CategoriesSlice;
  sync: SyncSlice;
}

// AuthSlice — two-phase auth: OAuth (identity) + master password (key derivation)
interface AuthSlice {
  user: { sub: string; email: string; name: string } | null;
  accessToken: string | null;          // Memory only; never persisted
  cryptoKey: CryptoKey | null;         // WebCrypto key object; memory only; derived from master password
  isAuthenticated: boolean;            // true after OAuth completes
  isUnlocked: boolean;                 // true after master password verified
  isFirstUse: boolean;                 // true if no settings.enc sentinel found in Drive
  loginWithGoogle: (tokenResponse: TokenResponse) => Promise<void>; // Phase 1: OAuth
  unlockWithPassword: (password: string) => Promise<void>;          // Phase 2: derive key + verify sentinel
  setupPassword: (password: string) => Promise<void>;               // First use: create sentinel + store key
  logout: () => void;                  // Clears everything; key wiped from memory
}

// ObligationsSlice — eagerly stores all installment records
interface ObligationsSlice {
  obligations: Record<string, Obligation>;
  installments: Record<string, Installment>; // All N records per obligation (keyed by installment.id)
  categories: Record<string, Category>;
  addObligation: (o: CreateObligationDTO) => void;         // Creates obligation + all N installments
  updateObligation: (id: string, updates: Partial<Obligation>) => void; // Regenerates future PENDING installments
  softDeleteObligation: (id: string) => void;              // Marks obligation + PENDING installments DELETED
  addCategory: (c: CreateCategoryDTO) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
}

// PaymentsSlice
interface PaymentsSlice {
  markPaid: (obligationId: string, installmentNumber: number, paidDate: string) => void;
  markRenegotiated: (obligationId: string, newObligationData: CreateObligationDTO) => void;
  revertToPending: (obligationId: string, installmentNumber: number) => void;
}

// IncomeSlice
interface IncomeSlice {
  incomes: Record<string, Income>;
  addIncome: (i: CreateIncomeDTO) => void;
  addRecurringIncome: (i: CreateIncomeDTO, months: number) => void;
  removeIncome: (id: string) => void;
}

// SyncSlice
interface SyncSlice {
  status: 'SYNCED' | 'SYNCING' | 'PENDING' | 'ERROR' | 'OFFLINE';
  lastSyncedAt: string | null;
  pendingMutations: number;
  errorMessage: string | null;
  queueWrite: (domain: DataDomain) => void;
  forcSync: () => Promise<void>;
  setStatus: (status: SyncStatus) => void;
}
```

### Store Middleware
- `persist` middleware: NOT used for auth/crypto keys — those are always memory-only
- Custom `syncMiddleware`: On every state mutation in obligations/payments/income, calls `syncSlice.queueWrite(domain)`

---

## 3. Crypto Layer

> **Decision A1 (2026-08-31):** Key derived from user-defined master password, NOT from OAuth sub + APP_SALT. No server-side secret needed. If password is forgotten, data is permanently inaccessible. UI must warn at setup and every login.

```typescript
// src/shared/utils/crypto.ts

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH = 'SHA-256';
const KEY_SALT = 'tu-chauchera-v1'; // Fixed app salt — safe to embed (password is the secret)

// Derive AES-256-GCM key from user-defined master password
async function deriveKeyFromPassword(masterPassword: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(KEY_SALT),
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,  // Non-extractable — cannot be read back from memory
    ['encrypt', 'decrypt']
  );
}

// Encrypt JSON data — returns IV prepended to ciphertext
async function encryptData(key: CryptoKey, data: unknown): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const result = new Uint8Array(iv.length + ciphertext.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ciphertext), iv.length);
  return result.buffer;
}

// Decrypt and parse JSON — throws on wrong key (AES-GCM auth tag failure)
async function decryptData<T>(key: CryptoKey, buffer: ArrayBuffer): Promise<T> {
  const bytes = new Uint8Array(buffer);
  const iv = bytes.slice(0, 12);
  const ciphertext = bytes.slice(12);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}

// Password setup flow (first use):
// 1. User creates master password (min 12 chars recommended)
// 2. UI displays warning: "Si olvidas esta contraseña, tus datos son irrecuperables permanentemente."
// 3. User confirms password
// 4. deriveKeyFromPassword(password) → CryptoKey stored in AuthSlice memory
// 5. A "password hint" (a tiny encrypted sentinel value) is stored in settings.enc
//    so subsequent logins can verify the password without a test-decrypt of all data.

// Password verification on login:
// 1. User enters master password
// 2. Derive key from password
// 3. Attempt decrypt of sentinel from settings.enc
// 4. If AES-GCM auth tag passes → password correct → store key in AuthSlice
// 5. If AES-GCM throws → password incorrect → show error, clear key
```

> **UX Warning Copy (required at password setup screen):**
> "⚠️ IMPORTANTE: Esta contraseña no se almacena en ningún servidor ni en tu dispositivo. Si la olvidas, todos tus datos financieros serán permanentemente inaccesibles. Guarda tu contraseña en un lugar seguro."

> **No VITE_APP_SALT env variable needed** — the salt is a fixed public string; the password is the actual secret. Remove VITE_APP_SALT from .env.example.


---

## 4. Google Drive Client

```typescript
// src/shared/services/driveClient.ts

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const APP_FOLDER_NAME = 'tu-chauchera';

type DataDomain = 'obligations' | 'incomes' | 'categories' | 'settings';

class DriveClient {
  constructor(private getToken: () => string | null) {}

  // Get or create app folder in appDataFolder
  async getAppFolderId(): Promise<string> { ... }

  // Get file ID for a domain file (obligations.enc, etc.)
  async getFileId(domain: DataDomain): Promise<string | null> { ... }

  // Upload/overwrite encrypted data
  async write(domain: DataDomain, encryptedBuffer: ArrayBuffer): Promise<void> { ... }

  // Download and return encrypted ArrayBuffer
  async read(domain: DataDomain): Promise<ArrayBuffer | null> { ... }

  // Read unencrypted meta.json
  async readMeta(): Promise<SyncMeta | null> { ... }

  // Write unencrypted meta.json
  async writeMeta(meta: SyncMeta): Promise<void> { ... }
}
```

---

## 5. Sync Service

```typescript
// src/shared/services/syncService.ts

// Debounced write queue — 1500ms debounce
class SyncService {
  private pendingDomains = new Set<DataDomain>();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  queueWrite(domain: DataDomain): void {
    this.pendingDomains.add(domain);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.flush(), 1500);
  }

  async flush(): Promise<void> {
    // For each pending domain:
    // 1. Read from Zustand store
    // 2. Encrypt with CryptoKey
    // 3. Write to Drive
    // 4. Update meta.json
    // 5. Clear from pendingDomains
  }

  async forceSync(): Promise<void> {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    await this.flush();
  }
}
```

---

## 6. Installment Eager Generation

> **Decision A2 (2026-08-31):** All N installment records are created upfront in Drive when an obligation is created. On obligation schedule edit, future PENDING records are regenerated.

```typescript
// src/features/obligations/utils/installmentGenerator.ts

import { addMonths, getDaysInMonth, setDate, format } from 'date-fns';

/** Clamp dueDay to the actual last day of a given month (handles Feb 30 → Feb 28/29) */
function clampDueDay(year: number, month: number, dueDay: number): number {
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  return Math.min(dueDay, daysInMonth);
}

/** Compute ISO due date string for a given installment offset */
function computeDueDate(startDate: string, offsetMonths: number, dueDay: number): string {
  const base = new Date(startDate + 'T00:00:00');
  const target = addMonths(base, offsetMonths);
  const year = target.getFullYear();
  const month = target.getMonth() + 1;
  const day = clampDueDay(year, month, dueDay);
  return format(setDate(new Date(year, month - 1), day), 'yyyy-MM-dd');
}

/**
 * Generate all Installment records for an Obligation.
 * Called on creation (full generation) and on schedule-affecting edits (partial regeneration).
 */
function generateInstallments(
  obligation: Obligation,
  existingInstallments: Installment[] = [], // Pass existing to preserve PAID/RENEGOTIATED
): Installment[] {
  const { id, currentInstallment, totalInstallments, installmentAmountCents, startDate, dueDay } = obligation;

  // Build a map of existing non-PENDING records to preserve
  const preserved = new Map<number, Installment>(
    existingInstallments
      .filter(i => i.status === 'PAID' || i.status === 'RENEGOTIATED')
      .map(i => [i.installmentNumber, i])
  );

  const installments: Installment[] = [];

  for (let num = currentInstallment; num <= totalInstallments; num++) {
    if (preserved.has(num)) {
      // Preserve existing PAID/RENEGOTIATED record unchanged
      installments.push(preserved.get(num)!);
    } else {
      const offset = num - currentInstallment;
      installments.push({
        id: crypto.randomUUID(),
        obligationId: id,
        installmentNumber: num,
        dueDate: computeDueDate(startDate, offset, dueDay),
        amountCents: installmentAmountCents as Money,
        status: 'PENDING',
      });
    }
  }

  return installments;
}
```

**Storage:** Installments stored in `obligations.enc` alongside Obligation records (same Drive domain). The store uses `installments: Record<string, Installment>` keyed by installment UUID for O(1) lookup.

**Matrix computation with eager installments:** Instead of projecting on the fly, the matrix queries the eagerly-stored installments directly by `dueDate` YYYY-MM period:

```typescript
function getInstallmentsForPeriod(
  installments: Installment[],
  period: string // "YYYY-MM"
): Installment[] {
  return installments.filter(
    i => i.status !== 'DELETED' && i.dueDate.startsWith(period)
  );
}
```


---

## 7. Financial Matrix Computation

```typescript
// src/features/matrix/hooks/useMatrixComputation.ts

interface MatrixData {
  categories: Category[];
  periods: string[]; // ["2026-07", "2026-08", ...]
  cells: Record<string, Record<string, number>>; // categoryId -> period -> totalCents
  columnTotals: Record<string, number>; // period -> totalCents
  rowTotals: Record<string, number>; // categoryId -> totalCents
  grandTotal: number;
}

function computeMatrix(
  obligations: Obligation[],
  installmentRecords: Record<string, InstallmentRecord>,
  categories: Category[],
  periods: string[]
): MatrixData {
  // For each (category, period) pair:
  // - Filter active obligations in that category
  // - Compute installment for that period using projection algorithm
  // - Aggregate amountCents
  // Pure computation — O(obligations × periods)
}
```

---

## 8. OAuth PKCE Flow

```typescript
// src/features/auth/services/googleOAuth.ts

const OAUTH_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  scopes: [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/drive.appdata',
  ],
  redirectUri: window.location.origin,
};

// PKCE helpers
function generateCodeVerifier(): string { /* 43-128 char random string */ }
async function generateCodeChallenge(verifier: string): Promise<string> { /* SHA-256 base64url */ }

// Flow:
// 1. Generate code_verifier + code_challenge
// 2. Store code_verifier in sessionStorage (needed for token exchange)
// 3. Redirect to Google authorization endpoint with code_challenge
// 4. On callback: exchange code + code_verifier for access_token
// 5. Extract user info (sub, email, name) from id_token
// 6. Derive CryptoKey from sub
// 7. Store token + key in Zustand AuthSlice (memory only)
```

---

## 9. Money Utility Type

```typescript
// src/shared/types/money.ts

// Branded type — prevents accidental use of raw numbers as currency
declare const __brand: unique symbol;
type Money = number & { [__brand]: 'Money' };

function toCents(amountCLP: number): Money {
  return Math.round(amountCLP) as Money; // CLP has no decimals; integer pesos = integer "cents"
}

function addMoney(a: Money, b: Money): Money {
  return (a + b) as Money;
}

function formatCLP(cents: Money): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(cents);
}
```

---

## 10. UI Design System — Glassmorphism Dark

### Color Palette
```css
/* tailwind.config.ts extensions */
colors: {
  surface: {
    DEFAULT: 'rgba(255,255,255,0.05)',
    hover: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.12)',
  },
  neon: {
    green: '#39ff8f',   /* Savings/synced indicator */
    red: '#ff4d6d',     /* Deficit/error indicator */
    blue: '#4d9fff',    /* Primary accent */
    yellow: '#ffd166',  /* Warning/upcoming due */
  },
  bg: {
    deep: '#0a0a1a',    /* Base background */
    surface: '#111127', /* Card backgrounds */
  }
}
```

### Component Glassmorphism Pattern
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
}
```

### State Color Coding
| Status | Color | Usage |
|---|---|---|
| PENDING | Yellow/muted | Default installment state |
| PAID | Neon green | Completed payment |
| RENEGOTIATED | Blue/muted | Archived obligation |
| ERROR/Deficit | Neon red | Alert states |
| SYNCING | Pulsing blue | Sync in progress |
| OFFLINE | Gray | Network unavailable |

---

## 11. Technology Decisions

| Concern | Decision | Rationale |
|---|---|---|
| State management | Zustand 4.x | Minimal overhead; perfect for local-first pattern |
| Routing | React Router 6.x | Standard SPA routing; loader/action pattern useful for auth guard |
| Drive API | Direct fetch (no SDK) | Lighter than gapi.js; works with Vite tree-shaking |
| OAuth | Custom PKCE implementation | Avoids heavy gapi.client; PKCE is straightforward |
| Date handling | Temporal API polyfill or date-fns | Avoid Moment.js; date-fns is tree-shakeable |
| Testing | Vitest + Testing Library | Native Vite integration; fast |
| Linting | ESLint + typescript-eslint | Strict mode; no-any; no-floating-promises |
| Formatting | Prettier | Opinionated; zero config debates |
| Bundle analysis | vite-bundle-visualizer | Ensure Drive/Crypto stay lean |

---

## 12. Environment Variables

```env
# .env.local (never committed)
VITE_GOOGLE_CLIENT_ID=<your-oauth-client-id>
VITE_APP_SALT=<random-64-char-string-generated-at-setup>

# .env.example (committed)
VITE_GOOGLE_CLIENT_ID=
VITE_APP_SALT=
```

---

## 13. Key Design Decisions and Trade-offs

| Decision | Choice | Trade-off |
|---|---|---|
| Lazy installment generation | Compute per view | Simpler Drive storage; slightly more CPU per view render |
| Single AES key per user | PBKDF2(sub+salt) | Simpler UX; if sub changes, data is inaccessible (document clearly) |
| One .enc file per data domain | obligations.enc, incomes.enc, etc. | Simple; Drive write per domain; no cross-entity transactions |
| Matrix as pure computation | No storage | Fast re-compute; no staleness issues |
| Debounced sync (1500ms) | Batch mutations | Fewer Drive API calls; 1.5s data loss window on crash (acceptable) |
| No refresh token | Accept 1hr session | Simpler architecture; UX re-auth prompt on expiry |
