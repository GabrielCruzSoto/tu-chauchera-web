import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { MatrixItemDetailModal, type MatrixItemDetailPayload } from "../components/MatrixItemDetailModal"
import { useObligationsStore } from "@/features/obligations/store/obligationsSlice"
import { toMoney } from "@/shared/types/money"

describe("MatrixItemDetailModal", () => {
  const mockItem: MatrixItemDetailPayload = {
    id: "cat-1-isis-paris",
    name: "Isis Paris",
    categoryName: "Deudas con terceros",
    categoryColor: "emerald",
    totalInRange: 1100000,
    periods: ["2026-08", "2026-09", "2026-10", "2026-11", "2026-12", "2027-01"],
    cells: {
      "2026-08": 500000,
      "2026-09": 200000,
      "2026-10": 200000,
      "2026-11": 200000,
      "2026-12": 0,
      "2027-01": 0,
    },
    obligationId: "obl-isis",
    type: "P2P_DEBT",
    p2pRole: "LENT_MY_CARD",
    thirdPartyName: "Isis Paris",
    cardIssuer: "Banco de Chile",
    productDescription: "Ropa y calzado",
    detail: "Compra en cuotas tienda Paris",
  }

  beforeEach(() => {
    useObligationsStore.setState({
      categories: {
        "cat-1": { id: "cat-1", name: "Deudas con terceros", color: "emerald", createdAt: "", updatedAt: "" },
      },
      obligations: {
        "obl-isis": {
          id: "obl-isis",
          categoryId: "cat-1",
          subcategory: "Isis Paris",
          detail: "Compra en cuotas tienda Paris",
          totalAmountCents: toMoney(1100000),
          totalInstallments: 4,
          currentInstallment: 1,
          installmentAmountCents: toMoney(200000),
          startDate: "2026-08-05",
          dueDay: 5,
          status: "PENDING",
          type: "P2P_DEBT",
          p2pMetadata: {
            role: "LENT_MY_CARD",
            thirdPartyName: "Isis Paris",
            cardIssuer: "Banco de Chile",
            productDescription: "Ropa y calzado",
            baseInstallmentAmountCents: toMoney(200000),
            totalMonthlyChargeCents: toMoney(200000),
          },
          createdAt: "",
          updatedAt: "",
        },
      },
      installments: {
        "inst-1": {
          id: "inst-1",
          obligationId: "obl-isis",
          installmentNumber: 1,
          amountCents: toMoney(500000),
          dueDate: "2026-08-05",
          status: "PAID",
          paidDate: "2026-08-04",
          period: "2026-08",
        },
        "inst-2": {
          id: "inst-2",
          obligationId: "obl-isis",
          installmentNumber: 2,
          amountCents: toMoney(200000),
          dueDate: "2026-09-05",
          status: "PENDING",
        },
      },
      isLoaded: true,
    })
  })

  it("renders modal with item name, category badge and financial breakdown when open", () => {
    const handleClose = vi.fn()
    render(<MatrixItemDetailModal isOpen={true} onClose={handleClose} item={mockItem} />)

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Isis Paris" })).toBeInTheDocument()
    expect(screen.getByText("Deudas con terceros")).toBeInTheDocument()
    expect(screen.getByText(/Presté mi tarjeta/i)).toBeInTheDocument()
    expect(screen.getByText(/Ropa y calzado/i)).toBeInTheDocument()
    expect(screen.getByText(/Banco de Chile/i)).toBeInTheDocument()
    expect(screen.getByText("Total en Horizonte")).toBeInTheDocument()
  })

  it("calls onClose when clicking close button or pressing Escape", () => {
    const handleClose = vi.fn()
    render(<MatrixItemDetailModal isOpen={true} onClose={handleClose} item={mockItem} />)

    const closeBtn = screen.getByRole("button", { name: /Cerrar detalle/i })
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)

    // Press Escape
    fireEvent.keyDown(window, { key: "Escape" })
    expect(handleClose).toHaveBeenCalledTimes(2)
  })

  it("does not render when isOpen is false", () => {
    const handleClose = vi.fn()
    render(<MatrixItemDetailModal isOpen={false} onClose={handleClose} item={mockItem} />)

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("renders monthly matrix distribution and installments schedule", () => {
    const handleClose = vi.fn()
    render(<MatrixItemDetailModal isOpen={true} onClose={handleClose} item={mockItem} />)

    expect(screen.getByText("Proyección Mes a Mes en la Matriz")).toBeInTheDocument()
    expect(screen.getByText("2026-08")).toBeInTheDocument()
    expect(screen.getByText("2026-09")).toBeInTheDocument()
    expect(screen.getByText(/Cronograma Completo de Cuotas/i)).toBeInTheDocument()
  })

  it("copies WhatsApp message when clicking copy button", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    })

    render(<MatrixItemDetailModal isOpen={true} onClose={vi.fn()} item={mockItem} />)

    const whatsappBtn = screen.getByRole("button", { name: /Copiar WhatsApp/i })
    fireEvent.click(whatsappBtn)

    expect(writeTextMock).toHaveBeenCalledTimes(1)
    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining("Isis Paris"))
  })
})
