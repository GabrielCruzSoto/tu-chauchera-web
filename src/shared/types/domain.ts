/**
 * Core domain types for Tu Chauchera.
 *
 * All money values use the Money branded type (integer CLP pesos).
 * All dates are ISO 8601 strings (YYYY-MM-DD).
 * All periods are YYYY-MM strings.
 */
import type { Money } from './money'
export type { Money }

// ─── Identifiers ────────────────────────────────────────────────────────────

export type UUID = string
export type ISODate = string    // "YYYY-MM-DD"
export type Period = string     // "YYYY-MM"

// ─── Category ───────────────────────────────────────────────────────────────

export interface Category {
  id: UUID
  name: string          // e.g., "Banco", "Servicios Básicos", "Suscripciones"
  color: string         // Tailwind color class or hex
  createdAt: ISODate
  updatedAt: ISODate
}

export interface CreateCategoryDTO {
  name: string
  color: string
}

// ─── Obligation ─────────────────────────────────────────────────────────────

export type ObligationStatus = 'PENDING' | 'PAID' | 'RENEGOTIATED' | 'DELETED'
export type ObligationType = 'EXPENSE' | 'DEBT' | 'P2P_DEBT'

export type P2PRole =
  | 'LENT_MY_CARD'       // User lent credit card to third party (third party owes user)
  | 'USED_THEIR_CARD'     // User used someone else's credit card (user owes third party)
  | 'DIRECT_LOAN_GIVEN'   // User loaned cash/money to third party
  | 'DIRECT_LOAN_TAKEN'   // User received cash loan from third party

export type MaintenanceSplitMode = 'FULL' | 'SPLIT_50_50' | 'CUSTOM_AMOUNT'
export type CommissionMode = 'SPREAD_ACROSS_INSTALLMENTS' | 'FIRST_INSTALLMENT_ONLY'

export interface CardFeeSurcharge {
  includeMaintenanceFee: boolean
  maintenanceFeeAmountCents?: Money | undefined
  maintenanceSplitMode?: MaintenanceSplitMode | undefined
  customMaintenanceCents?: Money | undefined

  includeOneTimeCommission: boolean
  totalCommissionCents?: Money | undefined
  commissionCollectionMode?: CommissionMode | undefined
}

export interface P2PMetadata {
  role: P2PRole
  thirdPartyName: string
  cardIssuer?: string | undefined
  productDescription: string
  baseInstallmentAmountCents: Money
  surcharges?: CardFeeSurcharge | undefined
  totalMonthlyChargeCents: Money
  linkedPaymentDueDay?: number | undefined
}

export interface Obligation {
  id: UUID
  type?: ObligationType | undefined
  categoryId: UUID
  subcategory: string   // e.g., "Banco Estado - Crédito Hipotecario" or person name
  detail: string        // Free-text description
  totalAmountCents: Money
  totalInstallments: number    // 1–600
  currentInstallment: number   // 1 ≤ current ≤ total (the first installment number)
  installmentAmountCents: Money
  isRecurringIndefinite?: boolean | undefined
  p2pMetadata?: P2PMetadata | undefined
  startDate: ISODate    // When the first installment is due
  dueDay: number        // Day of month (1–31); clamped to month length at display
  status: ObligationStatus
  createdAt: ISODate
  updatedAt: ISODate
  renegotiatedFromId?: UUID | undefined   // Links to the original obligation when RENEGOTIATED
}

export interface CreateObligationDTO {
  type?: ObligationType | undefined
  categoryId: UUID
  subcategory: string
  detail: string
  totalAmountCents: Money
  totalInstallments: number
  currentInstallment: number
  installmentAmountCents: Money
  isRecurringIndefinite?: boolean | undefined
  p2pMetadata?: P2PMetadata | undefined
  startDate: ISODate
  dueDay: number
}

// ─── Installment ─────────────────────────────────────────────────────────────

export type InstallmentStatus = 'PENDING' | 'PAID' | 'RENEGOTIATED' | 'DELETED'

/**
 * Eagerly-generated installment record.
 * All N installments are created upfront when an Obligation is added.
 */
export interface Installment {
  id: UUID
  obligationId: UUID
  installmentNumber: number    // 1-based; matches obligation.currentInstallment + offset
  dueDate: ISODate             // Computed from startDate + offset; dueDay clamped to month
  amountCents: Money
  status: InstallmentStatus
  paidDate?: ISODate | undefined           // Required when status = PAID; drives period assignment
  period?: Period | undefined              // YYYY-MM extracted from paidDate; used for reconciliation
  notes?: string | undefined
}

// ─── Income ──────────────────────────────────────────────────────────────────

export type IncomeType = 'FIXED' | 'VARIABLE'

