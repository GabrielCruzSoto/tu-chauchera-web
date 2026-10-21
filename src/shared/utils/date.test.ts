import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  getLocalISODate,
  getCurrentDateISO,
  getLocalPeriod,
  getCurrentPeriod,
  addMonthsToPeriod,
  generateLocalPeriodsRange,
} from './date'

describe('date utils', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats date in local ISO format YYYY-MM-DD', () => {
    // 2026-09-30 at 22:30 local time
    const testDate = new Date(2026, 8, 30, 22, 30, 0)
    expect(getLocalISODate(testDate)).toBe('2026-09-30')
    expect(getCurrentDateISO(testDate)).toBe('2026-09-30')
  })

  it('formats period in local format YYYY-MM without UTC shift', () => {
    // 2026-09-30 at 23:45 local time
    const testDate = new Date(2026, 8, 30, 23, 45, 0)
    expect(getLocalPeriod(testDate)).toBe('2026-09')
    expect(getCurrentPeriod(testDate)).toBe('2026-09')
  })

  it('keeps local calendar date and period when UTC crosses midnight (e.g. 23:30 UTC-3)', () => {
    vi.useFakeTimers()
    // Simulate local date 2026-09-30 at 23:30 local time
    const lateNightLocal = new Date(2026, 8, 30, 23, 30, 0)
    vi.setSystemTime(lateNightLocal)

    expect(getLocalISODate()).toBe('2026-09-30')
    expect(getCurrentDateISO()).toBe('2026-09-30')
    expect(getLocalPeriod()).toBe('2026-09')
    expect(getCurrentPeriod()).toBe('2026-09')
  })

  it('adds and subtracts months accurately to period strings', () => {
    expect(addMonthsToPeriod('2026-09', 1)).toBe('2026-10')
    expect(addMonthsToPeriod('2026-09', 3)).toBe('2026-12')
    expect(addMonthsToPeriod('2026-09', 4)).toBe('2027-01')
    expect(addMonthsToPeriod('2026-09', -1)).toBe('2026-08')
    expect(addMonthsToPeriod('2026-01', -1)).toBe('2025-12')
  })

  it('generates contiguous local period ranges', () => {
    const base = new Date(2026, 8, 1) // September 2026
    const range = generateLocalPeriodsRange(base, 4)
    expect(range).toEqual(['2026-09', '2026-10', '2026-11', '2026-12'])
  })
})
