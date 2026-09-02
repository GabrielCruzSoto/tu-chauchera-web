/**
 * Money — branded integer type for CLP (Chilean Peso) amounts.
 *
 * CLP has no decimal places. All amounts are stored and computed
 * as integer pesos (NOT cents). The brand prevents accidental use
 * of raw numbers as currency values.
 *
 * NEVER use floating-point arithmetic for money operations.
 */
declare const __moneyBrand: unique symbol

/** Integer CLP amount. Never use raw `number` for currency. */
export type Money = number & { readonly [__moneyBrand]: 'Money' }

/**
 * Convert a raw integer amount (CLP pesos) to the Money branded type.
 * Rounds to nearest integer to prevent floating-point input accidents.
 */
export function toMoney(amount: number): Money {
  if (!Number.isFinite(amount)) {
    throw new RangeError(`toMoney: received non-finite value ${amount}`)
  }
  return Math.round(amount) as Money
}

/** Add two Money values. Always returns Money. */
export function addMoney(a: Money, b: Money): Money {
  return (a + b) as Money
}

/** Subtract b from a. Returns Money (can be negative for deficits). */
export function subtractMoney(a: Money, b: Money): Money {
  return (a - b) as Money
}

/** Sum an array of Money values. Returns 0 as Money for empty arrays. */
export function sumMoney(amounts: Money[]): Money {
  return amounts.reduce<Money>((acc, m) => addMoney(acc, m), 0 as Money)
}

/**
 * Format a Money value as a CLP currency string.
 * Example: toMoney(150000) → "$ 150.000"
 */
export function formatCLP(amount: Money): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Check if a Money value represents a financial deficit (negative). */
export function isDeficit(amount: Money): boolean {
  return amount < 0
}

/** Safe multiplication: Money × scalar integer. */
export function multiplyMoney(amount: Money, scalar: number): Money {
  return Math.round(amount * scalar) as Money
}
