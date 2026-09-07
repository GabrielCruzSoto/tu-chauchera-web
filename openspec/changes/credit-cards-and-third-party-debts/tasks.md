# Implementation Tasks: credit-cards-and-third-party-debts

## Review Workload Forecast
- Estimated Total Changed Lines: ~650 lines
- 400-line budget risk: Medium / Split recommended
- Strategy: `auto-chain` (2 PRs secuenciales)

---

### PR 1: Core Domain, Cycle Calculators & Store Slice (`feat/credit-cards-core`)
- [ ] **Task 1.1:** Extender `src/shared/types/domain.ts` con interfaces `CreditCardAccount`, `CreditCardPlastic`, `CreditCardPurchase`, `ThirdPartyReceivable`, `ThirdPartyRepayment`.
- [ ] **Task 1.2:** Crear suite de pruebas unitarias y lógica de ciclos en `src/features/credit-cards/utils/cycleCalculators.ts` (determinación de período según fecha de compra y día de corte).
- [ ] **Task 1.3:** Crear `creditCardSlice.ts` con acciones para agregar/editar cuentas, plásticos, compras y cobranzas de terceros.
- [ ] **Task 1.4:** Integrar el slice con el root store de Zustand y persistencia cifrada.

---

### PR 2: UI Modals, Dashboard & Third-Party Receivables Management (`feat/credit-cards-ui`)
- [ ] **Task 2.1:** Diseñar e implementar modal de creación/edición de tarjeta con plásticos adicionales dinámicos (`CreditCardAccountModal.tsx`).
- [ ] **Task 2.2:** Diseñar e implementar modal de registro de compras con desglose de cuotas y selector de "Propio" vs "Tercero" (`CreditCardPurchaseModal.tsx`).
- [ ] **Task 2.3:** Crear vista de gestión de cobranzas de terceros con registro de pagos parciales y totales (`ThirdPartyReceivablesView.tsx`).
- [ ] **Task 2.4:** Integrar resumen de tarjetas en el dashboard principal y validar exclusión de compras de terceros en métricas de gastos personales.
- [ ] **Task 2.5:** Pruebas de integración E2E y verificación final.
