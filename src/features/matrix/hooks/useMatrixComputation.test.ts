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

  it("integrates credit card accounts and purchases into matrix as Tarjetas de Crédito", () => {
    const categories: Record<string, Category> = {}
    const obligations: Record<string, Obligation> = {}
    const installments: Record<string, Installment> = {}
    const periods = ["2026-06", "2026-07", "2026-08"]

    const creditCards = {
      "card-1": {
        id: "card-1",
        institution: "Banco Falabella",
        accountName: "CMR Mastercard",
        creditLimitCents: toMoney(500000),
        closingDay: 19,
        dueDay: 5,
        plastics: [],
        createdAt: "",
        updatedAt: "",
      },
    }

    const purchases = {
      "pur-1": {
        id: "pur-1",
        accountId: "card-1",
        plasticId: "plas-1",
        description: "Lider Santa Amalia",
        purchaseDate: "2026-05-15",
        totalAmountCents: toMoney(189300),
        totalInstallments: 6,
        firstInstallmentPeriod: "2026-07",
        payerType: "PROPIO" as const,
        createdAt: "",
        updatedAt: "",
      },
      "pur-2": {
        id: "pur-2",
        accountId: "card-1",
        plasticId: "plas-1",
        description: "Celular para Amigo",
        purchaseDate: "2026-05-14",
        totalAmountCents: toMoney(60000),
        totalInstallments: 2,
        firstInstallmentPeriod: "2026-06",
        payerType: "TERCERO" as const,
        thirdPartyReceivable: {
          id: "rec-1",
          thirdPartyName: "Pedro",
          purchaseId: "pur-2",
          totalOwedCents: toMoney(60000),
          amountCollectedCents: toMoney(0),
          status: "PENDIENTE" as const,
          repayments: [],
        },
        createdAt: "",
        updatedAt: "",
      },
    }

    const matrix = computeFinancialMatrix(
      categories,
      obligations,
      installments,
      periods,
      creditCards,
      purchases
    )

    // Verify system category exists
    const cardCat = matrix.categories.find((c) => c.name === "Tarjetas de Crédito")
    expect(cardCat).toBeDefined()

    // Monthly installment for pur-1: 189300 / 6 = 31550 (starts 2026-07)
    // Monthly installment for pur-2: 60000 / 2 = 30000 (starts 2026-06, spans 2026-06 and 2026-07)
    // June: pur-2 (30000)
    // July: pur-1 (31550) + pur-2 (30000) = 61550
    // August: pur-1 (31550)
    expect(matrix.cells[cardCat!.id]?.["2026-06"]).toBe(30000)
    expect(matrix.cells[cardCat!.id]?.["2026-07"]).toBe(61550)
    expect(matrix.cells[cardCat!.id]?.["2026-08"]).toBe(31550)

    // Third party / P2P tracking
    expect(matrix.totalThirdPartyReceivables).toBe(60000) // pur-2 total in range
    expect(matrix.p2pGroups.find((g) => g.personName === "Pedro")).toBeDefined()

    // Subcategories should be grouped into a single summarized card row rather than 30 separate purchases
    const cardSubcats = matrix.subcategoriesByCategory[cardCat!.id]
    expect(cardSubcats).toBeDefined()
    expect(cardSubcats).toHaveLength(1)
    expect(cardSubcats![0]!.name).toBe("Banco Falabella - CMR Mastercard")
    expect(cardSubcats![0]!.cells["2026-06"]).toBe(30000)
    expect(cardSubcats![0]!.cells["2026-07"]).toBe(61550)
    expect(cardSubcats![0]!.cells["2026-08"]).toBe(31550)
    expect(cardSubcats![0]!.total).toBe(123100)
  })
})
