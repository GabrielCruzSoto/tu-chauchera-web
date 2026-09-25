import { describe, it, expect } from "vitest"
import { generateInstallments, clampDueDay, computeDueDate } from "./installmentGenerator"
import { toMoney } from "@/shared/types/money"
import type { Obligation, Installment } from "@/shared/types/domain"

describe("installmentGenerator", () => {
  it("correctly clamps day to month boundaries", () => {
    // Feb in leap year (2024)
    expect(clampDueDay(2024, 2, 31)).toBe(29)
    // Feb in non-leap year (2023)
    expect(clampDueDay(2023, 2, 31)).toBe(28)
    // April (30 days)
    expect(clampDueDay(2024, 4, 31)).toBe(30)
    // Jan (31 days)
    expect(clampDueDay(2024, 1, 15)).toBe(15)
  })

  it("computes accurate monthly due dates with clamped days", () => {
    const startDate = "2024-01-31"
    const dueDay = 31
    expect(computeDueDate(startDate, 0, dueDay)).toBe("2024-01-31")
    expect(computeDueDate(startDate, 1, dueDay)).toBe("2024-02-29") // Leap year
    expect(computeDueDate(startDate, 2, dueDay)).toBe("2024-03-31")
    expect(computeDueDate(startDate, 3, dueDay)).toBe("2024-04-30")
  })

  it("handles empty or invalid dates and NaN gracefully without throwing", () => {
    expect(computeDueDate("", 0, 15)).toBe("—")
    expect(computeDueDate("invalid-date", 0, 15)).toBe("—")
    expect(computeDueDate("2024-", 0, 15)).toBe("—")
    expect(computeDueDate("2024-01-15", 0, NaN)).toBe("2024-01-01")
    expect(clampDueDay(NaN, NaN, NaN)).toBe(1)
  })

  it("generates all N installments eagerly for a new obligation", () => {
    const obligation: Obligation = {
      id: "obl-1",
      categoryId: "cat-1",
      subcategory: "Auto Loan",
      detail: "Monthly car payment",
      totalAmountCents: toMoney(4800000),
      totalInstallments: 48,
      currentInstallment: 1,
      installmentAmountCents: toMoney(100000),
      startDate: "2024-01-15",
      dueDay: 15,
      status: "PENDING",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    }

    const installments = generateInstallments(obligation)

    expect(installments).toHaveLength(48)
    expect(installments[0]?.installmentNumber).toBe(1)
    expect(installments[0]?.dueDate).toBe("2024-01-15")
    expect(installments[0]?.amountCents).toBe(toMoney(100000))
    expect(installments[0]?.status).toBe("PENDING")

    expect(installments[47]?.installmentNumber).toBe(48)
    expect(installments[47]?.dueDate).toBe("2027-12-15")
  })

  it("calculates accurate future due dates and generates historical paid installments when currentInstallment > 1", () => {
    const obligation: Obligation = {
      id: "obl-banco-estado",
      categoryId: "cat-1",
      subcategory: "Banco Estado",
      detail: "Credito",
      totalAmountCents: toMoney(5374872),
      totalInstallments: 72,
      currentInstallment: 69,
      installmentAmountCents: toMoney(74651),
      startDate: "2020-11-23",
      dueDay: 31,
      status: "PENDING",
      createdAt: "",
      updatedAt: "",
    }

    const installments = generateInstallments(obligation)

    expect(installments).toHaveLength(72) // 1 to 72
    // First installment is marked as PAID
    expect(installments[0]?.installmentNumber).toBe(1)
    expect(installments[0]?.status).toBe("PAID")
    // Installment 68 is marked as PAID
    expect(installments[67]?.installmentNumber).toBe(68)
    expect(installments[67]?.status).toBe("PAID")

    // Installments 69 onwards are PENDING
    expect(installments[68]?.installmentNumber).toBe(69)
    expect(installments[68]?.status).toBe("PENDING")
    // 68 months after Nov 2020 is July 2026!
    expect(installments[68]?.dueDate).toBe("2026-07-31")
    expect(installments[69]?.installmentNumber).toBe(70)
    expect(installments[69]?.dueDate).toBe("2026-08-31")
    expect(installments[71]?.installmentNumber).toBe(72)
    // 71 months after Nov 2020 is October 2026!
    expect(installments[71]?.dueDate).toBe("2026-10-31")
  })

  it("preserves PAID and RENEGOTIATED installments on regeneration", () => {
    const obligation: Obligation = {
      id: "obl-1",
      categoryId: "cat-1",
      subcategory: "Loan",
      detail: "Test",
      totalAmountCents: toMoney(500000),
      totalInstallments: 5,
      currentInstallment: 1,
      installmentAmountCents: toMoney(100000),
      startDate: "2024-01-10",
      dueDay: 10,
      status: "PENDING",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    }

    const paidInstallment: Installment = {
      id: "inst-1",
      obligationId: "obl-1",
      installmentNumber: 1,
      dueDate: "2024-01-10",
      amountCents: toMoney(100000),
      status: "PAID",
      paidDate: "2024-01-09",
      period: "2024-01",
    }

    // Regenerate with a changed due day
    const updatedObligation = { ...obligation, dueDay: 20 }
    const regenerated = generateInstallments(updatedObligation, [paidInstallment])

    expect(regenerated).toHaveLength(5)
    // First installment was preserved intact
    expect(regenerated[0]).toEqual(paidInstallment)
    // Second installment takes new due day
    expect(regenerated[1]?.installmentNumber).toBe(2)
    expect(regenerated[1]?.dueDate).toBe("2024-02-20")
    expect(regenerated[1]?.status).toBe("PENDING")
  })

  it("calculates P2P surcharges when generating installments", () => {
    const obligation: Obligation = {
      id: "obl-p2p",
      type: "P2P_DEBT",
      categoryId: "cat-retail",
      subcategory: "Juan Pérez",
      detail: "Smart TV",
      totalAmountCents: toMoney(540000),
      totalInstallments: 3,
      currentInstallment: 1,
      installmentAmountCents: toMoney(45000),
      startDate: "2024-01-05",
      dueDay: 5,
      status: "PENDING",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      p2pMetadata: {
        role: "LENT_MY_CARD",
        thirdPartyName: "Juan Pérez",
        cardIssuer: "CMR Falabella",
        productDescription: "Smart TV",
        baseInstallmentAmountCents: toMoney(45000),
        totalMonthlyChargeCents: toMoney(49000),
        surcharges: {
          includeMaintenanceFee: true,
          maintenanceFeeAmountCents: toMoney(3500),
          maintenanceSplitMode: "FULL",
          includeOneTimeCommission: true,
          totalCommissionCents: toMoney(1500),
          commissionCollectionMode: "SPREAD_ACROSS_INSTALLMENTS",
        },
      },
    }

    const installments = generateInstallments(obligation)
    expect(installments).toHaveLength(3)
    // 45000 + 3500 + (1500 / 3) = 49000
    expect(installments[0]?.amountCents).toBe(toMoney(49000))
    expect(installments[1]?.amountCents).toBe(toMoney(49000))
    expect(installments[2]?.amountCents).toBe(toMoney(49000))
  })
})
