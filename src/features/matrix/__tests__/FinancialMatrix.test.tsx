import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach } from "vitest"
import { FinancialMatrix } from "../components/FinancialMatrix"
import { useObligationsStore } from "@/features/obligations/store/obligationsSlice"
import { useIncomeStore } from "@/features/income/store/incomeSlice"
import { toMoney } from "@/shared/types/money"

describe("FinancialMatrix Component & Responsive Toggle", () => {
  beforeEach(() => {
    useObligationsStore.setState({
      categories: {
        "cat-1": { id: "cat-1", name: "Créditos", color: "rose", createdAt: "", updatedAt: "" },
        "cat-2": { id: "cat-2", name: "Servicios", color: "sky", createdAt: "", updatedAt: "" },
      },
      obligations: {
        "obl-1": {
          id: "obl-1",
          categoryId: "cat-1",
          subcategory: "Banco",
          detail: "Cuota",
          totalAmountCents: toMoney(1200000),
          totalInstallments: 12,
          currentInstallment: 1,
          installmentAmountCents: toMoney(100000),
          startDate: "2026-01-01",
          dueDay: 5,
          status: "PENDING",
          createdAt: "",
          updatedAt: "",
        },
      },
      installments: {
        "inst-1": {
          id: "inst-1",
          obligationId: "obl-1",
          installmentNumber: 1,
          amountCents: toMoney(100000),
          dueDate: "2026-01-05",
          status: "PENDING",
        },
      },
      isLoaded: true,
    })

    useIncomeStore.setState({
      incomes: {
        "inc-1": {
          id: "inc-1",
          description: "Sueldo",
          amountCents: toMoney(1500000),
          type: "FIXED",
          period: "2026-01",
          createdAt: "",
        },
      },
      isLoaded: true,
    })
  })

  it("renders table view by default with sticky category headers and totals", () => {
    render(<FinancialMatrix />)

    expect(screen.getByTestId("matrix-table-view")).toBeInTheDocument()
    expect(screen.queryByTestId("matrix-cards-view")).not.toBeInTheDocument()
    expect(screen.getByText("Matriz de Consolidación Financiera")).toBeInTheDocument()
    expect(screen.getByText("Total Egresos")).toBeInTheDocument()
    expect(screen.getAllByText("Total Ingresos")[0]).toBeInTheDocument()
    expect(screen.getByText("Capacidad de Ahorro / Margen")).toBeInTheDocument()
  })

  it("switches to Deudas Terceros view when clicking the P2P tab", () => {
    render(<FinancialMatrix />)
    const p2pTabBtn = screen.getByRole("button", { name: /Deudas Terceros/i })
    fireEvent.click(p2pTabBtn)

    expect(screen.getByText("Consolidación de Cuentas y Tarjetas con Terceros")).toBeInTheDocument()
  })

  it("toggles between table view and cards view when clicking toggle buttons", () => {
    render(<FinancialMatrix />)

    const cardsToggleBtn = screen.getByRole("button", { name: /Tarjetas/i })
    fireEvent.click(cardsToggleBtn)

    expect(screen.getByTestId("matrix-cards-view")).toBeInTheDocument()
    expect(screen.queryByTestId("matrix-table-view")).not.toBeInTheDocument()
    expect(screen.getByTestId("matrix-card-cat-1")).toBeInTheDocument()
    expect(screen.getByTestId("matrix-card-cat-2")).toBeInTheDocument()

    // Switch back to table
    const tableToggleBtn = screen.getByRole("button", { name: /Tabla/i })
    fireEvent.click(tableToggleBtn)

    expect(screen.getByTestId("matrix-table-view")).toBeInTheDocument()
    expect(screen.queryByTestId("matrix-cards-view")).not.toBeInTheDocument()
  })

  it("navigates periods when clicking previous and next buttons", () => {
    render(<FinancialMatrix />)

    const nextBtn = screen.getByRole("button", { name: /Mes siguiente/i })
    fireEvent.click(nextBtn)

    // Verify matrix still renders properly after period shift
    expect(screen.getByTestId("matrix-table-view")).toBeInTheDocument()
  })

  it("shows subcategories breakdown in cards view", () => {
    render(<FinancialMatrix />)

    const cardsToggleBtn = screen.getByRole("button", { name: /Tarjetas/i })
    fireEvent.click(cardsToggleBtn)

    expect(screen.getByTestId("matrix-card-subcats-cat-1")).toBeInTheDocument()
    expect(screen.getByText("Banco")).toBeInTheDocument()
  })

  it("expands category in table view when clicked to show subcategory rows", () => {
    render(<FinancialMatrix />)

    // Subcategory row initially not rendered
    expect(screen.queryByTestId("matrix-subcat-row-cat-1-banco")).not.toBeInTheDocument()

    // Click category row / expand button
    const expandBtn = screen.getByRole("button", { name: /Expandir Créditos/i })
    fireEvent.click(expandBtn)

    expect(screen.getByTestId("matrix-subcat-row-cat-1-banco")).toBeInTheDocument()
    expect(screen.getByText("Banco")).toBeInTheDocument()
  })

  it("expands and collapses all subcategories using toggle all button", () => {
    render(<FinancialMatrix />)

    const toggleAllBtn = screen.getByRole("button", { name: /Desglosar subcategorías/i })
    fireEvent.click(toggleAllBtn)

    expect(screen.getByTestId("matrix-subcat-row-cat-1-banco")).toBeInTheDocument()

    // Click again to collapse
    const collapseAllBtn = screen.getByRole("button", { name: /Contraer subcategorías/i })
    fireEvent.click(collapseAllBtn)

    expect(screen.queryByTestId("matrix-subcat-row-cat-1-banco")).not.toBeInTheDocument()
  })
})
