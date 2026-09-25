import React from "react"
import { render, screen, fireEvent, within } from "@testing-library/react"
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

  it("expands and collapses all subcategories using toggle all button with aria-expanded", () => {
    render(<FinancialMatrix />)

    const toggleAllBtn = screen.getByRole("button", { name: /Desglosar subcategorías/i })
    expect(toggleAllBtn).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(toggleAllBtn)

    expect(screen.getByTestId("matrix-subcat-row-cat-1-banco")).toBeInTheDocument()
    expect(toggleAllBtn).toHaveAttribute("aria-expanded", "true")

    // Click again to collapse
    const collapseAllBtn = screen.getByRole("button", { name: /Contraer subcategorías/i })
    fireEvent.click(collapseAllBtn)

    expect(screen.queryByTestId("matrix-subcat-row-cat-1-banco")).not.toBeInTheDocument()
    expect(collapseAllBtn).toHaveAttribute("aria-expanded", "false")
  })

  it("renders tabular numeric cells with right alignment and monospace font", () => {
    render(<FinancialMatrix />)

    // Expand category to check row data cells
    const expandBtn = screen.getByRole("button", { name: /Expandir Créditos/i })
    expect(expandBtn).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(expandBtn)
    expect(expandBtn).toHaveAttribute("aria-expanded", "true")

    // Check table headers have text-right and font-mono / tabular-nums
    const tableHeaders = screen.getAllByRole("columnheader")
    // The first header is the category name (sticky, left-aligned)
    const categoryColHeader = tableHeaders[0]
    expect(categoryColHeader).toHaveClass("text-left")
    expect(categoryColHeader).toHaveClass("sticky")
    expect(categoryColHeader).toHaveClass("border-r")

    // Subsequent period headers should have text-right font-mono tabular-nums
    const periodHeader = tableHeaders[1]
    expect(periodHeader).toHaveClass("text-right")
    expect(periodHeader).toHaveClass("font-mono")
    expect(periodHeader).toHaveClass("tabular-nums")

    // Total header
    const totalHeader = tableHeaders[tableHeaders.length - 1]
    expect(totalHeader).toHaveClass("text-right")
    expect(totalHeader).toHaveClass("font-mono")
    expect(totalHeader).toHaveClass("tabular-nums")
  })

  it("opens item detail modal when clicking a subcategory item or detail button in the matrix table", () => {
    render(<FinancialMatrix />)

    // Expand category
    const expandBtn = screen.getByRole("button", { name: /Expandir Créditos/i })
    fireEvent.click(expandBtn)

    // Subcategory row should be visible
    const subcatRow = screen.getByTestId("matrix-subcat-row-cat-1-banco")
    expect(subcatRow).toBeInTheDocument()

    // Click the subcategory item / detail button
    const detailBtn = screen.getByRole("button", { name: /Ver detalle de Banco/i })
    fireEvent.click(detailBtn)

    // Modal dialog should appear with item details
    const dialog = screen.getByRole("dialog")
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByRole("heading", { name: "Banco" })).toBeInTheDocument()
    expect(within(dialog).getByText("Créditos")).toBeInTheDocument()
    expect(within(dialog).getByText("Total en Horizonte")).toBeInTheDocument()

    // Close modal
    const closeBtn = screen.getByRole("button", { name: /Cerrar detalle/i })
    fireEvent.click(closeBtn)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("opens item detail modal when clicking an item in Deudas Terceros (P2P) view", () => {
    // Add a P2P obligation
    useObligationsStore.setState((prev) => ({
      ...prev,
      obligations: {
        ...prev.obligations,
        "obl-p2p": {
          id: "obl-p2p",
          categoryId: "cat-1",
          subcategory: "Isis Paris",
          detail: "Zapatos",
          totalAmountCents: toMoney(500000),
          totalInstallments: 3,
          currentInstallment: 1,
          installmentAmountCents: toMoney(100000),
          startDate: "2026-01-01",
          dueDay: 10,
          status: "PENDING",
          type: "P2P_DEBT",
          p2pMetadata: {
            role: "LENT_MY_CARD",
            thirdPartyName: "Isis Paris",
            cardIssuer: "Banco Falabella",
            productDescription: "Zapatos",
            baseInstallmentAmountCents: toMoney(100000),
            totalMonthlyChargeCents: toMoney(100000),
          },
          createdAt: "",
          updatedAt: "",
        },
      },
    }))

    render(<FinancialMatrix />)

    // Go to P2P tab
    const p2pTabBtn = screen.getByRole("button", { name: /Deudas Terceros/i })
    fireEvent.click(p2pTabBtn)

    // Click on the P2P person detail button
    const detailBtn = screen.getByRole("button", { name: /Ver detalle de Isis Paris/i })
    fireEvent.click(detailBtn)

    // Verify modal is open with P2P details
    const dialog = screen.getByRole("dialog")
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByRole("heading", { name: "Isis Paris" })).toBeInTheDocument()
    expect(within(dialog).getByText(/Presté mi tarjeta/i)).toBeInTheDocument()
    expect(within(dialog).getByText(/Banco Falabella/i)).toBeInTheDocument()
  })
})

