# SDD Exploration: obligations-and-debts-redesign

## Context and Problem Statement
The current implementation of the Financial Obligations module (`ObligationFormModal`, `domain.ts`, `obligationsSlice`, and `FinancialMatrix`) forces all user expenses into a rigid financial debt paradigm (total installments, total loan amount, amortization).
This fails for:
1. **Recurring Expenses (Gastos Recurrentes):** Utilities (water, power), subscriptions (Netflix, Spotify), rent, school fees — which are ongoing monthly expenses with no "total loan amount" or "installment 1 of 600".
2. **Institutional Debts (Deudas Financieras):** Bank loans, mortgages, auto loans, personal credit card purchases with installments.
3. **P2P Obligations & Shared Credit Card Lending (Deudas y Préstamos con Terceros):**
   - User lends their own credit card for a third party to buy a product in installments.
   - Surcharge transfer: Passing card monthly maintenance fees (100%, 50/50, custom) and bank transaction taxes/commissions (ITE prorated).
   - User uses someone else's credit card.
   - Direct personal loans.

## Codebase Touchpoints
1. `src/shared/types/domain.ts`:
   - Extend `Obligation` and `CreateObligationDTO` with `type: 'EXPENSE' | 'DEBT' | 'P2P_DEBT'`.
   - Add `isRecurringIndefinite?: boolean`, `p2pMetadata?: P2PMetadata`, `surcharges?: CardFeeSurcharge`.
2. `src/features/obligations/components/ObligationFormModal.tsx`:
   - Replace single monolithic form with an adaptive multi-tab segmented control (`Gastos Recurrentes` | `Deudas Financieras` | `Entre Personas`).
   - Dynamic validation and UI tailored per category.
3. `src/features/obligations/utils/installmentGenerator.ts`:
   - For recurring indefinite expenses (`isRecurringIndefinite: true`), generate eager projection windows (e.g. 12/24 rolling months) or dynamic horizon.
   - For P2P credit card lending, calculate total monthly charge including maintenance fee and prorated commissions.
4. `src/features/matrix/hooks/useMatrixComputation.ts` & `FinancialMatrix.tsx`:
   - Support distinguishing between debt amortization, recurring expenses, and third-party reimbursement receivables.
5. `src/features/obligations/components/MonthlyInstallmentsView.tsx`:
   - Add filter / section for "Cobros a Terceros" with quick status action ("Marcar como transferido").

## Architecture Decisions
- **Zero Breaking Changes:** Existing obligations without `type` default gracefully to `'DEBT'`.
- **Eager Generation Alignment:** Installments for indefinite expenses generated for 12 forward months from start date with auto-extension or rolling period support.
- **Bi-directional P2P:** Clear distinction between `LENT_MY_CARD` (receivable) and `USED_THEIR_CARD` (payable).
