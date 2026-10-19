import type { CreditCardPurchase } from '@/shared/types/domain'
import type { ParsedStatementTransaction } from '../parsers/falabellaParser'
import { offsetPeriod } from './cycleCalculators'

export interface EnhancedParsedTransaction extends ParsedStatementTransaction {
  isDuplicateOrOngoing: boolean
  duplicateReason?: 'ALREADY_IMPORTED' | 'ONGOING_INSTALLMENT' | undefined
}

/**
 * Checks if a parsed installment transaction matches an active existing installment plan.
 * An ongoing installment match is only applicable for subsequent installments (currentInstallment > 1).
 */
function isOngoingInstallmentMatch(
  tx: ParsedStatementTransaction,
  p: CreditCardPurchase
): boolean {
  if (p.description.toLowerCase() !== tx.description.toLowerCase()) {
    return false
  }
  if (p.totalInstallments !== tx.totalInstallments) {
    return false
  }

  // If both define the first installment period, they must match
  if (tx.firstInstallmentPeriod && p.firstInstallmentPeriod) {
    return tx.firstInstallmentPeriod === p.firstInstallmentPeriod
  }

  // If existing purchase has a firstInstallmentPeriod, verify the plan has not already finished
  if (p.firstInstallmentPeriod) {
    const lastPeriod = offsetPeriod(p.firstInstallmentPeriod, p.totalInstallments - 1)
    const txPeriod = tx.date.slice(0, 7) // YYYY-MM
    // If the transaction period is after the plan's completion, it is not the same plan
    if (txPeriod > lastPeriod) {
      return false
    }
  }

  return true
}

/**
 * Checks a list of parsed transactions against existing card purchases.
 * Detects:
 * 1. Exact duplicate: Same description, same date, same amount (already imported).
 * 2. Ongoing installment: Subsequent installment (currentInstallment > 1) of an existing plan.
 */
export function matchExistingPurchases(
  parsedTransactions: ParsedStatementTransaction[],
  existingPurchases: CreditCardPurchase[]
): EnhancedParsedTransaction[] {
  return parsedTransactions.map((tx) => {
    // 1. Exact match
    const exactMatch = existingPurchases.find(
      (p) =>
        p.description.toLowerCase() === tx.description.toLowerCase() &&
        p.purchaseDate === tx.date &&
        p.totalAmountCents === tx.amountCents
    )

    if (exactMatch) {
      return {
        ...tx,
        isDuplicateOrOngoing: true,
        duplicateReason: 'ALREADY_IMPORTED',
        selected: false, // Deselect automatically
      }
    }

    // 2. Ongoing installment match
    // Only subsequent installments (currentInstallment > 1) can match an existing plan.
    // The initial installment (currentInstallment === 1) is always a new purchase unless caught by exactMatch.
    if (tx.totalInstallments > 1 && tx.currentInstallment > 1) {
      const ongoingMatch = existingPurchases.find((p) => isOngoingInstallmentMatch(tx, p))

      if (ongoingMatch) {
        return {
          ...tx,
          isDuplicateOrOngoing: true,
          duplicateReason: 'ONGOING_INSTALLMENT',
          selected: false, // Deselect to avoid duplicating the installment plan
          isThirdParty: ongoingMatch.payerType === 'TERCERO',
          thirdPartyName: ongoingMatch.thirdPartyReceivable?.thirdPartyName,
        }
      }
    }

    // Brand new transaction
    return {
      ...tx,
      isDuplicateOrOngoing: false,
      selected: true,
    }
  })
}
