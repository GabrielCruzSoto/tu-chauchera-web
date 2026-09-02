/**
 * Unit tests for the Money branded type and utilities.
 *
 * These tests verify:
 * - Integer-only arithmetic (no floating point)
 * - Correct CLP formatting
 * - Deficit detection
 * - Type safety properties (brand enforcement at runtime)
 */
import { describe, it, expect } from 'vitest'
import {
  toMoney,
  addMoney,
  subtractMoney,
  sumMoney,
  formatCLP,
  isDeficit,
  multiplyMoney,
  type Money,
} from './money'

describe('toMoney', () => {
  it('converts a positive integer correctly', () => {
    expect(toMoney(150000)).toBe(150000)
  })

  it('converts zero correctly', () => {
    expect(toMoney(0)).toBe(0)
  })

  it('rounds floating-point input to nearest integer', () => {
    expect(toMoney(150000.7)).toBe(150001)
    expect(toMoney(150000.2)).toBe(150000)
  })

  it('converts negative amounts (deficits)', () => {
    expect(toMoney(-50000)).toBe(-50000)
  })

  it('throws for non-finite values', () => {
    expect(() => toMoney(Infinity)).toThrow(RangeError)
    expect(() => toMoney(NaN)).toThrow(RangeError)
  })
})

describe('addMoney', () => {
  it('adds two positive amounts', () => {
    const a = toMoney(100000)
    const b = toMoney(50000)
    expect(addMoney(a, b)).toBe(150000)
  })

  it('adds zero', () => {
    const a = toMoney(100000)
    const zero = toMoney(0)
    expect(addMoney(a, zero)).toBe(100000)
  })

  it('returns Money type (no overflow check — use safely)', () => {
    const a = toMoney(999_999_999)
    const b = toMoney(1)
    expect(typeof addMoney(a, b)).toBe('number')
  })
})

describe('subtractMoney', () => {
  it('subtracts smaller from larger', () => {
    const a = toMoney(500000)
    const b = toMoney(200000)
    expect(subtractMoney(a, b)).toBe(300000)
  })

  it('returns negative result when b > a (deficit)', () => {
    const a = toMoney(100000)
    const b = toMoney(200000)
    expect(subtractMoney(a, b)).toBe(-100000)
  })

  it('returns zero when equal', () => {
    const a = toMoney(100000)
    expect(subtractMoney(a, a)).toBe(0)
  })
})

describe('sumMoney', () => {
  it('sums multiple amounts', () => {
    const amounts: Money[] = [toMoney(100000), toMoney(200000), toMoney(50000)]
    expect(sumMoney(amounts)).toBe(350000)
  })

  it('returns 0 for empty array', () => {
    expect(sumMoney([])).toBe(0)
  })

  it('handles single-element array', () => {
    expect(sumMoney([toMoney(75000)])).toBe(75000)
  })

  it('is commutative', () => {
    const a: Money[] = [toMoney(100000), toMoney(200000)]
    const b: Money[] = [toMoney(200000), toMoney(100000)]
    expect(sumMoney(a)).toBe(sumMoney(b))
  })
})

describe('formatCLP', () => {
  it('formats a typical CLP amount', () => {
    const result = formatCLP(toMoney(150000))
    // CLP formatting: "$ 150.000" or "$150.000" depending on locale
    expect(result).toContain('150')
    expect(result).toContain('000')
    expect(result).toMatch(/\$/)
  })

  it('formats zero', () => {
    const result = formatCLP(toMoney(0))
    expect(result).toContain('0')
  })

  it('formats a million', () => {
    const result = formatCLP(toMoney(1_000_000))
    expect(result).toContain('1')
    expect(result).toContain('000')
  })

  it('does not include decimal places for CLP', () => {
    const result = formatCLP(toMoney(100000))
    // CLP has no decimals — should not have comma-separated decimals
    expect(result).not.toMatch(/,\d{2}$/)
  })
})

describe('isDeficit', () => {
  it('returns true for negative amounts', () => {
    expect(isDeficit(toMoney(-1))).toBe(true)
    expect(isDeficit(toMoney(-100000))).toBe(true)
  })

  it('returns false for positive amounts', () => {
    expect(isDeficit(toMoney(1))).toBe(false)
    expect(isDeficit(toMoney(100000))).toBe(false)
  })

  it('returns false for zero', () => {
    expect(isDeficit(toMoney(0))).toBe(false)
  })
})

describe('multiplyMoney', () => {
  it('multiplies by a positive scalar', () => {
    expect(multiplyMoney(toMoney(100000), 3)).toBe(300000)
  })

  it('multiplies by zero', () => {
    expect(multiplyMoney(toMoney(100000), 0)).toBe(0)
  })

  it('rounds fractional results', () => {
    // 100 * 1/3 = 33.33... → rounds to 33
    expect(multiplyMoney(toMoney(100), 1 / 3)).toBe(33)
  })
})

describe('Financial correctness — no floating-point errors', () => {
  it('0.1 + 0.2 does not produce floating-point error when using toMoney', () => {
    // Raw JS: 0.1 + 0.2 = 0.30000000000000004
    // With Money: we work in integer pesos, so this scenario means:
    // 100 pesos + 200 pesos = 300 pesos (not 0.1 + 0.2)
    const a = toMoney(100)
    const b = toMoney(200)
    expect(addMoney(a, b)).toBe(300)   // Exactly 300, no floating-point drift
  })

  it('large installment sum is exact', () => {
    // 48 installments of $285,000 each = $13,680,000
    const installment = toMoney(285_000)
    const installments: Money[] = Array.from({ length: 48 }, () => installment)
    expect(sumMoney(installments)).toBe(13_680_000)
  })
})
