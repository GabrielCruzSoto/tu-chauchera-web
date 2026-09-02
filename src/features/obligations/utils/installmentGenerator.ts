import { addMonths, getDaysInMonth, setDate, format } from "date-fns"
import type { Obligation, Installment } from "@/shared/types/domain"
import { computeP2PInstallmentCharge } from "./surchargeCalculator"

/** Clamp dueDay to the actual last day of a given month (handles Feb 30 -> Feb 28/29) */
export function clampDueDay(year: number, month: number, dueDay: number): number {
  if (!Number.isFinite(year) || !Number.isFinite(month)) return 1
  const cleanDueDay = Number.isFinite(dueDay) && dueDay >= 1 ? Math.min(Math.floor(dueDay), 31) : 1
  try {
    const daysInMonth = getDaysInMonth(new Date(year, month - 1))
    return Math.min(cleanDueDay, daysInMonth)
  } catch {
    return cleanDueDay
  }
}

/** Compute ISO due date string for a given installment offset */
export function computeDueDate(startDate: string, offsetMonths: number, dueDay: number): string {
  if (!startDate || typeof startDate !== "string" || startDate.trim().length < 4) {
    return "—"
  }

  const cleanDueDay = Number.isFinite(dueDay) && dueDay >= 1 ? Math.min(Math.floor(dueDay), 31) : 1
  const cleanOffset = Number.isFinite(offsetMonths) ? offsetMonths : 0

  try {
    const isoString = startDate.includes("T") ? startDate : `${startDate.trim()}T00:00:00`
    const base = new Date(isoString)
    if (isNaN(base.getTime())) return "—"

    const target = addMonths(base, cleanOffset)
    const year = target.getFullYear()
    const month = target.getMonth() + 1
    if (isNaN(year) || isNaN(month)) return "—"

    const day = clampDueDay(year, month, cleanDueDay)
    return format(setDate(new Date(year, month - 1), day), "yyyy-MM-dd")
  } catch {
    return "—"
  }
}

/**
 * Generate all Installment records for an Obligation eagerly.
 * Preserves PAID and RENEGOTIATED records on partial regeneration.
 */
export function generateInstallments(
  obligation: Obligation,
  existingInstallments: Installment[] = []
): Installment[] {
  const { id, currentInstallment, totalInstallments, installmentAmountCents, startDate, dueDay, p2pMetadata } =
    obligation

  const preserved = new Map<number, Installment>(
    existingInstallments
      .filter((i) => i.status === "PAID" || i.status === "RENEGOTIATED")
      .map((i) => [i.installmentNumber, i])
  )

  const installments: Installment[] = []

  for (let num = currentInstallment; num <= totalInstallments; num++) {
    const existing = preserved.get(num)
    if (existing) {
      installments.push(existing)
    } else {
      const offset = num - 1
      let calculatedAmount = installmentAmountCents

      if (p2pMetadata?.surcharges && p2pMetadata.baseInstallmentAmountCents) {
        calculatedAmount = computeP2PInstallmentCharge(
          p2pMetadata.baseInstallmentAmountCents,
          totalInstallments,
          p2pMetadata.surcharges,
          num
        ).totalMonthlyChargeCents
      }

      installments.push({
        id: crypto.randomUUID(),
        obligationId: id,
        installmentNumber: num,
        dueDate: computeDueDate(startDate, offset, dueDay),
        amountCents: calculatedAmount,
        status: "PENDING",
        period: undefined,
        paidDate: undefined,
        notes: undefined,
      })
    }
  }

  return installments
}
