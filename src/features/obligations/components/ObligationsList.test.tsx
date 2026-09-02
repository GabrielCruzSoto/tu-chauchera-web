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
})
