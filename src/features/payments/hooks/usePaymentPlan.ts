import { useMemo } from 'react'
import type { Period } from '@/shared/types/domain'
import { useObligationsStore } from '@/features/obligations/store/obligationsSlice'
import { useCreditCardStore } from '@/features/credit-cards/store/creditCardSlice'
import { useIncomeStore } from '@/features/income/store/incomeSlice'
import { buildPaymentCalendar } from '../domain/buildPaymentCalendar'
import { assignPaymentWindows } from '../domain/assignPaymentWindows'
import { calculateFinancialHealth } from '../domain/calculateFinancialHealth'
import { prioritizeDebts } from '../domain/prioritizeDebts'
import type {
  DebtPayoffStrategy,
  PaymentWindow,
  FinancialHealthMetrics,
  PrioritizedDebt,
  PaymentItem,
} from '../domain/types'

export interface UsePaymentPlanResult {
  period: Period
  calendarItems: PaymentItem[]
  windows: PaymentWindow[]
  metrics: FinancialHealthMetrics
  prioritizedDebts: PrioritizedDebt[]
  totalItemsCount: number
  pendingItemsCount: number
}

/**
 * Reactive hook aggregating store data into payment planning windows and metrics.
 */
export function usePaymentPlan(
  targetPeriod: Period,
  strategy: DebtPayoffStrategy = 'AVALANCHE',
): UsePaymentPlanResult {
  const obligations = useObligationsStore(s => s.obligations)
  const installments = useObligationsStore(s => s.installments)
  const categories = useObligationsStore(s => s.categories)

  const creditCardAccounts = useCreditCardStore(s => s.accounts)
  const creditCardPurchases = useCreditCardStore(s => s.purchases)

  const incomes = useIncomeStore(s => s.incomes)

  const calendarItems = useMemo(() => {
    return buildPaymentCalendar(
      {
        obligations,
        installments,
        creditCardAccounts,
        creditCardPurchases,
        categories,
      },
      targetPeriod,
    )
  }, [obligations, installments, creditCardAccounts, creditCardPurchases, categories, targetPeriod])

  const windows = useMemo(() => {
    return assignPaymentWindows(calendarItems)
  }, [calendarItems])

  const metrics = useMemo(() => {
    return calculateFinancialHealth(Object.values(incomes), calendarItems, targetPeriod)
  }, [incomes, calendarItems, targetPeriod])

  const prioritizedDebts = useMemo(() => {
    return prioritizeDebts(
      {
        obligations,
        installments,
        categories,
      },
      strategy,
    )
  }, [obligations, installments, categories, strategy])

  const pendingItemsCount = useMemo(() => {
    return calendarItems.filter(i => !i.isPaid).length
  }, [calendarItems])

  return {
    period: targetPeriod,
    calendarItems,
    windows,
    metrics,
    prioritizedDebts,
    totalItemsCount: calendarItems.length,
    pendingItemsCount,
  }
}
