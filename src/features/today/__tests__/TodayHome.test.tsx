import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { TodayHome } from "../components/TodayHome"
import { toMoney } from "@/shared/types/money"
import { useObligationsStore } from "@/features/obligations/store/obligationsSlice"
import { useIncomeStore } from "@/features/income/store/incomeSlice"
import { useCreditCardStore } from "@/features/credit-cards/store/creditCardSlice"

// Fixed "today": 2026-10-19 (local) for deterministic countdowns
const FIXED_NOW = new Date(2026, 9, 19, 12, 0, 0)

function seedStores() {
  useIncomeStore.setState({
    incomes: {
      "inc-1": {
        id: "inc-1",
        description: "Sueldo",
        amountCents: toMoney(1500000),
        type: "FIXED",
        period: "2026-10",
        createdAt: "2026-10-01",
      },
    },
    isLoaded: true,
  })

  useObligationsStore.setState({
    categories: {},
    isLoaded: true,
    obligations: {
      "obl-credit": {
        id: "obl-credit",
        type: "DEBT",
        categoryId: "cat-1",
        subcategory: "Crédito Automotriz",
        detail: "Cuota mensual",
        totalAmountCents: toMoney(2400000),
        totalInstallments: 12,
        currentInstallment: 1,
        installmentAmountCents: toMoney(200000),
        startDate: "2026-10-22",
        dueDay: 22,
        status: "PENDING",
        createdAt: "2026-10-01",
        updatedAt: "2026-10-01",
      },
      "obl-light": {
        id: "obl-light",
        type: "EXPENSE",
        categoryId: "cat-1",
        subcategory: "Cuenta de Luz",
        detail: "Luz octubre",
        totalAmountCents: toMoney(80000),
        totalInstallments: 1,
        currentInstallment: 1,
        installmentAmountCents: toMoney(80000),
        isRecurringIndefinite: false,
        startDate: "2026-10-10",
        dueDay: 10,
        status: "PENDING",
        createdAt: "2026-10-01",
        updatedAt: "2026-10-01",
      },
      "obl-old": {
        id: "obl-old",
        type: "DEBT",
        categoryId: "cat-1",
        subcategory: "Crédito Antiguo",
        detail: "Cuota de septiembre olvidada",
        totalAmountCents: toMoney(600000),
        totalInstallments: 12,
        currentInstallment: 1,
        installmentAmountCents: toMoney(50000),
        startDate: "2026-09-28",
        dueDay: 28,
        status: "PENDING",
        createdAt: "2026-09-01",
        updatedAt: "2026-09-01",
      },
      "obl-far": {
        id: "obl-far",
        type: "EXPENSE",
        categoryId: "cat-1",
        subcategory: "Gasto Lejano",
        detail: "Vence después de la ventana de 7 días",
        totalAmountCents: toMoney(30000),
        totalInstallments: 1,
        currentInstallment: 1,
        installmentAmountCents: toMoney(30000),
        isRecurringIndefinite: false,
        startDate: "2026-10-31",
        dueDay: 31,
        status: "PENDING",
        createdAt: "2026-10-01",
        updatedAt: "2026-10-01",
      },
    },
    installments: {
      "inst-credit": {
        id: "inst-credit",
        obligationId: "obl-credit",
        installmentNumber: 1,
        dueDate: "2026-10-22",
        amountCents: toMoney(200000),
        status: "PENDING",
        period: "2026-10",
      },
      "inst-light": {
        id: "inst-light",
        obligationId: "obl-light",
        installmentNumber: 1,
        dueDate: "2026-10-10",
        amountCents: toMoney(80000),
        status: "PENDING",
        period: "2026-10",
      },
      // Carryover: belongs to a PREVIOUS period — the monthly calendar never shows it
      "inst-old": {
        id: "inst-old",
        obligationId: "obl-old",
        installmentNumber: 1,
        dueDate: "2026-09-28",
        amountCents: toMoney(50000),
        status: "PENDING",
        period: "2026-09",
      },
      "inst-far": {
        id: "inst-far",
        obligationId: "obl-far",
        installmentNumber: 1,
        dueDate: "2026-10-31",
        amountCents: toMoney(30000),
        status: "PENDING",
        period: "2026-10",
      },
    },
  })

  useCreditCardStore.setState({
    accounts: {
      "acc-1": {
        id: "acc-1",
        institution: "Tenpo",
        accountName: "Cuenta Tenpo",
        creditLimitCents: toMoney(500000),
        closingDay: 15,
        dueDay: 22,
        plastics: [],
        paidPeriods: [],
        createdAt: "2026-10-01",
        updatedAt: "2026-10-01",
      },
    },
    purchases: {
      "pur-1": {
        id: "pur-1",
        accountId: "acc-1",
        plasticId: "plastic-1",
        description: "Compra única",
        purchaseDate: "2026-10-05",
        totalAmountCents: toMoney(100000),
        totalInstallments: 1,
        firstInstallmentPeriod: "2026-10",
        payerType: "PROPIO",
        createdAt: "2026-10-05",
        updatedAt: "2026-10-05",
      },
    },
    isLoaded: true,
  })
}

