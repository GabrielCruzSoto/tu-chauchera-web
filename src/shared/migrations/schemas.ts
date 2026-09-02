/**
 * Zod validation schemas for domain payloads in runtime.
 */
import { z } from "zod"
import type { Money } from "@/shared/types/money"
import type {
  ObligationStatus,
  InstallmentStatus,
  IncomeType,
  Category,
  Obligation,
  Installment,
  Income,
  ObligationsStore,
  CategoriesStore,
  IncomesStore,
  SettingsStore,
} from "@/shared/types/domain"

const moneySchema = z.number().int().nonnegative().transform((val) => val as Money)

export const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<Category>

export const obligationSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1),
  subcategory: z.string(),
  detail: z.string(),
  totalAmountCents: moneySchema,
  totalInstallments: z.number().int().min(1),
  currentInstallment: z.number().int().min(1),
  installmentAmountCents: moneySchema,
  startDate: z.string(),
  dueDay: z.number().int().min(1).max(31),
  status: z.enum(["PENDING", "PAID", "RENEGOTIATED", "DELETED"] as const satisfies readonly ObligationStatus[]),
  createdAt: z.string(),
  updatedAt: z.string(),
  renegotiatedFromId: z.string().optional(),
}) satisfies z.ZodType<Obligation>

export const installmentSchema = z.object({
  id: z.string().min(1),
  obligationId: z.string().min(1),
  installmentNumber: z.number().int().min(1),
  dueDate: z.string(),
  amountCents: moneySchema,
  status: z.enum(["PENDING", "PAID", "RENEGOTIATED", "DELETED"] as const satisfies readonly InstallmentStatus[]),
  paidDate: z.string().optional(),
  period: z.string().optional(),
  notes: z.string().optional(),
}) satisfies z.ZodType<Installment>

export const incomeSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  amountCents: moneySchema,
  type: z.enum(["FIXED", "VARIABLE"] as const satisfies readonly IncomeType[]),
  period: z.string(),
  receivedDate: z.string().optional(),
  categoryId: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<Income>

// ─── Domain Stores Validation Schemas ────────────────────────────────────────

export const obligationsStoreSchema = z.object({
  obligations: z.record(z.string(), obligationSchema),
  installments: z.record(z.string(), installmentSchema),
  schemaVersion: z.string().optional(),
}) satisfies z.ZodType<ObligationsStore>

export const categoriesStoreSchema = z.object({
  categories: z.record(z.string(), categorySchema),
  schemaVersion: z.string().optional(),
}) satisfies z.ZodType<CategoriesStore>

export const incomesStoreSchema = z.object({
  incomes: z.record(z.string(), incomeSchema),
  schemaVersion: z.string().optional(),
}) satisfies z.ZodType<IncomesStore>

export const settingsStoreSchema = z.object({
  passwordSentinel: z.string().min(1),
  schemaVersion: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<SettingsStore>
