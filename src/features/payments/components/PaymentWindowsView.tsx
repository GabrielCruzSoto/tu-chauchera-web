import React, { useState } from 'react'
import { formatCLP } from '@/shared/types/money'
import { usePaymentPlan } from '../hooks/usePaymentPlan'
import type { DebtPayoffStrategy, PaymentWindow } from '../domain/types'

interface PaymentWindowsViewProps {
  currentPeriod: string // YYYY-MM
}

export const PaymentWindowsView: React.FC<PaymentWindowsViewProps> = ({ currentPeriod }) => {
  const [strategy, setStrategy] = useState<DebtPayoffStrategy>('AVALANCHE')
  const { windows, metrics, prioritizedDebts } = usePaymentPlan(currentPeriod, strategy)

  const getBurdenBadge = () => {
    switch (metrics.burdenLevel) {
      case 'HEALTHY':
        return {
          label: 'Saludable (<30%)',
          color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
          desc: 'Tu nivel de deuda está dentro de los límites recomendados.',
        }
      case 'CAUTION':
        return {
          label: 'Alerta (30% - 35%)',
          color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
          desc: 'Estás cerca del límite de sobreendeudamiento. Evita tomar nuevos créditos.',
        }
      case 'CRITICAL':
        return {
          label: 'Crítico (>35%)',
          color: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
          desc: 'Sobreendeudamiento detectado. Prioriza pagar capital y evalúa consolidar deudas.',
        }
    }
  }

  const badge = getBurdenBadge()

  return (
    <div className="space-y-6">
      {/* ─── Financial Health & Committed Funds KPI Header ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Ingreso vs Comprometido */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Dinero Comprometido al Cobrar
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatCLP(metrics.totalCommittedCents)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Debe reservarse el día de pago (
            {metrics.totalMonthlyIncomeCents > 0
              ? `${Math.round((metrics.totalCommittedCents / metrics.totalMonthlyIncomeCents) * 100)}% de tu ingreso`
              : 'Sin ingresos registrados'}
            )
          </div>
        </div>

        {/* KPI 2: Carga Financiera (Deudas / Ingreso) */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Carga Financiera
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}
            >
              {badge.label}
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {metrics.financialBurdenPercentage}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Cuotas de deuda: {formatCLP(metrics.totalDebtInstallmentsCents)}
          </div>
        </div>

        {/* KPI 3: Disponible Libre */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Disponible Libre Mensual
          </div>
          <div
            className={`text-2xl font-bold ${metrics.freeDisposableCents < 0 ? 'text-rose-600' : 'text-emerald-600'}`}
          >
            {formatCLP(metrics.freeDisposableCents)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Para ahorro, imprevistos y gastos variables diarios.
          </div>
        </div>
      </div>

      {/* ─── Payment Windows Cards ─── */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Ventanas de Pago</h3>
          <p className="text-sm text-muted-foreground">
            Organiza tus desembolsos según las fechas en que ingresa tu dinero. Separa lo
            comprometido apenas cobres.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {windows.map((w: PaymentWindow) => (
            <div
              key={w.id}
              className="rounded-xl border border-border bg-card shadow-xs overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground text-sm">{w.name}</h4>
                  <span className="text-xs font-mono font-medium text-foreground bg-background px-2 py-1 rounded-md border border-border">
                    {formatCLP(w.totalAmountCents)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{w.description}</p>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-amber-600 font-medium">
                    Pendiente: {formatCLP(w.totalPendingCents)}
                  </span>
                  <span className="text-emerald-600 font-medium">
                    Pagado: {formatCLP(w.totalPaidCents)}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 space-y-2">
                {w.items.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-6">
                    No hay obligaciones en esta ventana para este mes.
                  </p>
                ) : (
                  w.items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 hover:bg-muted/40 transition-colors text-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          Día {item.dueDay}
                        </span>
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-1.5">
                            {item.title}
                            {item.isDebt && (
                              <span className="text-[10px] bg-purple-500/10 text-purple-600 border border-purple-500/20 px-1.5 py-0.2 rounded font-normal">
                                Deuda
                              </span>
                            )}
                          </div>
                          {item.subtitle && (
                            <div className="text-[11px] text-muted-foreground">{item.subtitle}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">
                          {formatCLP(item.amountCents)}
                        </div>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                            item.isPaid
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-amber-500/10 text-amber-600'
                          }`}
                        >
                          {item.isPaid ? 'Pagado' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Debt Prioritization Simulator ─── */}
      {prioritizedDebts.length > 0 && (
        <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Estrategia de Pago Acelerado
              </h3>
              <p className="text-xs text-muted-foreground">
                Si cuentas con excedentes o deseas salir rápido de deudas, concéntralos en una sola
                obligación.
              </p>
            </div>
            <div className="flex rounded-lg border border-border p-1 bg-muted/40 text-xs">
              <button
                type="button"
                onClick={() => setStrategy('AVALANCHE')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  strategy === 'AVALANCHE'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Avalancha (Tasa Alta)
              </button>
              <button
                type="button"
                onClick={() => setStrategy('SNOWBALL')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  strategy === 'SNOWBALL'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Bola de Nieve (Saldo Menor)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {prioritizedDebts.map(debt => (
              <div
                key={debt.id}
                className={`p-3.5 rounded-lg border text-sm ${
                  debt.order === 1
                    ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border bg-background'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-muted-foreground">
                    #{debt.order} Prioridad
                  </span>
                  {debt.order === 1 && (
                    <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                      Foco Principal
                    </span>
                  )}
                </div>
                <div className="font-medium text-foreground truncate">{debt.title}</div>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Saldo restante:</span>
                    <span className="font-semibold text-foreground">
                      {formatCLP(debt.remainingBalanceCents)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Cuota mensual:</span>
                    <span>{formatCLP(debt.installmentAmountCents)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Cuotas pendientes:</span>
                    <span>{debt.remainingInstallments}</span>
                  </div>
                  {debt.interestRatePercentage !== undefined && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tasa / CAE:</span>
                      <span className="font-semibold text-purple-400">
                        {debt.interestRatePercentage}% anual
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
