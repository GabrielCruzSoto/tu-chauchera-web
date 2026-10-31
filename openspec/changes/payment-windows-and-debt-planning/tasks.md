# SDD Tasks: payment-windows-and-debt-planning

## Task Breakdown

### Phase 1: Core Pure Calculations & Tests
- [ ] **Task 1.1:** Create domain types for payment windows and financial health in `src/features/payments/domain/types.ts`.
- [ ] **Task 1.2:** Implement `buildPaymentCalendar.ts` (aggregates installments + credit card monthly balances). Add unit tests with Vitest.
- [ ] **Task 1.3:** Implement `assignPaymentWindows.ts` (partitions calendar items into income-anchored windows, calculates committed funds). Add unit tests with Vitest.
- [ ] **Task 1.4:** Implement `calculateFinancialHealth.ts` (computes Carga Financiera, alert thresholds, disposable balance). Add unit tests with Vitest.
- [ ] **Task 1.5:** Implement `prioritizeDebts.ts` (Avalanche vs Snowball algorithm). Add unit tests with Vitest.

### Phase 2: React Hook & State Wiring
- [ ] **Task 2.1:** Create `usePaymentPlan.ts` combining store states (`useObligationsStore`, `useCreditCardStore`, `useIncomeStore`) into reactive payment windows and health indicators.
- [ ] **Task 2.2:** Add unit tests for `usePaymentPlan`.

### Phase 3: UI Dashboard
- [ ] **Task 3.1:** Create `PaymentWindowsView.tsx` with tabs/cards for:
  - Resumen de Fondos Comprometidos (porcentaje de ingreso comprometido al cobrar).
  - Semáforo de Carga Financiera (< 30% Saludable, 30-35% Alerta, > 35% Crítico).
  - Tarjetas de Ventanas de Pago ("Ventana Fin de Mes" y "Ventana Quincenal") con desglose de ítems pendientes/pagados.
  - Simulador de Prioridad de Deudas (Selector Avalancha vs Bola de Nieve).
- [ ] **Task 3.2:** Wire the view into navigation / main layout.
- [ ] **Task 3.3:** Run comprehensive test suite (`npm run test` and `npm run typecheck`).
