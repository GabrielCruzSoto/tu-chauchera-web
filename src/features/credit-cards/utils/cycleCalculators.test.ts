import { describe, it, expect } from 'vitest'
import {
  calculateBillingPeriod,
  calculateInstallmentPeriods,
  calculateRepaymentStatus,
} from './cycleCalculators'
import { toMoney } from '../../../shared/types/money'

describe('cycleCalculators', () => {
  describe('calculateBillingPeriod', () => {
    it('assigns to current month cycle if purchase is on or before closingDay', () => {
      const period = calculateBillingPeriod('2026-05-15', 20)
      expect(period).toBe('2026-05')
    })

    it('assigns to current month cycle if purchase is exactly on closingDay', () => {
      const period = calculateBillingPeriod('2026-05-20', 20)
      expect(period).toBe('2026-05')
    })

    it('assigns to next month cycle if purchase is after closingDay', () => {
      const period = calculateBillingPeriod('2026-05-21', 20)
      expect(period).toBe('2026-06')
    })

    it('handles year boundary when purchase is after closingDay in December', () => {
      const period = calculateBillingPeriod('2026-12-25', 20)
      expect(period).toBe('2027-01')
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
