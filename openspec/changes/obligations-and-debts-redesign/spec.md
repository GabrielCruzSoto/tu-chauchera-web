# SDD Spec: obligations-and-debts-redesign

## 1. Domain Types Specification (`src/shared/types/domain.ts`)

### 1.1 Types & Enums
```typescript
export type ObligationType = 'EXPENSE' | 'DEBT' | 'P2P_DEBT'

export type P2PRole = 
  | 'LENT_MY_CARD'       // User lent credit card to third party (third party owes user)
  | 'USED_THEIR_CARD'     // User used someone else's credit card (user owes third party)
  | 'DIRECT_LOAN_GIVEN'   // User loaned cash/money to third party
  | 'DIRECT_LOAN_TAKEN'   // User received cash loan from third party

export type MaintenanceSplitMode = 'FULL' | 'SPLIT_50_50' | 'CUSTOM_AMOUNT'
export type CommissionMode = 'SPREAD_ACROSS_INSTALLMENTS' | 'FIRST_INSTALLMENT_ONLY'

export interface CardFeeSurcharge {
  includeMaintenanceFee: boolean
  maintenanceFeeAmountCents?: Money
  maintenanceSplitMode?: MaintenanceSplitMode
  customMaintenanceCents?: Money
  
  includeOneTimeCommission: boolean
  totalCommissionCents?: Money
  commissionCollectionMode?: CommissionMode
}

export interface P2PMetadata {
  role: P2PRole
  thirdPartyName: string
  cardIssuer?: string
  productDescription: string
  baseInstallmentAmountCents: Money
  surcharges?: CardFeeSurcharge
  totalMonthlyChargeCents: Money
  linkedPaymentDueDay?: number
}
```

### 1.2 Extended Obligation Structure
```typescript
export interface Obligation {
  id: UUID
  type?: ObligationType        // Defaults to 'DEBT' if undefined
  categoryId: UUID
  subcategory: string          // Provider / Bank / Person
  detail: string               // Description
  
  totalAmountCents: Money
  installmentAmountCents: Money
  totalInstallments: number
  currentInstallment: number
  isRecurringIndefinite?: boolean
  
  p2pMetadata?: P2PMetadata

  startDate: ISODate
  dueDay: number
  status: ObligationStatus
  createdAt: ISODate
  updatedAt: ISODate
  renegotiatedFromId?: UUID
}
```

## 2. Requirements & Business Rules

### BR-01: Obligation Type Classification
- **Gasto Recurrente (`EXPENSE`):** Requires `categoryId`, `subcategory` (provider), `installmentAmountCents` (monthly estimate/fixed cost), `dueDay`, `startDate`. `isRecurringIndefinite` defaults to `true`. `totalInstallments` defaults to 12 (rolling 1-year window) and `totalAmountCents` = `installmentAmountCents * 12`.
- **Deuda Financiera (`DEBT`):** Requires `categoryId`, `subcategory` (bank/institution), `totalAmountCents`, `installmentAmountCents`, `totalInstallments`, `currentInstallment`, `dueDay`, `startDate`.
- **Deuda entre Personas (`P2P_DEBT`):** Requires `p2pMetadata` containing `role`, `thirdPartyName`, `productDescription`, `baseInstallmentAmountCents`, `totalMonthlyChargeCents`, and optional `surcharges`.

### BR-02: Surcharge Calculation Engine
For `role === 'LENT_MY_CARD'`:
1. $\text{Maintenance Surcharge} =$
   - If `maintenanceSplitMode === 'FULL'`: $100\%$ of `maintenanceFeeAmountCents`.
   - If `maintenanceSplitMode === 'SPLIT_50_50'`: $\lfloor \text{maintenanceFeeAmountCents} / 2 \rfloor$.
   - If `maintenanceSplitMode === 'CUSTOM_AMOUNT'`: `customMaintenanceCents`.
2. $\text{Commission Surcharge per Installment} =$
   - If `commissionCollectionMode === 'SPREAD_ACROSS_INSTALLMENTS'`: $\lfloor \text{totalCommissionCents} / \text{totalInstallments} \rfloor$.
   - If `commissionCollectionMode === 'FIRST_INSTALLMENT_ONLY'`: $\text{totalCommissionCents}$ in installment 1, $0$ in subsequent.
3. $\text{Total Monthly Charge} = \text{Base Installment} + \text{Maintenance Surcharge} + \text{Commission Surcharge}$.

### BR-03: Backward Compatibility
- Any serialized JSON without `type` or `p2pMetadata` parses as a regular `DEBT`.
- No database or storage migrations required.

## 3. UI/UX Contract

- **Form Modal:** Segmented control tabs with clear icons:
  - 💡 **Gasto Recurrente**
  - 🏦 **Deuda Financiera**
  - 👥 **Entre Personas**
- **Dynamic Field Visibility:** Only relevant fields rendered per active tab.
- **WhatsApp Summary Exporter:** Button in P2P obligations to copy formatted WhatsApp payment reminder string.
