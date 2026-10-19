import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import React from "react"
import { PaymentWindowsView } from "../PaymentWindowsView"
import { useObligationsStore } from "@/features/obligations/store/obligationsSlice"
import { useIncomeStore } from "@/features/income/store/incomeSlice"

describe("PaymentWindowsView", () => {
  it("renders financial health KPIs, payment windows, and debt strategies", () => {
    // Setup test state
    useIncomeStore.setState({
      incomes: {
        "inc-1": {
          id: "inc-1",
          description: "Sueldo",
          amountCents: 100000000, // $1.000.000
          type: "FIXED",
          period: "2026-10",
          createdAt: "2026-10-01",
        },
      },
      isLoaded: true,
    })

    useObligationsStore.setState({
      obligations: {
        "obl-1": {
          id: "obl-1",
          type: "DEBT",
          categoryId: "cat-1",
          subcategory: "Crédito Banco",
          detail: "Crédito cuota 1",
          totalAmountCents: 200000000,
          totalInstallments: 10,
          currentInstallment: 1,
          installmentAmountCents: 20000000, // $200.000 (20% burden)
          startDate: "2026-10-05",
          dueDay: 5,
          status: "PENDING",
          createdAt: "2026-10-01",
          updatedAt: "2026-10-01",
        },
      },
      installments: {
        "inst-1": {
          id: "inst-1",
          obligationId: "obl-1",
          installmentNumber: 1,
          dueDate: "2026-10-05",
          amountCents: 20000000,
          status: "PENDING",
          period: "2026-10",
        },
      },
      categories: {},
      isLoaded: true,
    })

    render(<PaymentWindowsView currentPeriod="2026-10" />)

    // Check KPIs
    expect(screen.getByText(/Dinero Comprometido al Cobrar/i)).toBeInTheDocument()
    expect(screen.getByText(/Carga Financiera/i)).toBeInTheDocument()
    expect(screen.getByText(/Saludable \(<30%\)/i)).toBeInTheDocument()
    expect(screen.getByText("20%")).toBeInTheDocument()

    // Check Windows & Prioritization elements
    expect(screen.getByText(/Ventana Sueldo \/ Fin e Inicio de Mes/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Crédito Banco/i).length).toBeGreaterThanOrEqual(1)

    // Check Debt Prioritization buttons
    const snowballBtn = screen.getByRole("button", { name: /Bola de Nieve/i })
    expect(snowballBtn).toBeInTheDocument()
    fireEvent.click(snowballBtn)
    expect(screen.getByText(/Foco Principal/i)).toBeInTheDocument()
  })
})
