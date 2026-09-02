import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { ObligationFormModal } from "./ObligationFormModal"
import { useObligationsStore } from "../store/obligationsSlice"
import { toMoney } from "@/shared/types/money"
import type { Obligation } from "@/shared/types/domain"

describe("ObligationFormModal Integration", () => {
  beforeEach(() => {
    useObligationsStore.setState({
      obligations: {},
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

  it("allows quick creation of category and selects it without resetting form", () => {
    const onClose = vi.fn()
    render(<ObligationFormModal onClose={onClose} />)

    // Partially fill out the form in DEBT mode (default)
    const subcategoryInput = screen.getByPlaceholderText(/Banco Estado/i)
    fireEvent.change(subcategoryInput, { target: { value: "Seguro Dental Colectivo" } })

    const totalAmountInput = screen.getByPlaceholderText("Ej. 12000000")
    fireEvent.change(totalAmountInput, { target: { value: "360000" } })

    // Open category creation via dropdown option
    const select = screen.getByRole("combobox")
    fireEvent.change(select, { target: { value: "__NEW_CATEGORY__" } })

    // Category modal should be visible
    expect(screen.getByText("Configuración de Categorías")).toBeInTheDocument()

    // Fill in new category
    const catNameInput = screen.getByPlaceholderText(/Nombre de categoría/i)
    fireEvent.change(catNameInput, { target: { value: "Salud & Dental" } })

    const roseColor = screen.getByTitle("Rosa")
    fireEvent.click(roseColor)

    const addCatBtn = screen.getByRole("button", { name: "+ Agregar Categoría" })
    fireEvent.click(addCatBtn)

    // Check modal closed and category is selected in the form
    expect(screen.queryByText("Configuración de Categorías")).not.toBeInTheDocument()

    // Verify subcategory input is preserved
    expect(subcategoryInput).toHaveValue("Seguro Dental Colectivo")
    expect(totalAmountInput).toHaveValue(360000)

    // Submit obligation form
    const submitBtn = screen.getByRole("button", { name: "Guardar Obligación" })
    fireEvent.click(submitBtn)

    const state = useObligationsStore.getState()
    const addedObl = Object.values(state.obligations)[0]
    expect(addedObl).toBeDefined()
    expect(addedObl?.type).toBe("DEBT")
    expect(addedObl?.subcategory).toBe("Seguro Dental Colectivo")

    // Category id belongs to the newly added category
    const newCategory = Object.values(state.categories).find((c) => c.name === "Salud & Dental")
    expect(addedObl?.categoryId).toBe(newCategory?.id)
    expect(onClose).toHaveBeenCalled()
  })

  it("creates a Recurring Expense in EXPENSE tab", () => {
    const onClose = vi.fn()
    render(<ObligationFormModal onClose={onClose} />)

    // Click Gasto Recurrente tab
    const expenseTab = screen.getByRole("button", { name: /Gasto Recurrente/i })
    fireEvent.click(expenseTab)

    const providerInput = screen.getByPlaceholderText(/Enel, VTR, Netflix/i)
    fireEvent.change(providerInput, { target: { value: "VTR Internet Fibra" } })

    const monthlyAmountInput = screen.getByPlaceholderText("Ej. 29990")
    fireEvent.change(monthlyAmountInput, { target: { value: "29990" } })

    const submitBtn = screen.getByRole("button", { name: "Guardar Obligación" })
    fireEvent.click(submitBtn)

    const state = useObligationsStore.getState()
    const addedObl = Object.values(state.obligations)[0]
    expect(addedObl).toBeDefined()
    expect(addedObl?.type).toBe("EXPENSE")
    expect(addedObl?.subcategory).toBe("VTR Internet Fibra")
    expect(addedObl?.installmentAmountCents).toBe(29990)
    expect(addedObl?.isRecurringIndefinite).toBe(true)
    expect(onClose).toHaveBeenCalled()
  })

  it("creates a P2P Debt with card surcharge calculation in Entre Personas tab", () => {
    const onClose = vi.fn()
    render(<ObligationFormModal onClose={onClose} />)

    // Click Entre Personas tab
    const p2pTab = screen.getByRole("button", { name: /Entre Personas/i })
    fireEvent.click(p2pTab)

    // Fill Person Name
    const personInput = screen.getByPlaceholderText(/Juan Pérez/i)
    fireEvent.change(personInput, { target: { value: "Carlos Soto" } })

    // Fill Card Issuer
    const cardInput = screen.getByPlaceholderText(/CMR Falabella, Santander/i)
    fireEvent.change(cardInput, { target: { value: "CMR Falabella" } })

    // Fill Product
    const prodInput = screen.getByPlaceholderText(/Smart TV Samsung/i)
    fireEvent.change(prodInput, { target: { value: "PlayStation 5" } })

    // Fill Base installment
    const amountInput = screen.getByPlaceholderText(/209998|45000/i)
    fireEvent.change(amountInput, { target: { value: "50000" } })

    // Check maintenance fee
    const maintenanceCheckbox = screen.getByLabelText(/Traspasar Mantención/i)
    fireEvent.click(maintenanceCheckbox)

    const submitBtn = screen.getByRole("button", { name: "Guardar Obligación" })
    fireEvent.click(submitBtn)

    const state = useObligationsStore.getState()
    const addedObl = Object.values(state.obligations)[0]
    expect(addedObl).toBeDefined()
    expect(addedObl?.type).toBe("P2P_DEBT")
    expect(addedObl?.subcategory).toBe("Carlos Soto")
    expect(addedObl?.p2pMetadata?.thirdPartyName).toBe("Carlos Soto")
    expect(addedObl?.p2pMetadata?.cardIssuer).toBe("CMR Falabella")
    // Base 50000 + maintenance 3500 = 53500
    expect(addedObl?.installmentAmountCents).toBe(53500)
    expect(onClose).toHaveBeenCalled()
  })

  it("populates and updates an existing obligation when obligationToEdit is provided", () => {
    const onClose = vi.fn()
    const existingObl = {
      id: "obl-to-edit",
      type: "DEBT" as const,
      categoryId: "cat-bancos",
      subcategory: "Banco Chile Crédito",
      detail: "Cuota original",
      totalAmountCents: toMoney(1200000),
      totalInstallments: 12,
      currentInstallment: 1,
      installmentAmountCents: toMoney(100000),
      startDate: "2024-01-10",
      dueDay: 10,
      status: "PENDING" as const,
      createdAt: "",
      updatedAt: "",
    }

    useObligationsStore.setState({
      obligations: { [existingObl.id]: existingObl },
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

    render(<ObligationFormModal obligationToEdit={existingObl} onClose={onClose} />)

    expect(screen.getByText("Editar Obligación Financiera")).toBeInTheDocument()

    const subcategoryInput = screen.getByDisplayValue("Banco Chile Crédito")
    fireEvent.change(subcategoryInput, { target: { value: "Banco Chile Crédito Modificado" } })

    const saveChangesBtn = screen.getByRole("button", { name: "Guardar Cambios" })
    fireEvent.click(saveChangesBtn)

    const state = useObligationsStore.getState()
    expect(state.obligations["obl-to-edit"]?.subcategory).toBe("Banco Chile Crédito Modificado")
    expect(onClose).toHaveBeenCalled()
  })

  it("automatically creates/selects 'Deudas con terceros' category when switching to Entre Personas tab", () => {
    const onClose = vi.fn()
    render(<ObligationFormModal onClose={onClose} />)

    // Initially in DEBT mode, category is Bancos & Créditos
    const select = screen.getByRole("combobox")
    expect(select).toHaveValue("cat-bancos")

    // Click Entre Personas tab
    const p2pTab = screen.getByRole("button", { name: /Entre Personas/i })
    fireEvent.click(p2pTab)

    // Category should now be automatically set to "Deudas con terceros"
    const state = useObligationsStore.getState()
    const tercerosCat = Object.values(state.categories).find((c) =>
      c.name.toLowerCase().includes("deudas con terceros")
    )
    expect(tercerosCat).toBeDefined()
    expect(select).toHaveValue(tercerosCat?.id)
  })

  it("pre-populates form when obligationToClone is provided and creates a new obligation", () => {
    const onClose = vi.fn()
    const existingObl: Obligation = {
      id: "obl-to-clone",
      categoryId: "cat-bancos",
      subcategory: "Crédito Scotiabank",
      detail: "Cuota 10",
      totalAmountCents: toMoney(1200000),
      totalInstallments: 12,
      currentInstallment: 4,
      installmentAmountCents: toMoney(100000),
      startDate: "2024-03-01",
      dueDay: 5,
      status: "PENDING",
      type: "DEBT",
      createdAt: "",
      updatedAt: "",
    }

    render(<ObligationFormModal obligationToClone={existingObl} onClose={onClose} />)

    expect(screen.getByText("Clonar Obligación Financiera")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Crédito Scotiabank (Copia)")).toBeInTheDocument()

    const cloneSubmitBtn = screen.getByRole("button", { name: "Clonar y Crear Obligación" })
    fireEvent.click(cloneSubmitBtn)

    const state = useObligationsStore.getState()
    const clonedObl = Object.values(state.obligations).find(
      (o) => o.subcategory === "Crédito Scotiabank (Copia)"
    )
    expect(clonedObl).toBeDefined()
    expect(clonedObl?.id).not.toBe("obl-to-clone")
    expect(clonedObl?.installmentAmountCents).toBe(toMoney(100000))
    expect(onClose).toHaveBeenCalled()
  })
})
