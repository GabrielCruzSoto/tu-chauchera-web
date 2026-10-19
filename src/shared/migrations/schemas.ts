/**
 * Zod validation schemas for domain payloads in runtime.
 */
import { z } from "zod"
import type { Money } from "@/shared/types/money"
import type {
  ObligationStatus,
  ObligationType,
  P2PRole,
  MaintenanceSplitMode,
  CommissionMode,
  CardFeeSurcharge,
  P2PMetadata,
  InstallmentStatus,
  IncomeType,
  IncomeStatus,
  Category,
  Obligation,
  Installment,
  Income,
  ObligationsStore,
  CategoriesStore,
  IncomesStore,
  SettingsStore,
  CreditCardsStore,
  CreditCardAccount,
  CreditCardPlastic,
  CreditCardPurchase,
  ThirdPartyRepayment,
  ThirdPartyReceivable,
  PlasticType,
  PurchasePayerType,
  ThirdPartyReceivableStatus,
} from "@/shared/types/domain"

const moneySchema = z.number().int().nonnegative().transform((val) => val as Money)

export const categorySchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    color: z.string().min(1),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough() satisfies z.ZodType<Category>

export const cardFeeSurchargeSchema = z
  .object({
    includeMaintenanceFee: z.boolean(),
    maintenanceFeeAmountCents: moneySchema.optional(),
    maintenanceSplitMode: z
      .enum(["FULL", "SPLIT_50_50", "CUSTOM_AMOUNT"] as const satisfies readonly MaintenanceSplitMode[])
      .optional(),
    customMaintenanceCents: moneySchema.optional(),
    includeOneTimeCommission: z.boolean(),
    totalCommissionCents: moneySchema.optional(),
    commissionCollectionMode: z
      .enum(["SPREAD_ACROSS_INSTALLMENTS", "FIRST_INSTALLMENT_ONLY"] as const satisfies readonly CommissionMode[])
      .optional(),
  })
  .passthrough() satisfies z.ZodType<CardFeeSurcharge>

export const p2pMetadataSchema = z
  .object({
    role: z.enum([
      "LENT_MY_CARD",
      "USED_THEIR_CARD",
      "DIRECT_LOAN_GIVEN",
      "DIRECT_LOAN_TAKEN",
    ] as const satisfies readonly P2PRole[]),
    thirdPartyName: z.string(),
    cardIssuer: z.string().optional(),
    productDescription: z.string(),
    baseInstallmentAmountCents: moneySchema,
    surcharges: cardFeeSurchargeSchema.optional(),
    totalMonthlyChargeCents: moneySchema,
    linkedPaymentDueDay: z.number().int().min(1).max(31).optional(),
  })
  .passthrough() satisfies z.ZodType<P2PMetadata>

export const dueRuleSchema = z.union([
  z.object({
    kind: z.literal("FIXED_DAY"),
    day: z.number().int().min(1).max(31),
    shift: z.enum(["NONE", "NEXT_BUSINESS", "PREV_BUSINESS"]).optional(),
  }),
  z.object({
    kind: z.literal("LAST_BUSINESS_DAY"),
  }),
])

export const obligationSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["EXPENSE", "DEBT", "P2P_DEBT"] as const satisfies readonly ObligationType[]).optional(),
    categoryId: z.string().min(1),
    subcategory: z.string(),
    detail: z.string(),
    totalAmountCents: moneySchema,
    totalInstallments: z.number().int().min(1),
    currentInstallment: z.number().int().min(1),
    installmentAmountCents: moneySchema,
    isRecurringIndefinite: z.boolean().optional(),
    p2pMetadata: p2pMetadataSchema.optional(),
    startDate: z.string(),
    dueDay: z.number().int().min(1).max(31),
    dueRule: dueRuleSchema.optional(),
    annualRatePercentage: z.number().optional(),
    status: z.enum(["PENDING", "PAID", "RENEGOTIATED", "DELETED"] as const satisfies readonly ObligationStatus[]),
    createdAt: z.string(),
    updatedAt: z.string(),
    renegotiatedFromId: z.string().optional(),
  })
  .passthrough()
  .transform((obl): Obligation => {
    let resolvedType = obl.type
    let resolvedRecurring = obl.isRecurringIndefinite

    if (!resolvedType) {
      if (obl.p2pMetadata) {
        resolvedType = "P2P_DEBT"
      } else if (obl.isRecurringIndefinite) {
        resolvedType = "EXPENSE"
      } else if (
        (obl.categoryId === "cat-servicios" || obl.categoryId === "cat-suscrip") &&
        obl.totalInstallments === 60 &&
        obl.totalAmountCents === obl.installmentAmountCents * 60
      ) {
        resolvedType = "EXPENSE"
        resolvedRecurring = true
      }
    }

    return {
      ...obl,
      type: resolvedType,
      isRecurringIndefinite: resolvedRecurring,
    }
  }) satisfies z.ZodType<Obligation>

