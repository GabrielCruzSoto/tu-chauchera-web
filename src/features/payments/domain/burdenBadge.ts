import type { FinancialBurdenLevel } from "./types"

export interface BurdenBadgeConfig {
  label: string
  color: string
  desc: string
}

/**
 * Shared visual config for the Financial Burden (DTI) semaphore.
 * Single source of truth for thresholds messaging across views
 * (PaymentWindowsView, TodayHome).
 */
export function getBurdenBadgeConfig(level: FinancialBurdenLevel): BurdenBadgeConfig {
  switch (level) {
    case "HEALTHY":
      return {
        label: "Saludable (<30%)",
        color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        desc: "Tu nivel de deuda está dentro de los límites recomendados.",
      }
    case "CAUTION":
      return {
        label: "Alerta (30% - 35%)",
        color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        desc: "Estás cerca del límite de sobreendeudamiento. Evita tomar nuevos créditos.",
      }
    case "CRITICAL":
      return {
        label: "Crítico (>35%)",
        color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
        desc: "Sobreendeudamiento detectado. Prioriza pagar capital y evalúa consolidar deudas.",
      }
  }
}
