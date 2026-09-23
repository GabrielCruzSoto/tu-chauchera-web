import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { ObligationsList } from "./ObligationsList"
import { useObligationsStore } from "../store/obligationsSlice"
import { toMoney } from "@/shared/types/money"
import type { Obligation } from "@/shared/types/domain"

describe("ObligationsList Component", () => {
  const sampleObligation: Obligation = {
    id: "obl-1",
    categoryId: "cat-bancos",
    subcategory: "Crédito Consumo",
    detail: "3 cuotas restantes",
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

  beforeEach(() => {
    vi.restoreAllMocks()
    useObligationsStore.setState({
      obligations: {
        "obl-1": sampleObligation,
      },
      installments: {},
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

  it("renders Clonar button in table view and opens clone modal when clicked", () => {
    render(<ObligationsList />)

    const cloneButtons = screen.getAllByRole("button", { name: /Clonar/i })
    expect(cloneButtons.length).toBeGreaterThanOrEqual(1)

    fireEvent.click(cloneButtons[0]!)

    expect(screen.getByText("Clonar Obligación Financiera")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Crédito Consumo (Copia)")).toBeInTheDocument()
  })

  it("renders Clonar button in grid view and opens clone modal when clicked", () => {
    render(<ObligationsList />)

    // Switch to grid view
    const gridViewBtn = screen.getByTitle("Vista en Tarjetas")
    fireEvent.click(gridViewBtn)

    const cloneButton = screen.getByRole("button", { name: /Clonar/i })
    expect(cloneButton).toBeInTheDocument()

    fireEvent.click(cloneButton)

    expect(screen.getByText("Clonar Obligación Financiera")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Crédito Consumo (Copia)")).toBeInTheDocument()
  })

  it("validates summary metrics calculation (Total Obligaciones, Compromiso Mensual Total, Saldo Total Deudas)", () => {
    // Adding recurring expense and P2P debt
    useObligationsStore.setState({
      obligations: {
        "obl-exp": {
          id: "obl-exp",
          categoryId: "cat-bancos",
          subcategory: "Internet Fibra Óptica QA",
          detail: "Plan hogar",
          totalAmountCents: toMoney(25000 * 12),
          totalInstallments: 12,
          currentInstallment: 1,
          installmentAmountCents: toMoney(25000),
          startDate: "2026-09-01",
          dueDay: 10,
          status: "PENDING",
          type: "EXPENSE",
          isRecurringIndefinite: true,
          createdAt: "",
          updatedAt: "",
        },
        "obl-p2p": {
          id: "obl-p2p",
          categoryId: "cat-bancos",
          subcategory: "Familiar QA",
          detail: "Refrigerador NoFrost QA",
          totalAmountCents: toMoney(150000),
          totalInstallments: 3,
          currentInstallment: 1,
          installmentAmountCents: toMoney(50000),
          startDate: "2026-09-01",
          dueDay: 10,
          status: "PENDING",
          type: "P2P_DEBT",
          p2pMetadata: {
            role: "LENT_MY_CARD",
            thirdPartyName: "Familiar QA",
            productDescription: "Refrigerador NoFrost QA",
            baseInstallmentAmountCents: toMoney(50000),
            totalMonthlyChargeCents: toMoney(50000),
          },
          createdAt: "",
          updatedAt: "",
        },
      },
      categories: {
        "cat-bancos": {
          id: "cat-bancos",
          name: "Servicios Básicos",
          color: "sky",
          createdAt: "",
          updatedAt: "",
        },
      },
      installments: {},
      isLoaded: true,
    })

    render(<ObligationsList />)

    // Total Obligaciones: 2 registradas
    expect(screen.getByText("Total Obligaciones")).toBeInTheDocument()
    expect(screen.getByText("registradas")).toBeInTheDocument()

    // Compromiso Mensual Total: 25.000 + 50.000 = $75.000 / mes
    expect(screen.getByText("Compromiso Mensual Total")).toBeInTheDocument()
    expect(screen.getByText("$75.000")).toBeInTheDocument()

    // Saldo Total Deudas: P2P Debt (150.000)
    expect(screen.getByText("Saldo Total Deudas")).toBeInTheDocument()
    const amounts150k = screen.getAllByText("$150.000")
    expect(amounts150k.length).toBeGreaterThanOrEqual(1)
  })

  it("filters obligations by search query and type filters in real time", () => {
    useObligationsStore.setState({
      obligations: {
        "obl-exp": {
          id: "obl-exp",
          categoryId: "cat-bancos",
          subcategory: "Internet Fibra Óptica QA",
          detail: "Plan hogar",
          totalAmountCents: toMoney(25000 * 12),
          totalInstallments: 12,
          currentInstallment: 1,
          installmentAmountCents: toMoney(25000),
          startDate: "2026-09-01",
          dueDay: 10,
          status: "PENDING",
          type: "EXPENSE",
          createdAt: "",
          updatedAt: "",
        },
        "obl-p2p": {
          id: "obl-p2p",
          categoryId: "cat-bancos",
          subcategory: "Familiar QA",
          detail: "Refrigerador NoFrost QA",
          totalAmountCents: toMoney(150000),
          totalInstallments: 3,
          currentInstallment: 1,
          installmentAmountCents: toMoney(50000),
          startDate: "2026-09-01",
          dueDay: 10,
          status: "PENDING",
          type: "P2P_DEBT",
          createdAt: "",
          updatedAt: "",
        },
      },
      categories: {
        "cat-bancos": {
          id: "cat-bancos",
          name: "Servicios",
          color: "sky",
          createdAt: "",
          updatedAt: "",
        },
      },
      installments: {},
      isLoaded: true,
    })

    render(<ObligationsList />)

    // Initial render displays both
    expect(screen.getByText("Internet Fibra Óptica QA")).toBeInTheDocument()
    expect(screen.getByText("Refrigerador NoFrost QA")).toBeInTheDocument()

    // Type query "Fibra"
    const searchInput = screen.getByPlaceholderText(/Buscar por nombre, detalle/i)
    fireEvent.change(searchInput, { target: { value: "Fibra" } })

    // Now only "Internet Fibra Óptica QA" should be displayed
    expect(screen.getByText("Internet Fibra Óptica QA")).toBeInTheDocument()
    expect(screen.queryByText("Refrigerador NoFrost QA")).not.toBeInTheDocument()

    // Clear search
    fireEvent.change(searchInput, { target: { value: "" } })
    expect(screen.getByText("Refrigerador NoFrost QA")).toBeInTheDocument()

    // Switch to Gastos filter (EXPENSE)
    const filterGastos = screen.getByRole("button", { name: /Gastos/i })
    fireEvent.click(filterGastos)
    expect(screen.getByText("Internet Fibra Óptica QA")).toBeInTheDocument()
    expect(screen.queryByText("Refrigerador NoFrost QA")).not.toBeInTheDocument()

    // Switch to Terceros filter (P2P_DEBT)
    const filterTerceros = screen.getByRole("button", { name: /Terceros/i })
    fireEvent.click(filterTerceros)
    expect(screen.queryByText("Internet Fibra Óptica QA")).not.toBeInTheDocument()
    expect(screen.getByText("Refrigerador NoFrost QA")).toBeInTheDocument()

    // Switch to Todos
    const filterTodos = screen.getByRole("button", { name: /^Todos/i })
    fireEvent.click(filterTodos)
    expect(screen.getByText("Internet Fibra Óptica QA")).toBeInTheDocument()
    expect(screen.getByText("Refrigerador NoFrost QA")).toBeInTheDocument()
  })

  it("deletes obligations and confirms idempotent return to empty state", () => {
    useObligationsStore.setState({
      obligations: {
        "obl-exp": {
          id: "obl-exp",
          categoryId: "cat-bancos",
          subcategory: "Internet Fibra Óptica QA",
          detail: "Plan hogar",
          totalAmountCents: toMoney(25000 * 12),
          totalInstallments: 12,
          currentInstallment: 1,
          installmentAmountCents: toMoney(25000),
          startDate: "2026-09-01",
          dueDay: 10,
          status: "PENDING",
          type: "EXPENSE",
          createdAt: "",
          updatedAt: "",
        },
      },
      categories: {
        "cat-bancos": {
          id: "cat-bancos",
          name: "Servicios",
          color: "sky",
          createdAt: "",
          updatedAt: "",
        },
      },
      installments: {},
      isLoaded: true,
    })

    render(<ObligationsList />)
    expect(screen.getByText("Internet Fibra Óptica QA")).toBeInTheDocument()

    // Click delete
    const deleteBtn = screen.getByTitle("Eliminar obligación")
    fireEvent.click(deleteBtn)

    // Verify empty state
    expect(screen.getByText("No hay obligaciones registradas")).toBeInTheDocument()
    expect(screen.getByText("registradas")).toBeInTheDocument()
    expect(screen.getByText("Total Obligaciones")).toBeInTheDocument()
  })
})

