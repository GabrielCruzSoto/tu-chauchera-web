import type { ISODate, Period, ThirdPartyReceivableStatus } from '../../../shared/types/domain'
import type { Money } from '../../../shared/types/money'

/**
 * Calculates the billing period (YYYY-MM) for a purchase based on the closing day.
 * If purchase day is on or before closing day, it belongs to the current month's cycle.
 * If purchase day is strictly after closing day, it rolls over to the next month's cycle.
 */
export function calculateBillingPeriod(purchaseDate: ISODate, closingDay: number): Period {
  const [yearStr, monthStr, dayStr] = purchaseDate.split('-')
  let year = parseInt(yearStr, 10)
  let month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)

  if (day > closingDay) {
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }

  const paddedMonth = month.toString().padStart(2, '0')
  return `${year}-${paddedMonth}`
}

/**
 * Computes an array of consecutive Period strings (YYYY-MM) for N installments.
 */
export function calculateInstallmentPeriods(firstPeriod: Period, totalInstallments: number): Period[] {
  const [yearStr, monthStr] = firstPeriod.split('-')
  let year = parseInt(yearStr, 10)
  let month = parseInt(monthStr, 10)

  const periods: Period[] = []
  for (let i = 0; i < totalInstallments; i++) {
    const paddedMonth = month.toString().padStart(2, '0')
    periods.push(`${year}-${paddedMonth}`)

    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }

  return periods
}

/**
 * Determines the dynamic status of a third-party receivable based on collected vs total amount.
 */
export function calculateRepaymentStatus(
  totalOwedCents: Money,
  amountCollectedCents: Money
): ThirdPartyReceivableStatus {
  if (amountCollectedCents <= 0) {
    return 'PENDIENTE'
  }
  if (amountCollectedCents >= totalOwedCents) {
    return 'COBRADO_TOTAL'
  }
  return 'COBRADO_PARCIAL'
}
