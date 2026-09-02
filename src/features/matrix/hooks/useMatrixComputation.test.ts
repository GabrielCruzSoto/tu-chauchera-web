import { describe, it, expect } from "vitest"
import { computeFinancialMatrix, generatePeriodsRange } from "./useMatrixComputation"
import { toMoney } from "@/shared/types/money"
import type { Category, Obligation, Installment } from "@/shared/types/domain"

describe("Financial Matrix Computation", () => {
  it("generates correct range of periods", () => {
    const baseDate = new Date("2024-01-15T00:00:00Z")
    const periods = generatePeriodsRange(baseDate, 3)
    expect(periods).toEqual(["2024-01", "2024-02", "2024-03"])
  })

  it("aggregates categories by period correctly with totals", () => {
    const categories: Record<string, Category> = {
      "cat-banco": { id: "cat-banco", name: "Bancos", color: "emerald", createdAt: "", updatedAt: "" },
      "cat-servicios": { id: "cat-servicios", name: "Servicios", color: "sky", createdAt: "", updatedAt: "" },
    }

    const obligations: Record<string, Obligation> = {
      "obl-1": {
        id: "obl-1",
        categoryId: "cat-banco",
        subcategory: "Crédito Hipotecario",
        detail: "",
        totalAmountCents: toMoney(1000000),
        totalInstallments: 10,
        currentInstallment: 1,
        installmentAmountCents: toMoney(100000),
        startDate: "2024-01-10",
        dueDay: 10,
        status: "PENDING",
        createdAt: "",
        updatedAt: "",
      },
      "obl-2": {
        id: "obl-2",
        categoryId: "cat-servicios",
        subcategory: "Luz",
        detail: "",
        totalAmountCents: toMoney(60000),
        totalInstallments: 2,
        currentInstallment: 1,
        installmentAmountCents: toMoney(30000),
        startDate: "2024-01-20",
        dueDay: 20,
        status: "PENDING",
        createdAt: "",
        updatedAt: "",
      },
    }

    const installments: Record<string, Installment> = {
      "i-1": {
        id: "i-1",
        obligationId: "obl-1",
        installmentNumber: 1,
        dueDate: "2024-01-10",
        amountCents: toMoney(100000),
        status: "PENDING",
      },
      "i-2": {
        id: "i-2",
        obligationId: "obl-1",
        installmentNumber: 2,
        dueDate: "2024-02-10",
        amountCents: toMoney(100000),
        status: "PENDING",
      },
      "i-3": {
        id: "i-3",
        obligationId: "obl-2",
        installmentNumber: 1,
        dueDate: "2024-01-20",
        amountCents: toMoney(30000),
        status: "PENDING",
      },
    }

    const periods = ["2024-01", "2024-02"]
    const matrix = computeFinancialMatrix(categories, obligations, installments, periods)

    // Cell values
    expect(matrix.cells["cat-banco"]?.["2024-01"]).toBe(100000)
    expect(matrix.cells["cat-banco"]?.["2024-02"]).toBe(100000)
    expect(matrix.cells["cat-servicios"]?.["2024-01"]).toBe(30000)
    expect(matrix.cells["cat-servicios"]?.["2024-02"]).toBe(0)

    // Column totals
    expect(matrix.columnTotals["2024-01"]).toBe(130000)
    expect(matrix.columnTotals["2024-02"]).toBe(100000)

    // Row totals
    expect(matrix.rowTotals["cat-banco"]).toBe(200000)
    expect(matrix.rowTotals["cat-servicios"]).toBe(30000)

    // Subcategories breakdown
    expect(matrix.subcategoriesByCategory["cat-banco"]).toHaveLength(1)
    expect(matrix.subcategoriesByCategory["cat-banco"]![0]!.name).toBe("Crédito Hipotecario")
    expect(matrix.subcategoriesByCategory["cat-banco"]![0]!.cells["2024-01"]).toBe(100000)
    expect(matrix.subcategoriesByCategory["cat-banco"]![0]!.cells["2024-02"]).toBe(100000)
    expect(matrix.subcategoriesByCategory["cat-banco"]![0]!.total).toBe(200000)

    expect(matrix.subcategoriesByCategory["cat-servicios"]).toHaveLength(1)
    expect(matrix.subcategoriesByCategory["cat-servicios"]![0]!.name).toBe("Luz")
    expect(matrix.subcategoriesByCategory["cat-servicios"]![0]!.cells["2024-01"]).toBe(30000)
    expect(matrix.subcategoriesByCategory["cat-servicios"]![0]!.cells["2024-02"]).toBe(0)
    expect(matrix.subcategoriesByCategory["cat-servicios"]![0]!.total).toBe(30000)
  })
})
