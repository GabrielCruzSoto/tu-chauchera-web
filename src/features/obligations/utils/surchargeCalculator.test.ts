import { describe, it, expect } from "vitest"
import { computeP2PInstallmentCharge } from "./surchargeCalculator"
import { toMoney } from "@/shared/types/money"
import type { CardFeeSurcharge } from "@/shared/types/domain"

describe("computeP2PInstallmentCharge", () => {
  it("returns base amount when no surcharges provided", () => {
    const res = computeP2PInstallmentCharge(toMoney(45000), 12)
    expect(res.baseAmountCents).toBe(45000)
    expect(res.maintenanceSurchargeCents).toBe(0)
    expect(res.commissionSurchargeCents).toBe(0)
    expect(res.totalMonthlyChargeCents).toBe(45000)
  })

  it("adds 100% card maintenance fee", () => {
    const surcharges: CardFeeSurcharge = {
      includeMaintenanceFee: true,
      maintenanceFeeAmountCents: toMoney(3500),
      maintenanceSplitMode: "FULL",
      includeOneTimeCommission: false,
    }
    const res = computeP2PInstallmentCharge(toMoney(45000), 12, surcharges)
    expect(res.maintenanceSurchargeCents).toBe(3500)
    expect(res.totalMonthlyChargeCents).toBe(48500)
  })

  it("splits maintenance fee 50/50", () => {
    const surcharges: CardFeeSurcharge = {
      includeMaintenanceFee: true,
      maintenanceFeeAmountCents: toMoney(3500),
      maintenanceSplitMode: "SPLIT_50_50",
      includeOneTimeCommission: false,
    }
    const res = computeP2PInstallmentCharge(toMoney(45000), 12, surcharges)
    expect(res.maintenanceSurchargeCents).toBe(1750)
    expect(res.totalMonthlyChargeCents).toBe(46750)
  })

  it("spreads one-time commissions and taxes across all installments", () => {
    const surcharges: CardFeeSurcharge = {
      includeMaintenanceFee: true,
      maintenanceFeeAmountCents: toMoney(3500),
      maintenanceSplitMode: "FULL",
      includeOneTimeCommission: true,
      totalCommissionCents: toMoney(6000),
      commissionCollectionMode: "SPREAD_ACROSS_INSTALLMENTS",
    }
    const res = computeP2PInstallmentCharge(toMoney(45000), 12, surcharges)
    expect(res.maintenanceSurchargeCents).toBe(3500)
    expect(res.commissionSurchargeCents).toBe(500)
    expect(res.totalMonthlyChargeCents).toBe(49000)
  })

  it("charges one-time commission only on first installment", () => {
    const surcharges: CardFeeSurcharge = {
      includeMaintenanceFee: false,
      includeOneTimeCommission: true,
      totalCommissionCents: toMoney(6000),
      commissionCollectionMode: "FIRST_INSTALLMENT_ONLY",
    }
    const inst1 = computeP2PInstallmentCharge(toMoney(45000), 12, surcharges, 1)
    expect(inst1.commissionSurchargeCents).toBe(6000)
    expect(inst1.totalMonthlyChargeCents).toBe(51000)

    const inst2 = computeP2PInstallmentCharge(toMoney(45000), 12, surcharges, 2)
    expect(inst2.commissionSurchargeCents).toBe(0)
    expect(inst2.totalMonthlyChargeCents).toBe(45000)
  })
})
