import { addMonths, getDaysInMonth, setDate, format } from 'date-fns'
import type { Obligation, Installment, DueRule } from '@/shared/types/domain'
import { computeP2PInstallmentCharge } from './surchargeCalculator'
import { resolveDueDate } from '@/features/payments/domain/resolveDueDate'

/** Standard projection horizon (5 years / 60 months) for indefinite recurring expenses */
export const INDEFINITE_INSTALLMENTS_HORIZON = 60

/** Clamp dueDay to the actual last day of a given month (handles Feb 30 -> Feb 28/29) */
export function clampDueDay(year: number, month: number, dueDay: number): number {
  if (!Number.isFinite(year) || !Number.isFinite(month)) return 1
  const cleanDueDay = Number.isFinite(dueDay) && dueDay >= 1 ? Math.min(Math.floor(dueDay), 31) : 1
  try {
    const daysInMonth = getDaysInMonth(new Date(year, month - 1))
    return Math.min(cleanDueDay, daysInMonth)
  } catch {
    return cleanDueDay
  }
}

/** Compute ISO due date string for a given installment offset, respecting optional dueRule */
export function computeDueDate(
  startDate: string,
  offsetMonths: number,
  dueDay: number,
  dueRule?: DueRule,
): string {
  if (!startDate || typeof startDate !== 'string' || startDate.trim().length < 4) {
    return '—'
  }

  const cleanDueDay = Number.isFinite(dueDay) && dueDay >= 1 ? Math.min(Math.floor(dueDay), 31) : 1
  const cleanOffset = Number.isFinite(offsetMonths) ? offsetMonths : 0

  try {
    const isoString = startDate.includes('T') ? startDate : `${startDate.trim()}T00:00:00`
    const base = new Date(isoString)
    if (isNaN(base.getTime())) return '—'

    const target = addMonths(base, cleanOffset)
    const year = target.getFullYear()
    const month = target.getMonth() + 1
    if (isNaN(year) || isNaN(month)) return '—'

    const paddedMonth = month.toString().padStart(2, '0')
    const period = `${year}-${paddedMonth}`

    if (dueRule) {
      return resolveDueDate(dueRule, period)
    }

    const day = clampDueDay(year, month, cleanDueDay)
    return format(setDate(new Date(year, month - 1), day), 'yyyy-MM-dd')
  } catch {
    return '—'
  }
}

/**
 * Generate all Installment records for an Obligation eagerly.
 * Preserves PAID and RENEGOTIATED records on partial regeneration.
 */
export function generateInstallments(
  obligation: Obligation,
  existingInstallments: Installment[] = [],
): Installment[] {
  const {
    id,
    currentInstallment,
    totalInstallments,
    installmentAmountCents,
    startDate,
    dueDay,
    p2pMetadata,
    isRecurringIndefinite,
  } = obligation

  const effectiveTotalInstallments = isRecurringIndefinite
    ? Math.max(totalInstallments, INDEFINITE_INSTALLMENTS_HORIZON)
    : totalInstallments

  const preserved = new Map<number, Installment>(
    existingInstallments
      .filter(i => i.status === 'PAID' || i.status === 'RENEGOTIATED')
      .map(i => [i.installmentNumber, i]),
  )

  const installments: Installment[] = []

  for (let num = 1; num <= effectiveTotalInstallments; num++) {
    const existing = preserved.get(num)
    if (existing) {
      installments.push(existing)
    } else {
      const offset = num - 1
      let calculatedAmount = installmentAmountCents

      if (p2pMetadata?.surcharges && p2pMetadata.baseInstallmentAmountCents) {
        calculatedAmount = computeP2PInstallmentCharge(
          p2pMetadata.baseInstallmentAmountCents,
          totalInstallments,
          p2pMetadata.surcharges,
          num,
        ).totalMonthlyChargeCents
      }

      const dueDate = computeDueDate(startDate, offset, dueDay, obligation.dueRule)
      const isHistoricalPaid = num < currentInstallment

      installments.push({
        id: crypto.randomUUID(),
        obligationId: id,
        installmentNumber: num,
        dueDate,
        amountCents: calculatedAmount,
        status: isHistoricalPaid ? 'PAID' : 'PENDING',
        period: isHistoricalPaid && dueDate !== '—' ? dueDate.slice(0, 7) : undefined,
        paidDate: isHistoricalPaid && dueDate !== '—' ? dueDate : undefined,
        notes: isHistoricalPaid ? 'Amortización inicial registrada' : undefined,
      })
    }
  }

  return installments
}