describe("TodayHome", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
    seedStores()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders the financial health KPIs for the current month", () => {
    render(<TodayHome />)

    expect(screen.getByText(/Libre para gastar/i)).toBeInTheDocument()
    expect(screen.getByText(/Comprometido este mes/i)).toBeInTheDocument()
    expect(screen.getByText(/Carga Financiera/i)).toBeInTheDocument()

    // Income 1.500.000 − committed 410.000 (200k + 80k + 30k + 100k TC) = 1.090.000
    expect(screen.getByText(/1\.090\.000/)).toBeInTheDocument()
    // Burden: only DEBT items count (200k credit + 100k TC) / 1.500.000 = 20%
    expect(screen.getByText("20%")).toBeInTheDocument()
    expect(screen.getByText(/Saludable \(<30%\)/i)).toBeInTheDocument()
  })

  it("prioritizes the most overdue item as the next payment, including previous-period carryover", () => {
    render(<TodayHome />)

    // The carryover installment (due 2026-09-28) is the most urgent item
    expect(screen.getByText(/Próximo pago/i)).toBeInTheDocument()
    expect(screen.getAllByText("Crédito Antiguo").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Vencido hace 21 días/i).length).toBeGreaterThanOrEqual(1)
  })

  it("separates overdue items from the 7-day lookahead and hides far-future items", () => {
    render(<TodayHome />)

    // Overdue: Cuenta de Luz (10 oct) + Crédito Antiguo (28 sep, carryover)
    expect(screen.getByText(/Vencidos — paga esto primero \(2\)/i)).toBeInTheDocument()
    expect(screen.getAllByText("Cuenta de Luz").length).toBeGreaterThanOrEqual(1)

    // Upcoming 7 days: Crédito Automotriz (22 oct) + Tenpo card (22 oct)
    expect(screen.getByText(/Próximos 7 días \(2\)/i)).toBeInTheDocument()
    expect(screen.getAllByText("Crédito Automotriz").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Tenpo \(Cuenta Tenpo\)/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Vence en 3 días/i).length).toBeGreaterThanOrEqual(1)

    // Far-future item (31 oct) is intentionally not listed in the Today view
    expect(screen.queryByText("Gasto Lejano")).not.toBeInTheDocument()
  })

  it("opens PaymentModal when paying an installment from the next-payment hero", () => {
    render(<TodayHome />)

    const payNowBtn = screen.getByRole("button", { name: /Pagar ahora/i })
    fireEvent.click(payNowBtn)

    expect(
      screen.getByRole("heading", { name: /Registrar Pago de Cuota/i })
    ).toBeInTheDocument()
  })

  it("marks a credit card period as paid directly from the list", () => {
    render(<TodayHome />)

    const markPaidBtn = screen.getByRole("button", { name: /Marcar pagada/i })
    fireEvent.click(markPaidBtn)

    const account = useCreditCardStore.getState().accounts["acc-1"]
    expect(account?.paidPeriods).toContain("2026-10")
  })

  it("shows a celebratory empty state when there is nothing pending", () => {
    useObligationsStore.setState({ obligations: {}, installments: {}, categories: {}, isLoaded: true })
    useCreditCardStore.setState({ accounts: {}, purchases: {}, isLoaded: true })

    render(<TodayHome />)

    expect(screen.getByText(/No tienes pagos pendientes este mes/i)).toBeInTheDocument()
    expect(screen.getByText(/Sin pagos vencidos/i)).toBeInTheDocument()
  })
})
