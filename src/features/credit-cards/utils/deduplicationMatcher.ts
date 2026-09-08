import type { CreditCardPurchase } from '@/shared/types/domain'
import type { ParsedStatementTransaction } from '../parsers/falabellaParser'

export interface EnhancedParsedTransaction extends ParsedStatementTransaction {
  isDuplicateOrOngoing: boolean
  duplicateReason?: 'ALREADY_IMPORTED' | 'ONGOING_INSTALLMENT' | undefined
}

/**
 * Checks a list of parsed transactions against existing card purchases.
 * Detects:
 * 1. Exact duplicate: Same description, same date, same amount (already imported).
 * 2. Ongoing installment: Same description and same total installments (already tracking this plan).
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
    if (tx.totalInstallments > 1) {
      const ongoingMatch = existingPurchases.find(
        (p) =>
          p.description.toLowerCase() === tx.description.toLowerCase() &&
          p.totalInstallments === tx.totalInstallments
      )

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
