import type {
  Obligation,
  Installment,
  CreditCardAccount,
  CreditCardPurchase,
  Category,
  Period,
  UUID,
} from '@/shared/types/domain'
import { calculateInstallmentPeriods } from '@/features/credit-cards/utils/cycleCalculators'
import { toMoney } from '@/shared/types/money'
import type { PaymentItem } from './types'

export interface CalendarSources {
  obligations: Record<UUID, Obligation>
  installments: Record<UUID, Installment>
  creditCardAccounts: Record<UUID, CreditCardAccount>
  creditCardPurchases: Record<UUID, CreditCardPurchase>
  categories?: Record<UUID, Category>
}

/**
 * Builds a unified list of due payment items for a specific target period (YYYY-MM).
 * Aggregates:
 * 1. Active Installments (from obligations: loans, recurring expenses, etc.)
 * 2. Credit Card monthly statements (total purchases due in target period + maintenance fees)
 */
export function buildPaymentCalendar(
  sources: CalendarSources,
  targetPeriod: Period,
): PaymentItem[] {
  const {
    obligations,
    installments,
    creditCardAccounts,
    creditCardPurchases,
    categories = {},
  } = sources
  const items: PaymentItem[] = []

  // 1. Process Installments
  const materializedObligations = new Set<string>()

  for (const installment of Object.values(installments)) {
    if (installment.status === 'DELETED') continue

    // Determine period: either explicitly assigned or derived from dueDate
    const instPeriod = installment.period ?? (installment.dueDate?.slice(0, 7) || '')
    if (instPeriod !== targetPeriod) continue

    const obligation = obligations[installment.obligationId]
    if (!obligation || obligation.status === 'DELETED') continue

    materializedObligations.add(obligation.id)

    const category = categories[obligation.categoryId]
    const dueDay = parseInt(installment.dueDate.slice(8, 10), 10) || obligation.dueDay || 1
    const isDebt = obligation.type === 'DEBT' || obligation.type === 'P2P_DEBT'

    const isPaid = installment.status === 'PAID'
    const subtitle = obligation.detail !== obligation.subcategory ? obligation.detail : undefined

    items.push({
      id: `inst-${installment.id}`,
      title: obligation.subcategory || obligation.detail || 'Obligación',
      ...(subtitle !== undefined ? { subtitle } : {}),
      amountCents: installment.amountCents,
      dueDate: installment.dueDate,
      dueDay,
      period: targetPeriod,
      sourceType: 'INSTALLMENT',
      sourceId: installment.id,
      isPaid,
      ...(installment.paidDate !== undefined ? { paidDate: installment.paidDate } : {}),
      ...(category?.name !== undefined ? { categoryName: category.name } : {}),
      ...(category?.color !== undefined ? { categoryColor: category.color } : {}),
      isDebt,
    })
  }

  // 1.1 Process Indefinite Recurring Obligations if beyond materialized installments
  for (const obligation of Object.values(obligations)) {
    if (obligation.status === 'DELETED' || !obligation.isRecurringIndefinite) continue
    if (materializedObligations.has(obligation.id)) continue

    const oblStartPeriod = obligation.startDate.slice(0, 7)
    if (targetPeriod < oblStartPeriod) continue

    const category = categories[obligation.categoryId]
    const dueDay = obligation.dueDay || 1
    const paddedDay = dueDay.toString().padStart(2, '0')
    const dueDate = `${targetPeriod}-${paddedDay}`
    const isDebt = obligation.type === 'DEBT' || obligation.type === 'P2P_DEBT'
    const subtitle = obligation.detail !== obligation.subcategory ? obligation.detail : undefined

    items.push({
      id: `obl-virtual-${obligation.id}-${targetPeriod}`,
      title: obligation.subcategory || obligation.detail || 'Gasto Recurrente',
      ...(subtitle !== undefined ? { subtitle } : {}),
      amountCents: obligation.installmentAmountCents,
      dueDate,
      dueDay,
      period: targetPeriod,
      sourceType: 'INSTALLMENT',
      sourceId: obligation.id,
      isPaid: false,
      ...(category?.name !== undefined ? { categoryName: category.name } : {}),
      ...(category?.color !== undefined ? { categoryColor: category.color } : {}),
      isDebt,
    })
  }

  // 2. Process Credit Cards
  for (const account of Object.values(creditCardAccounts)) {
    let accountTotalDueCents = 0

    // Sum installments belonging to this period
    for (const purchase of Object.values(creditCardPurchases)) {
      if (purchase.accountId !== account.id) continue

      const periods = calculateInstallmentPeriods(
        purchase.firstInstallmentPeriod,
        purchase.totalInstallments,
      )
      if (periods.includes(targetPeriod)) {
        const monthlyInstallment = Math.round(
          purchase.totalAmountCents / purchase.totalInstallments,
        )
        accountTotalDueCents += monthlyInstallment
      }
    }

    // Add monthly maintenance fee if configured
    if (account.monthlyMaintenanceFeeCents && account.monthlyMaintenanceFeeCents > 0) {
      accountTotalDueCents += account.monthlyMaintenanceFeeCents
    }

    if (accountTotalDueCents > 0) {
      const dueDay = account.dueDay || 5
      const paddedDay = dueDay.toString().padStart(2, '0')
      const dueDate = `${targetPeriod}-${paddedDay}`
      const isPaid = account.paidPeriods?.includes(targetPeriod) ?? false

      items.push({
        id: `cc-${account.id}-${targetPeriod}`,
        title: `${account.institution} (${account.accountName})`,
        subtitle: 'Estado de cuenta tarjeta de crédito',
        amountCents: toMoney(accountTotalDueCents),
        dueDate,
        dueDay,
        period: targetPeriod,
        sourceType: 'CREDIT_CARD',
        sourceId: account.id,
        isPaid,
        categoryName: 'Tarjeta de Crédito',
        categoryColor: 'bg-purple-500',
        isDebt: true,
      })
    }
  }

  // Sort by due day ascending
  return items.sort((a, b) => a.dueDay - b.dueDay)
}
