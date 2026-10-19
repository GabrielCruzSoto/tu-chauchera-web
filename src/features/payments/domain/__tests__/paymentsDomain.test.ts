import { describe, it, expect } from "vitest"
import type {
  Obligation,
  Installment,
  CreditCardAccount,
  CreditCardPurchase,
  Category,
  Income,
} from "@/shared/types/domain"
import { buildPaymentCalendar } from "../buildPaymentCalendar"
import { assignPaymentWindows } from "../assignPaymentWindows"
import { calculateFinancialHealth } from "../calculateFinancialHealth"
import { prioritizeDebts } from "../prioritizeDebts"

describe("Payments Domain Logic", () => {
  const categories: Record<string, Category> = {
    "cat-1": { id: "cat-1", name: "Servicios", color: "blue", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
    "cat-2": { id: "cat-2", name: "Créditos", color: "red", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  }

  const obligations: Record<string, Obligation> = {
    "obl-rent": {
      id: "obl-rent",
      type: "EXPENSE",
      categoryId: "cat-1",
      subcategory: "Arriendo",
      detail: "Arriendo departamento",
      totalAmountCents: 45000000,
      totalInstallments: 12,
      currentInstallment: 1,
      installmentAmountCents: 45000000,
      startDate: "2026-10-01",
      dueDay: 1,
      status: "PENDING",
      createdAt: "2026-10-01",
      updatedAt: "2026-10-01",
    },
    "obl-car": {
      id: "obl-car",
      type: "DEBT",
      categoryId: "cat-2",
      subcategory: "Crédito Auto",
      detail: "Cuota 10/36",
      totalAmountCents: 720000000,
      totalInstallments: 36,
      currentInstallment: 10,
      installmentAmountCents: 20000000,
      startDate: "2026-10-15",
      dueDay: 15,
      status: "PENDING",
      createdAt: "2026-10-01",
      updatedAt: "2026-10-01",
    },
    "obl-loan": {
      id: "obl-loan",
      type: "DEBT",
      categoryId: "cat-2",
      subcategory: "Crédito Consumo Banco",
      detail: "Crédito fin de mes",
      totalAmountCents: 300000000,
      totalInstallments: 24,
      currentInstallment: 5,
      installmentAmountCents: 15000000,
      startDate: "2026-10-30",
      dueDay: 30,
      status: "PENDING",
      createdAt: "2026-10-01",
      updatedAt: "2026-10-01",
    },
  }

  const installments: Record<string, Installment> = {
    "inst-rent-oct": {
      id: "inst-rent-oct",
      obligationId: "obl-rent",
      installmentNumber: 1,
      dueDate: "2026-10-01",
      amountCents: 45000000,
      status: "PENDING",
      period: "2026-10",
    },
    "inst-car-oct": {
      id: "inst-car-oct",
      obligationId: "obl-car",
      installmentNumber: 10,
      dueDate: "2026-10-15",
      amountCents: 20000000,
      status: "PENDING",
      period: "2026-10",
    },
    "inst-loan-oct": {
      id: "inst-loan-oct",
      obligationId: "obl-loan",
      installmentNumber: 5,
      dueDate: "2026-10-30",
      amountCents: 15000000,
      status: "PENDING",
      period: "2026-10",
    },
    // Future installment for remaining calculation
    "inst-loan-nov": {
      id: "inst-loan-nov",
      obligationId: "obl-loan",
      installmentNumber: 6,
      dueDate: "2026-11-30",
      amountCents: 15000000,
      status: "PENDING",
      period: "2026-11",
    },
  }

  const creditCardAccounts: Record<string, CreditCardAccount> = {
    "cc-santander": {
      id: "cc-santander",
      institution: "Banco Santander",
      accountName: "Visa Gold",
      creditLimitCents: 200000000,
      closingDay: 20,
      dueDay: 5,
      monthlyMaintenanceFeeCents: 350000,
      plastics: [],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  }

  const creditCardPurchases: Record<string, CreditCardPurchase> = {
    "purchase-1": {
      id: "purchase-1",
      accountId: "cc-santander",
      plasticId: "plastic-1",
      description: "Supermercado en 3 cuotas",
      purchaseDate: "2026-09-10",
      totalAmountCents: 9000000,
      totalInstallments: 3,
      firstInstallmentPeriod: "2026-10",
      payerType: "PROPIO",
      createdAt: "2026-09-10",
      updatedAt: "2026-09-10",
    },
  }

  it("buildPaymentCalendar should aggregate installments and credit card balances", () => {
    const items = buildPaymentCalendar(
      {
        obligations,
        installments,
        creditCardAccounts,
        creditCardPurchases,
        categories,
      },
      "2026-10"
    )

    // Should contain: Arriendo (day 1), CC Santander (day 5), Crédito Auto (day 15), Crédito Consumo (day 30)
    expect(items).toHaveLength(4)
    expect(items[0].title).toBe("Arriendo")
    expect(items[0].dueDay).toBe(1)
    expect(items[0].isDebt).toBe(false)

    // Credit Card has 30.000 (1/3 of 90.000) + 3.500 mantención = 33.500 (3350000 cents)
    const ccItem = items.find((i) => i.sourceType === "CREDIT_CARD")
    expect(ccItem).toBeDefined()
    expect(ccItem?.amountCents).toBe(3350000)
    expect(ccItem?.dueDay).toBe(5)
    expect(ccItem?.isDebt).toBe(true)
  })

  it("assignPaymentWindows should correctly partition month-end vs mid-month obligations", () => {
    const calendarItems = buildPaymentCalendar(
      {
        obligations,
        installments,
        creditCardAccounts,
        creditCardPurchases,
        categories,
      },
      "2026-10"
    )

    const windows = assignPaymentWindows(calendarItems)
    expect(windows).toHaveLength(2)

    const salaryWindow = windows[0] // Day 25 to 5
    const midMonthWindow = windows[1] // Day 6 to 24

    expect(salaryWindow.id).toBe("window-salary-month-end")
    // Day 1 (Arriendo), Day 5 (CC), Day 30 (Consumo)
    expect(salaryWindow.items).toHaveLength(3)
    expect(salaryWindow.totalAmountCents).toBe(45000000 + 3350000 + 15000000)

    // Mid-month: Day 15 (Crédito Auto)
    expect(midMonthWindow.id).toBe("window-mid-month")
    expect(midMonthWindow.items).toHaveLength(1)
    expect(midMonthWindow.items[0].title).toBe("Crédito Auto")
    expect(midMonthWindow.totalAmountCents).toBe(20000000)
  })

  it("calculateFinancialHealth should compute correct burden percentage and alerts", () => {
    const calendarItems = buildPaymentCalendar(
      {
        obligations,
        installments,
        creditCardAccounts,
        creditCardPurchases,
        categories,
      },
      "2026-10"
    )

    const incomes: Income[] = [
      {
        id: "inc-1",
        description: "Sueldo Líquido",
        amountCents: 120000000, // $1.200.000 CLP
        type: "FIXED",
        period: "2026-10",
        createdAt: "2026-10-01",
      },
    ]

    const metrics = calculateFinancialHealth(incomes, calendarItems, "2026-10")

    // Debt payments = CC (33.500) + Car (200.000) + Loan (150.000) = 383.500 ($38.350.000 cents)
    // Income = $1.200.000 ($120.000.000 cents)
    // Burden = (383.500 / 1.200.000) * 100 = ~31.95% -> 32.0%
    expect(metrics.totalMonthlyIncomeCents).toBe(120000000)
    expect(metrics.totalDebtInstallmentsCents).toBe(38350000)
    expect(metrics.totalRecurringExpensesCents).toBe(45000000) // Rent
    expect(metrics.financialBurdenPercentage).toBe(32)
    expect(metrics.burdenLevel).toBe("CAUTION")
    expect(metrics.freeDisposableCents).toBe(120000000 - 38350000 - 45000000)
  })

  it("prioritizeDebts should sort debts by Snowball (lowest balance first)", () => {
    const prioritized = prioritizeDebts({ obligations, installments, categories }, "SNOWBALL")

    expect(prioritized).toHaveLength(2)
    // Loan has 2 pending installments ($300.000) vs Car has 1 pending ($200.000 in test mock)
    // Expect Car ($200.000) before Loan ($300.000)
    expect(prioritized[0].title).toBe("Crédito Auto")
    expect(prioritized[1].title).toBe("Crédito Consumo Banco")
    expect(prioritized[0].order).toBe(1)
    expect(prioritized[1].order).toBe(2)
  })

  it("prioritizeDebts should sort debts by Avalanche (highest interest rate first)", () => {
    const debtsWithRates: Record<string, Obligation> = {
      ...obligations,
      "obl-car": {
        ...obligations["obl-car"],
        annualRatePercentage: 12.5, // 12.5%
      },
      "obl-loan": {
        ...obligations["obl-loan"],
        annualRatePercentage: 28.9, // 28.9% -> Higher rate
      },
    }

    const prioritized = prioritizeDebts({ obligations: debtsWithRates, installments, categories }, "AVALANCHE")

    expect(prioritized).toHaveLength(2)
    // Loan has 28.9% rate vs Car has 12.5% rate -> Loan must be #1
    expect(prioritized[0].title).toBe("Crédito Consumo Banco")
    expect(prioritized[0].interestRatePercentage).toBe(28.9)
    expect(prioritized[0].order).toBe(1)

    expect(prioritized[1].title).toBe("Crédito Auto")
    expect(prioritized[1].interestRatePercentage).toBe(12.5)
    expect(prioritized[1].order).toBe(2)
  })
})
