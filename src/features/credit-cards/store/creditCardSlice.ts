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
import { useSyncStore } from '@/features/sync/store/syncSlice'

export interface CreateAccountDTO {
  institution: string
  accountName: string
  creditLimitCents: number
  hasInternationalLimit?: boolean | undefined
  internationalCreditLimitUSD?: number | undefined
  monthlyMaintenanceFeeCents?: number | undefined
  monthlyMaintenanceFeeCurrency?: 'CLP' | 'UF' | undefined
  monthlyMaintenanceFeeAmount?: number | undefined
  closingDay: number
  dueDay: number
  primaryHolderName: string
  primaryLastFour: string
}

export interface UpdateAccountDTO {
  institution?: string | undefined
  accountName?: string | undefined
  creditLimitCents?: number | undefined
  hasInternationalLimit?: boolean | undefined
  internationalCreditLimitUSD?: number | undefined
  monthlyMaintenanceFeeCents?: number | undefined
  monthlyMaintenanceFeeCurrency?: 'CLP' | 'UF' | undefined
  monthlyMaintenanceFeeAmount?: number | undefined
  closingDay?: number | undefined
  dueDay?: number | undefined
  primaryHolderName?: string | undefined
  primaryLastFour?: string | undefined
}

export interface CreatePurchaseDTO {
  accountId: UUID
  plasticId: UUID
  description: string
  purchaseDate: ISODate
  totalAmountCents: number
  totalInstallments: number
  firstInstallmentPeriod?: string | undefined
  payerType: 'PROPIO' | 'TERCERO'
  thirdPartyName?: string | undefined
}

export interface CreditCardState {
  accounts: Record<UUID, CreditCardAccount>
  purchases: Record<UUID, CreditCardPurchase>
  isLoaded: boolean

  setCreditCardsData: (data: CreditCardsStore) => void
  addAccount: (dto: CreateAccountDTO) => CreditCardAccount
  updateAccount: (accountId: UUID, dto: UpdateAccountDTO) => CreditCardAccount | null
  deleteAccount: (accountId: UUID) => void
  addPlastic: (accountId: UUID, holderName: string, lastFourDigits: string) => CreditCardPlastic | null
  removePlastic: (accountId: UUID, plasticId: UUID) => void
  addPurchase: (dto: CreatePurchaseDTO) => CreditCardPurchase
  addRepayment: (purchaseId: UUID, repayment: Omit<ThirdPartyRepayment, 'id'>) => void
  togglePeriodPaid: (accountId: UUID, period: string) => void
  resetCreditCards: () => void
}

