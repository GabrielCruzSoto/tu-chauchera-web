# SDD Tasks: obligations-and-debts-redesign

## Work Units Breakdown

### Batch 1: Domain Models, Types & Calculation Engine
- [ ] **Task 1.1:** Extend `src/shared/types/domain.ts` with `ObligationType`, `P2PRole`, `CardFeeSurcharge`, and `P2PMetadata`. Update `Obligation` and `CreateObligationDTO`.
- [ ] **Task 1.2:** Implement `src/features/obligations/utils/surchargeCalculator.ts` and unit tests in `src/features/obligations/utils/surchargeCalculator.test.ts`.
- [ ] **Task 1.3:** Update `src/features/obligations/utils/installmentGenerator.ts` to handle `isRecurringIndefinite` and calculate monthly installments with P2P surcharges. Update tests.

### Batch 2: Store Slices & State Management
- [ ] **Task 2.1:** Update `src/features/obligations/store/obligationsSlice.ts` to handle the extended DTO fields and pass metadata to the store and sync queue.
- [ ] **Task 2.2:** Update `src/features/obligations/store/obligationsSlice.test.ts` to verify creating `EXPENSE`, `DEBT`, and `P2P_DEBT` obligations.

### Batch 3: Modal UI Redesign (`ObligationFormModal.tsx`)
- [ ] **Task 3.1:** Implement segmented tabs for `💡 Gasto Recurrente`, `🏦 Deuda Financiera`, and `👥 Entre Personas`.
- [ ] **Task 3.2:** Implement specialized inputs for Recurring Expenses (simplified monthly amount, due day, indefinite toggle).
- [ ] **Task 3.3:** Implement specialized inputs for P2P Lending ("Presté mi tarjeta", person name, card issuer, maintenance fee transfer, commission transfer).
- [ ] **Task 3.4:** Update unit tests in `src/features/obligations/components/ObligationFormModal.test.tsx`.

### Batch 4: List, Monthly Calendar, Badges & WhatsApp Exporter
- [ ] **Task 4.1:** Update `CategoryBadge.tsx` and `ObligationsList.tsx` to display distinct badges for Expenses, Institutional Debts, and P2P Debts.
- [ ] **Task 4.2:** In `MonthlyInstallmentsView.tsx`, add P2P breakdown with "Copiar Recordatorio WhatsApp" button.
- [ ] **Task 4.3:** Run all unit and integration tests (`npm test`) and verify build (`npm run build`).

---

## Review Workload Forecast
- **Estimated changed lines:** ~350–450 lines.
- **400-line budget risk:** Low / Moderate.
- **Chained PRs recommended:** No (Single autonomous slice within 800-line session budget).
- **Decision needed before apply:** No.
