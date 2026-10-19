import React, { useState } from "react"
import { parseISO } from "date-fns"
import type { Installment, Obligation } from "@/shared/types/domain"
import { formatCLP } from "@/shared/types/money"
import { useAuthStore } from "@/store/authSlice"
import { useObligationsStore } from "@/features/obligations/store/obligationsSlice"
import { useCreditCardStore } from "@/features/credit-cards/store/creditCardSlice"
import { PaymentModal } from "@/features/obligations/components/PaymentModal"
import { getBurdenBadgeConfig } from "@/features/payments/domain/burdenBadge"
import { useTodaySummary, type TodayPaymentItem } from "../hooks/useTodaySummary"

interface TodayHomeProps {
  onNavigateToCalendar?: () => void
}

function getCountdownLabel(days: number): string {
  if (days < -1) return `Vencido hace ${Math.abs(days)} días`
  if (days === -1) return "Venció ayer"
  if (days === 0) return "Vence hoy"
  if (days === 1) return "Vence mañana"
  return `Vence en ${days} días`
}

function getCountdownClasses(days: number): string {
  if (days < 0) return "bg-rose-500/15 text-rose-300 border-rose-500/30"
  if (days <= 1) return "bg-amber-500/15 text-amber-300 border-amber-500/30"
  return "bg-sky-500/10 text-sky-300 border-sky-500/25"
}

