import { describe, it, expect, beforeEach } from 'vitest'
import { useCreditCardStore } from './creditCardSlice'
import { toMoney } from '@/shared/types/money'

describe('creditCardSlice', () => {
  beforeEach(() => {
    useCreditCardStore.setState({
      accounts: {},
      purchases: {},
      isLoaded: false,
    })
  })

  it('adds an account with primary plastic', () => {
    const store = useCreditCardStore.getState()
    const account = store.addAccount({
      institution: 'Banco Santander',
      accountName: 'Visa Signature',
      creditLimitCents: 2500000,
      closingDay: 20,
      dueDay: 5,
      primaryHolderName: 'Gabriel Cruz',
      primaryLastFour: '1234',
    })

    expect(account.id).toBeDefined()
    expect(account.plastics).toHaveLength(1)
    expect(account.plastics[0]?.type).toBe('TITULAR')
    expect(account.plastics[0]?.lastFourDigits).toBe('1234')

    const state = useCreditCardStore.getState()
    expect(state.accounts[account.id]).toBeDefined()
  })

  it('adds an additional plastic to an account', () => {
    const store = useCreditCardStore.getState()
    const account = store.addAccount({
      institution: 'Banco Santander',
      accountName: 'Visa Signature',
      creditLimitCents: 2500000,
      closingDay: 20,
      dueDay: 5,
      primaryHolderName: 'Gabriel Cruz',
      primaryLastFour: '1234',
    })

    const plastic = store.addPlastic(account.id, 'Laura Soto', '5678')
    expect(plastic).toBeDefined()
    expect(plastic?.type).toBe('ADICIONAL')

    const updatedAccount = useCreditCardStore.getState().accounts[account.id]
    expect(updatedAccount?.plastics).toHaveLength(2)
  })

  it('adds a purchase for third party and records repayment', () => {
    const store = useCreditCardStore.getState()
    const account = store.addAccount({
      institution: 'Banco Santander',
      accountName: 'Visa Signature',
      creditLimitCents: 2500000,
      closingDay: 20,
      dueDay: 5,
      primaryHolderName: 'Gabriel Cruz',
      primaryLastFour: '1234',
    })

    const primaryPlastic = account.plastics[0]
    expect(primaryPlastic).toBeDefined()

    const purchase = store.addPurchase({
      accountId: account.id,
      plasticId: primaryPlastic!.id,
      description: 'Zapatillas para Juan',
      purchaseDate: '2026-05-15',
      totalAmountCents: 50000,
      totalInstallments: 1,
      payerType: 'TERCERO',
      thirdPartyName: 'Juan Pérez',
    })

    expect(purchase.thirdPartyReceivable).toBeDefined()
    expect(purchase.thirdPartyReceivable?.status).toBe('PENDIENTE')

    // Add partial repayment
    store.addRepayment(purchase.id, {
      amountCents: toMoney(25000),
      paymentDate: '2026-05-25',
      destinationAccount: 'Cuenta Corriente',
    })

    const afterRepayment = useCreditCardStore.getState().purchases[purchase.id]
    expect(afterRepayment?.thirdPartyReceivable?.status).toBe('COBRADO_PARCIAL')
    expect(afterRepayment?.thirdPartyReceivable?.amountCollectedCents).toBe(25000)

    // Complete repayment
    store.addRepayment(purchase.id, {
      amountCents: toMoney(25000),
      paymentDate: '2026-05-28',
    })

    const afterFullRepayment = useCreditCardStore.getState().purchases[purchase.id]
    expect(afterFullRepayment?.thirdPartyReceivable?.status).toBe('COBRADO_TOTAL')
  })

  it('updates an existing account and primary plastic', () => {
    const store = useCreditCardStore.getState()
    const account = store.addAccount({
      institution: 'Banco Santander',
      accountName: 'Visa Signature',
      creditLimitCents: 2000000,
      closingDay: 20,
      dueDay: 5,
      primaryHolderName: 'Gabriel Cruz',
      primaryLastFour: '1234',
    })

    const updated = store.updateAccount(account.id, {
      creditLimitCents: 3500000, // Aumento de cupo
      closingDay: 24, // Cambio de fecha de corte
      dueDay: 10, // Cambio de fecha de pago
      primaryHolderName: 'Gabriel Cruz Soto',
    })

    expect(updated).not.toBeNull()
    expect(updated?.creditLimitCents).toBe(3500000)
    expect(updated?.closingDay).toBe(24)
    expect(updated?.dueDay).toBe(10)
    expect(updated?.plastics[0]?.holderName).toBe('Gabriel Cruz Soto')
    expect(updated?.plastics[0]?.lastFourDigits).toBe('1234')
  })

  it('removes an additional plastic from an account', () => {
    const store = useCreditCardStore.getState()
    const account = store.addAccount({
      institution: 'Banco Santander',
      accountName: 'Visa Signature',
      creditLimitCents: 2000000,
      closingDay: 20,
      dueDay: 5,
      primaryHolderName: 'Gabriel Cruz',
      primaryLastFour: '1234',
    })

    const additional = store.addPlastic(account.id, 'Laura Soto', '5678')
    expect(useCreditCardStore.getState().accounts[account.id]?.plastics).toHaveLength(2)

    store.removePlastic(account.id, additional!.id)
    const afterRemoval = useCreditCardStore.getState().accounts[account.id]
    expect(afterRemoval?.plastics).toHaveLength(1)
    expect(afterRemoval?.plastics[0]?.type).toBe('TITULAR')
  })

  it('deletes an account and its purchases', () => {
    const store = useCreditCardStore.getState()
    const account = store.addAccount({
      institution: 'Banco Santander',
      accountName: 'Visa Signature',
      creditLimitCents: 2000000,
      closingDay: 20,
      dueDay: 5,
      primaryHolderName: 'Gabriel Cruz',
      primaryLastFour: '1234',
    })

    const purchase = store.addPurchase({
      accountId: account.id,
      plasticId: account.plastics[0]!.id,
      description: 'Supermercado',
      purchaseDate: '2026-05-10',
      totalAmountCents: 30000,
      totalInstallments: 1,
      payerType: 'PROPIO',
    })

    expect(useCreditCardStore.getState().accounts[account.id]).toBeDefined()
    expect(useCreditCardStore.getState().purchases[purchase.id]).toBeDefined()

    store.deleteAccount(account.id)
    expect(useCreditCardStore.getState().accounts[account.id]).toBeUndefined()
    expect(useCreditCardStore.getState().purchases[purchase.id]).toBeUndefined()
  })
})
