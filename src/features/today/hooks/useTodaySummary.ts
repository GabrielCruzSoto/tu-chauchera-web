import { useMemo } from "react"
import { differenceInCalendarDays, parseISO } from "date-fns"
import type { ISODate, Period } from "@/shared/types/domain"
import { getLocalISODate, getLocalPeriod } from "@/shared/utils/date"
import { useObligationsStore } from "@/features/obligations/store/obligationsSlice"
import { usePaymentPlan } from "@/features/payments/hooks/usePaymentPlan"
import type { FinancialHealthMetrics, PaymentItem } from "@/features/payments/domain/types"

/** How far ahead (in calendar days) the "upcoming" section looks. */
export const UPCOMING_WINDOW_DAYS = 7

export interface TodayPaymentItem extends PaymentItem {
  /** Calendar days from today to dueDate. Negative = overdue. */
  daysUntilDue: number
}

export interface TodaySummary {
  period: Period
  today: ISODate
  metrics: FinancialHealthMetrics
  /** Most urgent unpaid item (overdue first, then soonest due). */
  nextPayment: TodayPaymentItem | null
  /** Unpaid items with dueDate before today (includes previous-period carryover). */
  overdueItems: TodayPaymentItem[]
  /** Unpaid items due within the next UPCOMING_WINDOW_DAYS days. */
  upcomingItems: TodayPaymentItem[]
  pendingCount: number
}

function daysUntil(dueDate: ISODate, today: ISODate): number | null {
  if (!dueDate || dueDate.length < 10) return null
  const days = differenceInCalendarDays(parseISO(dueDate), parseISO(today))
  return Number.isNaN(days) ? null : days
}

/**
 * Aggregates everything the "Hoy" landing needs:
 * - Financial health KPIs for the current period (via usePaymentPlan).
 * - The next payment to attend, overdue list and 7-day lookahead.
 *
 * Note: buildPaymentCalendar only covers the current period, so this hook
 * additionally scans for PENDING installments from previous periods
 * (carryover) — forgotten installments are the most urgent items to surface.
 */
export function useTodaySummary(): TodaySummary {
  const today = getLocalISODate()
  const period = getLocalPeriod()
  const obligations = useObligationsStore((s) => s.obligations)
  const installments = useObligationsStore((s) => s.installments)
  const categories = useObligationsStore((s) => s.categories)
  const { calendarItems, metrics, pendingItemsCount } = usePaymentPlan(period)

  return useMemo(() => {
    const withCountdown: TodayPaymentItem[] = []
    for (const item of calendarItems) {
      if (item.isPaid) continue
      const days = daysUntil(item.dueDate, today)
      if (days === null) continue
      withCountdown.push({ ...item, daysUntilDue: days })
    }

    // Carryover: pending installments whose period is not the current one.
    // The monthly calendar never shows them, but they are the most urgent.
    const calendarInstallmentIds = new Set(
      calendarItems.filter((i) => i.sourceType === "INSTALLMENT").map((i) => i.sourceId)
    )
    const carryover: TodayPaymentItem[] = []
    for (const inst of Object.values(installments)) {
      if (inst.status !== "PENDING") continue
      if (calendarInstallmentIds.has(inst.id)) continue
      const days = daysUntil(inst.dueDate, today)
      if (days === null || days >= 0) continue

      const obligation = obligations[inst.obligationId]
      if (!obligation || obligation.status === "DELETED") continue

      const category = categories[obligation.categoryId]
      const subtitle = obligation.detail !== obligation.subcategory ? obligation.detail : undefined
      carryover.push({
        id: `inst-${inst.id}`,
        title: obligation.subcategory || obligation.detail || "Obligación",
        ...(subtitle !== undefined ? { subtitle } : {}),
        amountCents: inst.amountCents,
        dueDate: inst.dueDate,
        dueDay: parseInt(inst.dueDate.slice(8, 10), 10) || obligation.dueDay || 1,
        period: inst.period ?? inst.dueDate.slice(0, 7),
        sourceType: "INSTALLMENT",
        sourceId: inst.id,
        isPaid: false,
        ...(category?.name !== undefined ? { categoryName: category.name } : {}),
        ...(category?.color !== undefined ? { categoryColor: category.color } : {}),
        isDebt: obligation.type === "DEBT" || obligation.type === "P2P_DEBT",
        daysUntilDue: days,
      })
    }

    const allPending = [...withCountdown, ...carryover].sort(
      (a, b) => a.daysUntilDue - b.daysUntilDue
    )
    const overdueItems = allPending.filter((i) => i.daysUntilDue < 0)
    const upcomingItems = allPending.filter(
      (i) => i.daysUntilDue >= 0 && i.daysUntilDue <= UPCOMING_WINDOW_DAYS
    )

    return {
      period,
      today,
      metrics,
      nextPayment: allPending[0] ?? null,
      overdueItems,
      upcomingItems,
      pendingCount: pendingItemsCount + carryover.length,
    }
  }, [calendarItems, metrics, pendingItemsCount, installments, obligations, categories, period, today])
}
