import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { CategorySettingsModal } from "./CategorySettingsModal"
import { useObligationsStore } from "../store/obligationsSlice"
import { toMoney } from "@/shared/types/money"

describe("CategorySettingsModal", () => {
  beforeEach(() => {
    useObligationsStore.setState({
      obligations: {
        "obl-1": {
          id: "obl-1",
          categoryId: "cat-in-use",
          subcategory: "Crédito Automotriz",
          detail: "Auto",
          totalAmountCents: toMoney(5000000),
          totalInstallments: 24,
          currentInstallment: 1,
          installmentAmountCents: toMoney(250000),
          startDate: "2026-01-01",
          dueDay: 5,
          status: "PENDING",
          createdAt: "",
          updatedAt: "",
        },
      },
      installments: {},
      categories: {
        "cat-in-use": {
          id: "cat-in-use",
          name: "Automotriz",
          color: "cyan",
          createdAt: "",
          updatedAt: "",
        },
        "cat-free": {
          id: "cat-free",
          name: "Ocio",
          color: "purple",
          createdAt: "",
          updatedAt: "",
        },
      },
      isLoaded: true,
    })
  })

  it("renders list of categories and their usage count", () => {
    render(<CategorySettingsModal onClose={vi.fn()} />)

    expect(screen.getByText("Automotriz")).toBeInTheDocument()
    expect(screen.getByText("Ocio")).toBeInTheDocument()
    expect(screen.getByText("1 obligación activa")).toBeInTheDocument()
    expect(screen.getByText("0 obligaciones activas")).toBeInTheDocument()
  })

  it("rejects empty category name submission with validation error", () => {
    render(<CategorySettingsModal onClose={vi.fn()} />)

    const addButton = screen.getByRole("button", { name: "+ Agregar Categoría" })
    fireEvent.click(addButton)

    expect(
      screen.getByText("El nombre de la categoría no puede estar vacío.")
    ).toBeInTheDocument()
  })

  it("creates a new category when name and color are provided", () => {
    const onCategoryCreated = vi.fn()
    render(
      <CategorySettingsModal onClose={vi.fn()} onCategoryCreated={onCategoryCreated} />
    )

    const input = screen.getByPlaceholderText(/Nombre de categoría/i)
    fireEvent.change(input, { target: { value: "Seguros Médicos" } })

    const roseColorBtn = screen.getByTitle("Rosa")
    fireEvent.click(roseColorBtn)

    const addButton = screen.getByRole("button", { name: "+ Agregar Categoría" })
    fireEvent.click(addButton)

    const state = useObligationsStore.getState()
    const addedCat = Object.values(state.categories).find((c) => c.name === "Seguros Médicos")
    expect(addedCat).toBeDefined()
    expect(addedCat?.color).toBe("rose")
    expect(onCategoryCreated).toHaveBeenCalledWith(addedCat)
  })

  it("allows editing an existing category", () => {
    render(<CategorySettingsModal onClose={vi.fn()} />)

    const editButtons = screen.getAllByRole("button", { name: "Editar" })
    fireEvent.click(editButtons[1]!) // Ocio category

    const input = screen.getByDisplayValue("Ocio")
    fireEvent.change(input, { target: { value: "Entretenimiento & Ocio" } })

    const saveButton = screen.getByRole("button", { name: "Guardar Cambios" })
    fireEvent.click(saveButton)

    const state = useObligationsStore.getState()
    expect(state.categories["cat-free"]?.name).toBe("Entretenimiento & Ocio")
  })

  it("blocks deletion of categories assigned to active obligations", () => {
    render(<CategorySettingsModal onClose={vi.fn()} />)

    const deleteButtons = screen.getAllByRole("button", { name: "Eliminar" })
    fireEvent.click(deleteButtons[0]!) // cat-in-use

    expect(
      screen.getByText(/No se puede eliminar la categoría porque está en uso/i)
    ).toBeInTheDocument()

    const state = useObligationsStore.getState()
    expect(state.categories["cat-in-use"]).toBeDefined()
  })

  it("allows deletion of categories not in use", () => {
    render(<CategorySettingsModal onClose={vi.fn()} />)

    const deleteButtons = screen.getAllByRole("button", { name: "Eliminar" })
    fireEvent.click(deleteButtons[1]!) // cat-free

    const state = useObligationsStore.getState()
    expect(state.categories["cat-free"]).toBeUndefined()
  })
})
