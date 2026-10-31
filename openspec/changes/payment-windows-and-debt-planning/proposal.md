# SDD Proposal: payment-windows-and-debt-planning

## Executive Summary
Implement an intelligent cash flow and debt planning layer in Tu Chauchera Web based on **Payment Windows (Ventanas de Pago)** and financial health indicators. Instead of treating obligations in isolation, this system groups obligations and credit card due dates around user salary/income dates, calculates mandatory provisions ("montos comprometidos"), evaluates financial burden (Carga Financiera), and recommends prioritization strategies (Avalancha vs. Bola de Nieve).

## Motivation & Problem Statement
1. **Disconnected Due Dates:** Users typically pay obligations on scattered dates (e.g., credit cards on the 5th, consumer loans on the last business day, auto loans on the 15th). Without income-linked windows, users face cash-flow blind spots and risk late payments or overdrafts.
2. **Missing Chilean Banking Specifics:** In Chile, many obligations and salaries are pegged to the "last business day of the month" (último día hábil) or shift when falling on weekends/holidays. The current system only supports numeric `dueDay: 1-31`.
3. **No Debt Strategy Guidance:** Users with multiple debts lack quantitative metrics to know if they are overindebted (Carga Financiera > 30-35%) and lack deterministic plans to pay them off (Avalanche vs. Snowball).

## Scope & Phased Implementation

### Phase 1: Pure Derived Planning (No Schema Changes)
- **Features in `src/features/payments/`:**
  - `buildPaymentCalendar`: Aggregates active installments and credit card closing/due obligations for a target month.
  - `assignPaymentWindows`: Groups obligations into income-anchored windows (e.g. Ventana Fin/Inicio de Mes vs. Ventana Quincenal).
  - Calculates "Dinero Comprometido" (funds that must be isolated immediately upon receiving income).
  - Derived execution via custom hook `usePaymentPlan`.

### Phase 2: Business Days, Chilean Holidays & Due Rules (Schema Migration)
- **Domain extension `DueRule`:**
  - `FIXED_DAY` with shift options (`NONE`, `NEXT_BUSINESS`, `PREV_BUSINESS`).
  - `LAST_BUSINESS_DAY`.
- **Static Chilean Holiday Calendar:** Zero-backend, local table of official Chilean holidays (`src/shared/constants/chileanHolidays.ts`).
- **Income Pay Schedule:** Support configuring salary payment dates for `FIXED` income using `DueRule`.
- Schema version bump and migration in `src/shared/migrations/`.

### Phase 3: Interest Rates, Carga Financiera & Debt Prioritization
- Optional annual/monthly rate (`annualRatePercentage` or `caePercentage`) in `Obligation`.
- Indicator: **Carga Financiera** = `Total Cuotas Deuda / Ingreso Líquido`.
- Payoff Planner: Avalanche (highest rate first) vs. Snowball (lowest balance first).

## Non-Goals
- Real-time bank scraping or automated PAC/PAT debit execution.
- External API calls for holidays (will use self-contained, typed calendar constants).

## Success Criteria
- Deterministic calculation of payment windows with 100% pure function test coverage.
- Clear UI dashboard in `src/features/payments/` displaying upcoming payment windows, committed amounts, and debt health indicators.
- Backward compatibility preserved with existing Google Drive encrypted stores.
