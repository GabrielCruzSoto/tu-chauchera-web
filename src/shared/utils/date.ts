import { format, addMonths } from "date-fns"
import type { ISODate, Period } from "@/shared/types/domain"

/**
 * Returns today's date formatted as ISO "YYYY-MM-DD" in local time.
 * Avoids `.toISOString().slice(0, 10)` which converts to UTC and shifts
 * dates forward after 21:00 in UTC-3/UTC-4 (e.g. Chile, Argentina).
 */
export function getLocalISODate(date: Date = new Date()): ISODate {
  return format(date, "yyyy-MM-dd")
}

/**
 * Returns the period formatted as "YYYY-MM" in local time.
 * Avoids `.toISOString().slice(0, 7)` timezone boundary shifts.
 */
export function getLocalPeriod(date: Date = new Date()): Period {
  return format(date, "yyyy-MM")
}

/**
 * Adds (or subtracts) months to a given period ("YYYY-MM") and returns the new "YYYY-MM".
 */
export function addMonthsToPeriod(period: Period, months: number): Period {
  const parts = period.split("-")
  const yearPart = parts[0]
  const monthPart = parts[1]
  if (!yearPart || !monthPart) return period
  const year = parseInt(yearPart, 10)
  const month = parseInt(monthPart, 10)
  if (isNaN(year) || isNaN(month)) return period

  const base = new Date(year, month - 1, 1)
  return format(addMonths(base, months), "yyyy-MM")
}

/**
 * Generates an array of contiguous periods ("YYYY-MM") starting from a base Date.
 */
export function generateLocalPeriodsRange(baseDate: Date, monthsCount = 6): Period[] {
  const periods: Period[] = []
  const current = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)

  for (let i = 0; i < monthsCount; i++) {
    periods.push(format(current, "yyyy-MM"))
    current.setMonth(current.getMonth() + 1)
  }

  return periods
}