export const useCreditCardStore = create<CreditCardState>((set, get) => ({
  accounts: {},
  purchases: {},
  isLoaded: false,

  resetCreditCards: () => {
    set({
      accounts: {},
      purchases: {},
      isLoaded: false,
    })
  },

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
    const now = new Date().toISOString().split('T')[0] ?? ''

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
      hasInternationalLimit: dto.hasInternationalLimit,
      internationalCreditLimitUSD: dto.internationalCreditLimitUSD,
      monthlyMaintenanceFeeCents: dto.monthlyMaintenanceFeeCents !== undefined ? toMoney(dto.monthlyMaintenanceFeeCents) : undefined,
      monthlyMaintenanceFeeCurrency: dto.monthlyMaintenanceFeeCurrency,
      monthlyMaintenanceFeeAmount: dto.monthlyMaintenanceFeeAmount,
      closingDay: dto.closingDay,
      dueDay: dto.dueDay,
      plastics: [primaryPlastic],
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({
      accounts: { ...state.accounts, [accountId]: newAccount },
    }))

    useSyncStore.getState().queueSyncDomain('credit_cards')

    return newAccount
  },

  updateAccount: (accountId, dto) => {
    const account = get().accounts[accountId]
    if (!account) return null

    const now = new Date().toISOString().split('T')[0] ?? ''

    let updatedPlastics = account.plastics
    if (dto.primaryHolderName !== undefined || dto.primaryLastFour !== undefined) {
      updatedPlastics = account.plastics.map((p) => {
        if (p.type === 'TITULAR') {
          return {
            ...p,
            holderName: dto.primaryHolderName ?? p.holderName,
            lastFourDigits: dto.primaryLastFour ?? p.lastFourDigits,
            updatedAt: now,
          }
        }
        return p
      })
    }

    const updatedAccount: CreditCardAccount = {
      ...account,
      institution: dto.institution ?? account.institution,
      accountName: dto.accountName ?? account.accountName,
      creditLimitCents: dto.creditLimitCents !== undefined ? toMoney(dto.creditLimitCents) : account.creditLimitCents,
      hasInternationalLimit: dto.hasInternationalLimit ?? account.hasInternationalLimit,
      internationalCreditLimitUSD: dto.internationalCreditLimitUSD ?? account.internationalCreditLimitUSD,
      monthlyMaintenanceFeeCents: dto.monthlyMaintenanceFeeCents !== undefined ? toMoney(dto.monthlyMaintenanceFeeCents) : account.monthlyMaintenanceFeeCents,
      monthlyMaintenanceFeeCurrency: dto.monthlyMaintenanceFeeCurrency ?? account.monthlyMaintenanceFeeCurrency,
      monthlyMaintenanceFeeAmount: dto.monthlyMaintenanceFeeAmount ?? account.monthlyMaintenanceFeeAmount,
      closingDay: dto.closingDay ?? account.closingDay,
      dueDay: dto.dueDay ?? account.dueDay,
      plastics: updatedPlastics,
      updatedAt: now,
    }

    set((state) => ({
      accounts: { ...state.accounts, [accountId]: updatedAccount },
    }))

    useSyncStore.getState().queueSyncDomain('credit_cards')

    return updatedAccount
  },

  deleteAccount: (accountId) => {
    set((state) => {
      const nextAccounts = { ...state.accounts }
      delete nextAccounts[accountId]

      // Also remove associated purchases
      const nextPurchases = { ...state.purchases }
      for (const [id, purchase] of Object.entries(nextPurchases)) {
        if (purchase.accountId === accountId) {
          delete nextPurchases[id]
        }
      }

      return {
        accounts: nextAccounts,
        purchases: nextPurchases,
      }
    })

    useSyncStore.getState().queueSyncDomain('credit_cards')
  },

  addPlastic: (accountId, holderName, lastFourDigits) => {
    const account = get().accounts[accountId]
    if (!account) return null

    const now = new Date().toISOString().split('T')[0] ?? ''
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

    useSyncStore.getState().queueSyncDomain('credit_cards')

    return newPlastic
  },

  removePlastic: (accountId, plasticId) => {
    const account = get().accounts[accountId]
    if (!account) return

    const now = new Date().toISOString().split('T')[0] ?? ''
    // Only allow removing additional plastics (not primary TITULAR)
    const updatedPlastics = account.plastics.filter((p) => p.id !== plasticId || p.type === 'TITULAR')

    const updatedAccount: CreditCardAccount = {
      ...account,
      plastics: updatedPlastics,
      updatedAt: now,
    }

    set((state) => ({
      accounts: { ...state.accounts, [accountId]: updatedAccount },
    }))

    useSyncStore.getState().queueSyncDomain('credit_cards')
  },

  addPurchase: (dto) => {
    const account = get().accounts[dto.accountId]
    const now = new Date().toISOString().split('T')[0] ?? ''
    const purchaseId = crypto.randomUUID()

    const firstInstallmentPeriod =
      dto.firstInstallmentPeriod ??
      (account
        ? calculateBillingPeriod(dto.purchaseDate, account.closingDay, account.dueDay)
        : calculateBillingPeriod(dto.purchaseDate, 20, 5))

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

    useSyncStore.getState().queueSyncDomain('credit_cards')

    return newPurchase
  },

  addRepayment: (purchaseId, repaymentDto) => {
    const purchase = get().purchases[purchaseId]
    if (!purchase?.thirdPartyReceivable) return

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
      updatedAt: new Date().toISOString().split('T')[0] ?? '',
    }

    set((state) => ({
      purchases: { ...state.purchases, [purchaseId]: updatedPurchase },
    }))

    useSyncStore.getState().queueSyncDomain('credit_cards')
  },

  togglePeriodPaid: (accountId, period) => {
    const account = get().accounts[accountId]
    if (!account) return

    const currentPaid = account.paidPeriods ?? []
    const isPaid = currentPaid.includes(period)
    const nextPaid = isPaid
      ? currentPaid.filter((p) => p !== period)
      : [...currentPaid, period]

    const updatedAccount: CreditCardAccount = {
      ...account,
      paidPeriods: nextPaid,
      updatedAt: new Date().toISOString().split('T')[0] ?? '',
    }

    set((state) => ({
      accounts: { ...state.accounts, [accountId]: updatedAccount },
    }))

    useSyncStore.getState().queueSyncDomain('credit_cards')
  },
}))
