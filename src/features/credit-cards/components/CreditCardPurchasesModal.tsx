import React, { useState, useMemo } from 'react'
import type { CreditCardAccount, CreditCardPurchase, Period } from '@/shared/types/domain'
import { formatCLP, toMoney } from '@/shared/types/money'
import { calculateInstallmentPeriods } from '../utils/cycleCalculators'
import { useCreditCardStore } from '../store/creditCardSlice'

interface CreditCardPurchasesModalProps {
  isOpen: boolean
  account: CreditCardAccount | null
  purchases: CreditCardPurchase[]
  onClose: () => void
}

type PeriodRangeOption = 3 | 6 | 12 | 24

export const CreditCardPurchasesModal: React.FC<CreditCardPurchasesModalProps> = ({
  isOpen,
  account,
  purchases,
  onClose,
}) => {
  const [filterPlastic, setFilterPlastic] = useState<string>('ALL')
  const [monthsCount, setMonthsCount] = useState<PeriodRangeOption>(6)
  const togglePeriodPaid = useCreditCardStore((s) => s.togglePeriodPaid)
  const storeAccount = useCreditCardStore((s) => (account ? s.accounts[account.id] : undefined))

  if (!isOpen || !account) return null

  const currentAccount = storeAccount ?? account
  const todayStr = new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
  const paidPeriods = currentAccount.paidPeriods ?? []

  // Mapeo rápido de ID de plástico a nombre legible
  const plasticsMap = new Map(
    account.plastics.map((p) => [p.id, `${p.holderName} (•••• ${p.lastFourDigits})`])
  )

  // Filtrar compras para esta tarjeta
  const accountPurchases = purchases
    .filter((p) => p.accountId === account.id)
    .filter((p) => filterPlastic === 'ALL' || p.plasticId === filterPlastic)
    .sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate))

  // Determinar el periodo base inicial (el más temprano entre el mes actual y la primera compra)
  const currentMonthPeriod = todayStr.slice(0, 7) // "YYYY-MM"
  let earliestPeriod = currentMonthPeriod

  accountPurchases.forEach((p) => {
    if (p.firstInstallmentPeriod < earliestPeriod) {
      earliestPeriod = p.firstInstallmentPeriod
    }
  })

  // Generar lista de periodos contiguos según selector (3, 6, 12, 24)
  const periods: Period[] = useMemo(() => {
    const [startYearStr, startMonthStr] = earliestPeriod.split('-')
    let year = parseInt(startYearStr ?? '2026', 10)
    let month = parseInt(startMonthStr ?? '01', 10)

    const result: Period[] = []
    for (let i = 0; i < monthsCount; i++) {
      const padded = month.toString().padStart(2, '0')
      result.push(`${year}-${padded}`)
      month += 1
      if (month > 12) {
        month = 1
        year += 1
      }
    }
    return result
  }, [earliestPeriod, monthsCount])

  // Formato legible para encabezado de periodo (ej. "May 26")
  const formatPeriodHeader = (period: Period) => {
    const [y, m] = period.split('-')
    const date = new Date(parseInt(y!, 10), parseInt(m!, 10) - 1, 1)
    const monthName = date.toLocaleString('es-CL', { month: 'short' })
    const shortYear = y?.slice(2)
    return `${monthName.toUpperCase()} '${shortYear}`
  }

  // Pre-computar para cada compra sus cuotas distribuidas por periodo
  const purchasesWithPeriods = useMemo(() => {
    return accountPurchases.map((purchase) => {
      const totalInstallments = purchase.totalInstallments || 1
      const installmentAmount = Math.round(purchase.totalAmountCents / totalInstallments)
      const purchasePeriods = calculateInstallmentPeriods(purchase.firstInstallmentPeriod, totalInstallments)

      // Mapa de period -> { installmentIndex: 1-based, amountCents }
      const periodInstallmentMap = new Map<Period, { installmentNum: number; amountCents: number }>()
      purchasePeriods.forEach((p, idx) => {
        periodInstallmentMap.set(p, {
          installmentNum: idx + 1,
          amountCents: installmentAmount,
        })
      })

      return {
        purchase,
        totalInstallments,
        installmentAmount,
        periodInstallmentMap,
      }
    })
  }, [accountPurchases])

  // Totales por columna de periodo
  const periodTotals = useMemo(() => {
    const totals: Record<Period, number> = {}
    periods.forEach((p) => {
      totals[p] = 0
    })

    purchasesWithPeriods.forEach(({ periodInstallmentMap }) => {
      periods.forEach((period) => {
        const item = periodInstallmentMap.get(period)
        if (item) {
          totals[period] = (totals[period] ?? 0) + item.amountCents
        }
      })
    })

    return totals
  }, [purchasesWithPeriods, periods])

  // Obtener estado visual para una cuota en un período determinado
  const getInstallmentCellStatus = (period: Period) => {
    const isCardPeriodPaid = paidPeriods.includes(period)
    if (isCardPeriodPaid) {
      return {
        status: 'PAID' as const,
        label: 'Pagada',
        colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      }
    }

    const dueDate = `${period}-${String(account.dueDay).padStart(2, '0')}`
    if (dueDate < todayStr) {
      return {
        status: 'OVERDUE' as const,
        label: 'Vencida',
        colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20 font-semibold',
      }
    }

    return {
      status: 'PENDING' as const,
      label: 'Por vencer',
      colorClass: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
    }
  }

  const totalSpentCents = accountPurchases.reduce((acc, p) => acc + p.totalAmountCents, 0)
  const availableLimitCents = Math.max(0, account.creditLimitCents - totalSpentCents)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-[95vw] lg:max-w-7xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-400 font-bold uppercase">{account.institution}</span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400">
                Cierre día {account.closingDay} | Vencimiento día {account.dueDay}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
              🛍️ Matriz de Compras y Cuotas — {account.accountName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg p-2 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Cerrar modal de compras"
          >
            ✕
          </button>
        </div>

        {/* Resumen de la Tarjeta */}
        <div className="p-4 sm:p-5 bg-slate-950/40 border-b border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50">
            <span className="text-xs text-slate-400 block mb-0.5">Cupo Total Autorizado</span>
            <span className="text-base font-bold text-white">{formatCLP(account.creditLimitCents)}</span>
          </div>
          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50">
            <span className="text-xs text-slate-400 block mb-0.5">Total Compras Registradas</span>
            <span className="text-base font-bold text-indigo-300">{formatCLP(toMoney(totalSpentCents))}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">({accountPurchases.length} movimientos)</span>
          </div>
          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50">
            <span className="text-xs text-slate-400 block mb-0.5">Cupo Disponible Estimado</span>
            <span className="text-base font-bold text-emerald-400">{formatCLP(toMoney(availableLimitCents))}</span>
          </div>
        </div>

        {/* Controles: Selector de Rango de Períodos y Filtros */}
        <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de meses */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1">
              <span className="text-slate-400 px-2 font-medium">Períodos:</span>
              {([3, 6, 12, 24] as PeriodRangeOption[]).map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setMonthsCount(count)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    monthsCount === count
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {count}M
                </button>
              ))}
            </div>

            {/* Filtro por plástico */}
            {account.plastics.length > 1 && (
              <div className="flex items-center gap-2">
                <label htmlFor="filter-plastic" className="text-slate-400 font-medium">
                  Plástico:
                </label>
                <select
                  id="filter-plastic"
                  value={filterPlastic}
                  onChange={(e) => setFilterPlastic(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">Todos ({account.plastics.length})</option>
                  {account.plastics.map((plastic) => (
                    <option key={plastic.id} value={plastic.id}>
                      {plastic.holderName} (•••• {plastic.lastFourDigits})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Leyenda de estados */}
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-rose-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Vencida
            </span>
            <span className="flex items-center gap-1 text-amber-300 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> Por vencer
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Pagada
            </span>
          </div>
        </div>

        {/* Tabla matriz multi-período */}
        <div className="p-4 sm:p-5 overflow-auto flex-1">
          {accountPurchases.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <span className="text-3xl block mb-2">🏷️</span>
              <p className="text-sm font-medium text-slate-300">No hay compras registradas para esta tarjeta.</p>
              <p className="text-xs text-slate-500 mt-1">
                Puedes importar un estado de cuenta en PDF o registrar compras manualmente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  {/* Fila superior de períodos y botón de pago de tarjeta */}
                  <tr className="border-b border-slate-800 bg-slate-800/70 text-slate-300">
                    <th className="py-3 px-3.5 sticky left-0 z-20 bg-slate-900/95 min-w-[240px]" colSpan={2}>
                      Movimiento
                    </th>
                    <th className="py-3 px-3 text-right whitespace-nowrap min-w-[100px]">
                      Monto Total
                    </th>
                    <th className="py-3 px-2.5 text-center whitespace-nowrap min-w-[70px]">
                      Cuotas
                    </th>

                    {/* Columnas dinámicas de períodos */}
                    {periods.map((period) => {
                      const isPaid = paidPeriods.includes(period)
                      const dueDate = `${period}-${String(account.dueDay).padStart(2, '0')}`
                      const isOverdue = !isPaid && dueDate < todayStr

                      return (
                        <th
                          key={period}
                          className={`py-2 px-3 text-center min-w-[125px] border-l border-slate-800/80 ${
                            isPaid
                              ? 'bg-emerald-950/20'
                              : isOverdue
                              ? 'bg-rose-950/20'
                              : 'bg-slate-800/40'
                          }`}
                        >
                          <div className="font-bold text-white text-[12px]">{formatPeriodHeader(period)}</div>
                          <div className="text-[10px] text-slate-400 font-normal">Vence {dueDate}</div>
                          <button
                            type="button"
                            onClick={() => togglePeriodPaid(account.id, period)}
                            title={isPaid ? 'Marcar tarjeta como NO pagada en este período' : 'Registrar pago de tarjeta en este período'}
                            className={`mt-1 text-[10px] px-2 py-0.5 rounded font-semibold transition cursor-pointer border ${
                              isPaid
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                            }`}
                          >
                            {isPaid ? '✓ Tarjeta Pagada' : 'Marcar Pago'}
                          </button>
                        </th>
                      )
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/60">
                  {purchasesWithPeriods.map(({ purchase, totalInstallments, periodInstallmentMap }) => {
                    const isThirdParty = purchase.payerType === 'TERCERO'
                    const receivable = purchase.thirdPartyReceivable

                    return (
                      <tr key={purchase.id} className="hover:bg-slate-800/30 transition">
                        {/* Fecha y Plástico */}
                        <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap sticky left-0 z-10 bg-slate-900/95 border-r border-slate-800/40">
                          <div className="text-slate-300 font-mono text-[11px]">{purchase.purchaseDate}</div>
                          <div className="text-[10px] text-slate-500">
                            {plasticsMap.get(purchase.plasticId) ?? 'Titular'}
                          </div>
                        </td>

                        {/* Detalle y tercero */}
                        <td className="py-2.5 px-3 text-white font-medium min-w-[180px]">
                          <div>{purchase.description}</div>
                          {isThirdParty && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-medium border border-indigo-500/30">
                                👤 {receivable?.thirdPartyName ?? 'Tercero'}
                              </span>
                              {receivable && (
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                    receivable.status === 'COBRADO_TOTAL'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : receivable.status === 'COBRADO_PARCIAL'
                                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  }`}
                                >
                                  {receivable.status === 'COBRADO_TOTAL'
                                    ? 'Persona pagó'
                                    : receivable.status === 'COBRADO_PARCIAL'
                                    ? 'Abonó parte'
                                    : 'Cobro pendiente'}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Monto Total */}
                        <td className="py-2.5 px-3 text-right text-white font-semibold whitespace-nowrap">
                          {formatCLP(purchase.totalAmountCents)}
                        </td>

                        {/* Cuotas */}
                        <td className="py-2.5 px-2.5 text-center text-slate-300 whitespace-nowrap">
                          {totalInstallments === 1 ? (
                            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
                              1 pago
                            </span>
                          ) : (
                            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              {totalInstallments} ctas
                            </span>
                          )}
                        </td>

                        {/* Columnas de Períodos con los valores de cuota y colores correspondientes */}
                        {periods.map((period) => {
                          const item = periodInstallmentMap.get(period)
                          if (!item) {
                            return (
                              <td
                                key={period}
                                className="py-2.5 px-3 text-center border-l border-slate-800/40 text-slate-600 text-[11px]"
                              >
                                —
                              </td>
                            )
                          }

                          const cellStatus = getInstallmentCellStatus(period)

                          return (
                            <td
                              key={period}
                              className="py-2.5 px-3 text-right border-l border-slate-800/40 whitespace-nowrap"
                            >
                              <div
                                className={`inline-block px-2 py-1 rounded-lg border text-right ${cellStatus.colorClass}`}
                              >
                                <span className="block font-bold">
                                  {formatCLP(toMoney(item.amountCents))}
                                </span>
                                <span className="block text-[9px] opacity-80">
                                  Cuota {item.installmentNum}/{totalInstallments}
                                </span>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>

                {/* Pie de tabla con totales por período */}
                <tfoot>
                  <tr className="border-t-2 border-slate-700 bg-slate-950/80 font-bold">
                    <td colSpan={2} className="py-3 px-3 text-white sticky left-0 z-10 bg-slate-950">
                      Total a Pagar en Período:
                    </td>
                    <td className="py-3 px-3 text-right text-indigo-300 whitespace-nowrap">
                      {formatCLP(toMoney(totalSpentCents))}
                    </td>
                    <td className="py-3 px-2.5 text-center text-slate-400 text-[10px]">
                      —
                    </td>

                    {periods.map((period) => {
                      const totalPeriod = periodTotals[period] ?? 0
                      const cellStatus = getInstallmentCellStatus(period)

                      return (
                        <td
                          key={period}
                          className="py-3 px-3 text-right border-l border-slate-800 whitespace-nowrap font-bold"
                        >
                          <span
                            className={
                              totalPeriod > 0
                                ? cellStatus.status === 'PAID'
                                  ? 'text-emerald-400'
                                  : cellStatus.status === 'OVERDUE'
                                  ? 'text-rose-400'
                                  : 'text-amber-300'
                                : 'text-slate-500'
                            }
                          >
                            {formatCLP(toMoney(totalPeriod))}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-xs text-slate-400">
          <span>
            💡 Haz clic en <strong>"Marcar Pago"</strong> en el encabezado de un período cuando hayas pagado la facturación de tu tarjeta.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
