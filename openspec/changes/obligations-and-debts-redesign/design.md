# SDD Design: obligations-and-debts-redesign

## 1. Architectural Overview

```
                               ┌─────────────────────────────┐
                               │   ObligationFormModal.tsx   │
                               └──────────────┬──────────────┘
                                              │
              ┌───────────────────────────────┼───────────────────────────────┐
              ▼                               ▼                               ▼
    ┌──────────────────┐            ┌──────────────────┐            ┌──────────────────┐
    │  RecurringTab    │            │  DebtTab         │            │  P2PTab          │
    │  - No total loan │            │  - Bank selector │            │  - Lent card UI  │
    │  - Simple monthly│            │  - Amortization  │            │  - Surcharge fee │
    │  - Category pick │            │  - Cuotas X / Y  │            │  - Person info   │
    └─────────┬────────┘            └─────────┬────────┘            └─────────┬────────┘
              │                               │                               │
              └───────────────────────────────┼───────────────────────────────┘
                                              ▼
                               ┌─────────────────────────────┐
                               │     obligationsSlice.ts     │
                               │  - addObligation(DTO)       │
                               │  - generateInstallments()   │
                               └──────────────┬──────────────┘
                                              ▼
                               ┌─────────────────────────────┐
                               │    Monthly & Matrix Views   │
                               │  - Badges & Types           │
                               │  - WhatsApp reminder copy   │
                               └─────────────────────────────┘
```

## 2. Component Structure & State Architecture

### 2.1 Modal Component Decomposition
`ObligationFormModal.tsx` will manage:
- Active Tab state: `'EXPENSE' | 'DEBT' | 'P2P_DEBT'`.
- P2P Sub-role: `'LENT_MY_CARD' | 'USED_THEIR_CARD' | 'DIRECT_LOAN'`.
- Live Surcharge calculation preview: Updates the total monthly charge in real-time as the user toggles maintenance fees or commissions.

### 2.2 Surcharge Calculator Helper (`surchargeCalculator.ts`)
A pure helper function:
```typescript
export function computeTotalMonthlyP2PCharge(
  baseAmount: number,
  totalInstallments: number,
  surcharges?: CardFeeSurcharge,
  installmentNumber: number = 1
): number {
  if (!surcharges) return baseAmount
  let extra = 0
  
  if (surcharges.includeMaintenanceFee && surcharges.maintenanceFeeAmountCents) {
    if (surcharges.maintenanceSplitMode === 'SPLIT_50_50') {
      extra += Math.floor(surcharges.maintenanceFeeAmountCents / 2)
    } else if (surcharges.maintenanceSplitMode === 'CUSTOM_AMOUNT') {
      extra += surcharges.customMaintenanceCents ?? 0
    } else {
      extra += surcharges.maintenanceFeeAmountCents
    }
  }

  if (surcharges.includeOneTimeCommission && surcharges.totalCommissionCents) {
    if (surcharges.commissionCollectionMode === 'FIRST_INSTALLMENT_ONLY') {
      if (installmentNumber === 1) extra += surcharges.totalCommissionCents
    } else {
      extra += Math.floor(surcharges.totalCommissionCents / Math.max(1, totalInstallments))
    }
  }

  return baseAmount + extra
}
```

### 2.3 Visual Badges & WhatsApp Exporter
- In `ObligationsList.tsx` and `MonthlyInstallmentsView.tsx`:
  - `EXPENSE`: Display icon `💡` and badge "Gasto Recurrente".
  - `DEBT`: Display icon `🏦` and badge "Crédito X/Y".
  - `P2P_DEBT`: Display icon `💳` or `👥` with third-party person name.
  - If `role === 'LENT_MY_CARD'`, add a button "📋 Recordatorio WhatsApp" that copies the payment breakdown directly to clipboard.
