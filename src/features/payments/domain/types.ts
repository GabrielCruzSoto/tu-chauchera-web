import type { Money, ISODate, Period, UUID } from "@/shared/types/domain"

export type PaymentSourceType = "INSTALLMENT" | "CREDIT_CARD"

export interface PaymentItem {
  id: string
  title: string
  subtitle?: string
  amountCents: Money
  dueDate: ISODate
  dueDay: number
  period: Period // YYYY-MM
  sourceType: PaymentSourceType
  sourceId: UUID
  isPaid: boolean
  paidDate?: ISODate
  categoryName?: string
  categoryColor?: string
  isDebt: boolean
}

export interface PaymentWindow {
  id: string
  name: string
  description: string
  startDay: number
  endDay: number
  items: PaymentItem[]
  totalAmountCents: Money
  totalPendingCents: Money
  totalPaidCents: Money
}

export type FinancialBurdenLevel = "HEALTHY" | "CAUTION" | "CRITICAL"

export interface FinancialHealthMetrics {
  totalMonthlyIncomeCents: Money
  totalDebtInstallmentsCents: Money
  totalRecurringExpensesCents: Money
  totalCommittedCents: Money // All fixed monthly commitments (Debts + Expenses)
  freeDisposableCents: Money // Income - totalCommittedCents
  financialBurdenPercentage: number // (totalDebtInstallmentsCents / totalMonthlyIncomeCents) * 100
  burdenLevel: FinancialBurdenLevel // HEALTHY (<30%), CAUTION (30-35%), CRITICAL (>35%)
}

export type DebtPayoffStrategy = "AVALANCHE" | "SNOWBALL"

export interface PrioritizedDebt {
  id: UUID
  title: string
  categoryName?: string
  remainingBalanceCents: Money
  installmentAmountCents: Money
  remainingInstallments: number
  interestRatePercentage?: number
  order: number
}
