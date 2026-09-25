import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { PaymentModal } from "./PaymentModal"
import { usePaymentsStore } from "../store/paymentsSlice"
import { toMoney } from "@/shared/types/money"
import type { Installment, Obligation } from "@/shared/types/domain"

describe("PaymentModal Component", () => {
  const mockClose = vi.fn()

  const sampleObl: Obligation = {
    id: "obl-1",
    categoryId: "cat-1",
    subcategory: "Crédito Banco",
    detail: "Crédito consumo cuota",
    totalAmountCents: toMoney(600000),
    totalInstallments: 6,
    currentInstallment: 1,
    installmentAmountCents: toMoney(100000),
    startDate: "2024-05-10",
    dueDay: 10,
    status: "PENDING",
    type: "DEBT",
    createdAt: "",
    updatedAt: "",
  }

  const pendingInst: Installment = {
    id: "inst-pending",
    obligationId: "obl-1",
    installmentNumber: 1,
    dueDate: "2024-05-10",
    amountCents: toMoney(100000),
    status: "PENDING",
  }

  const paidInst: Installment = {
    id: "inst-paid",
    obligationId: "obl-1",
    installmentNumber: 1,
    dueDate: "2024-05-10",
    amountCents: toMoney(100000),
    status: "PAID",
    paidDate: "2024-05-09",
    period: "2024-05",
    notes: "Comprobante #1234",
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders in registration mode for pending installment", () => {
    render(
      <PaymentModal
        installment={pendingInst}
        obligation={sampleObl}
        onClose={mockClose}
      />
    )

    expect(screen.getByRole("heading", { name: "Registrar Pago de Cuota" })).toBeInTheDocument()
    expect(screen.queryByText("Pagado")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Confirmar Pago/i })).toBeInTheDocument()
  })

  it("renders in edit mode for paid installment", () => {
    render(
      <PaymentModal
        installment={paidInst}
        obligation={sampleObl}
        onClose={mockClose}
      />
    )

    expect(screen.getByRole("heading", { name: "Modificar Pago de Cuota" })).toBeInTheDocument()
    expect(screen.getByText("Pagado")).toBeInTheDocument()
    expect(screen.getByText("Fecha de pago registrada:")).toBeInTheDocument()
    expect(screen.getByText("2024-05-09")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Guardar Cambios/i })).toBeInTheDocument()
  })

  it("submits modified payment with updated values and calls markPaid", () => {
    const markPaidSpy = vi.spyOn(usePaymentsStore.getState(), "markPaid")

    render(
      <PaymentModal
        installment={paidInst}
        obligation={sampleObl}
        onClose={mockClose}
      />
    )

    const amountInput = screen.getByLabelText(/Monto Real Pagado/i)
    const dateInput = screen.getByLabelText(/Fecha de Pago Real/i)
    const notesInput = screen.getByLabelText(/Notas \/ Comprobante/i)

    // Modify amount to include surcharge
    fireEvent.change(amountInput, { target: { value: "105000" } })
    expect(screen.getByText(/recargo \/ mora/i)).toBeInTheDocument()

    // Modify date
    fireEvent.change(dateInput, { target: { value: "2024-05-15" } })

    // Modify notes
    fireEvent.change(notesInput, { target: { value: "Transferencia actualizada con multa" } })

    // Submit
    const submitBtn = screen.getByRole("button", { name: /Guardar Cambios/i })
    fireEvent.click(submitBtn)

    expect(markPaidSpy).toHaveBeenCalledWith(
      paidInst.id,
      "2024-05-15",
      "Transferencia actualizada con multa",
      toMoney(105000)
    )
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it("calls onClose when clicking Cancel button or close icon", () => {
    render(
      <PaymentModal
        installment={paidInst}
        obligation={sampleObl}
        onClose={mockClose}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: /Cancelar/i }))
    expect(mockClose).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole("button", { name: /Cerrar modal/i }))
    expect(mockClose).toHaveBeenCalledTimes(2)
  })
})