const CountdownChip: React.FC<{ days: number }> = ({ days }) => (
  <span
    className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getCountdownClasses(days)}`}
  >
    {getCountdownLabel(days)}
  </span>
)

function formatShortDate(isoDate: string): string {
  const parsed = parseISO(isoDate)
  if (Number.isNaN(parsed.getTime())) return isoDate
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(parsed)
}

export const TodayHome: React.FC<TodayHomeProps> = ({ onNavigateToCalendar }) => {
  const user = useAuthStore((s) => s.user)
  const obligations = useObligationsStore((s) => s.obligations)
  const installments = useObligationsStore((s) => s.installments)
  const togglePeriodPaid = useCreditCardStore((s) => s.togglePeriodPaid)

  const { today, metrics, nextPayment, overdueItems, upcomingItems } = useTodaySummary()
  const [payingInstallment, setPayingInstallment] = useState<{
    installment: Installment
    obligation: Obligation
  } | null>(null)

  const firstName = user?.name?.trim().split(" ")[0] ?? ""
  const todayLabel = new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseISO(today))

  const hasIncome = metrics.totalMonthlyIncomeCents > 0
  const committedPct = hasIncome
    ? Math.round((metrics.totalCommittedCents / metrics.totalMonthlyIncomeCents) * 100)
    : 0
  const badge = getBurdenBadgeConfig(metrics.burdenLevel)

  const handlePayItem = (item: TodayPaymentItem) => {
    if (item.sourceType === "CREDIT_CARD") {
      togglePeriodPaid(item.sourceId, item.period)
      return
    }
    const installment = installments[item.sourceId]
    if (!installment) return
    const obligation = obligations[installment.obligationId]
    if (!obligation) return
    setPayingInstallment({ installment, obligation })
  }

  const renderItemRow = (item: TodayPaymentItem) => (
    <div
      key={item.id}
      className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0 text-[11px] font-mono font-semibold text-slate-300 bg-slate-800 px-2 py-1 rounded-lg capitalize">
          {formatShortDate(item.dueDate)}
        </span>
        <div className="min-w-0">
          <div className="font-medium text-slate-100 text-sm truncate flex items-center gap-1.5">
            {item.title}
            {item.isDebt && (
              <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-1.5 py-0.5 rounded font-normal shrink-0">
                Deuda
              </span>
            )}
          </div>
          {item.subtitle && (
            <div className="text-[11px] text-slate-400 truncate">{item.subtitle}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2.5 ml-auto">
        <div className="text-right">
          <div className="font-semibold text-slate-100 text-sm font-mono">
            {formatCLP(item.amountCents)}
          </div>
          <CountdownChip days={item.daysUntilDue} />
        </div>
        <button
          type="button"
          onClick={() => handlePayItem(item)}
          className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition cursor-pointer"
        >
          {item.sourceType === "CREDIT_CARD" ? "Marcar pagada" : "Pagar"}
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* ─── Greeting ─── */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Hola{firstName ? `, ${firstName}` : ""} 👋
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 capitalize mt-0.5">{todayLabel}</p>
      </div>

      {/* ─── KPI Header: la respuesta en 5 segundos ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-xs">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            Libre para gastar
          </div>
          <div
            className={`text-2xl font-bold ${
              metrics.freeDisposableCents < 0 ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            {formatCLP(metrics.freeDisposableCents)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {hasIncome
              ? "Lo que realmente te queda hasta fin de mes."
              : "Registra tu ingreso del mes para calcularlo."}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-xs">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            Comprometido este mes
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {formatCLP(metrics.totalCommittedCents)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {hasIncome
              ? `${committedPct}% de tu ingreso. Resérvalo apenas cobres.`
              : "Debes reservarlo el día de pago."}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Carga Financiera
            </span>
            {hasIncome && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}
              >
                {badge.label}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {hasIncome ? `${metrics.financialBurdenPercentage}%` : "—"}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {hasIncome ? badge.desc : "Registra tu ingreso para medir tu nivel de deuda."}
          </div>
        </div>
      </div>

      {/* ─── Próximo pago (lo más urgente primero) ─── */}
      {nextPayment ? (
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              ⏰ Próximo pago
            </div>
            <div className="text-lg font-bold text-white truncate">{nextPayment.title}</div>
            <div className="text-xs text-slate-400 mt-0.5 capitalize">
              {formatShortDate(nextPayment.dueDate)}
              {nextPayment.subtitle ? ` — ${nextPayment.subtitle}` : ""}
            </div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right">
              <div className="text-xl font-bold text-slate-100 font-mono">
                {formatCLP(nextPayment.amountCents)}
              </div>
              <CountdownChip days={nextPayment.daysUntilDue} />
            </div>
            <button
              type="button"
              onClick={() => handlePayItem(nextPayment)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg transition cursor-pointer"
            >
              {nextPayment.sourceType === "CREDIT_CARD" ? "Marcar pagada" : "Pagar ahora"}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 text-center">
          <p className="text-sm font-medium text-emerald-300">
            🎉 No tienes pagos pendientes este mes. ¡Todo en orden!
          </p>
        </div>
      )}

      {/* ─── Listas: vencidos y próximos 7 días ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section
          aria-label="Pagos vencidos"
          className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-4 space-y-3"
        >
          <h2 className="text-sm font-semibold text-rose-300">
            ⚠️ Vencidos — paga esto primero ({overdueItems.length})
          </h2>
          {overdueItems.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">Sin pagos vencidos. Vas al día. 💪</p>
          ) : (
            <div className="space-y-2">{overdueItems.map(renderItemRow)}</div>
          )}
        </section>

        <section
          aria-label="Pagos de los próximos 7 días"
          className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3"
        >
          <h2 className="text-sm font-semibold text-slate-200">
            📅 Próximos 7 días ({upcomingItems.length})
          </h2>
          {upcomingItems.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              Nada vence en la próxima semana.
            </p>
          ) : (
            <div className="space-y-2">{upcomingItems.map(renderItemRow)}</div>
          )}
        </section>
      </div>

      {onNavigateToCalendar && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onNavigateToCalendar}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            Ver flujo completo del mes →
          </button>
        </div>
      )}

      {payingInstallment && (
        <PaymentModal
          installment={payingInstallment.installment}
          obligation={payingInstallment.obligation}
          onClose={() => setPayingInstallment(null)}
        />
      )}
    </div>
  )
}
