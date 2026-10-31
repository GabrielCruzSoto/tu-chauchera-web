import React, { useState, useMemo } from 'react'
import { useObligationsStore } from '../store/obligationsSlice'
import { usePaymentsStore } from '../store/paymentsSlice'
import { useIncomeStore, getTotalIncomeForPeriod } from '@/features/income/store/incomeSlice'
import { formatCLP, toMoney } from '@/shared/types/money'
import type { Installment, Obligation } from '@/shared/types/domain'
import { getLocalISODate, getLocalPeriod, addMonthsToPeriod } from '@/shared/utils/date'
import { PaymentModal } from './PaymentModal'
import { RenegotiationModal } from './RenegotiationModal'
import { CategoryBadge } from './CategoryBadge'
import { PaymentWindowsView } from '@/features/payments/components/PaymentWindowsView'

export type InstallmentStatusFilter = 'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'
export type InstallmentsSubTab = 'LIST' | 'WINDOWS'

export const MonthlyInstallmentsView: React.FC = () => {
  const { obligations, installments } = useObligationsStore()
  const { revertToPending, postponeToNextMonth, moveToPreviousMonth } = usePaymentsStore()

  const [currentPeriod, setCurrentPeriod] = useState(getLocalPeriod()) // "YYYY-MM"
  const [subTab, setSubTab] = useState<InstallmentsSubTab>('LIST')
  const [statusFilter, setStatusFilter] = useState<InstallmentStatusFilter>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedInstId, setCopiedInstId] = useState<string | null>(null)
  const [postponeMessage, setPostponeMessage] = useState<string | null>(null)
  const [undoAction, setUndoAction] = useState<{
    id: string
    type: 'POSTPONE' | 'PREVIOUS'
  } | null>(null)
  const [selectedForPayment, setSelectedForPayment] = useState<{
    installment: Installment
    obligation: Obligation
  } | null>(null)

  const [selectedForReneg, setSelectedForReneg] = useState<{
    obligation: Obligation
    fromInstallmentNumber: number
  } | null>(null)

  const todayStr = useMemo(() => getLocalISODate(), [])

  // Helper to determine previous period (YYYY-MM)
  const prevPeriod = useMemo(() => addMonthsToPeriod(currentPeriod, -1), [currentPeriod])

  // Filter installments for the selected month (dueDate in currentPeriod OR paid period matches currentPeriod)
  // Rollover: If an obligation installment was not paid on its date in the previous month (or has been rolled over),
  // it passes to the following month in red indicating that it was not paid on time.
  const monthInstallments = useMemo(() => {
    return Object.values(installments)
      .filter(i => {
        if (i.status === 'DELETED') return false

        if (i.status === 'PAID' && i.period) {
          return i.period === currentPeriod || i.dueDate.startsWith(currentPeriod)
        }

        if (i.dueDate.startsWith(currentPeriod)) {
          return true
        }

        // Rolled over from previous month due to non-payment
        const instPeriod = i.dueDate.slice(0, 7)
        if (i.status === 'PENDING') {
          if (
            i.isOverdueRollover &&
            (i.dueDate.startsWith(currentPeriod) || instPeriod <= currentPeriod)
          ) {
            return true
          }
          if (instPeriod === prevPeriod && i.dueDate < todayStr) {
            return true
          }
        }

        return false
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  }, [installments, currentPeriod, prevPeriod, todayStr])

  // All overdue installments (unpaid with dueDate in the past or rolled over)
  const allOverdueInstallments = useMemo(() => {
    return Object.values(installments)
      .filter(i => {
        if (i.status !== 'PENDING') return false
        return i.dueDate < todayStr || !!i.isOverdueRollover
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  }, [installments, todayStr])

  const rolledOverInstallments = useMemo(() => {
    return monthInstallments.filter(i => {
      return (
        i.status === 'PENDING' &&
        (i.dueDate.slice(0, 7) < currentPeriod ||
          !!i.isOverdueRollover ||
          (!!i.originalDueDate && i.originalDueDate.slice(0, 7) < currentPeriod))
      )
    })
  }, [monthInstallments, currentPeriod])

  const rolledOverTotal = useMemo(() => {
    return rolledOverInstallments.reduce((acc, i) => acc + i.amountCents, 0)
  }, [rolledOverInstallments])

  // Summary Metrics
  const totalAmount = monthInstallments.reduce((acc, i) => acc + i.amountCents, 0)
  const totalPaid = monthInstallments
    .filter(i => i.status === 'PAID')
    .reduce((acc, i) => acc + i.amountCents, 0)
  const totalPending = monthInstallments
    .filter(i => i.status === 'PENDING')
    .reduce((acc, i) => acc + i.amountCents, 0)

  // Income & Running Cash Flow computations
  const { incomes } = useIncomeStore()
  const periodIncomeCents = useMemo(
    () => getTotalIncomeForPeriod(incomes, currentPeriod),
    [incomes, currentPeriod],
  )

  // Chronological running balance across the entire month
  const runningBalanceMap = useMemo(() => {
    const map: Record<string, number> = {}
    let running = periodIncomeCents
    for (const inst of monthInstallments) {
      running -= inst.amountCents
      map[inst.id] = running
    }
    return map
  }, [monthInstallments, periodIncomeCents])

  const projectedNetCents = periodIncomeCents - totalAmount

  // Status Counts for filters
  const pendingCount = useMemo(
    () => monthInstallments.filter(i => i.status === 'PENDING').length,
    [monthInstallments],
  )
  const paidCount = useMemo(
    () => monthInstallments.filter(i => i.status === 'PAID').length,
    [monthInstallments],
  )
  const overdueCount = useMemo(() => {
    const ids = new Set(allOverdueInstallments.map(i => i.id))
    for (const r of rolledOverInstallments) {
      ids.add(r.id)
    }
    return ids.size
  }, [allOverdueInstallments, rolledOverInstallments])

  const handlePostpone = (instId: string) => {
    postponeToNextMonth(instId)
    setUndoAction({ id: instId, type: 'POSTPONE' })
    setPostponeMessage('Cuota pasada al mes siguiente.')
    setTimeout(() => {
      setPostponeMessage(null)
      setUndoAction(null)
    }, 6000)
  }

  const handleMoveToPreviousMonth = (instId: string) => {
    moveToPreviousMonth(instId)
    setUndoAction({ id: instId, type: 'PREVIOUS' })
    setPostponeMessage('Cuota movida al mes anterior.')
    setTimeout(() => {
      setPostponeMessage(null)
      setUndoAction(null)
    }, 6000)
  }

  const handleUndo = () => {
    if (!undoAction) return
    if (undoAction.type === 'POSTPONE') {
      moveToPreviousMonth(undoAction.id)
    } else {
      postponeToNextMonth(undoAction.id)
    }
    setPostponeMessage('Acción deshecha correctamente.')
    setUndoAction(null)
    setTimeout(() => setPostponeMessage(null), 3000)
  }

  // Filtered List based on status filter and search query
  const filteredInstallments = useMemo(() => {
    const sourceList = statusFilter === 'OVERDUE' ? allOverdueInstallments : monthInstallments

    return sourceList.filter(inst => {
      const obl = obligations[inst.obligationId]
      if (!obl || obl.status === 'DELETED') return false

      // Status filter
      if (statusFilter === 'PENDING' && inst.status !== 'PENDING') {
        return false
      }
      if (statusFilter === 'PAID' && inst.status !== 'PAID') {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const nameMatch = obl.subcategory.toLowerCase().includes(q)
        const detailMatch = obl.detail?.toLowerCase().includes(q)
        const p2pPerson = obl.p2pMetadata?.thirdPartyName?.toLowerCase().includes(q)
        const p2pCard = obl.p2pMetadata?.cardIssuer?.toLowerCase().includes(q)
        const p2pProduct = obl.p2pMetadata?.productDescription?.toLowerCase().includes(q)
        const dateMatch = inst.dueDate.includes(q) || inst.paidDate?.includes(q)

        if (!nameMatch && !detailMatch && !p2pPerson && !p2pCard && !p2pProduct && !dateMatch) {
          return false
        }
      }

      return true
    })
  }, [statusFilter, allOverdueInstallments, monthInstallments, obligations, searchQuery])

  const handlePrevMonth = () => {
    setCurrentPeriod(prev => addMonthsToPeriod(prev, -1))
  }

  const handleNextMonth = () => {
    setCurrentPeriod(prev => addMonthsToPeriod(prev, 1))
  }

  const handleCopyWhatsAppReminder = (obl: Obligation, inst: Installment) => {
    const p2p = obl.p2pMetadata
    const person = p2p?.thirdPartyName ?? obl.subcategory
    const card = p2p?.cardIssuer ? ` en tarjeta ${p2p.cardIssuer}` : ''
    const product = p2p?.productDescription ?? obl.detail
    const base = p2p?.baseInstallmentAmountCents
      ? formatCLP(p2p.baseInstallmentAmountCents)
      : formatCLP(inst.amountCents)
    const total = formatCLP(inst.amountCents)

    let msg = `Hola ${person}! Te comparto el detalle de tu cuota de este mes (${currentPeriod}) por la compra de "${product}"${card}:\n`
    msg += `• Cuota #${inst.installmentNumber}/${obl.totalInstallments}: ${base}\n`
    if (p2p?.surcharges?.includeMaintenanceFee && p2p.surcharges.maintenanceFeeAmountCents) {
      msg += `• Mantención tarjeta: ${formatCLP(p2p.surcharges.maintenanceFeeAmountCents)}\n`
    }
    if (p2p?.surcharges?.includeOneTimeCommission && p2p.surcharges.totalCommissionCents) {
      msg += `• Impuesto / Comisión: ${formatCLP(p2p.surcharges.totalCommissionCents)}\n`
    }
    msg += `\n*Total a transferir: ${total}*\nFecha límite acordada: día ${obl.dueDay} de cada mes.\n¡Muchas gracias!`

    void navigator.clipboard.writeText(msg)
    setCopiedInstId(inst.id)
    setTimeout(() => setCopiedInstId(null), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Month Navigator & Summary Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <button
            onClick={handlePrevMonth}
            aria-label="Mes anterior"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold cursor-pointer flex items-center justify-center transition border border-slate-700/60"
          >
            ←
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide uppercase font-mono">
            {currentPeriod}
          </h2>
          <button
            onClick={handleNextMonth}
            aria-label="Mes siguiente"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold cursor-pointer flex items-center justify-center transition border border-slate-700/60"
          >
            →
          </button>
        </div>

        <div
          className={`grid grid-cols-2 ${rolledOverTotal > 0 ? 'sm:grid-cols-3 lg:grid-cols-6' : 'sm:grid-cols-2 lg:grid-cols-5'} gap-2.5 sm:gap-3 text-xs`}
        >
          <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between sm:flex-col sm:items-start gap-1">
            <span className="text-emerald-400 font-medium">Ingresos Ciclo:</span>
            <span className="font-bold font-mono text-emerald-300 text-sm">
              {formatCLP(toMoney(periodIncomeCents))}
            </span>
          </div>
          <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between sm:flex-col sm:items-start gap-1">
            <span className="text-slate-400 font-medium">Total Mes:</span>
            <span className="font-bold font-mono text-white text-sm">
              {formatCLP(toMoney(totalAmount))}
            </span>
          </div>
          <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between sm:flex-col sm:items-start gap-1">
            <span className="text-slate-400 font-medium">Saldo Proyectado:</span>
            <span
              className={`font-bold font-mono text-sm ${
                periodIncomeCents === 0
                  ? 'text-slate-400'
                  : projectedNetCents >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
              }`}
            >
              {periodIncomeCents === 0 ? '—' : formatCLP(toMoney(projectedNetCents))}
            </span>
          </div>
          <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between sm:flex-col sm:items-start gap-1">
            <span className="text-emerald-400 font-medium">Pagado:</span>
            <span className="font-bold font-mono text-emerald-300 text-sm">
              {formatCLP(toMoney(totalPaid))}
            </span>
          </div>
          <div className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between sm:flex-col sm:items-start gap-1">
            <span className="text-amber-400 font-medium">Pendiente:</span>
            <span className="font-bold font-mono text-amber-300 text-sm">
              {formatCLP(toMoney(totalPending))}
            </span>
          </div>
          {rolledOverTotal > 0 && (
            <div className="col-span-2 sm:col-span-1 px-3.5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between sm:flex-col sm:items-start gap-1">
              <span className="text-rose-400 font-medium flex items-center gap-1">
                <span>⚠️</span>
                <span>No pagadas en plazo:</span>
              </span>
              <span className="font-bold font-mono text-rose-300 text-sm">
                {formatCLP(toMoney(rolledOverTotal))}
              </span>
            </div>
          )}
        </div>
      </div>

      {postponeMessage && (
        <div className="p-3 bg-slate-800/90 border border-slate-700 rounded-xl text-slate-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-base">ℹ️</span>
            <span>{postponeMessage}</span>
          </div>
          <div className="flex items-center gap-2">
            {undoAction && (
              <button
                onClick={handleUndo}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg font-semibold text-xs cursor-pointer transition border border-amber-500/40"
              >
                Deshacer
              </button>
            )}
            <button
              onClick={() => {
                setPostponeMessage(null)
                setUndoAction(null)
              }}
              className="text-slate-400 hover:text-slate-200 p-1 font-bold cursor-pointer"
              aria-label="Cerrar aviso"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* View Switcher: Cuotas vs Ventanas de Pago */}
      <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setSubTab('LIST')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            subTab === 'LIST'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📋</span>
          <span>Listado de Cuotas</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('WINDOWS')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            subTab === 'WINDOWS'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🎯</span>
          <span>Ventanas de Pago & Salud Financiera</span>
        </button>
      </div>

      {subTab === 'WINDOWS' ? (
        <PaymentWindowsView currentPeriod={currentPeriod} />
      ) : (
        <>
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/80">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por obligación, categoría, detalle..."
                className="w-full h-10 pl-9 pr-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border whitespace-nowrap ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-800 text-white border-slate-700 shadow-sm'
                    : 'text-slate-400 border-transparent hover:bg-slate-800/50'
                }`}
              >
                Todas ({monthInstallments.length})
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border whitespace-nowrap flex items-center gap-1 ${
                  statusFilter === 'PENDING'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'text-slate-400 border-transparent hover:bg-slate-800/50'
                }`}
              >
                <span>⏳</span>
                <span>No Pagadas ({pendingCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('PAID')}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border whitespace-nowrap flex items-center gap-1 ${
                  statusFilter === 'PAID'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 border-transparent hover:bg-slate-800/50'
                }`}
              >
                <span>✅</span>
                <span>Pagadas ({paidCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('OVERDUE')}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border whitespace-nowrap flex items-center gap-1 ${
                  statusFilter === 'OVERDUE'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                    : 'text-slate-400 border-transparent hover:bg-slate-800/50'
                }`}
              >
                <span>⚠️</span>
                <span>Vencidas ({overdueCount})</span>
              </button>
            </div>
          </div>

          {/* Table of Installments */}
          {monthInstallments.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl">
              <div className="text-3xl mb-2">🗓️</div>
              <h3 className="text-base font-medium text-slate-300">
                No hay cuotas programadas para {currentPeriod}
              </h3>
            </div>
          ) : filteredInstallments.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl space-y-3">
              <div className="text-3xl">🔍</div>
              <h3 className="text-base font-medium text-slate-300">
                No se encontraron cuotas con el filtro seleccionado
              </h3>
              <p className="text-xs text-slate-400">
                Intenta cambiar el filtro o borrar el término de búsqueda.
              </p>
              <button
                onClick={() => {
                  setStatusFilter('ALL')
                  setSearchQuery('')
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-slate-700 transition cursor-pointer"
              >
                Mostrar todas las cuotas del mes
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
              <table className="w-full text-left text-xs text-slate-300 min-w-[650px] border-collapse">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] sm:text-[11px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Estado</th>
                    <th className="px-4 py-3.5">Obligación / Concepto</th>
                    <th className="px-4 py-3.5">Tipo / Cuota</th>
                    <th className="px-4 py-3.5">Vencimiento</th>
                    <th className="px-4 py-3.5">Monto</th>
                    <th className="px-4 py-3.5">Saldo Proyectado</th>
                    <th className="px-4 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredInstallments.map(inst => {
                    const obl = obligations[inst.obligationId]
                    if (!obl) return null

                    const isExpense = obl.type === 'EXPENSE'
                    const isP2P = obl.type === 'P2P_DEBT'
                    const isOverdue = inst.status === 'PENDING' && inst.dueDate < todayStr
                    const isRolledOver =
                      inst.status === 'PENDING' &&
                      (inst.dueDate.slice(0, 7) < currentPeriod ||
                        !!inst.isOverdueRollover ||
                        (!!inst.originalDueDate &&
                          inst.originalDueDate.slice(0, 7) < currentPeriod))
                    const isLent =
                      isP2P &&
                      (obl.p2pMetadata?.role === 'LENT_MY_CARD' ||
                        obl.p2pMetadata?.role === 'DIRECT_LOAN_GIVEN')
                    const concept = isP2P
                      ? (obl.p2pMetadata?.productDescription ?? obl.detail)
                      : obl.detail
                    const hasDistinctConcept =
                      concept &&
                      concept.trim().toLowerCase() !== obl.subcategory.trim().toLowerCase()

                    return (
                      <tr
                        key={inst.id}
                        className={`transition ${
                          isRolledOver
                            ? 'bg-rose-950/25 border-l-4 border-l-rose-500 hover:bg-rose-950/40'
                            : 'hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          {isRolledOver ? (
                            <div className="space-y-1">
                              <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-rose-500/25 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1 shadow-sm">
                                <span>⚠️</span>
                                <span>NO PAGADA EN PLAZO</span>
                              </span>
                              <div className="text-[10px] text-rose-400 font-medium">
                                {inst.originalDueDate
                                  ? `Mes orig: ${inst.originalDueDate.slice(0, 7)}`
                                  : `Pasó de: ${inst.dueDate.slice(0, 7)}`}
                              </div>
                            </div>
                          ) : inst.status === 'PAID' ? (
                            <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              PAGADO
                            </span>
                          ) : inst.status === 'PENDING' ? (
                            isOverdue ? (
                              <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                ⚠️ VENCIDA
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                PENDIENTE
                              </span>
                            )
                          ) : inst.status === 'RENEGOTIATED' ? (
                            <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              RENEGOCIADO
                            </span>
                          ) : null}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <div className="font-semibold text-white flex items-center gap-1.5 flex-wrap">
                              <span>{obl.subcategory}</span>
                              {isExpense && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                  💡 Gasto
                                </span>
                              )}
                              {isP2P && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                                    isLent
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  }`}
                                >
                                  {obl.p2pMetadata?.role === 'LENT_MY_CARD'
                                    ? '💳 Presté Tarjeta (Cobro)'
                                    : obl.p2pMetadata?.role === 'USED_THEIR_CARD'
                                      ? '🛍️ Usé Tarjeta (Pago)'
                                      : obl.p2pMetadata?.role === 'DIRECT_LOAN_GIVEN'
                                        ? '🤝 Préstamo Otorgado (Cobro)'
                                        : obl.p2pMetadata?.role === 'DIRECT_LOAN_TAKEN'
                                          ? '🤝 Préstamo Recibido (Pago)'
                                          : '👥 P2P'}
                                </span>
                              )}
                            </div>

                            {hasDistinctConcept && (
                              <div className="text-xs text-slate-300 flex items-center gap-1.5">
                                <span className="text-slate-500 text-[11px]">Concepto:</span>
                                <span className="text-emerald-300/90 font-medium truncate max-w-xs">
                                  {concept}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 flex-wrap">
                              <CategoryBadge categoryId={obl.categoryId} showDot={false} />
                              {isP2P && obl.p2pMetadata?.cardIssuer && (
                                <span className="text-[10px] text-slate-400 bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800">
                                  💳 {obl.p2pMetadata.cardIssuer}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-slate-300">
                          {isExpense ? (
                            <span className="text-sky-300 text-[11px]">Recurrente</span>
                          ) : (
                            `#${inst.installmentNumber} / ${obl.totalInstallments}`
                          )}
                        </td>

                        <td className="px-4 py-3.5 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700/80 shrink-0">
                              Día {inst.dueDate.slice(8, 10)}
                            </span>
                            <div>
                              <span
                                className={
                                  isRolledOver || isOverdue
                                    ? 'text-rose-300 font-semibold'
                                    : 'text-slate-200'
                                }
                              >
                                {inst.dueDate}
                              </span>
                              {isRolledOver && inst.originalDueDate && (
                                <div className="text-[10px] text-rose-400/90 font-medium mt-0.5 line-through">
                                  Orig: {inst.originalDueDate}
                                </div>
                              )}
                              {isRolledOver && !inst.originalDueDate && (
                                <div className="text-[10px] text-rose-400 font-semibold mt-0.5">
                                  No pagada en plazo
                                </div>
                              )}
                              {!isRolledOver && isOverdue && (
                                <div className="text-[10px] text-rose-400 font-semibold mt-0.5">
                                  Vencida
                                </div>
                              )}
                              {inst.paidDate && (
                                <div className="text-[10px] text-emerald-400 mt-0.5">
                                  Pagado: {inst.paidDate}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-bold font-mono text-white text-sm">
                          {formatCLP(inst.amountCents)}
                        </td>

                        <td className="px-4 py-3.5 font-mono">
                          {periodIncomeCents > 0 ? (
                            (() => {
                              const balance = runningBalanceMap[inst.id]
                              return (
                                <div className="flex flex-col">
                                  <span
                                    className={`font-bold text-xs ${
                                      balance !== undefined && balance >= 0
                                        ? 'text-emerald-400'
                                        : 'text-rose-400'
                                    }`}
                                  >
                                    {formatCLP(toMoney(balance ?? 0))}
                                  </span>
                                  {balance !== undefined && balance < 0 && (
                                    <span className="text-[10px] text-rose-400/90 font-medium">
                                      ⚠️ Déficit
                                    </span>
                                  )}
                                </div>
                              )
                            })()
                          ) : (
                            <span
                              className="text-slate-500 text-[11px]"
                              title="Sin ingresos registrados en el período"
                            >
                              —
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {isP2P && obl.p2pMetadata?.role === 'LENT_MY_CARD' && (
                              <button
                                onClick={() => handleCopyWhatsAppReminder(obl, inst)}
                                className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium cursor-pointer transition flex items-center gap-1"
                                title="Copiar Recordatorio WhatsApp"
                              >
                                <span>{copiedInstId === inst.id ? '✅' : '📲'}</span>
                                <span className="hidden sm:inline">
                                  {copiedInstId === inst.id ? 'Copiado' : 'Cobro'}
                                </span>
                              </button>
                            )}

                            {inst.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() =>
                                    setSelectedForPayment({ installment: inst, obligation: obl })
                                  }
                                  className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer shadow transition"
                                >
                                  {isLent ? 'Cobrar' : 'Pagar'}
                                </button>
                                {!isExpense && (
                                  <button
                                    onClick={() =>
                                      setSelectedForReneg({
                                        obligation: obl,
                                        fromInstallmentNumber: inst.installmentNumber,
                                      })
                                    }
                                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium text-xs border border-slate-700 cursor-pointer transition"
                                  >
                                    Repactar
                                  </button>
                                )}
                                <button
                                  onClick={() => handleMoveToPreviousMonth(inst.id)}
                                  className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium cursor-pointer transition flex items-center gap-1"
                                  title={
                                    inst.originalDueDate
                                      ? `Volver a fecha original (${inst.originalDueDate})`
                                      : 'Pasar esta cuota al mes anterior'
                                  }
                                >
                                  <span>⏪</span>
                                  <span className="hidden sm:inline">
                                    {inst.originalDueDate
                                      ? 'Volver a fecha original'
                                      : 'Pasar a mes anterior'}
                                  </span>
                                </button>
                                <button
                                  onClick={() => handlePostpone(inst.id)}
                                  className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium cursor-pointer transition flex items-center gap-1"
                                  title="Pasar esta cuota al mes siguiente"
                                >
                                  <span>⏩</span>
                                  <span className="hidden sm:inline">Pasar a mes siguiente</span>
                                </button>
                              </>
                            )}

                            {inst.status === 'PAID' && (
                              <>
                                <button
                                  onClick={() =>
                                    setSelectedForPayment({ installment: inst, obligation: obl })
                                  }
                                  className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 text-xs font-medium cursor-pointer transition flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                  title="Modificar pago"
                                >
                                  <span aria-hidden="true">✏️</span>
                                  <span>Modificar pago</span>
                                </button>
                                <button
                                  onClick={() => revertToPending(inst.id)}
                                  className="min-h-[36px] px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                  title="Revertir a Pendiente"
                                >
                                  Deshacer pago
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {selectedForPayment && (
        <PaymentModal
          installment={selectedForPayment.installment}
          obligation={selectedForPayment.obligation}
          onClose={() => setSelectedForPayment(null)}
        />
      )}

      {selectedForReneg && (
        <RenegotiationModal
          oldObligation={selectedForReneg.obligation}
          fromInstallmentNumber={selectedForReneg.fromInstallmentNumber}
          onClose={() => setSelectedForReneg(null)}
        />
      )}
    </div>
  )
}
