import React, { useState, useMemo } from "react"
import { useObligationsStore } from "../store/obligationsSlice"
import { usePaymentsStore } from "../store/paymentsSlice"
import { formatCLP, toMoney } from "@/shared/types/money"
import type { Installment, Obligation } from "@/shared/types/domain"
import { PaymentModal } from "./PaymentModal"
import { RenegotiationModal } from "./RenegotiationModal"
import { CategoryBadge } from "./CategoryBadge"

export type InstallmentStatusFilter = "ALL" | "PENDING" | "PAID" | "OVERDUE"

export const MonthlyInstallmentsView: React.FC = () => {
  const { obligations, installments } = useObligationsStore()
  const { revertToPending } = usePaymentsStore()

  const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().slice(0, 7)) // "YYYY-MM"
  const [statusFilter, setStatusFilter] = useState<InstallmentStatusFilter>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedInstId, setCopiedInstId] = useState<string | null>(null)
  const [selectedForPayment, setSelectedForPayment] = useState<{
    installment: Installment
    obligation: Obligation
  } | null>(null)

  const [selectedForReneg, setSelectedForReneg] = useState<{
    obligation: Obligation
    fromInstallmentNumber: number
  } | null>(null)

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  // Filter installments for the selected month (dueDate in currentPeriod OR paid period matches currentPeriod)
  const monthInstallments = useMemo(() => {
    return Object.values(installments).filter((i) => {
      if (i.status === "DELETED") return false
      if (i.status === "PAID" && i.period) {
        return i.period === currentPeriod || i.dueDate.startsWith(currentPeriod)
      }
      return i.dueDate.startsWith(currentPeriod)
    })
  }, [installments, currentPeriod])

  // All overdue installments (unpaid with dueDate in the past)
  const allOverdueInstallments = useMemo(() => {
    return Object.values(installments).filter((i) => {
      if (i.status !== "PENDING") return false
      return i.dueDate < todayStr
    })
  }, [installments, todayStr])

  // Summary Metrics
  const totalAmount = monthInstallments.reduce((acc, i) => acc + i.amountCents, 0)
  const totalPaid = monthInstallments
    .filter((i) => i.status === "PAID")
    .reduce((acc, i) => acc + i.amountCents, 0)
  const totalPending = monthInstallments
    .filter((i) => i.status === "PENDING")
    .reduce((acc, i) => acc + i.amountCents, 0)

  // Status Counts for filters
  const pendingCount = useMemo(
    () => monthInstallments.filter((i) => i.status === "PENDING").length,
    [monthInstallments]
  )
  const paidCount = useMemo(
    () => monthInstallments.filter((i) => i.status === "PAID").length,
    [monthInstallments]
  )
  const overdueCount = allOverdueInstallments.length

  // Filtered List based on status filter and search query
  const filteredInstallments = useMemo(() => {
    const sourceList = statusFilter === "OVERDUE" ? allOverdueInstallments : monthInstallments

    return sourceList.filter((inst) => {
      const obl = obligations[inst.obligationId]
      if (!obl || obl.status === "DELETED") return false

      // Status filter
      if (statusFilter === "PENDING" && inst.status !== "PENDING") {
        return false
      }
      if (statusFilter === "PAID" && inst.status !== "PAID") {
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
    const [year, month] = currentPeriod.split("-").map(Number)
    const prevDate = new Date(year!, month! - 2, 1)
    setCurrentPeriod(prevDate.toISOString().slice(0, 7))
  }

  const handleNextMonth = () => {
    const [year, month] = currentPeriod.split("-").map(Number)
    const nextDate = new Date(year!, month!, 1)
    setCurrentPeriod(nextDate.toISOString().slice(0, 7))
  }

  const handleCopyWhatsAppReminder = (obl: Obligation, inst: Installment) => {
    const p2p = obl.p2pMetadata
    const person = p2p?.thirdPartyName || obl.subcategory
    const card = p2p?.cardIssuer ? ` en tarjeta ${p2p.cardIssuer}` : ""
    const product = p2p?.productDescription || obl.detail
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
          <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between sm:flex-col sm:items-start gap-1">
            <span className="text-slate-400 font-medium">Total Mes:</span>
            <span className="font-bold font-mono text-white text-sm">{formatCLP(toMoney(totalAmount))}</span>
          </div>
          <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between sm:flex-col sm:items-start gap-1">
            <span className="text-emerald-400 font-medium">Pagado:</span>
            <span className="font-bold font-mono text-emerald-300 text-sm">{formatCLP(toMoney(totalPaid))}</span>
          </div>
          <div className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between sm:flex-col sm:items-start gap-1">
            <span className="text-amber-400 font-medium">Pendiente:</span>
            <span className="font-bold font-mono text-amber-300 text-sm">{formatCLP(toMoney(totalPending))}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/80">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por obligación, categoría, detalle..."
            className="w-full h-10 pl-9 pr-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border whitespace-nowrap ${
              statusFilter === "ALL"
                ? "bg-slate-800 text-white border-slate-700 shadow-sm"
                : "text-slate-400 border-transparent hover:bg-slate-800/50"
            }`}
          >
            Todas ({monthInstallments.length})
          </button>
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border whitespace-nowrap flex items-center gap-1 ${
              statusFilter === "PENDING"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm"
                : "text-slate-400 border-transparent hover:bg-slate-800/50"
            }`}
          >
            <span>⏳</span>
            <span>No Pagadas ({pendingCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter("PAID")}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border whitespace-nowrap flex items-center gap-1 ${
              statusFilter === "PAID"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm"
                : "text-slate-400 border-transparent hover:bg-slate-800/50"
            }`}
          >
            <span>✅</span>
            <span>Pagadas ({paidCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter("OVERDUE")}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border whitespace-nowrap flex items-center gap-1 ${
              statusFilter === "OVERDUE"
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm"
                : "text-slate-400 border-transparent hover:bg-slate-800/50"
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
              setStatusFilter("ALL")
              setSearchQuery("")
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
                <th className="px-4 py-3.5">Obligación / Categoría</th>
                <th className="px-4 py-3.5">Tipo / Cuota</th>
                <th className="px-4 py-3.5">Vencimiento</th>
                <th className="px-4 py-3.5">Monto</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInstallments.map((inst) => {
                const obl = obligations[inst.obligationId]
                if (!obl) return null

                const isExpense = obl.type === "EXPENSE"
                const isP2P = obl.type === "P2P_DEBT"
                const isOverdue = inst.status === "PENDING" && inst.dueDate < todayStr

                return (
                  <tr key={inst.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3.5">
                      {inst.status === "PAID" && (
                        <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          PAGADO
                        </span>
                      )}
                      {inst.status === "PENDING" && (
                        isOverdue ? (
                          <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            ⚠️ VENCIDA
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            PENDIENTE
                          </span>
                        )
                      )}
                      {inst.status === "RENEGOTIATED" && (
                        <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          RENEGOCIADO
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>{obl.subcategory}</span>
                        {isExpense && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300">
                            💡 Gasto
                          </span>
                        )}
                        {isP2P && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                            👥 P2P
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <CategoryBadge categoryId={obl.categoryId} showDot={false} />
                        {isP2P && obl.p2pMetadata?.cardIssuer && (
                          <span className="text-[10px] text-slate-400">({obl.p2pMetadata.cardIssuer})</span>
                        )}
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
                      <span className={isOverdue ? "text-rose-300 font-semibold" : "text-slate-200"}>
                        {inst.dueDate}
                      </span>
                      {isOverdue && (
                        <div className="text-[10px] text-rose-400 font-semibold mt-0.5">Vencida</div>
                      )}
                      {inst.paidDate && (
                        <div className="text-[10px] text-emerald-400 mt-0.5">Pagado: {inst.paidDate}</div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-bold font-mono text-white text-sm">
                      {formatCLP(inst.amountCents)}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {isP2P && obl.p2pMetadata?.role === "LENT_MY_CARD" && (
                          <button
                            onClick={() => handleCopyWhatsAppReminder(obl, inst)}
                            className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium cursor-pointer transition flex items-center gap-1"
                            title="Copiar Recordatorio WhatsApp"
                          >
                            <span>{copiedInstId === inst.id ? "✅" : "📲"}</span>
                            <span className="hidden sm:inline">
                              {copiedInstId === inst.id ? "Copiado" : "Cobro"}
                            </span>
                          </button>
                        )}

                        {inst.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => setSelectedForPayment({ installment: inst, obligation: obl })}
                              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer shadow transition"
                            >
                              Pagar
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
                          </>
                        )}

                        {inst.status === "PAID" && (
                          <>
                            <button
                              onClick={() => setSelectedForPayment({ installment: inst, obligation: obl })}
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
