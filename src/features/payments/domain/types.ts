/**
 * Pure domain types for payment windows, financial health, and debt prioritization.
 *
 * All *Cents fields are stored and computed in integer CLP pesos
 * (misnomer *Cents kept for schema compatibility — never multiply or divide by 100).
 */
import type { Money, ISODate, Period, UUID } from '@/shared/types/domain'

export type PaymentSourceType = 'INSTALLMENT' | 'CREDIT_CARD'

export interface PaymentItem {
  id: string
  title: string
  subtitle?: string
  amountCents: Money // in integer CLP pesos (misnomer *Cents kept for schema compatibility)
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
  totalAmountCents: Money // in integer CLP pesos (misnomer *Cents kept for schema compatibility)
  totalPendingCents: Money // in integer CLP pesos (misnomer *Cents kept for schema compatibility)
  totalPaidCents: Money // in integer CLP pesos (misnomer *Cents kept for schema compatibility)
}

export type FinancialBurdenLevel = 'HEALTHY' | 'CAUTION' | 'CRITICAL'

export interface FinancialHealthMetrics {
  totalMonthlyIncomeCents: Money // in integer CLP pesos (misnomer *Cents kept for schema compatibility)
  totalDebtInstallmentsCents: Money // in integer CLP pesos (misnomer *Cents kept for schema compatibility)
  totalRecurringExpensesCents: Money // in integer CLP pesos (misnomer *Cents kept for schema compatibility)
  totalCommittedCents: Money // All fixed monthly commitments (Debts + Expenses) in integer CLP pesos (misnomer *Cents kept for schema compatibility)
  freeDisposableCents: Money // Income - totalCommittedCents in integer CLP pesos (misnomer *Cents kept for schema compatibility)
  financialBurdenPercentage: number // (totalDebtInstallmentsCents / totalMonthlyIncomeCents) * 100
  burdenLevel: FinancialBurdenLevel // HEALTHY (<30%), CAUTION (30-35%), CRITICAL (>35%)
}

export type DebtPayoffStrategy = 'AVALANCHE' | 'SNOWBALL'

export interface PrioritizedDebt {
  id: UUID
  title: string
  categoryName?: string
  remainingBalanceCents: Money // in integer CLP pesos (misnomer *Cents kept for schema compatibility)
  installmentAmountCents: Money // in integer CLP pesos (misnomer *Cents kept for schema compatibility)
  remainingInstallments: number
  interestRatePercentage?: number
  order: number
}
