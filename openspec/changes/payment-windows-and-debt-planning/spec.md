# SDD Specification: payment-windows-and-debt-planning

## 1. Domain Types & Pure Calculations (`src/features/payments/domain/`)

### 1.1 Payment Windows
An income event establishes an anchor. A payment window spans from an income anchor to the next anchor (or end of month).
```typescript
export interface PaymentItem {
  id: string
  title: string
  amountCents: number
  dueDate: string // YYYY-MM-DD
  dueDay: number
  sourceType: 'INSTALLMENT' | 'CREDIT_CARD'
  sourceId: string
  isPaid: boolean
  categoryName?: string
  categoryColor?: string
}

export interface PaymentWindow {
  id: string
  name: string // e.g. "Ventana Fin de Mes (Sueldo) / Días 28 al 05"
  startDay: number
  endDay: number
  items: PaymentItem[]
  totalAmountCents: number
  totalPendingCents: number
  totalPaidCents: number
}
```

### 1.2 Financial Health Indicators
```typescript
export interface FinancialHealthMetrics {
  totalMonthlyIncomeCents: number
  totalDebtInstallmentsCents: number
  totalRecurringExpensesCents: number
  financialBurdenPercentage: number // (totalDebtInstallmentsCents / totalMonthlyIncomeCents) * 100
  isOverburdened: boolean // financialBurdenPercentage > 35%
  committedFundsCents: number // All fixed commitments due in the month
  freeDisposableCents: number // Income - Committed
}
```

### 1.3 Prioritization Models
```typescript
export type PrioritizationMethod = 'AVALANCHE' | 'SNOWBALL'

export interface PrioritizedDebtItem {
  obligationId: string
  name: string
  remainingBalanceCents: number
  monthlyInstallmentCents: number
  ratePercentage?: number
  order: number
}
```

## 2. State & Hooks Integration
- Custom hook `usePaymentPlan(targetPeriod: Period)`:
  - Consumes `useObligationsStore`, `useCreditCardStore`, and `useIncomeStore`.
  - Computes active obligations for `targetPeriod`.
  - Partitions them into default windows:
    - **Ventana 1 (Cobro Fin/Inicio de Mes):** Días 25 al 5 (tarjetas, créditos de fin de mes, arriendos).
    - **Ventana 2 (Quincena):** Días 6 al 24 (créditos automotrices, otros gastos de quincena).
  - Calculates metrics and committed amounts without persisting derived data.

## 3. Requirements & Constraints
- Pure calculations must be completely decoupled from React and Zustand for 100% Vitest coverage.
- Zero external network dependencies (fully local-first and compatible with offline Drive sync).