export const installmentSchema = z
  .object({
    id: z.string().min(1),
    obligationId: z.string().min(1),
    installmentNumber: z.number().int().min(1),
    dueDate: z.string(),
    amountCents: moneySchema,
    status: z.enum(["PENDING", "PAID", "RENEGOTIATED", "DELETED"] as const satisfies readonly InstallmentStatus[]),
    paidDate: z.string().optional(),
    period: z.string().optional(),
    notes: z.string().optional(),
    originalDueDate: z.string().optional(),
    isOverdueRollover: z.boolean().optional(),
  })
  .passthrough() satisfies z.ZodType<Installment>

export const incomeSchema = z
  .object({
    id: z.string().min(1),
    description: z.string().min(1),
    amountCents: moneySchema,
    type: z.enum(["FIXED", "VARIABLE"] as const satisfies readonly IncomeType[]),
    status: z.enum(["REAL", "ESTIMATED"] as const satisfies readonly IncomeStatus[]).optional(),
    period: z.string(),
    receivedDate: z.string().optional(),
    categoryId: z.string().optional(),
    payRule: dueRuleSchema.optional(),
    createdAt: z.string(),
  })
  .passthrough() satisfies z.ZodType<Income>

// ─── Domain Stores Validation Schemas ────────────────────────────────────────

export const obligationsStoreSchema = z
  .object({
    obligations: z.record(z.string(), obligationSchema),
    installments: z.record(z.string(), installmentSchema),
    schemaVersion: z.string().optional(),
  })
  .passthrough() satisfies z.ZodType<ObligationsStore>

export const categoriesStoreSchema = z
  .object({
    categories: z.record(z.string(), categorySchema),
    schemaVersion: z.string().optional(),
  })
  .passthrough() satisfies z.ZodType<CategoriesStore>

export const incomesStoreSchema = z
  .object({
    incomes: z.record(z.string(), incomeSchema),
    schemaVersion: z.string().optional(),
  })
  .passthrough() satisfies z.ZodType<IncomesStore>

export const settingsStoreSchema = z
  .object({
    passwordSentinel: z.string().min(1),
    schemaVersion: z.string().optional(),
    createdAt: z.string(),
  })
  .passthrough() satisfies z.ZodType<SettingsStore>

export const creditCardPlasticSchema = z
  .object({
    id: z.string().min(1),
    accountId: z.string().min(1),
    holderName: z.string().min(1),
    lastFourDigits: z.string().min(1),
    type: z.enum(["TITULAR", "ADICIONAL"] as const satisfies readonly PlasticType[]),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough() satisfies z.ZodType<CreditCardPlastic>

export const creditCardAccountSchema = z
  .object({
    id: z.string().min(1),
    institution: z.string().min(1),
    accountName: z.string().min(1),
    creditLimitCents: moneySchema,
    hasInternationalLimit: z.boolean().optional(),
    internationalCreditLimitUSD: z.number().optional(),
    monthlyMaintenanceFeeCents: moneySchema.optional(),
    monthlyMaintenanceFeeCurrency: z.enum(["CLP", "UF"]).optional(),
    monthlyMaintenanceFeeAmount: z.number().optional(),
    closingDay: z.number().int().min(1).max(31),
    dueDay: z.number().int().min(1).max(31),
    plastics: z.array(creditCardPlasticSchema),
    paidPeriods: z.array(z.string()).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough() satisfies z.ZodType<CreditCardAccount>

export const thirdPartyRepaymentSchema = z
  .object({
    id: z.string().min(1),
    amountCents: moneySchema,
    paymentDate: z.string(),
    destinationAccount: z.string().optional(),
    notes: z.string().optional(),
  })
  .passthrough() satisfies z.ZodType<ThirdPartyRepayment>

export const thirdPartyReceivableSchema = z
  .object({
    id: z.string().min(1),
    thirdPartyName: z.string().min(1),
    purchaseId: z.string().min(1),
    totalOwedCents: moneySchema,
    amountCollectedCents: moneySchema,
    status: z.enum(["PENDIENTE", "COBRADO_PARCIAL", "COBRADO_TOTAL"] as const satisfies readonly ThirdPartyReceivableStatus[]),
    repayments: z.array(thirdPartyRepaymentSchema),
  })
  .passthrough() satisfies z.ZodType<ThirdPartyReceivable>

export const creditCardPurchaseSchema = z
  .object({
    id: z.string().min(1),
    accountId: z.string().min(1),
    plasticId: z.string().min(1),
    description: z.string().min(1),
    purchaseDate: z.string(),
    totalAmountCents: moneySchema,
    totalInstallments: z.number().int().min(1),
    firstInstallmentPeriod: z.string(),
    payerType: z.enum(["PROPIO", "TERCERO"] as const satisfies readonly PurchasePayerType[]),
    thirdPartyReceivable: thirdPartyReceivableSchema.optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough() satisfies z.ZodType<CreditCardPurchase>

export const creditCardsStoreSchema = z
  .object({
    accounts: z.record(z.string(), creditCardAccountSchema),
    purchases: z.record(z.string(), creditCardPurchaseSchema),
    schemaVersion: z.string().optional(),
  })
  .passthrough() satisfies z.ZodType<CreditCardsStore>

