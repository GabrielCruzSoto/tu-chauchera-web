import { getDaysInMonth, format } from "date-fns"
import type { DueRule, ISODate, Period } from "@/shared/types/domain"
import { isChileanHoliday } from "@/shared/constants/chileanHolidays"

/**
 * Checks if a given Date instance is a Chilean business day (Lunes a Viernes, no feriado).
 */
export function isBusinessDay(date: Date): boolean {
  const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false
  }

  const isoDate = format(date, "yyyy-MM-dd")
  return !isChileanHoliday(isoDate)
}

/**
 * Shifts a target date to the next business day (forward) or previous business day (backward).
 */
export function shiftToBusinessDay(date: Date, direction: "NEXT" | "PREV"): Date {
  const current = new Date(date.getTime())
  const step = direction === "NEXT" ? 1 : -1

  while (!isBusinessDay(current)) {
    current.setDate(current.getDate() + step)
  }

  return current
}

/**
 * Resolves the exact ISO dueDate ("YYYY-MM-DD") for a given DueRule within a target period ("YYYY-MM").
 *
 * Rules:
 * - `LAST_BUSINESS_DAY`: Walks backward from the month's last calendar day until finding a business day.
 * - `FIXED_DAY`: Clamps day to the month length. Applies weekend/holiday shift if requested:
 *    - `NONE`: Leaves on the exact calendar day.
 *    - `NEXT_BUSINESS`: Moves to the following Monday/working day if falling on weekend/holiday.
 *    - `PREV_BUSINESS`: Moves to the preceding Friday/working day if falling on weekend/holiday.
 */
export function resolveDueDate(rule: DueRule, period: Period): ISODate {
  const [yearStr = "1970", monthStr = "01"] = period.split("-")
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10) // 1-12

  if (rule.kind === "LAST_BUSINESS_DAY") {
    const daysInMonth = getDaysInMonth(new Date(year, month - 1))
    const cursor = new Date(year, month - 1, daysInMonth)

    while (!isBusinessDay(cursor) && cursor.getDate() > 1) {
      cursor.setDate(cursor.getDate() - 1)
    }

    return format(cursor, "yyyy-MM-dd")
  }

  // FIXED_DAY
  const daysInMonth = getDaysInMonth(new Date(year, month - 1))
  const cleanDay = Math.min(Math.max(1, Math.floor(rule.day)), daysInMonth)
  const targetDate = new Date(year, month - 1, cleanDay)

  if (!rule.shift || rule.shift === "NONE") {
    return format(targetDate, "yyyy-MM-dd")
  }

  const direction = rule.shift === "NEXT_BUSINESS" ? "NEXT" : "PREV"
  const shiftedDate = shiftToBusinessDay(targetDate, direction)
  return format(shiftedDate, "yyyy-MM-dd")
}
