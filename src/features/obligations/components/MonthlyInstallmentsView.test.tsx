import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { MonthlyInstallmentsView } from "./MonthlyInstallmentsView"
import { useObligationsStore } from "../store/obligationsSlice"
import { useIncomeStore } from "@/features/income/store/incomeSlice"
import { toMoney } from "@/shared/types/money"
import type { Obligation, Installment } from "@/shared/types/domain"

describe("MonthlyInstallmentsView Status Filters", () => {
  const sampleObl: Obligation = {
    id: "obl-1",
    categoryId: "cat-bancos",
    subcategory: "Crédito Banco Chile",
    detail: "Cuota mensual",
    totalAmountCents: toMoney(300000),
    totalInstallments: 3,
    currentInstallment: 1,
    installmentAmountCents: toMoney(100000),
    startDate: "2024-05-10",
    dueDay: 10,
    status: "PENDING",
    type: "DEBT",
    createdAt: "",
    updatedAt: "",
  }

  const currentMonthStr = new Date().toISOString().slice(0, 7) // e.g. "2026-09"
  const [curYear, curMonth] = currentMonthStr.split("-").map(Number)
  const prevYearVal = curMonth === 1 ? (curYear || 2026) - 1 : curYear
  const prevMonthNumVal = curMonth === 1 ? 12 : (curMonth || 9) - 1
  const prevMonthStr = `${prevYearVal}-${String(prevMonthNumVal).padStart(2, "0")}`

  const instPaid: Installment = {
    id: "inst-paid",
    obligationId: "obl-1",
    installmentNumber: 1,
    dueDate: `${currentMonthStr}-05`,
    amountCents: toMoney(100000),
    status: "PAID",
    paidDate: `${currentMonthStr}-04`,
    period: currentMonthStr,
  }

  const instPendingFuture: Installment = {
    id: "inst-pending-future",
    obligationId: "obl-1",
    installmentNumber: 2,
    dueDate: `${currentMonthStr}-28`,
    amountCents: toMoney(100000),
    status: "PENDING",
  }

  const instOverdue: Installment = {
    id: "inst-overdue",
    obligationId: "obl-1",
    installmentNumber: 3,
    dueDate: "2020-01-01", // Clearly in the past
    amountCents: toMoney(100000),
    status: "PENDING",
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(`${currentMonthStr}-10T12:00:00Z`))
    useIncomeStore.setState({
      incomes: {},
      isLoaded: true,
    })
    useObligationsStore.setState({
      obligations: {
        "obl-1": sampleObl,
      },
      installments: {
        "inst-paid": instPaid,
        "inst-pending-future": instPendingFuture,
        "inst-overdue": instOverdue,
      },
      categories: {
        "cat-bancos": {
          id: "cat-bancos",
          name: "Bancos & Créditos",
          color: "emerald",
          createdAt: "",
          updatedAt: "",
        },
      },
      isLoaded: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders month summary, filter toolbar, and installments by default", () => {
    render(<MonthlyInstallmentsView />)

    expect(screen.getByText(/^Todas \(2\)/i)).toBeInTheDocument()
    expect(screen.getByText(/No Pagadas \(1\)/i)).toBeInTheDocument()
    expect(screen.getByText(/^Pagadas \(1\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Vencidas \(1\)/i)).toBeInTheDocument()

    expect(screen.getByText("PAGADO")).toBeInTheDocument()
    expect(screen.getByText("PENDIENTE")).toBeInTheDocument()
  })

  it("filters only paid installments when clicking Pagadas filter", () => {
    render(<MonthlyInstallmentsView />)

    const paidFilterBtn = screen.getByRole("button", {
      name: (content) => content.includes("Pagadas") && !content.includes("No Pagadas"),
    })
    fireEvent.click(paidFilterBtn)

    expect(screen.getByText("PAGADO")).toBeInTheDocument()
    expect(screen.queryByText("#2 / 3")).not.toBeInTheDocument()
  })

  it("filters only unpaid installments when clicking No Pagadas filter", () => {
    render(<MonthlyInstallmentsView />)

    const pendingFilterBtn = screen.getByRole("button", {
      name: (content) => content.includes("No Pagadas"),
    })
    fireEvent.click(pendingFilterBtn)

    expect(screen.queryByText("PAGADO")).not.toBeInTheDocument()
    expect(screen.getByText("#2 / 3")).toBeInTheDocument()
  })

  it("filters only overdue installments when clicking Vencidas filter", () => {
    render(<MonthlyInstallmentsView />)

    const overdueFilterBtn = screen.getByRole("button", {
      name: (content) => content.includes("Vencidas"),
    })
    fireEvent.click(overdueFilterBtn)

    expect(screen.queryByText("PAGADO")).not.toBeInTheDocument()
    expect(screen.queryByText("#2 / 3")).not.toBeInTheDocument()
    expect(screen.getByText("#3 / 3")).toBeInTheDocument()
    expect(screen.getByText("NO PAGADA EN PLAZO")).toBeInTheDocument()
  })

  it("shows ⚠️ VENCIDA badge for pending installments overdue within the current month", () => {
    useObligationsStore.setState({
      obligations: { "obl-1": sampleObl },
      installments: {
        "inst-curr-overdue": {
          id: "inst-curr-overdue",
          obligationId: "obl-1",
          installmentNumber: 1,
          dueDate: `${currentMonthStr}-02`, // In the past, but in current month
          amountCents: toMoney(50000),
          status: "PENDING",
        },
      },
    })

    render(<MonthlyInstallmentsView />)

    expect(screen.getByText("⚠️ VENCIDA")).toBeInTheDocument()
  })

  it("rolls over unpaid installments from previous month into current month in red", () => {
    const [year, month] = currentMonthStr.split("-").map(Number)
    const prevYear = month === 1 ? (year || 2026) - 1 : year
    const prevMonthNum = month === 1 ? 12 : (month || 9) - 1
    const prevMonthStr = `${prevYear}-${String(prevMonthNum).padStart(2, "0")}`

    useObligationsStore.setState({
      obligations: { "obl-1": sampleObl },
      installments: {
        "inst-prev-unpaid": {
          id: "inst-prev-unpaid",
          obligationId: "obl-1",
          installmentNumber: 1,
          dueDate: `${prevMonthStr}-15`, // Unpaid installment from previous month
          amountCents: toMoney(85000),
          status: "PENDING",
        },
      },
    })

    render(<MonthlyInstallmentsView />)

    // Should be automatically included in current month's view
    expect(screen.getByText("NO PAGADA EN PLAZO")).toBeInTheDocument()
    expect(screen.getByText(`Pasó de: ${prevMonthStr}`)).toBeInTheDocument()
    expect(screen.getByText("No pagadas en plazo:")).toBeInTheDocument()
    expect(screen.getAllByText("$85.000").length).toBeGreaterThanOrEqual(1)
  })

  it("allows postponing an unpaid installment to the next month with Pasar a mes siguiente", () => {
    useObligationsStore.setState({
      obligations: { "obl-1": sampleObl },
      installments: {
        "inst-to-postpone": {
          id: "inst-to-postpone",
          obligationId: "obl-1",
          installmentNumber: 1,
          dueDate: `${currentMonthStr}-05`,
          amountCents: toMoney(60000),
          status: "PENDING",
        },
      },
    })

    render(<MonthlyInstallmentsView />)

    const postponeBtn = screen.getByRole("button", { name: /Pasar a mes siguiente/i })
    expect(postponeBtn).toBeInTheDocument()

    fireEvent.click(postponeBtn)

    // Feedback alert is displayed
    expect(
      screen.getByText(/Cuota pasada al mes siguiente/i)
    ).toBeInTheDocument()

    // Store has been updated with isOverdueRollover and new dueDate in next month
    const updatedInst = useObligationsStore.getState().installments["inst-to-postpone"]
    expect(updatedInst?.isOverdueRollover).toBe(true)
    expect(updatedInst?.originalDueDate).toBe(`${currentMonthStr}-05`)
  })

  it("allows undoing the postponement immediately from the feedback banner", () => {
    useObligationsStore.setState({
      obligations: { "obl-1": sampleObl },
      installments: {
        "inst-undo-banner": {
          id: "inst-undo-banner",
          obligationId: "obl-1",
          installmentNumber: 1,
          dueDate: `${currentMonthStr}-05`,
          amountCents: toMoney(60000),
          status: "PENDING",
        },
      },
    })

    render(<MonthlyInstallmentsView />)

    const postponeBtn = screen.getByRole("button", { name: /Pasar a mes siguiente/i })
    fireEvent.click(postponeBtn)

    // Deshacer button in banner appears
    const undoBtn = screen.getByRole("button", { name: /Deshacer/i })
    expect(undoBtn).toBeInTheDocument()

    fireEvent.click(undoBtn)

    // Store is reverted
    const revertedInst = useObligationsStore.getState().installments["inst-undo-banner"]
    expect(revertedInst?.dueDate).toBe(`${currentMonthStr}-05`)
    expect(revertedInst?.originalDueDate).toBeUndefined()
    expect(revertedInst?.isOverdueRollover).toBeUndefined()
    expect(screen.getByText(/Acción deshecha correctamente./i)).toBeInTheDocument()
  })

  it("allows moving any pending installment to the previous month with Pasar a mes anterior", () => {
    useObligationsStore.setState({
      obligations: { "obl-1": sampleObl },
      installments: {
        "inst-move-prev": {
          id: "inst-move-prev",
          obligationId: "obl-1",
          installmentNumber: 16,
          dueDate: `${currentMonthStr}-16`,
          amountCents: toMoney(287936),
          status: "PENDING",
        },
      },
    })

    render(<MonthlyInstallmentsView />)

    const prevBtn = screen.getByRole("button", { name: /Pasar a mes anterior/i })
    expect(prevBtn).toBeInTheDocument()

    fireEvent.click(prevBtn)

    const movedInst = useObligationsStore.getState().installments["inst-move-prev"]
    expect(movedInst?.dueDate).toBe(`${prevMonthStr}-16`)
    expect(screen.getByText(/Cuota movida al mes anterior./i)).toBeInTheDocument()
  })

  it("allows reverting a postponed installment via Volver a fecha original button", () => {
    useObligationsStore.setState({
      obligations: { "obl-1": sampleObl },
      installments: {
        "inst-revert-btn": {
          id: "inst-revert-btn",
          obligationId: "obl-1",
          installmentNumber: 1,
          dueDate: `${currentMonthStr}-05`,
          originalDueDate: `${prevMonthStr}-05`,
          amountCents: toMoney(60000),
          status: "PENDING",
          isOverdueRollover: true,
        },
      },
    })

    render(<MonthlyInstallmentsView />)

    const revertBtn = screen.getByRole("button", { name: /Volver a fecha original/i })
    expect(revertBtn).toBeInTheDocument()

    fireEvent.click(revertBtn)

    const revertedInst = useObligationsStore.getState().installments["inst-revert-btn"]
    expect(revertedInst?.dueDate).toBe(`${prevMonthStr}-05`)
    expect(revertedInst?.originalDueDate).toBeUndefined()
    expect(revertedInst?.isOverdueRollover).toBeUndefined()
  })

  it("keeps paid installments visible in their original dueDate month even when paid", () => {
    // If an installment was paid in a different month (e.g. dueDate is in currentPeriod, but paid in previous/next period)
    useObligationsStore.setState({
      obligations: { "obl-1": sampleObl },
      installments: {
        "inst-paid-diff-period": {
          id: "inst-paid-diff-period",
          obligationId: "obl-1",
          installmentNumber: 1,
          dueDate: `${currentMonthStr}-15`,
          amountCents: toMoney(100000),
          status: "PAID",
          paidDate: "2026-08-30",
          period: "2026-08",
        },
      },
    })

    render(<MonthlyInstallmentsView />)

    // It should still appear in the currentMonthStr view!
    expect(screen.getByText("PAGADO")).toBeInTheDocument()
    expect(screen.getByText(`${currentMonthStr}-15`)).toBeInTheDocument()
  })

  it("renders Modificar pago button for paid installments and opens PaymentModal in edit mode", () => {
    render(<MonthlyInstallmentsView />)

    const modifyBtn = screen.getByRole("button", { name: /Modificar pago/i })
    expect(modifyBtn).toBeInTheDocument()

    fireEvent.click(modifyBtn)

    expect(screen.getByRole("heading", { name: "Modificar Pago de Cuota" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Guardar Cambios/i })).toBeInTheDocument()
  })

  it("displays the concept / item prominently for standard obligations and P2P", () => {
    const p2pObl: Obligation = {
      id: "obl-p2p",
      categoryId: "cat-bancos",
      subcategory: "Carlos Soto",
      detail: "Zapatillas Deportivas Nike",
      totalAmountCents: toMoney(80000),
      totalInstallments: 2,
      currentInstallment: 1,
      installmentAmountCents: toMoney(40000),
      startDate: `${currentMonthStr}-01`,
      dueDay: 5,
      status: "PENDING",
      type: "P2P_DEBT",
      p2pMetadata: {
        role: "LENT_MY_CARD",
        thirdPartyName: "Carlos Soto",
        cardIssuer: "CMR Falabella",
        productDescription: "Zapatillas Deportivas Nike",
        baseInstallmentAmountCents: toMoney(40000),
        totalMonthlyChargeCents: toMoney(40000),
      },
      createdAt: "",
      updatedAt: "",
    }

    const p2pInst: Installment = {
      id: "inst-p2p-1",
      obligationId: "obl-p2p",
      installmentNumber: 1,
      dueDate: `${currentMonthStr}-05`,
      amountCents: toMoney(40000),
      status: "PENDING",
    }

    useObligationsStore.setState({
      obligations: {
        "obl-1": sampleObl,
        "obl-p2p": p2pObl,
      },
      installments: {
        "inst-p2p-1": p2pInst,
      },
    })

    render(<MonthlyInstallmentsView />)

    // Concept should be rendered in the table
    expect(screen.getByText("Concepto:")).toBeInTheDocument()
    expect(screen.getByText("Zapatillas Deportivas Nike")).toBeInTheDocument()
    // Subcategory (person)
    expect(screen.getByText("Carlos Soto")).toBeInTheDocument()
    // P2P badge with role
    expect(screen.getByText("💳 Presté Tarjeta (Cobro)")).toBeInTheDocument()
    // Action button should say "Cobrar" for LENT_MY_CARD instead of "Pagar"
    expect(screen.getByRole("button", { name: "Cobrar" })).toBeInTheDocument()
  })

  it("renders chronological day badges, cycle income, and cascading running balance", () => {
    useIncomeStore.setState({
      incomes: {
        "inc-1": {
          id: "inc-1",
          description: "Sueldo Mensual",
          amountCents: toMoney(500000),
          type: "FIXED",
          status: "REAL",
          period: currentMonthStr,
          createdAt: "",
        },
      },
      isLoaded: true,
    })

    render(<MonthlyInstallmentsView />)

    // Day badges
    expect(screen.getByText("Día 05")).toBeInTheDocument()
    expect(screen.getByText("Día 28")).toBeInTheDocument()

    // Summary headers
    expect(screen.getByText("Ingresos Ciclo:")).toBeInTheDocument()
    expect(screen.getByText("Saldo Proyectado:")).toBeInTheDocument()
    expect(screen.getByText("$500.000")).toBeInTheDocument() // Cycle Income

    // Net projected balance and final installment running balance: $500.000 - $200.000 = $300.000 (both in KPI and table)
    expect(screen.getAllByText("$300.000")).toHaveLength(2)

    // Cascading running balance in table for first installment: 500.000 - 100.000 = $400.000 remaining
    expect(screen.getByText("$400.000")).toBeInTheDocument()
  })
})


