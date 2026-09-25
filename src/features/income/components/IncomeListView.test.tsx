import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { IncomeListView } from "./IncomeListView"
import { useIncomeStore } from "../store/incomeSlice"
import { toMoney } from "@/shared/types/money"
import type { Income } from "@/shared/types/domain"

describe("IncomeListView Component & Integration Flow", () => {
  const currentMonthStr = new Date().toISOString().slice(0, 7)
  const [yearNum, monthNum] = currentMonthStr.split("-").map(Number)
  const nextMonthDate = new Date(yearNum!, monthNum!, 1)
  const nextMonthStr = nextMonthDate.toISOString().slice(0, 7)

  beforeEach(() => {
    vi.restoreAllMocks()
    useIncomeStore.setState({
      incomes: {},
      isLoaded: true,
    })
  })

  it("1. Precondición y Estado Vacío: Renderiza estado inicial y título de período", () => {
    render(<IncomeListView />)

    expect(screen.getByText(new RegExp(`Ingresos ${currentMonthStr}`, "i"))).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`No hay ingresos registrados para ${currentMonthStr}`, "i"))).toBeInTheDocument()
    expect(screen.getAllByText("$0").length).toBeGreaterThanOrEqual(1)
  })

  it("2. Prueba de Creación (Happy Path): Agrega ingreso fijo recurrente y actualiza Total Ingresos", () => {
    render(<IncomeListView />)

    // Abrir modal
    const addButtons = screen.getAllByRole("button", { name: /Agregar Ingreso/i })
    fireEvent.click(addButtons[0]!)

    expect(screen.getByRole("heading", { name: "Registrar Ingreso" })).toBeInTheDocument()

    // Completar formulario
    const descInput = screen.getByPlaceholderText(/Ej\. Sueldo Principal/i)
    const amountInput = screen.getByPlaceholderText(/Ej\. 1500000/i)
    const repeatCheckbox = screen.getByLabelText(/Repetir automáticamente en meses sucesivos/i)

    fireEvent.change(descInput, { target: { value: "Sueldo Principal QA" } })
    fireEvent.change(amountInput, { target: { value: "1500000" } })
    fireEvent.click(repeatCheckbox)

    // Submit
    const saveBtn = screen.getByRole("button", { name: "Guardar Ingreso" })
    fireEvent.click(saveBtn)

    // Aserción: modal cerrado, ingreso en lista y Total Ingresos = $1.500.000
    expect(screen.queryByRole("heading", { name: "Registrar Ingreso" })).not.toBeInTheDocument()
    expect(screen.getByText(new RegExp(`Sueldo Principal QA \\(${currentMonthStr}\\)`, "i"))).toBeInTheDocument()
    // Aparece tanto en el badge de resumen como en la celda de la tabla
    const amounts = screen.getAllByText("$1.500.000")
    expect(amounts.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("Total Ingresos")).toBeInTheDocument()
  })

  it("3. Prueba de Validación y Casos Borde: Previene submit con descripción vacía o monto <= 0 y cancela", () => {
    render(<IncomeListView />)

    const addButtons = screen.getAllByRole("button", { name: /Agregar Ingreso/i })
    fireEvent.click(addButtons[0]!)

    const descInput = screen.getByPlaceholderText(/Ej\. Sueldo Principal/i)
    const amountInput = screen.getByPlaceholderText(/Ej\. 1500000/i)
    const saveBtn = screen.getByRole("button", { name: "Guardar Ingreso" })

    // Caso: Campos vacíos
    fireEvent.change(descInput, { target: { value: "   " } })
    fireEvent.change(amountInput, { target: { value: "0" } })
    fireEvent.click(saveBtn)

    // Modal sigue abierto y store sigue vacío
    expect(screen.getByRole("heading", { name: "Registrar Ingreso" })).toBeInTheDocument()
    expect(Object.keys(useIncomeStore.getState().incomes)).toHaveLength(0)

    // Cancelar modal
    const cancelBtn = screen.getByRole("button", { name: "Cancelar" })
    fireEvent.click(cancelBtn)
    expect(screen.queryByRole("heading", { name: "Registrar Ingreso" })).not.toBeInTheDocument()
  })

  it("4. Navegación Temporal y Proyección: Proyecta ingresos recurrentes en mes siguiente", () => {
    // Inicializar con un ingreso recurrente de 12 meses
    useIncomeStore.getState().addRecurringIncome(
      {
        description: "Sueldo Principal QA",
        amountCents: toMoney(1500000),
        type: "FIXED",
        period: currentMonthStr,
      },
      12
    )

    render(<IncomeListView />)

    // Validar mes actual
    expect(screen.getAllByText("$1.500.000").length).toBeGreaterThanOrEqual(1)

    // Navegar al mes siguiente
    const nextBtn = screen.getByRole("button", { name: "Mes siguiente" })
    fireEvent.click(nextBtn)

    // Aserción de proyección automática
    expect(screen.getByText(new RegExp(`Ingresos ${nextMonthStr}`, "i"))).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`Sueldo Principal QA \\(${nextMonthStr}\\)`, "i"))).toBeInTheDocument()
    expect(screen.getAllByText("$1.500.000").length).toBeGreaterThanOrEqual(1)

    // Regresar al mes anterior
    const prevBtn = screen.getByRole("button", { name: "Mes anterior" })
    fireEvent.click(prevBtn)
    expect(screen.getByText(new RegExp(`Ingresos ${currentMonthStr}`, "i"))).toBeInTheDocument()
  })

  it("5. Limpieza e Idempotencia: Permite eliminar el ingreso creado", () => {
    const inc = useIncomeStore.getState().addIncome({
      description: "Sueldo Temporal",
      amountCents: toMoney(1500000),
      type: "FIXED",
      period: currentMonthStr,
    })

    render(<IncomeListView />)
    expect(screen.getByText("Sueldo Temporal")).toBeInTheDocument()

    // Eliminar
    const deleteBtn = screen.getByRole("button", { name: "Eliminar Sueldo Temporal" })
    fireEvent.click(deleteBtn)

    // Bóveda limpia
    expect(screen.queryByText("Sueldo Temporal")).not.toBeInTheDocument()
    expect(Object.keys(useIncomeStore.getState().incomes)).toHaveLength(0)
    expect(screen.getAllByText("$0").length).toBeGreaterThanOrEqual(1)
  })

  it("6. Gestión de Ingresos Reales y Estimados: badges, desglose y filtros", () => {
    const store = useIncomeStore.getState()
    store.addIncome({
      description: "Sueldo Fijo Real",
      amountCents: toMoney(1200000),
      type: "FIXED",
      status: "REAL",
      period: currentMonthStr,
    })
    store.addIncome({
      description: "Freelance Estimado",
      amountCents: toMoney(300000),
      type: "VARIABLE",
      status: "ESTIMATED",
      period: currentMonthStr,
    })

    render(<IncomeListView />)

    // Verificación de tarjetas de resumen
    expect(screen.getByText("Total Ingresos")).toBeInTheDocument()
    expect(screen.getByText("Ingreso Real")).toBeInTheDocument()
    expect(screen.getByText("Ingreso Estimado")).toBeInTheDocument()
    expect(screen.getAllByText("$1.500.000").length).toBeGreaterThanOrEqual(1) // Total
    expect(screen.getAllByText("$1.200.000").length).toBeGreaterThanOrEqual(1) // Real (card + row)
    expect(screen.getAllByText("$300.000").length).toBeGreaterThanOrEqual(1) // Estimado (card + row)

    // Badges en la tabla
    expect(screen.getByText("REAL")).toBeInTheDocument()
    expect(screen.getByText("ESTIMADO")).toBeInTheDocument()

    // Filtro Solo Reales
    const realTab = screen.getByRole("tab", { name: /Solo Reales/i })
    fireEvent.click(realTab)
    expect(screen.getByText("Sueldo Fijo Real")).toBeInTheDocument()
    expect(screen.queryByText("Freelance Estimado")).not.toBeInTheDocument()

    // Filtro Solo Estimados
    const estTab = screen.getByRole("tab", { name: /Solo Estimados/i })
    fireEvent.click(estTab)
    expect(screen.queryByText("Sueldo Fijo Real")).not.toBeInTheDocument()
    expect(screen.getByText("Freelance Estimado")).toBeInTheDocument()

    // Filtro Todos
    const allTab = screen.getByRole("tab", { name: /Todos/i })
    fireEvent.click(allTab)
    expect(screen.getByText("Sueldo Fijo Real")).toBeInTheDocument()
    expect(screen.getByText("Freelance Estimado")).toBeInTheDocument()
  })

  it("7. Edición de Ingreso: Permite cambiar estado de Estimado a Real y actualizar monto", () => {
    const store = useIncomeStore.getState()
    const inc = store.addIncome({
      description: "Proyecto Web",
      amountCents: toMoney(400000),
      type: "VARIABLE",
      status: "ESTIMATED",
      period: currentMonthStr,
    })

    render(<IncomeListView />)

    // Abrir modal de edición
    const editBtn = screen.getByRole("button", { name: "Editar Proyecto Web" })
    fireEvent.click(editBtn)

    expect(screen.getByRole("heading", { name: "Editar Ingreso" })).toBeInTheDocument()

    // Cambiar a Ingreso Real y nuevo monto recibido
    const realStatusBtn = screen.getByRole("button", { name: /Ingreso Real/i })
    fireEvent.click(realStatusBtn)

    const amountInput = screen.getByPlaceholderText(/Ej\. 1500000/i)
    fireEvent.change(amountInput, { target: { value: "450000" } })

    const saveChangesBtn = screen.getByRole("button", { name: "Guardar Cambios" })
    fireEvent.click(saveChangesBtn)

    // Verificación
    expect(screen.queryByRole("heading", { name: "Editar Ingreso" })).not.toBeInTheDocument()
    expect(screen.getAllByText("$450.000").length).toBeGreaterThanOrEqual(1)
    expect(useIncomeStore.getState().incomes[inc.id]?.status).toBe("REAL")
    expect(useIncomeStore.getState().incomes[inc.id]?.amountCents).toBe(toMoney(450000))
  })
})
