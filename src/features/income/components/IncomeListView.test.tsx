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
    expect(screen.getByText("$0")).toBeInTheDocument()
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
    expect(screen.getByText("Total Ingresos:")).toBeInTheDocument()
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
    const deleteBtn = screen.getByRole("button", { name: "Eliminar" })
    fireEvent.click(deleteBtn)

    // Bóveda limpia
    expect(screen.queryByText("Sueldo Temporal")).not.toBeInTheDocument()
    expect(Object.keys(useIncomeStore.getState().incomes)).toHaveLength(0)
    expect(screen.getByText("$0")).toBeInTheDocument()
  })
})
