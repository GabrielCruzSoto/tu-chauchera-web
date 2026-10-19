import type { Installment, CreditCardAccount, CreditCardPurchase, Period } from "@/shared/types/domain"

export type MatrixCellStatus = "PAID" | "OVERDUE" | "DUE_SOON" | "SCHEDULED" | "OTHER"

export interface MatrixStatusConfig {
  key: MatrixCellStatus
  label: string
  shortLabel: string
  textColor: string
  badgeClass: string
  dotClass: string
  description: string
}

export const MATRIX_STATUS_CONFIGS: Record<MatrixCellStatus, MatrixStatusConfig> = {
  PAID: {
    key: "PAID",
    label: "Pagado",
    shortLabel: "Pagado",
    textColor: "text-emerald-400",
    badgeClass: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
    dotClass: "bg-emerald-400",
    description: "Cuota pagada y saldada",
  },
  OVERDUE: {
    key: "OVERDUE",
    label: "Vencido",
    shortLabel: "Vencido",
    textColor: "text-rose-400 font-semibold",
    badgeClass: "text-rose-300 bg-rose-500/15 border-rose-500/30 font-semibold",
    dotClass: "bg-rose-500 animate-pulse",
    description: "Cuota vencida no pagada en plazo",
  },
  DUE_SOON: {
    key: "DUE_SOON",
    label: "Por vencer",
    shortLabel: "Por vencer",
    textColor: "text-amber-300 font-semibold",
    badgeClass: "text-amber-200 bg-amber-500/15 border-amber-500/30",
    dotClass: "bg-amber-400",
    description: "Cuota por vencer en el mes actual",
  },
  SCHEDULED: {
    key: "SCHEDULED",
    label: "En plazo",
    shortLabel: "Plazo",
    textColor: "text-sky-300",
    badgeClass: "text-sky-200 bg-sky-500/10 border-sky-500/25",
    dotClass: "bg-sky-400",
    description: "Cuota programada a plazo futuro",
  },
  OTHER: {
    key: "OTHER",
    label: "Otro",
    shortLabel: "Otro",
    textColor: "text-purple-300",
    badgeClass: "text-purple-200 bg-purple-500/10 border-purple-500/25",
    dotClass: "bg-purple-400",
    description: "Renegociado u otro estado",
  },
}

export function getMatrixStatusConfig(status?: MatrixCellStatus): MatrixStatusConfig {
  if (!status || !MATRIX_STATUS_CONFIGS[status]) {
    return MATRIX_STATUS_CONFIGS.SCHEDULED
  }
  return MATRIX_STATUS_CONFIGS[status]
}

/**
 * Resolves the aggregated status for a matrix cell with one or multiple obligations/installments.
 * Urgency/risk hierarchy:
 * 1. OVERDUE (alert user of overdue payments)
 * 2. DUE_SOON (upcoming commitments in current period)
 * 3. OTHER (e.g. renegotiated)
 * 4. SCHEDULED (future periods)
 * 5. PAID (if all are paid)
 */
export function resolveCellStatus(statuses: MatrixCellStatus[]): MatrixCellStatus | undefined {
  if (!statuses || statuses.length === 0) return undefined
  const unique = Array.from(new Set(statuses))
  if (unique.length === 1) return unique[0]

  if (statuses.includes("OVERDUE")) return "OVERDUE"
  if (statuses.includes("DUE_SOON")) return "DUE_SOON"
  if (statuses.includes("OTHER")) return "OTHER"
  if (statuses.includes("SCHEDULED")) return "SCHEDULED"
  if (statuses.every((s) => s === "PAID")) return "PAID"
  return "OTHER"
}

/**
 * Computes the matrix status for an installment in a given target period.
 */
export function getInstallmentStatusForMatrix(
  inst: Installment,
  targetPeriod: Period,
  todayStr: string,
  currentPeriod: Period
): MatrixCellStatus {
  if (inst.status === "PAID") {
    return "PAID"
  }
  if (inst.status === "RENEGOTIATED") {
    return "OTHER"
  }

  // PENDING installment
  if (inst.isOverdueRollover || inst.dueDate < todayStr || targetPeriod < currentPeriod) {
    return "OVERDUE"
  }
  if (targetPeriod === currentPeriod) {
    return "DUE_SOON"
  }
  return "SCHEDULED"
}

/**
 * Computes the matrix status for a credit card purchase/account in a given target period.
 */
export function getCreditCardStatusForMatrix(
  account: CreditCardAccount | undefined,
  targetPeriod: Period,
  todayStr: string,
  currentPeriod: Period,
  purchase?: CreditCardPurchase
): MatrixCellStatus {
  const isPaid = account?.paidPeriods?.includes(targetPeriod)
  if (isPaid) {
    return "PAID"
  }

  if (purchase?.payerType === "TERCERO" && purchase.thirdPartyReceivable?.status === "COBRADO_TOTAL") {
    return "PAID"
  }

  const dueDay = account?.dueDay ?? 5
  const dueDate = `${targetPeriod}-${String(Math.min(28, dueDay)).padStart(2, "0")}`

  if (targetPeriod < currentPeriod || dueDate < todayStr) {
    return "OVERDUE"
  }
  if (targetPeriod === currentPeriod) {
    return "DUE_SOON"
  }
  return "SCHEDULED"
}
