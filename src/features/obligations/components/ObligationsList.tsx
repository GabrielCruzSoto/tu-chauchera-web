import React, { useState, useMemo } from "react"
import { useObligationsStore } from "../store/obligationsSlice"
import { formatCLP, toMoney } from "@/shared/types/money"
import type { Obligation, ObligationType } from "@/shared/types/domain"
import { ObligationFormModal } from "./ObligationFormModal"
import { CategorySettingsModal } from "./CategorySettingsModal"
import { CategoryBadge } from "./CategoryBadge"

export const ObligationsList: React.FC = () => {
  const { obligations, installments, softDeleteObligation } = useObligationsStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingObligation, setEditingObligation] = useState<Obligation | null>(null)
  const [cloningObligation, setCloningObligation] = useState<Obligation | null>(null)
  const [isCategorySettingsOpen, setIsCategorySettingsOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Filters & View Mode
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"ALL" | ObligationType>("ALL")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  const activeObligations = Object.values(obligations).filter((o) => o.status !== "DELETED")

  // Filtered List
  const filteredObligations = useMemo(() => {
    return activeObligations.filter((obl) => {
      // Type filter
      const oblType = obl.type ?? "DEBT"
      if (typeFilter !== "ALL" && oblType !== typeFilter) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const nameMatch = obl.subcategory.toLowerCase().includes(query)
        const detailMatch = obl.detail?.toLowerCase().includes(query)
        const personMatch = obl.p2pMetadata?.thirdPartyName?.toLowerCase().includes(query)
        const cardMatch = obl.p2pMetadata?.cardIssuer?.toLowerCase().includes(query)
        const productMatch = obl.p2pMetadata?.productDescription?.toLowerCase().includes(query)

        if (!nameMatch && !detailMatch && !personMatch && !cardMatch && !productMatch) {
          return false
        }
      }

      return true
    })
  }, [activeObligations, typeFilter, searchQuery])

  // Summary Metrics
  const totalMonthlyCommitment = activeObligations.reduce((sum, o) => sum + o.installmentAmountCents, 0)
  
  // Real remaining pending debt balance
  const totalDebtRemainingBalance = activeObligations
    .filter((o) => o.type !== "EXPENSE")
    .reduce((sum, o) => {
      const relInst = Object.values(installments).filter((i) => i.obligationId === o.id)
      const pendingInst = relInst.filter((i) => i.status === "PENDING")
      if (relInst.length > 0) {
        return sum + pendingInst.reduce((acc, inst) => acc + inst.amountCents, 0)
      }
      // Fallback if no installments loaded
      const pendingCount = Math.max(0, o.totalInstallments - (o.currentInstallment - 1))
      return sum + pendingCount * o.installmentAmountCents
    }, 0)

  const handleCopyWhatsApp = (oblId: string) => {
    const obl = obligations[oblId]
    if (!obl) return

    const p2p = obl.p2pMetadata
    const person = p2p?.thirdPartyName || obl.subcategory
    const card = p2p?.cardIssuer ? ` (${p2p.cardIssuer})` : ""
    const product = p2p?.productDescription || obl.detail
    const total = formatCLP(obl.installmentAmountCents)

    let msg = `Hola ${person}! Te comparto el detalle de tu cuota mensual por la compra de "${product}"${card}:\n`
    msg += `• Monto mensual a transferir: ${total}\n`
    msg += `• Cuota: ${obl.currentInstallment} de ${obl.totalInstallments}\n`
    msg += `• Día acordado de pago: ${obl.dueDay} de cada mes.\n¡Muchas gracias!`

    void navigator.clipboard.writeText(msg)
    setCopiedId(oblId)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleOpenNewModal = () => {
    setEditingObligation(null)
    setCloningObligation(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (obl: Obligation) => {
    setEditingObligation(obl)
    setCloningObligation(null)
    setIsModalOpen(true)
  }

  const handleOpenCloneModal = (obl: Obligation) => {
    setEditingObligation(null)
    setCloningObligation(obl)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingObligation(null)
    setCloningObligation(null)
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Obligaciones Financieras
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Listado y control consolidado de gastos recurrentes, deudas y compras compartidas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <button
            onClick={() => setIsCategorySettingsOpen(true)}
            className="min-h-[40px] flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition border border-slate-700 cursor-pointer"
          >
            <span>⚙️</span> Configurar Categorías
          </button>
          <button
            onClick={handleOpenNewModal}
            className="min-h-[40px] flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg cursor-pointer"
          >
            <span className="text-base font-bold">+</span> Nueva Obligación
          </button>
        </div>
      </div>

      {/* Metric Summary Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Total Obligaciones
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {activeObligations.length} <span className="text-xs font-normal text-slate-400">registradas</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
            Compromiso Mensual Total
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
            {formatCLP(toMoney(totalMonthlyCommitment))} <span className="text-xs font-normal text-slate-400">/ mes</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
            Saldo Total Deudas
          </div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">
            {formatCLP(toMoney(totalDebtRemainingBalance))}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/80">
        {/* Search input */}
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, detalle, tarjeta o persona..."
            className="w-full h-10 pl-9 pr-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setTypeFilter("ALL")}
            className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border whitespace-nowrap ${
              typeFilter === "ALL"
                ? "bg-slate-800 text-white border-slate-700"
                : "text-slate-400 border-transparent hover:bg-slate-800/50"
            }`}
          >
            Todos ({activeObligations.length})
          </button>
          <button
            onClick={() => setTypeFilter("EXPENSE")}
            className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border whitespace-nowrap ${
              typeFilter === "EXPENSE"
                ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                : "text-slate-400 border-transparent hover:bg-slate-800/50"
            }`}
          >
            💡 Gastos
          </button>
          <button
            onClick={() => setTypeFilter("DEBT")}
            className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border whitespace-nowrap ${
              typeFilter === "DEBT"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "text-slate-400 border-transparent hover:bg-slate-800/50"
            }`}
          >
            🏦 Deudas
          </button>
          <button
            onClick={() => setTypeFilter("P2P_DEBT")}
            className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border whitespace-nowrap ${
              typeFilter === "P2P_DEBT"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "text-slate-400 border-transparent hover:bg-slate-800/50"
            }`}
          >
            👥 Terceros
          </button>

          {/* View toggle (List vs Grid) */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 ml-2 text-xs">
            <button
              onClick={() => setViewMode("list")}
              title="Vista en Listado / Tabla"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "list" ? "bg-slate-800 text-emerald-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              📋
            </button>
            <button
              onClick={() => setViewMode("grid")}
              title="Vista en Tarjetas"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "grid" ? "bg-slate-800 text-emerald-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              🗂️
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredObligations.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl">
          <div className="text-4xl mb-3">💳</div>
          <h3 className="text-base sm:text-lg font-medium text-slate-200">
            {activeObligations.length === 0 ? "No hay obligaciones registradas" : "No hay resultados para tu búsqueda"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            {activeObligations.length === 0
              ? "Ingresa tus gastos recurrentes, créditos bancarios o compras compartidas con terceros para proyectar automáticamente todas sus cuotas."
              : "Prueba modificando el texto del buscador o cambiando el filtro de tipo de registro."}
          </p>
          {activeObligations.length === 0 && (
            <button
              onClick={handleOpenNewModal}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-sm font-medium border border-slate-700 cursor-pointer"
            >
              Agregar mi primera obligación
            </button>
          )}
        </div>
      ) : viewMode === "list" ? (
        /* ─── VISTA 1: LISTADO / TABLA COMPACTA Y CLARA (DEFAULT) ─── */
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/90 text-slate-400 uppercase text-[11px] tracking-wider border-b border-slate-800 sticky top-0 z-30">
              <tr>
                <th className="px-4 sm:px-5 py-3.5 font-bold text-slate-300 min-w-[200px]">
                  Obligación / Detalle
                </th>
                <th className="px-3 sm:px-4 py-3.5 font-semibold text-slate-300 min-w-[130px]">
                  Categoría & Tipo
                </th>
                <th className="px-3 sm:px-4 py-3.5 text-right font-semibold text-slate-300 min-w-[120px]">
                  Monto Mensual
                </th>
                <th className="px-3 sm:px-4 py-3.5 text-center font-semibold text-slate-300 min-w-[140px]">
                  Progreso / Vencimiento
                </th>
                <th className="px-3 sm:px-4 py-3.5 text-right font-semibold text-slate-300 min-w-[120px]">
                  Total Compromiso
                </th>
                <th className="px-4 sm:px-5 py-3.5 text-center font-semibold text-slate-300 min-w-[140px]">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {filteredObligations.map((obl) => {
                const relatedInst = Object.values(installments).filter((i) => i.obligationId === obl.id)
                const paidCount = relatedInst.filter((i) => i.status === "PAID").length
                const pendingCount = relatedInst.filter((i) => i.status === "PENDING").length
                const isExpense = obl.type === "EXPENSE"
                const isP2P = obl.type === "P2P_DEBT"
                const isLent = obl.p2pMetadata?.role === "LENT_MY_CARD"

                const progressPercent =
                  obl.totalInstallments > 0
                    ? Math.round((paidCount / obl.totalInstallments) * 100)
                    : 0

                return (
                  <tr
                    key={obl.id}
                    className="hover:bg-slate-800/40 transition bg-slate-900/30 text-xs"
                  >
                    {/* Column 1: Subcategory / Name / Details */}
                    <td className="px-4 sm:px-5 py-3.5">
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{isP2P ? "👤" : isExpense ? "💡" : "🏦"}</span>
                          <span className="truncate">{obl.subcategory}</span>
                        </div>
                        {obl.detail && (
                          <div className="text-xs text-slate-300 truncate max-w-xs">{obl.detail}</div>
                        )}
                        {isP2P && obl.p2pMetadata?.cardIssuer && (
                          <div className="text-[11px] text-amber-400/90 flex items-center gap-1">
                            <span>💳 Tarjeta: {obl.p2pMetadata.cardIssuer}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Column 2: Category & Type Badge */}
                    <td className="px-3 sm:px-4 py-3.5">
                      <div className="space-y-1">
                        <div>
                          <CategoryBadge categoryId={obl.categoryId} />
                        </div>
                        <div>
                          {isExpense && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                              💡 Gasto Fijo
                            </span>
                          )}
                          {isP2P && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              {isLent ? "💳 Presté Tarjeta" : "👥 P2P"}
                            </span>
                          )}
                          {!isExpense && !isP2P && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              🏦 Deuda
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Column 3: Monthly Amount */}
                    <td className="px-3 sm:px-4 py-3.5 text-right font-mono">
                      <div className="font-bold text-sm text-white">
                        {formatCLP(obl.installmentAmountCents)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isExpense ? "estimado/mes" : "por cuota"}
                      </div>
                    </td>

                    {/* Column 4: Progress / Due Day */}
                    <td className="px-3 sm:px-4 py-3.5 text-center">
                      {isExpense ? (
                        <div className="space-y-0.5">
                          <span className="text-xs font-medium text-sky-300">Mensual permanente</span>
                          <div className="text-[11px] text-slate-400">Día {obl.dueDay} de cada mes</div>
                        </div>
                      ) : (
                        <div className="space-y-1 max-w-[140px] mx-auto">
                          <div className="flex justify-between text-[11px] text-slate-300 font-medium">
                            <span>{paidCount} pagadas</span>
                            <span className="text-slate-400">de {obl.totalInstallments}</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {pendingCount} pendientes • Día {obl.dueDay}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Column 5: Total Commitment */}
                    <td className="px-3 sm:px-4 py-3.5 text-right font-mono">
                      {isExpense ? (
                        <span className="text-xs text-slate-400">Continuo</span>
                      ) : (
                        <div>
                          <div className="font-semibold text-xs text-slate-200">
                            {formatCLP(obl.totalAmountCents)}
                          </div>
                          <div className="text-[10px] text-slate-500">Monto total</div>
                        </div>
                      )}
                    </td>

                    {/* Column 6: Actions */}
                    <td className="px-4 sm:px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isP2P && isLent && (
                          <button
                            type="button"
                            onClick={() => handleCopyWhatsApp(obl.id)}
                            title="Copiar cobro WhatsApp para el tercero"
                            className="min-h-[32px] px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                          >
                            <span>{copiedId === obl.id ? "✅" : "📲"}</span>
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenCloneModal(obl)}
                          title="Clonar obligación"
                          className="min-h-[32px] px-2.5 py-1 text-slate-300 hover:text-sky-400 text-xs transition cursor-pointer flex items-center gap-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60"
                        >
                          <span>📋</span>
                          <span>Clonar</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(obl)}
                          title="Editar obligación"
                          className="min-h-[32px] px-2.5 py-1 text-slate-300 hover:text-emerald-400 text-xs transition cursor-pointer flex items-center gap-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60"
                        >
                          <span>✏️</span>
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => softDeleteObligation(obl.id)}
                          title="Eliminar obligación"
                          className="min-h-[32px] px-2 py-1 text-slate-400 hover:text-rose-400 text-xs transition cursor-pointer flex items-center rounded-lg hover:bg-slate-800"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ─── VISTA 2: TARJETAS EN CUADRÍCULA ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredObligations.map((obl) => {
            const relatedInst = Object.values(installments).filter((i) => i.obligationId === obl.id)
            const paidCount = relatedInst.filter((i) => i.status === "PAID").length
            const pendingCount = relatedInst.filter((i) => i.status === "PENDING").length
            const isExpense = obl.type === "EXPENSE"
            const isP2P = obl.type === "P2P_DEBT"

            return (
              <div
                key={obl.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl hover:border-slate-700 transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <CategoryBadge categoryId={obl.categoryId} />
                      {isExpense && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                          💡 Gasto
                        </span>
                      )}
                      {isP2P && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {obl.p2pMetadata?.role === "LENT_MY_CARD" ? "💳 Tarjeta Prestada" : "👥 P2P"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenCloneModal(obl)}
                        title="Clonar obligación"
                        className="min-h-[32px] px-2.5 py-1 text-slate-400 hover:text-sky-400 text-xs transition cursor-pointer flex items-center gap-1 rounded hover:bg-slate-800"
                      >
                        <span>📋</span> Clonar
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(obl)}
                        title="Editar obligación"
                        className="min-h-[32px] px-2.5 py-1 text-slate-400 hover:text-emerald-400 text-xs transition cursor-pointer flex items-center gap-1 rounded hover:bg-slate-800"
                      >
                        <span>✏️</span> Editar
                      </button>
                      <button
                        onClick={() => softDeleteObligation(obl.id)}
                        title="Eliminar obligación"
                        className="min-h-[32px] px-2 py-1 text-slate-400 hover:text-rose-400 text-xs transition cursor-pointer flex items-center rounded hover:bg-slate-800"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-base flex items-center gap-1.5">
                      {obl.subcategory}
                    </h4>
                    {obl.detail && <p className="text-xs text-slate-400 line-clamp-1">{obl.detail}</p>}
                    {isP2P && obl.p2pMetadata?.cardIssuer && (
                      <p className="text-[11px] text-amber-300/80 mt-0.5">
                        💳 {obl.p2pMetadata.cardIssuer}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800/80">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{isExpense ? "Monto mensual estimado:" : "Monto por cuota:"}</span>
                    <span className="font-semibold text-white">{formatCLP(obl.installmentAmountCents)}</span>
                  </div>

                  {!isExpense && (
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Total compromiso:</span>
                      <span className="font-medium text-slate-300">{formatCLP(obl.totalAmountCents)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{isExpense ? "Frecuencia:" : "Progreso cuotas:"}</span>
                    <span className={`font-medium ${isExpense ? "text-sky-300" : "text-emerald-400"}`}>
                      {isExpense
                        ? `Mensual (Día ${obl.dueDay})`
                        : `${paidCount} pagadas / ${pendingCount} pendientes (${obl.totalInstallments} total)`}
                    </span>
                  </div>

                  {isP2P && obl.p2pMetadata?.role === "LENT_MY_CARD" && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleCopyWhatsApp(obl.id)}
                        className="w-full min-h-[36px] px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition"
                      >
                        <span>{copiedId === obl.id ? "✅ ¡Copiado!" : "📲 Copiar Cobro WhatsApp"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isModalOpen && (
        <ObligationFormModal
          obligationToEdit={editingObligation}
          obligationToClone={cloningObligation}
          onClose={handleCloseModal}
        />
      )}
      {isCategorySettingsOpen && (
        <CategorySettingsModal onClose={() => setIsCategorySettingsOpen(false)} />
      )}
    </div>
  )
}
