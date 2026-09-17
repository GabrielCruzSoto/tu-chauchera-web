import type { ISODate, Period, ThirdPartyReceivableStatus } from '../../../shared/types/domain'
import type { Money } from '../../../shared/types/money'

/**
 * Calculates the billing/payment period (YYYY-MM) for a purchase based on the closing day and due day.
 * In credit card billing cycles:
 * - When dueDay < closingDay (e.g. closes on 19th, pays on 5th of next month):
 *   Purchases made on or before closingDay (day <= 19) are billed in the cycle that is paid the next month (e.g. May 15 -> paid in June).
 *   Purchases made after closingDay (day > 19) are billed in the cycle that is paid two months later (e.g. May 21 -> paid in July).
 * - When dueDay >= closingDay (same month payment):
 *   Purchases made on or before closingDay are paid in current month; after closingDay are paid next month.
 */
export function calculateBillingPeriod(purchaseDate: ISODate, closingDay: number, dueDay?: number): Period {
  const [yearStr = '1970', monthStr = '01', dayStr = '01'] = purchaseDate.split('-')
  let year = parseInt(yearStr, 10)
  let month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)

  // Determine how many months ahead this purchase is due
  // If dueDay < closingDay (standard across Latin America / Chile where closing is ~19-20 and due date is ~5th next month),
  // cycle closing in month M is paid in month M+1.
  const isDueNextMonth = dueDay !== undefined ? dueDay < closingDay : closingDay > 15

  if (day <= closingDay) {
    if (isDueNextMonth) {
      month += 1
    }
  } else {
    // Purchased after closing day: enters cycle that closes month M+1
    month += isDueNextMonth ? 2 : 1
  }

  while (month > 12) {
    month -= 12
    year += 1
  }

  const paddedMonth = month.toString().padStart(2, '0')
  return `${year}-${paddedMonth}`
}

/**
 * Computes an array of consecutive Period strings (YYYY-MM) for N installments.
 */
export function calculateInstallmentPeriods(firstPeriod: Period, totalInstallments: number): Period[] {
  const [yearStr = '1970', monthStr = '01'] = firstPeriod.split('-')
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
