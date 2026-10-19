import type { Income, Period } from "@/shared/types/domain"
import type { FinancialHealthMetrics, FinancialBurdenLevel, PaymentItem } from "./types"

/**
 * Calculates essential financial health metrics:
 * 1. Carga Financiera (%) = (Cuotas de Deuda del Mes / Ingreso Líquido del Mes) * 100
 *    - < 30%: HEALTHY (Saludable)
 *    - 30% - 35%: CAUTION (Alerta / Cerca del límite prudencial)
 *    - > 35%: CRITICAL (Sobreendeudamiento / Riesgo financiero)
 * 2. Fondos Comprometidos = Deudas + Gastos Recurrentes
 * 3. Dinero Disponible Libre = Ingreso - Fondos Comprometidos
 */
export function calculateFinancialHealth(
  incomes: Income[],
  paymentItems: PaymentItem[],
  targetPeriod: Period
): FinancialHealthMetrics {
  // Sum incomes for target period
  let totalMonthlyIncomeCents = 0
  for (const inc of incomes) {
    if (inc.period === targetPeriod) {
      totalMonthlyIncomeCents += inc.amountCents
    }
  }

  let totalDebtInstallmentsCents = 0
  let totalRecurringExpensesCents = 0

  for (const item of paymentItems) {
    if (item.isDebt) {
      totalDebtInstallmentsCents += item.amountCents
    } else {
      totalRecurringExpensesCents += item.amountCents
    }
  }

  const totalCommittedCents = totalDebtInstallmentsCents + totalRecurringExpensesCents
  const freeDisposableCents = totalMonthlyIncomeCents - totalCommittedCents

  let financialBurdenPercentage = 0
  if (totalMonthlyIncomeCents > 0) {
    financialBurdenPercentage = Math.round((totalDebtInstallmentsCents / totalMonthlyIncomeCents) * 1000) / 10
  }

  let burdenLevel: FinancialBurdenLevel = "HEALTHY"
  if (financialBurdenPercentage > 35) {
    burdenLevel = "CRITICAL"
  } else if (financialBurdenPercentage >= 30) {
    burdenLevel = "CAUTION"
  }

  return {
    totalMonthlyIncomeCents,
    totalDebtInstallmentsCents,
    totalRecurringExpensesCents,
    totalCommittedCents,
    freeDisposableCents,
    financialBurdenPercentage,
    burdenLevel,
  }
}
