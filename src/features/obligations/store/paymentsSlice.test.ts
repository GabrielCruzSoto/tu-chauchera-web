import { describe, it, expect, beforeEach } from 'vitest'
import { useObligationsStore } from './obligationsSlice'
import { usePaymentsStore } from './paymentsSlice'
import { toMoney } from '@/shared/types/money'

describe('paymentsSlice', () => {
  beforeEach(() => {
    useObligationsStore.setState({
      obligations: {},
      installments: {},
      categories: {
        'cat-1': { id: 'cat-1', name: 'Banco', color: 'blue', createdAt: '', updatedAt: '' },
      },
      isLoaded: true,
    })
  })

  it('marks installment as PAID with paidDate and assigns period', () => {
    const oblStore = useObligationsStore.getState()
    const obl = oblStore.addObligation({
      categoryId: 'cat-1',
      subcategory: 'Crédito Consumo',
      detail: 'Test',
      totalAmountCents: toMoney(200000),
      totalInstallments: 2,
      currentInstallment: 1,
      installmentAmountCents: toMoney(100000),
      startDate: '2024-05-10',
      dueDay: 10,
    })

    const installments = Object.values(useObligationsStore.getState().installments).filter(
      i => i.obligationId === obl.id,
    )
    const firstInst = installments[0]!

    const paymentsStore = usePaymentsStore.getState()
    paymentsStore.markPaid(firstInst.id, '2024-05-08', 'Pago online banco')

    const updated = useObligationsStore.getState().installments[firstInst.id]
    expect(updated?.status).toBe('PAID')
    expect(updated?.paidDate).toBe('2024-05-08')
    expect(updated?.period).toBe('2024-05')
    expect(updated?.notes).toBe('Pago online banco')
  })

  it('marks installment as PAID with custom amount including interest', () => {
    const oblStore = useObligationsStore.getState()
    const obl = oblStore.addObligation({
      categoryId: 'cat-1',
      subcategory: 'Crédito Consumo',
      detail: 'Test',
      totalAmountCents: toMoney(200000),
      totalInstallments: 2,
      currentInstallment: 1,
      installmentAmountCents: toMoney(100000),
      startDate: '2024-05-10',
      dueDay: 10,
    })

    const installments = Object.values(useObligationsStore.getState().installments).filter(
      i => i.obligationId === obl.id,
    )
    const firstInst = installments[0]!

    const paymentsStore = usePaymentsStore.getState()
    // Original cuota is 100.000, paid with 5.000 interest = 105.000
    paymentsStore.markPaid(firstInst.id, '2024-05-25', 'Pago atrasado con mora', toMoney(105000))

    const updated = useObligationsStore.getState().installments[firstInst.id]
    expect(updated?.status).toBe('PAID')
    expect(updated?.paidDate).toBe('2024-05-25')
    expect(updated?.amountCents).toBe(toMoney(105000))
    expect(updated?.notes).toBe('Pago atrasado con mora')
  })

  it('reverts PAID installment to PENDING', () => {
    const oblStore = useObligationsStore.getState()
    const obl = oblStore.addObligation({
      categoryId: 'cat-1',
      subcategory: 'Crédito',
      detail: 'Test',
      totalAmountCents: toMoney(100000),
      totalInstallments: 1,
      currentInstallment: 1,
      installmentAmountCents: toMoney(100000),
      startDate: '2024-05-10',
      dueDay: 10,
    })

    const inst = Object.values(useObligationsStore.getState().installments).find(
      i => i.obligationId === obl.id,
    )!
    const paymentsStore = usePaymentsStore.getState()

    paymentsStore.markPaid(inst.id, '2024-05-10')
    expect(useObligationsStore.getState().installments[inst.id]?.status).toBe('PAID')

    paymentsStore.revertToPending(inst.id)
    const reverted = useObligationsStore.getState().installments[inst.id]
    expect(reverted?.status).toBe('PENDING')
    expect(reverted?.paidDate).toBeUndefined()
    expect(reverted?.period).toBeUndefined()
  })

  it('modifies an already PAID installment (updating paidDate, amount, and notes)', () => {
    const oblStore = useObligationsStore.getState()
    const obl = oblStore.addObligation({
      categoryId: 'cat-1',
      subcategory: 'Crédito Consumo',
      detail: 'Test',
      totalAmountCents: toMoney(200000),
      totalInstallments: 2,
      currentInstallment: 1,
      installmentAmountCents: toMoney(100000),
      startDate: '2024-05-10',
      dueDay: 10,
    })

    const inst = Object.values(useObligationsStore.getState().installments).find(
      i => i.obligationId === obl.id,
    )!

    const paymentsStore = usePaymentsStore.getState()
    // Initial payment
    paymentsStore.markPaid(inst.id, '2024-05-08', 'Pago original', toMoney(100000))
    expect(useObligationsStore.getState().installments[inst.id]?.paidDate).toBe('2024-05-08')
    expect(useObligationsStore.getState().installments[inst.id]?.amountCents).toBe(toMoney(100000))

    // Modify payment with new date, updated surcharge amount and changed notes
    paymentsStore.updatePayment(
      inst.id,
      '2024-05-12',
      'Pago corregido con recargo',
      toMoney(102500),
    )
    const updated = useObligationsStore.getState().installments[inst.id]
    expect(updated?.status).toBe('PAID')
    expect(updated?.paidDate).toBe('2024-05-12')
    expect(updated?.period).toBe('2024-05')
    expect(updated?.amountCents).toBe(toMoney(102500))
    expect(updated?.notes).toBe('Pago corregido con recargo')

    // Reverting restores original scheduled installment amount (100000 instead of 102500)
    paymentsStore.revertToPending(inst.id)
    const reverted = useObligationsStore.getState().installments[inst.id]
    expect(reverted?.status).toBe('PENDING')
    expect(reverted?.amountCents).toBe(toMoney(100000))
  })

  it('clears notes when modifying a payment with empty string', () => {
    const oblStore = useObligationsStore.getState()
    const obl = oblStore.addObligation({
      categoryId: 'cat-1',
      subcategory: 'Crédito',
      detail: 'Test',
      totalAmountCents: toMoney(100000),
      totalInstallments: 1,
      currentInstallment: 1,
      installmentAmountCents: toMoney(100000),
      startDate: '2024-05-10',
      dueDay: 10,
    })

    const inst = Object.values(useObligationsStore.getState().installments).find(
      i => i.obligationId === obl.id,
    )!

    const paymentsStore = usePaymentsStore.getState()
    paymentsStore.markPaid(inst.id, '2024-05-10', 'Nota inicial', toMoney(100000))
    expect(useObligationsStore.getState().installments[inst.id]?.notes).toBe('Nota inicial')

    paymentsStore.markPaid(inst.id, '2024-05-10', '   ', toMoney(100000))
    expect(useObligationsStore.getState().installments[inst.id]?.notes).toBeUndefined()
  })

  it('renegotiates obligation and freezes remaining pending installments', () => {
    const oblStore = useObligationsStore.getState()
    const oldObl = oblStore.addObligation({
      categoryId: 'cat-1',
      subcategory: 'Crédito Original',
      detail: '12 cuotas',
      totalAmountCents: toMoney(1200000),
      totalInstallments: 12,
      currentInstallment: 1,
      installmentAmountCents: toMoney(100000),
      startDate: '2024-01-10',
      dueDay: 10,
    })

    const installments = Object.values(useObligationsStore.getState().installments).filter(
      i => i.obligationId === oldObl.id,
    )

    const paymentsStore = usePaymentsStore.getState()
    // Pay first 2
    paymentsStore.markPaid(installments[0]!.id, '2024-01-10')
    paymentsStore.markPaid(installments[1]!.id, '2024-02-10')

    // Renegotiate from installment 3 into 24 cuotas of 60k
    paymentsStore.markRenegotiated(oldObl.id, 3, {
      categoryId: 'cat-1',
      subcategory: 'Crédito Repactado',
      detail: 'Repactación banco',
      totalAmountCents: toMoney(1440000),
      totalInstallments: 24,
      currentInstallment: 1,
      installmentAmountCents: toMoney(60000),
      startDate: '2024-03-10',
      dueDay: 10,
    })

    const state = useObligationsStore.getState()
    expect(state.obligations[oldObl.id]?.status).toBe('RENEGOTIATED')

    const oldInstallments = Object.values(state.installments).filter(
      i => i.obligationId === oldObl.id,
    )
    expect(oldInstallments.find(i => i.installmentNumber === 1)?.status).toBe('PAID')
    expect(oldInstallments.find(i => i.installmentNumber === 2)?.status).toBe('PAID')
    expect(oldInstallments.find(i => i.installmentNumber === 3)?.status).toBe('RENEGOTIATED')
    expect(oldInstallments.find(i => i.installmentNumber === 12)?.status).toBe('RENEGOTIATED')
  })

  it('postpones an installment to the next month and reverts it cleanly', () => {
    const oblStore = useObligationsStore.getState()
    const obl = oblStore.addObligation({
      categoryId: 'cat-1',
      subcategory: 'Gasto Común',
      detail: 'Gasto mensual',
      totalAmountCents: toMoney(50000),
      totalInstallments: 1,
      currentInstallment: 1,
      installmentAmountCents: toMoney(50000),
      startDate: '2024-05-15',
      dueDay: 15,
    })

    const inst = Object.values(useObligationsStore.getState().installments).find(
      i => i.obligationId === obl.id,
    )!

    const paymentsStore = usePaymentsStore.getState()

    // 1. Postpone
    paymentsStore.postponeToNextMonth(inst.id)
    const postponed = useObligationsStore.getState().installments[inst.id]!
    expect(postponed.dueDate).toBe('2024-06-15')
    expect(postponed.originalDueDate).toBe('2024-05-15')
    expect(postponed.isOverdueRollover).toBe(true)
    expect(postponed.notes).toContain('Pasada al mes siguiente por no pago en plazo')

    // 2. Revert
    paymentsStore.revertPostpone(inst.id)
    const reverted = useObligationsStore.getState().installments[inst.id]!
    expect(reverted.dueDate).toBe('2024-05-15')
    expect(reverted.originalDueDate).toBeUndefined()
    expect(reverted.isOverdueRollover).toBeUndefined()
    expect(reverted.notes).toBeUndefined()
  })

  it('preserves custom user notes when reverting a postponed installment', () => {
    const oblStore = useObligationsStore.getState()
    const obl = oblStore.addObligation({
      categoryId: 'cat-1',
      subcategory: 'Internet',
      detail: 'Fibra óptica',
      totalAmountCents: toMoney(25000),
      totalInstallments: 1,
      currentInstallment: 1,
      installmentAmountCents: toMoney(25000),
      startDate: '2024-05-20',
      dueDay: 20,
    })

    const inst = Object.values(useObligationsStore.getState().installments).find(
      i => i.obligationId === obl.id,
    )!

    // Manually set existing note
    useObligationsStore.setState(state => ({
      installments: {
        ...state.installments,
        [inst.id]: {
          ...state.installments[inst.id]!,
          notes: 'Nota del usuario',
        },
      },
    }))

    const paymentsStore = usePaymentsStore.getState()
    paymentsStore.postponeToNextMonth(inst.id)
    const postponed = useObligationsStore.getState().installments[inst.id]!
    expect(postponed.notes).toBe('Nota del usuario | Pasada al mes siguiente por no pago en plazo')

    paymentsStore.revertPostpone(inst.id)
    const reverted = useObligationsStore.getState().installments[inst.id]!
    expect(reverted.dueDate).toBe('2024-05-20')
    expect(reverted.originalDueDate).toBeUndefined()
    expect(reverted.notes).toBe('Nota del usuario')
  })

  it('moves an ordinary installment to the previous month even without originalDueDate', () => {
    const oblStore = useObligationsStore.getState()
    const obl = oblStore.addObligation({
      categoryId: 'cat-1',
      subcategory: 'Banco de Chile',
      detail: 'Crédito de Consumo',
      totalAmountCents: toMoney(287936),
      totalInstallments: 60,
      currentInstallment: 16,
      installmentAmountCents: toMoney(287936),
      startDate: '2026-10-16',
      dueDay: 16,
    })

    const inst = Object.values(useObligationsStore.getState().installments).find(
      i => i.obligationId === obl.id,
    )!

    expect(inst.dueDate).toBe('2026-10-16')

    const paymentsStore = usePaymentsStore.getState()
    paymentsStore.moveToPreviousMonth(inst.id)

    const updated = useObligationsStore.getState().installments[inst.id]!
    expect(updated.dueDate).toBe('2026-09-16')
    expect(updated.isOverdueRollover).toBeUndefined()
  })

  it('handles year boundary and day clamping correctly in moveToPreviousMonth', () => {
    const oblStore = useObligationsStore.getState()
    const obl = oblStore.addObligation({
      categoryId: 'cat-1',
      subcategory: 'Test Clamping',
      detail: 'Test',
      totalAmountCents: toMoney(10000),
      totalInstallments: 1,
      currentInstallment: 1,
      installmentAmountCents: toMoney(10000),
      startDate: '2026-01-31',
      dueDay: 31,
    })

    const inst = Object.values(useObligationsStore.getState().installments).find(
      i => i.obligationId === obl.id,
    )!

    const paymentsStore = usePaymentsStore.getState()
    // Move from 2026-01-31 to 2025-12-31
    paymentsStore.moveToPreviousMonth(inst.id)
    expect(useObligationsStore.getState().installments[inst.id]!.dueDate).toBe('2025-12-31')

    // Move from 2025-03-31 to 2025-02-28 (clamping)
    useObligationsStore.setState(state => ({
      installments: {
        ...state.installments,
        [inst.id]: {
          ...state.installments[inst.id]!,
          dueDate: '2025-03-31',
        },
      },
    }))
    paymentsStore.moveToPreviousMonth(inst.id)
    expect(useObligationsStore.getState().installments[inst.id]!.dueDate).toBe('2025-02-28')
  })
})
