import { describe, it, expect } from 'vitest'
import {
  calculateBillingPeriod,
  calculateInstallmentPeriods,
  calculateRepaymentStatus,
} from './cycleCalculators'
import { toMoney } from '../../../shared/types/money'

describe('cycleCalculators', () => {
  describe('calculateBillingPeriod', () => {
    it('assigns to next month when card closes on 19th and pays on 5th next month (Chilean standard)', () => {
      // Purchases made up to closing day (19/05) are billed in May and paid in June (2026-06)
      const period1 = calculateBillingPeriod('2026-05-15', 19, 5)
      expect(period1).toBe('2026-06')

      // Purchases made after closing day (21/05) are billed in June and paid in July (2026-07)
      const period2 = calculateBillingPeriod('2026-05-21', 19, 5)
      expect(period2).toBe('2026-07')
    })

    it('assigns to same month when card closing day <= due day (same month payment cycle)', () => {
      const period1 = calculateBillingPeriod('2026-05-10', 15, 28)
      expect(period1).toBe('2026-05')

      const period2 = calculateBillingPeriod('2026-05-16', 15, 28)
      expect(period2).toBe('2026-06')
    })

    it('handles year boundary across December and January', () => {
      const period = calculateBillingPeriod('2026-12-25', 19, 5)
      expect(period).toBe('2027-02')
    })
  })

  describe('calculateInstallmentPeriods', () => {
    it('returns consecutive periods for total installments', () => {
      const periods = calculateInstallmentPeriods('2026-05', 3)
      expect(periods).toEqual(['2026-05', '2026-06', '2026-07'])
    })

    it('handles year wrap for installments', () => {
      const periods = calculateInstallmentPeriods('2026-11', 3)
      expect(periods).toEqual(['2026-11', '2026-12', '2027-01'])
    })
  })

  describe('calculateRepaymentStatus', () => {
    it('returns PENDIENTE when 0 collected', () => {
      const status = calculateRepaymentStatus(toMoney(10000), toMoney(0))
      expect(status).toBe('PENDIENTE')
    })

    it('returns COBRADO_PARCIAL when partially paid', () => {
      const status = calculateRepaymentStatus(toMoney(10000), toMoney(5000))
      expect(status).toBe('COBRADO_PARCIAL')
    })

    it('returns COBRADO_TOTAL when fully paid or overpaid', () => {
      const status = calculateRepaymentStatus(toMoney(10000), toMoney(10000))
      expect(status).toBe('COBRADO_TOTAL')

      const overpaid = calculateRepaymentStatus(toMoney(10000), toMoney(12000))
      expect(overpaid).toBe('COBRADO_TOTAL')
    })
  })
})
