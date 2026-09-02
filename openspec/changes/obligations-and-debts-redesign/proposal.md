# SDD Proposal: obligations-and-debts-redesign

## Executive Summary
Redesign the Financial Obligations module in Tu Chauchera Web to cleanly distinguish between **Recurring Expenses (Gastos Recurrentes)**, **Institutional Debts (Deudas Financieras)**, and **P2P Loans / Shared Credit Card Lending (Deudas y Compromisos entre Personas)**. The proposal includes specialized UX/UI tabs, domain model extensions, automatic calculation of credit card maintenance fees and commission pass-through, and differentiated presentation in the monthly calendar and Financial Matrix.

## Motivation & Business Drivers
1. **Reduce Mental Overhead for Standard Expenses:** Users currently have to configure artificial installments (e.g. 12 or 60 cuotas) for ongoing expenses like power, water, rent, or Netflix.
2. **First-class P2P & Credit Card Lending:** In Latin America/Chile, lending one's credit card for a family member or friend to buy items in installments is extremely common. Users need to track who owes what, which card was used, and pass along maintenance costs (mantención) and credit taxes (impuesto timbres y estampillas).
3. **Accurate Cash Flow & Financial Matrix:** Expenses, liabilities (debt), and receivables (third-party reimbursements) should be categorized accurately without polluting the total debt KPI.

## Scope & Functional Capabilities

### 1. Adaptive Registration Modal (`ObligationFormModal.tsx`)
- **Segmented Control / Tabs:**
  - `💡 Gasto Recurrente`: Category, Provider/Detail, Monthly Amount (CLP), Frequency (Default Monthly), Due Day, Indefinite vs Fixed Term.
  - `🏦 Deuda Financiera`: Financial Institution, Credit Type, Total Loan Amount, Installment Amount, Total Installments, Current Installment, Due Day, Start Date.
  - `👥 Entre Personas / Terceros`:
    - Role / Direction:
      - `💳 Presté mi Tarjeta de Crédito`: Third-party name, card issuer, product description, base installment amount, installment count/progress, due day.
      - `⚙️ Traspaso de Costos de Tarjeta`: Option to pass maintenance fee (100%, 50/50, custom amount) and commissions/ITE (prorated or upfront in 1st installment).
      - `🛍️ Usé la Tarjeta de Alguien`: Creditor name, card issuer, monthly payment amount, due day.
      - `🤝 Préstamo Directo`: Loan given or received in cash/transfer, single payment or N installments.

### 2. Domain Model Extensions (`domain.ts`)
- Add `ObligationType = 'EXPENSE' | 'DEBT' | 'P2P_DEBT'`.
- Add `P2PRole = 'LENT_MY_CARD' | 'USED_THEIR_CARD' | 'DIRECT_LOAN_GIVEN' | 'DIRECT_LOAN_TAKEN'`.
- Add `CardFeeSurcharge` and `P2PMetadata` interfaces.
- Preserve backward compatibility by defaulting omitted `type` to `'DEBT'`.

### 3. Installment Generation & Projection (`installmentGenerator.ts`)
- Support `isRecurringIndefinite: true` by generating a standard 12-month rolling projection window.
- Calculate total monthly receivable for `LENT_MY_CARD` including surcharges.

### 4. Visual Distinctions & Management
- Distinct badges on `ObligationsList.tsx` and `MonthlyInstallmentsView.tsx`.
- Actionable WhatsApp message summary generator for third-party collection reminders.

## Non-Goals
- Automatic online bank scraping / open banking APIs.
- Legal contracts or promissory note drafting.
- Multicurrency UF conversion (planned for future phase).

## Success Criteria & Verification
- Creating a Recurring Expense requires no "total installments" or "total loan amount".
- Creating a "Presté mi Tarjeta" obligation automatically calculates the full monthly charge with surcharges and tracks third-party receivables.
- Existing obligations load and display seamlessly without schema migration breakage.
- Test coverage across generator, slice, modal, and computation hooks reaches 100% on new logic.