export interface Income {
  id: UUID
  description: string
  amountCents: Money
  type: IncomeType
  period: Period               // "YYYY-MM" — the month this income applies to
  receivedDate?: ISODate | undefined
  categoryId?: UUID | undefined
  createdAt: ISODate
}

export interface CreateIncomeDTO {
  description: string
  amountCents: Money
  type: IncomeType
  period: Period
  receivedDate?: ISODate
  categoryId?: UUID
}

// ─── Sync Metadata ───────────────────────────────────────────────────────────

export type DataDomain = 'obligations' | 'incomes' | 'categories' | 'settings'

export type SyncStatus = 'SYNCED' | 'SYNCING' | 'PENDING' | 'ERROR' | 'OFFLINE'

/**
 * Unencrypted metadata stored in meta.json on Drive.
 * Contains only sync timestamps and file IDs — no financial data.
 */
export interface SyncMeta {
  version: number
  lastSyncedAt: ISODate
  driveFileIds: Partial<Record<DataDomain, string>>
  pendingChanges: boolean
  schemaVersion: string        // e.g., "1.0.0" — for future migrations
}

// ─── Drive Storage Shape ──────────────────────────────────────────────────────

/**
 * The decrypted JSON structure stored in obligations.enc.
 * Contains both Obligation records and all their Installments.
 */
export interface ObligationsStore {
  obligations: Record<UUID, Obligation>
  installments: Record<UUID, Installment>
  schemaVersion?: string | undefined
}

/** The decrypted JSON structure stored in incomes.enc. */
export interface IncomesStore {
  incomes: Record<UUID, Income>
  schemaVersion?: string | undefined
}

/** The decrypted JSON structure stored in categories.enc. */
export interface CategoriesStore {
  categories: Record<UUID, Category>
  schemaVersion?: string | undefined
}

/**
 * The decrypted JSON structure stored in settings.enc.
 * Contains the password sentinel (encrypted magic value for password verification).
 */
export interface SettingsStore {
  passwordSentinel: string     // Base64-encoded ArrayBuffer from createPasswordSentinel()
  schemaVersion?: string | undefined
  createdAt: ISODate
}

// ─── Credit Cards & Third-Party Receivables ──────────────────────────────────

export type PlasticType = 'TITULAR' | 'ADICIONAL'

export interface CreditCardPlastic {
  id: UUID
  accountId: UUID
  holderName: string            // e.g., "Gabriel Cruz", "Laura Soto"
  lastFourDigits: string        // e.g., "1234"
  type: PlasticType
  createdAt: ISODate
  updatedAt: ISODate
}

export interface CreditCardAccount {
  id: UUID
  institution: string           // e.g., "Banco Santander", "Banco de Chile"
  accountName: string           // e.g., "Visa Signature", "Mastercard Black"
  creditLimitCents: Money       // Total assigned limit in CLP cents
  closingDay: number            // Cycle closing day of month (1-31)
  dueDay: number                // Payment due day of month (1-31)
  plastics: CreditCardPlastic[] // Primary + additional cards
  createdAt: ISODate
  updatedAt: ISODate
}

export type PurchasePayerType = 'PROPIO' | 'TERCERO'
export type ThirdPartyReceivableStatus = 'PENDIENTE' | 'COBRADO_PARCIAL' | 'COBRADO_TOTAL'

export interface ThirdPartyRepayment {
  id: UUID
  amountCents: Money
  paymentDate: ISODate
  destinationAccount?: string | undefined  // e.g., "Banco Estado Cuenta Corriente"
  notes?: string | undefined
}

export interface ThirdPartyReceivable {
  id: UUID
  thirdPartyName: string        // Responsible contact person
  purchaseId: UUID
  totalOwedCents: Money
  amountCollectedCents: Money   // Sum of repayments
  status: ThirdPartyReceivableStatus
  repayments: ThirdPartyRepayment[]
}

export interface CreditCardPurchase {
  id: UUID
  accountId: UUID
  plasticId: UUID               // Plastic used for the purchase
  description: string
  purchaseDate: ISODate
  totalAmountCents: Money
  totalInstallments: number     // 1 = single payment / no installments
  firstInstallmentPeriod: Period // YYYY-MM calculated from purchaseDate vs closingDay
  payerType: PurchasePayerType
  thirdPartyReceivable?: ThirdPartyReceivable | undefined
  createdAt: ISODate
  updatedAt: ISODate
}

/** The decrypted JSON structure stored in credit_cards.enc */
export interface CreditCardsStore {
  accounts: Record<UUID, CreditCardAccount>
  purchases: Record<UUID, CreditCardPurchase>
  schemaVersion?: string | undefined
}
