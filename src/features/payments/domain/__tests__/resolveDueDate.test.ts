import { describe, it, expect } from "vitest"
import { isBusinessDay, shiftToBusinessDay, resolveDueDate } from "../resolveDueDate"
import type { DueRule } from "@/shared/types/domain"

describe("resolveDueDate and Chilean Business Days", () => {
  it("correctly identifies Chilean weekends and official holidays", () => {
    // 2026-05-01 is Friday (Día del Trabajador - Holiday)
    const mayFirst2026 = new Date("2026-05-01T12:00:00")
    expect(isBusinessDay(mayFirst2026)).toBe(false)

    // 2026-05-02 is Saturday
    const sat = new Date("2026-05-02T12:00:00")
    expect(isBusinessDay(sat)).toBe(false)

    // 2026-05-03 is Sunday
    const sun = new Date("2026-05-03T12:00:00")
    expect(isBusinessDay(sun)).toBe(false)

    // 2026-05-04 is Monday (Normal business day)
    const mon = new Date("2026-05-04T12:00:00")
    expect(isBusinessDay(mon)).toBe(true)
  })

  it("shifts weekend/holiday dates with NEXT_BUSINESS and PREV_BUSINESS", () => {
    // 2026-05-01 is Friday (holiday). NEXT business day is Monday 2026-05-04
    const fridayHoliday = new Date("2026-05-01T12:00:00")
    const nextBusiness = shiftToBusinessDay(fridayHoliday, "NEXT")
    expect(nextBusiness.getDate()).toBe(4) // Monday May 4th

    // PREV business day from Friday holiday is Thursday 2026-04-30
    const prevBusiness = shiftToBusinessDay(fridayHoliday, "PREV")
    expect(prevBusiness.getDate()).toBe(30) // Thursday April 30th
  })

  it("resolves LAST_BUSINESS_DAY accurately for Chilean calendar", () => {
    const rule: DueRule = { kind: "LAST_BUSINESS_DAY" }

    // October 2026: October 31 is Saturday (and evangelical holiday). October 30 is Friday (normal business day)
    // Actually in 2026: October 31 is Saturday. Oct 30 is Friday.
    const dueDateOct2026 = resolveDueDate(rule, "2026-10")
    expect(dueDateOct2026).toBe("2026-10-30")

    // February 2026: Feb 28 is Saturday. Last business day is Friday Feb 27
    const dueDateFeb2026 = resolveDueDate(rule, "2026-02")
    expect(dueDateFeb2026).toBe("2026-02-27")
  })

  it("resolves FIXED_DAY with holiday shifts", () => {
    // May 1st 2026 is holiday. If shift is NEXT_BUSINESS -> 2026-05-04
    const ruleWithShift: DueRule = {
      kind: "FIXED_DAY",
      day: 1,
      shift: "NEXT_BUSINESS",
    }
    expect(resolveDueDate(ruleWithShift, "2026-05")).toBe("2026-05-04")

    // Without shift -> remains 2026-05-01
    const ruleNoShift: DueRule = {
      kind: "FIXED_DAY",
      day: 1,
      shift: "NONE",
    }
    expect(resolveDueDate(ruleNoShift, "2026-05")).toBe("2026-05-01")
  })
})
