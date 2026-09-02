import type { CardFeeSurcharge, Money } from "@/shared/types/domain"
import { toMoney } from "@/shared/types/money"

export interface ComputedP2PBreakdown {
  baseAmountCents: Money
  maintenanceSurchargeCents: Money
  commissionSurchargeCents: Money
  totalMonthlyChargeCents: Money
}

/**
 * Calculates the monthly fee breakdown and total amount to charge a third party,
 * including optional card maintenance fees and prorated or upfront commissions/taxes.
 */
export function computeP2PInstallmentCharge(
  baseAmountCents: Money,
  totalInstallments: number,
  surcharges?: CardFeeSurcharge,
  installmentNumber = 1
): ComputedP2PBreakdown {
  let maintenanceSurcharge = 0
  let commissionSurcharge = 0

  if (surcharges?.includeMaintenanceFee && surcharges.maintenanceFeeAmountCents) {
    if (surcharges.maintenanceSplitMode === "SPLIT_50_50") {
      maintenanceSurcharge = Math.floor(surcharges.maintenanceFeeAmountCents / 2)
    } else if (surcharges.maintenanceSplitMode === "CUSTOM_AMOUNT") {
      maintenanceSurcharge = surcharges.customMaintenanceCents ?? 0
    } else {
      // Default: FULL (100% passed to third party)
      maintenanceSurcharge = surcharges.maintenanceFeeAmountCents
    }
  }

  if (surcharges?.includeOneTimeCommission && surcharges.totalCommissionCents) {
    if (surcharges.commissionCollectionMode === "FIRST_INSTALLMENT_ONLY") {
      commissionSurcharge = installmentNumber === 1 ? surcharges.totalCommissionCents : 0
    } else {
      // Default: SPREAD_ACROSS_INSTALLMENTS
      const count = Math.max(1, totalInstallments)
      commissionSurcharge = Math.floor(surcharges.totalCommissionCents / count)
    }
  }

  const totalMonthly = baseAmountCents + maintenanceSurcharge + commissionSurcharge

  return {
    baseAmountCents,
    maintenanceSurchargeCents: toMoney(maintenanceSurcharge),
    commissionSurchargeCents: toMoney(commissionSurcharge),
    totalMonthlyChargeCents: toMoney(totalMonthly),
  }
}
