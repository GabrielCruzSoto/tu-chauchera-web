import { create } from 'zustand'
import type {
  CreditCardAccount,
  CreditCardPlastic,
  CreditCardPurchase,
  CreditCardsStore,
  ThirdPartyRepayment,
  UUID,
  ISODate,
} from '@/shared/types/domain'
import { toMoney, addMoney } from '@/shared/types/money'
import {
  calculateBillingPeriod,
  calculateRepaymentStatus,
} from '../utils/cycleCalculators'

export interface CreateAccountDTO {
  institution: string
  accountName: string
  creditLimitCents: number
  closingDay: number
  dueDay: number
  primaryHolderName: string
  primaryLastFour: string
}

export interface CreatePurchaseDTO {
  accountId: UUID
  plasticId: UUID
  description: string
  purchaseDate: ISODate
  totalAmountCents: number
  totalInstallments: number
  payerType: 'PROPIO' | 'TERCERO'
  thirdPartyName?: string | undefined
}

export interface CreditCardState {
  accounts: Record<UUID, CreditCardAccount>
  purchases: Record<UUID, CreditCardPurchase>
  isLoaded: boolean

  setCreditCardsData: (data: CreditCardsStore) => void
  addAccount: (dto: CreateAccountDTO) => CreditCardAccount
  addPlastic: (accountId: UUID, holderName: string, lastFourDigits: string) => CreditCardPlastic | null
  addPurchase: (dto: CreatePurchaseDTO) => CreditCardPurchase
  addRepayment: (purchaseId: UUID, repayment: Omit<ThirdPartyRepayment, 'id'>) => void
}

export const useCreditCardStore = create<CreditCardState>((set, get) => ({
  accounts: {},
  purchases: {},
  isLoaded: false,

  setCreditCardsData: (data) => {
    set({
      accounts: data.accounts || {},
      purchases: data.purchases || {},
      isLoaded: true,
    })
  },

  addAccount: (dto) => {
    const accountId = crypto.randomUUID()
    const plasticId = crypto.randomUUID()
    const now = new Date().toISOString().split('T')[0]

    const primaryPlastic: CreditCardPlastic = {
      id: plasticId,
      accountId,
      holderName: dto.primaryHolderName,
      lastFourDigits: dto.primaryLastFour,
      type: 'TITULAR',
      createdAt: now,
      updatedAt: now,
    }

    const newAccount: CreditCardAccount = {
      id: accountId,
      institution: dto.institution,
      accountName: dto.accountName,
      creditLimitCents: toMoney(dto.creditLimitCents),
      closingDay: dto.closingDay,
      dueDay: dto.dueDay,
      plastics: [primaryPlastic],
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({
      accounts: { ...state.accounts, [accountId]: newAccount },
    }))

    return newAccount
  },

  addPlastic: (accountId, holderName, lastFourDigits) => {
    const account = get().accounts[accountId]
    if (!account) return null

    const now = new Date().toISOString().split('T')[0]
    const newPlastic: CreditCardPlastic = {
      id: crypto.randomUUID(),
      accountId,
      holderName,
      lastFourDigits,
      type: 'ADICIONAL',
      createdAt: now,
      updatedAt: now,
    }

    const updatedAccount: CreditCardAccount = {
      ...account,
      plastics: [...account.plastics, newPlastic],
      updatedAt: now,
    }

    set((state) => ({
      accounts: { ...state.accounts, [accountId]: updatedAccount },
    }))

    return newPlastic
  },

  addPurchase: (dto) => {
    const account = get().accounts[dto.accountId]
    const now = new Date().toISOString().split('T')[0]
    const purchaseId = crypto.randomUUID()

    const firstInstallmentPeriod = account
      ? calculateBillingPeriod(dto.purchaseDate, account.closingDay)
      : calculateBillingPeriod(dto.purchaseDate, 20)

    let thirdPartyReceivable = undefined
    if (dto.payerType === 'TERCERO' && dto.thirdPartyName) {
      thirdPartyReceivable = {
        id: crypto.randomUUID(),
        thirdPartyName: dto.thirdPartyName,
        purchaseId,
        totalOwedCents: toMoney(dto.totalAmountCents),
        amountCollectedCents: toMoney(0),
        status: 'PENDIENTE' as const,
        repayments: [],
      }
    }

    const newPurchase: CreditCardPurchase = {
      id: purchaseId,
      accountId: dto.accountId,
      plasticId: dto.plasticId,
      description: dto.description,
      purchaseDate: dto.purchaseDate,
      totalAmountCents: toMoney(dto.totalAmountCents),
      totalInstallments: dto.totalInstallments,
      firstInstallmentPeriod,
      payerType: dto.payerType,
      thirdPartyReceivable,
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({
      purchases: { ...state.purchases, [purchaseId]: newPurchase },
    }))

    return newPurchase
  },

  addRepayment: (purchaseId, repaymentDto) => {
    const purchase = get().purchases[purchaseId]
    if (!purchase || !purchase.thirdPartyReceivable) return

    const receivable = purchase.thirdPartyReceivable
    const newRepayment: ThirdPartyRepayment = {
      ...repaymentDto,
      id: crypto.randomUUID(),
    }

    const updatedRepayments = [...receivable.repayments, newRepayment]
    const updatedCollected = updatedRepayments.reduce(
      (acc, curr) => addMoney(acc, curr.amountCents),
      toMoney(0)
    )

    const updatedStatus = calculateRepaymentStatus(receivable.totalOwedCents, updatedCollected)

    const updatedPurchase: CreditCardPurchase = {
      ...purchase,
      thirdPartyReceivable: {
        ...receivable,
        amountCollectedCents: updatedCollected,
        status: updatedStatus,
        repayments: updatedRepayments,
      },
      updatedAt: new Date().toISOString().split('T')[0],
    }

    set((state) => ({
      purchases: { ...state.purchases, [purchaseId]: updatedPurchase },
    }))
  },
}))
