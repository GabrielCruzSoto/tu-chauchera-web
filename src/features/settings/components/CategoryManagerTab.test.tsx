import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { CategoryManagerTab } from "./CategoryManagerTab"
import { useObligationsStore } from "@/features/obligations/store/obligationsSlice"

import type { Money } from "@/shared/types/domain"

describe("CategoryManagerTab", () => {
  beforeEach(() => {
    // Reset categories and obligations to initial state
    useObligationsStore.setState({
      categories: {
        "cat-bancos": {
          id: "cat-bancos",
          name: "Bancos & Créditos",
          color: "emerald",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        "cat-servicios": {
          id: "cat-servicios",
          name: "Servicios Básicos",
          color: "sky",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
      obligations: {
        "ob-1": {
          id: "ob-1",
          categoryId: "cat-bancos",
          subcategory: "Banco Estado",
          detail: "Crédito Consumo",
          type: "DEBT",
          totalAmountCents: 500000 as Money,
          totalInstallments: 12,
          currentInstallment: 1,
          installmentAmountCents: 45000 as Money,
          startDate: "2026-01-01",
          dueDay: 5,
          status: "PENDING",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    })
  })

  it("renders existing categories and their usage count", () => {
    render(<CategoryManagerTab />)

    expect(screen.getByText("Bancos & Créditos")).toBeInTheDocument()
    expect(screen.getByText("Servicios Básicos")).toBeInTheDocument()
    expect(screen.getByText("1 obligación asociada")).toBeInTheDocument()
    expect(screen.getByText("0 obligaciones asociadas")).toBeInTheDocument()
  })

  it("creates a new category when form is submitted", () => {
    render(<CategoryManagerTab />)

    const input = screen.getByPlaceholderText(/ej\. gimnasio/i)
    fireEvent.change(input, { target: { value: "Streaming & Juegos" } })

    const submitBtn = screen.getByRole("button", { name: /agregar/i })
    fireEvent.click(submitBtn)

    expect(screen.getByText("Streaming & Juegos")).toBeInTheDocument()
    expect(screen.getByText(/creada exitosamente/i)).toBeInTheDocument()
  })

  it("blocks deletion of a category that has active obligations", () => {
    render(<CategoryManagerTab />)

    const categoryRows = screen.getByTestId("category-row-cat-bancos")
    const deleteBtn = categoryRows.querySelector("button:last-child")!

    fireEvent.click(deleteBtn)

    expect(
      screen.getByText(/no se puede eliminar la categoría.*porque está en uso/i)
    ).toBeInTheDocument()
    // Bancos should still exist in store
    expect(useObligationsStore.getState().categories["cat-bancos"]).toBeDefined()
  })

  it("allows deletion of a category with 0 obligations", () => {
    render(<CategoryManagerTab />)

    const categoryRow = screen.getByTestId("category-row-cat-servicios")
    const deleteBtn = categoryRow.querySelector("button:last-child")!

    fireEvent.click(deleteBtn)

    expect(screen.getByText(/eliminada exitosamente/i)).toBeInTheDocument()
    expect(useObligationsStore.getState().categories["cat-servicios"]).toBeUndefined()
  })
})
