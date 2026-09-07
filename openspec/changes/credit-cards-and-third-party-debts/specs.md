# Technical Specification: credit-cards-and-third-party-debts

## 1. Overview & Data Model Extensions

### 1.1 Credit Card Account & Plastics
Se incorporan las siguientes interfaces en `src/shared/types/domain.ts`:

```typescript
export type PlasticType = 'TITULAR' | 'ADICIONAL'

export interface CreditCardPlastic {
  id: UUID
  accountId: UUID
  holderName: string            // ej. "Gabriel Cruz", "Laura Soto"
  lastFourDigits: string        // ej. "1234"
  type: PlasticType
  createdAt: ISODate
  updatedAt: ISODate
}

export interface CreditCardAccount {
  id: UUID
  institution: string           // ej. "Banco Santander", "Banco de Chile"
  accountName: string           // ej. "Visa Signature", "Mastercard Black"
  creditLimitCents: Money       // Límite total asignado en centavos
  closingDay: number            // Día del mes en que cierra el ciclo (1-31)
  dueDay: number                // Día del mes en que vence el pago (1-31)
  plastics: CreditCardPlastic[] // Plástico titular y adicionales
  createdAt: ISODate
  updatedAt: ISODate
}
```

### 1.2 Credit Card Purchase & Third-Party Ownership

```typescript
export type PurchasePayerType = 'PROPIO' | 'TERCERO'
export type ThirdPartyReceivableStatus = 'PENDIENTE' | 'COBRADO_PARCIAL' | 'COBRADO_TOTAL'

export interface ThirdPartyRepayment {
  id: UUID
  amountCents: Money
  paymentDate: ISODate
  destinationAccount?: string | undefined  // ej. "Banco Estado Cuenta Corriente"
  notes?: string | undefined
}

export interface ThirdPartyReceivable {
  id: UUID
  thirdPartyName: string        // Contacto responsable
  purchaseId: UUID
  totalOwedCents: Money
  amountCollectedCents: Money   // Suma de repayments
  status: ThirdPartyReceivableStatus
  repayments: ThirdPartyRepayment[]
}

export interface CreditCardPurchase {
  id: UUID
  accountId: UUID
  plasticId: UUID               // Plástico que realizó el consumo
  description: string
  purchaseDate: ISODate
  totalAmountCents: Money
  totalInstallments: number     // 1 = al contado / sin cuotas
  firstInstallmentPeriod: Period // YYYY-MM asignado por fecha de compra vs closingDay
  payerType: PurchasePayerType
  thirdPartyReceivable?: ThirdPartyReceivable | undefined
  createdAt: ISODate
  updatedAt: ISODate
}
```

## 2. Business Rules & Logic

### 2.1 Cycle Period Assignment (`calculateBillingPeriod`)
Dada la fecha de compra `purchaseDate` y el `closingDay` de la tarjeta:
- Si `purchaseDate.day <= closingDay`: El primer vencimiento/resumen corresponde al ciclo actual (mes de facturación).
- Si `purchaseDate.day > closingDay`: El consumo entra en el ciclo del mes siguiente.
- Cada cuota sucesiva incrementa un mes en el período proyectado (`YYYY-MM`).

### 2.2 Metrics & Financial Matrix Isolation
- **Gastos Propios:** Solo se incluyen en los KPIs de gastos y presupuesto las compras con `payerType === 'PROPIO'` (o la porción propia).
- **Cuentas por Cobrar (Activo):** Las compras con `payerType === 'TERCERO'` se exponen en una vista especializada de "Cobranzas de Tarjeta" y se consideran un activo circulante / compensación de liquidez, sin alterar el ratio de gastos de vida.

### 2.3 Conciliación de Pagos Parciales
- Se valida que la suma de `repayments` no exceda `totalOwedCents`.
- Estado dinámico:
  - `amountCollectedCents === 0` -> `PENDIENTE`
  - `0 < amountCollectedCents < totalOwedCents` -> `COBRADO_PARCIAL`
  - `amountCollectedCents >= totalOwedCents` -> `COBRADO_TOTAL`

## 3. Storage & Persistence
- Estructura cifrada local-first integrada en el store general de Drive o en un namespace dedicado con versionado retrocompatible (`schemaVersion: 1.1.0`).
- No rompe las obligaciones existentes; se vincula como fuente de financiamiento o pasivo mensual consolidado.
