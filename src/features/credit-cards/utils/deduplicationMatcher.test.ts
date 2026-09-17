import { describe, it, expect } from 'vitest'
import { matchExistingPurchases } from './deduplicationMatcher'
import type { CreditCardPurchase } from '@/shared/types/domain'
import type { ParsedStatementTransaction } from '../parsers/falabellaParser'
import { toMoney } from '@/shared/types/money'

describe('deduplicationMatcher', () => {
  const existing: CreditCardPurchase[] = [
    {
      id: 'p1',
      accountId: 'acc1',
      plasticId: 'pl1',
      description: 'FALABELLA PARQUE ARAUCO',
      purchaseDate: '2026-04-15',
      totalAmountCents: toMoney(120000),
      totalInstallments: 12,
      firstInstallmentPeriod: '2026-04',
      payerType: 'TERCERO',
      thirdPartyReceivable: {
        id: 'rec1',
        thirdPartyName: 'Juan Pérez',
        purchaseId: 'p1',
        totalOwedCents: toMoney(120000),
        amountCollectedCents: toMoney(0),
        status: 'PENDIENTE',
        repayments: [],
      },
      createdAt: '2026-04-15',
      updatedAt: '2026-04-15',
    },
    {
      id: 'p2',
      accountId: 'acc1',
      plasticId: 'pl1',
      description: 'LIDER EXPRESS',
      purchaseDate: '2026-04-18',
      totalAmountCents: toMoney(15000),
      totalInstallments: 1,
      firstInstallmentPeriod: '2026-04',
      payerType: 'PROPIO',
      createdAt: '2026-04-18',
      updatedAt: '2026-04-18',
    },
  ]

  it('marks exact match as ALREADY_IMPORTED and unselects it', () => {
    const nextMonthTxs: ParsedStatementTransaction[] = [
      {
        id: 't1',
        date: '2026-04-18',
        description: 'LIDER EXPRESS',
        currentInstallment: 1,
        totalInstallments: 1,
        amountCents: toMoney(15000),
        isThirdParty: false,
        selected: true,
      },
    ]

    const matched = matchExistingPurchases(nextMonthTxs, existing)
    expect(matched[0]?.isDuplicateOrOngoing).toBe(true)
    expect(matched[0]?.duplicateReason).toBe('ALREADY_IMPORTED')
    expect(matched[0]?.selected).toBe(false)
  })

  it('identifies installment 02/12 as ONGOING_INSTALLMENT and inherits thirdPartyName', () => {
    const nextMonthTxs: ParsedStatementTransaction[] = [
      {
        id: 't2',
        date: '2026-05-15',
        description: 'FALABELLA PARQUE ARAUCO',
        currentInstallment: 2,
        totalInstallments: 12,
        amountCents: toMoney(10000), // Cuota 2
        isThirdParty: false,
        selected: true,
      },
    ]

    const matched = matchExistingPurchases(nextMonthTxs, existing)
    expect(matched[0]?.isDuplicateOrOngoing).toBe(true)
    expect(matched[0]?.duplicateReason).toBe('ONGOING_INSTALLMENT')
    expect(matched[0]?.selected).toBe(false)
    expect(matched[0]?.isThirdParty).toBe(true)
    expect(matched[0]?.thirdPartyName).toBe('Juan Pérez')
  })

  it('keeps brand new purchase as selected and non-duplicate', () => {
    const nextMonthTxs: ParsedStatementTransaction[] = [
      {
        id: 't3',
        date: '2026-05-20',
        description: 'ZARA COSTANERA',
        currentInstallment: 1,
        totalInstallments: 3,
        amountCents: toMoney(45000),
        isThirdParty: false,
        selected: true,
      },
    ]

    const matched = matchExistingPurchases(nextMonthTxs, existing)
    expect(matched[0]?.isDuplicateOrOngoing).toBe(false)
    expect(matched[0]?.selected).toBe(true)
  })
})
