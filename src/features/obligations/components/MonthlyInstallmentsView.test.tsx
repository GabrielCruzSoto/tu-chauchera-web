import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { MonthlyInstallmentsView } from "./MonthlyInstallmentsView"
import { useObligationsStore } from "../store/obligationsSlice"
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
    vi.restoreAllMocks()
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
    expect(screen.getByText("⚠️ VENCIDA")).toBeInTheDocument()
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
})
