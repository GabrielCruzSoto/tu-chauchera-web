import { describe, it, expect, beforeEach } from "vitest"
import { resetAllAppData, purgeDomainStores } from "./appReset"
import { useAuthStore } from "./authSlice"
import { useCreditCardStore } from "@/features/credit-cards/store/creditCardSlice"
import { useObligationsStore } from "@/features/obligations/store/obligationsSlice"
import { useIncomeStore } from "@/features/income/store/incomeSlice"
import { useSettingsStore } from "@/features/settings/store/settingsSlice"
import { toMoney } from "@/shared/types/money"

describe("appReset & logout memory purge", () => {
  beforeEach(() => {
    // Populate credit cards
    const cardAccount = useCreditCardStore.getState().addAccount({
      institution: "Banco de Chile",
      accountName: "Visa Signature",
      creditLimitCents: 2000000,
      closingDay: 20,
      dueDay: 5,
      primaryHolderName: "Gabriel Cruz",
      primaryLastFour: "1234",
    })

    useCreditCardStore.getState().addPurchase({
      accountId: cardAccount.id,
      plasticId: cardAccount.plastics[0]!.id,
      description: "Supermercado",
      purchaseDate: "2026-09-17",
      totalAmountCents: 50000,
      totalInstallments: 1,
      payerType: "PROPIO",
    })

    // Populate obligations
    useObligationsStore.getState().addObligation({
      categoryId: "cat-servicios",
      subcategory: "Servicios",
      detail: "Internet Fibra",
      totalAmountCents: toMoney(30000),
      totalInstallments: 1,
      currentInstallment: 1,
      installmentAmountCents: toMoney(30000),
      startDate: "2026-01-01",
      dueDay: 5,
    })

    // Populate incomes
    useIncomeStore.getState().addIncome({
      description: "Sueldo",
      amountCents: toMoney(2000000),
      type: "FIXED",
      period: "2026-09",
    })

    // Populate preferences
    useSettingsStore.getState().updatePreferences({ theme: "light" })

    // Populate auth
    useAuthStore.setState({
      isAuthenticated: true,
      isUnlocked: true,
      user: { sub: "u1", email: "test@example.com", name: "Test User" },
      accessToken: "token-123",
      cryptoKey: {} as CryptoKey,
    })
  })

  it("completely purges credit cards, purchases, obligations and incomes with purgeDomainStores", () => {
    expect(Object.keys(useCreditCardStore.getState().accounts).length).toBeGreaterThan(0)
    expect(Object.keys(useCreditCardStore.getState().purchases).length).toBeGreaterThan(0)
    expect(Object.keys(useObligationsStore.getState().obligations).length).toBeGreaterThan(0)
    expect(Object.keys(useIncomeStore.getState().incomes).length).toBeGreaterThan(0)

    purgeDomainStores()

    expect(useCreditCardStore.getState().accounts).toEqual({})
    expect(useCreditCardStore.getState().purchases).toEqual({})
    expect(useCreditCardStore.getState().isLoaded).toBe(false)

    expect(useObligationsStore.getState().obligations).toEqual({})
    expect(useObligationsStore.getState().installments).toEqual({})
    expect(useObligationsStore.getState().isLoaded).toBe(false)

    expect(useIncomeStore.getState().incomes).toEqual({})
    expect(useIncomeStore.getState().isLoaded).toBe(false)
  })

  it("resets all app data and logs out when resetAllAppData is invoked", () => {
    resetAllAppData()

    expect(useCreditCardStore.getState().accounts).toEqual({})
    expect(useCreditCardStore.getState().purchases).toEqual({})
    expect(useObligationsStore.getState().obligations).toEqual({})
    expect(useIncomeStore.getState().incomes).toEqual({})

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().isUnlocked).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().cryptoKey).toBeNull()
  })

  it("automatically purges domain stores when logout() is called directly", () => {
    expect(Object.keys(useCreditCardStore.getState().accounts).length).toBeGreaterThan(0)

    useAuthStore.getState().logout()

    expect(useCreditCardStore.getState().accounts).toEqual({})
    expect(useCreditCardStore.getState().purchases).toEqual({})
    expect(useObligationsStore.getState().obligations).toEqual({})
    expect(useIncomeStore.getState().incomes).toEqual({})
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().isUnlocked).toBe(false)
  })
})
