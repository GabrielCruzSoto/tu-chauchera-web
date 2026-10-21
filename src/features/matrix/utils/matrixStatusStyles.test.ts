import { describe, it, expect } from 'vitest'
import {
  getMatrixStatusConfig,
  resolveCellStatus,
  getInstallmentStatusForMatrix,
  getCreditCardStatusForMatrix,
  MATRIX_STATUS_CONFIGS,
} from './matrixStatusStyles'
import type { Installment, CreditCardAccount, CreditCardPurchase } from '@/shared/types/domain'
import { toMoney } from '@/shared/types/money'

describe('matrixStatusStyles', () => {
  it('provides valid configurations for all matrix cell statuses', () => {
    expect(MATRIX_STATUS_CONFIGS.PAID.label).toBe('Pagado')
    expect(MATRIX_STATUS_CONFIGS.OVERDUE.label).toBe('Vencido')
    expect(MATRIX_STATUS_CONFIGS.DUE_SOON.label).toBe('Por vencer')
    expect(MATRIX_STATUS_CONFIGS.SCHEDULED.label).toBe('En plazo')
    expect(MATRIX_STATUS_CONFIGS.OTHER.label).toBe('Otro')

    expect(getMatrixStatusConfig('PAID').badgeClass).toContain('emerald')
    expect(getMatrixStatusConfig('OVERDUE').badgeClass).toContain('rose')
    expect(getMatrixStatusConfig('DUE_SOON').badgeClass).toContain('amber')
    expect(getMatrixStatusConfig('SCHEDULED').badgeClass).toContain('sky')
    expect(getMatrixStatusConfig('OTHER').badgeClass).toContain('purple')
    expect(getMatrixStatusConfig(undefined).badgeClass).toContain('sky')
  })

  it('resolves single and mixed cell statuses with correct priority hierarchy', () => {
    expect(resolveCellStatus([])).toBeUndefined()
    expect(resolveCellStatus(['PAID'])).toBe('PAID')
    expect(resolveCellStatus(['OVERDUE'])).toBe('OVERDUE')
    expect(resolveCellStatus(['DUE_SOON'])).toBe('DUE_SOON')
    expect(resolveCellStatus(['SCHEDULED'])).toBe('SCHEDULED')

    // Priority: OVERDUE beats all
    expect(resolveCellStatus(['PAID', 'OVERDUE'])).toBe('OVERDUE')
    expect(resolveCellStatus(['DUE_SOON', 'OVERDUE'])).toBe('OVERDUE')

    // DUE_SOON beats SCHEDULED & PAID
    expect(resolveCellStatus(['PAID', 'DUE_SOON'])).toBe('DUE_SOON')
    expect(resolveCellStatus(['SCHEDULED', 'DUE_SOON'])).toBe('DUE_SOON')

    // SCHEDULED
    expect(resolveCellStatus(['SCHEDULED', 'SCHEDULED'])).toBe('SCHEDULED')

    // ALL PAID
    expect(resolveCellStatus(['PAID', 'PAID'])).toBe('PAID')
  })

  it('calculates installment status for current, past, and future periods', () => {
    const todayStr = '2026-09-15'
    const currentPeriod = '2026-09'

    const paidInst: Installment = {
      id: '1',
      obligationId: 'o1',
      installmentNumber: 1,
      dueDate: '2026-09-05',
      amountCents: toMoney(50000),
      status: 'PAID',
    }
    expect(getInstallmentStatusForMatrix(paidInst, '2026-09', todayStr, currentPeriod)).toBe('PAID')

    const overdueInst: Installment = {
      id: '2',
      obligationId: 'o1',
      installmentNumber: 2,
      dueDate: '2026-09-10', // before todayStr (15)
      amountCents: toMoney(50000),
      status: 'PENDING',
    }
    expect(getInstallmentStatusForMatrix(overdueInst, '2026-09', todayStr, currentPeriod)).toBe(
      'OVERDUE',
    )

    const dueSoonInst: Installment = {
      id: '3',
      obligationId: 'o1',
      installmentNumber: 3,
      dueDate: '2026-09-25', // after todayStr (15) in current period
      amountCents: toMoney(50000),
      status: 'PENDING',
    }
    expect(getInstallmentStatusForMatrix(dueSoonInst, '2026-09', todayStr, currentPeriod)).toBe(
      'DUE_SOON',
    )

    const scheduledInst: Installment = {
      id: '4',
      obligationId: 'o1',
      installmentNumber: 4,
      dueDate: '2026-10-25',
      amountCents: toMoney(50000),
      status: 'PENDING',
    }
    expect(getInstallmentStatusForMatrix(scheduledInst, '2026-10', todayStr, currentPeriod)).toBe(
      'SCHEDULED',
    )

    const pastPeriodInst: Installment = {
      id: '5',
      obligationId: 'o1',
      installmentNumber: 5,
      dueDate: '2026-08-25',
      amountCents: toMoney(50000),
      status: 'PENDING',
    }
    expect(getInstallmentStatusForMatrix(pastPeriodInst, '2026-08', todayStr, currentPeriod)).toBe(
      'OVERDUE',
    )

    const rolloverInst: Installment = {
      id: '6',
      obligationId: 'o1',
      installmentNumber: 6,
      dueDate: '2026-09-30',
      amountCents: toMoney(50000),
      status: 'PENDING',
      isOverdueRollover: true,
    }
    expect(getInstallmentStatusForMatrix(rolloverInst, '2026-09', todayStr, currentPeriod)).toBe(
      'OVERDUE',
    )

    const renegotiatedInst: Installment = {
      id: '7',
      obligationId: 'o1',
      installmentNumber: 7,
      dueDate: '2026-09-30',
      amountCents: toMoney(50000),
      status: 'RENEGOTIATED',
    }
    expect(
      getInstallmentStatusForMatrix(renegotiatedInst, '2026-09', todayStr, currentPeriod),
    ).toBe('OTHER')
  })

  it('calculates credit card status correctly', () => {
    const todayStr = '2026-09-15'
    const currentPeriod = '2026-09'

    const account: CreditCardAccount = {
      id: 'card-1',
      institution: 'Banco Santander',
      accountName: 'WorldMember',
      creditLimitCents: toMoney(1000000),
      closingDay: 20,
      dueDay: 10,
      plastics: [],
      paidPeriods: ['2026-08'],
      createdAt: '',
      updatedAt: '',
    }

    // 2026-08 was marked as paid
    expect(getCreditCardStatusForMatrix(account, '2026-08', todayStr, currentPeriod)).toBe('PAID')

    // 2026-09 has dueDay 10, today is 15 -> OVERDUE
    expect(getCreditCardStatusForMatrix(account, '2026-09', todayStr, currentPeriod)).toBe(
      'OVERDUE',
    )

    // Account with dueDay 25 in current period -> DUE_SOON
    const accountDueLater: CreditCardAccount = {
      ...account,
      dueDay: 25,
    }
    expect(getCreditCardStatusForMatrix(accountDueLater, '2026-09', todayStr, currentPeriod)).toBe(
      'DUE_SOON',
    )

    // Future period -> SCHEDULED
    expect(getCreditCardStatusForMatrix(accountDueLater, '2026-10', todayStr, currentPeriod)).toBe(
      'SCHEDULED',
    )

    // Third-party purchase already fully collected
    const thirdPartyPaidPurchase: CreditCardPurchase = {
      id: 'pur-1',
      accountId: 'card-1',
      plasticId: 'pl-1',
      description: 'Zapatillas',
      purchaseDate: '2026-08-10',
      totalAmountCents: toMoney(50000),
      totalInstallments: 1,
      firstInstallmentPeriod: '2026-09',
      payerType: 'TERCERO',
      thirdPartyReceivable: {
        id: 'rec-1',
        thirdPartyName: 'Lucas',
        purchaseId: 'pur-1',
        totalOwedCents: toMoney(50000),
        amountCollectedCents: toMoney(50000),
        status: 'COBRADO_TOTAL',
        repayments: [],
      },
      createdAt: '',
      updatedAt: '',
    }
    expect(
      getCreditCardStatusForMatrix(
        account,
        '2026-09',
        todayStr,
        currentPeriod,
        thirdPartyPaidPurchase,
      ),
    ).toBe('PAID')
  })
})
