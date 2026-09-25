import React, { useState } from "react"
import { useMatrixComputation, type MatrixSubcategory, type P2PPersonGroup } from "../hooks/useMatrixComputation"
import { formatCLP, toMoney } from "@/shared/types/money"
import { useIncomeStore, getTotalIncomeForPeriod } from "@/features/income/store/incomeSlice"
import type { Category } from "@/shared/types/domain"
import { MatrixItemDetailModal, type MatrixItemDetailPayload } from "./MatrixItemDetailModal"

type GroupByMode = "category" | "p2p" | "type"

export const FinancialMatrix: React.FC = () => {
  const [baseDate, setBaseDate] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [monthsCount, setMonthsCount] = useState<number>(6)
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [groupBy, setGroupBy] = useState<GroupByMode>("category")
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [selectedItem, setSelectedItem] = useState<MatrixItemDetailPayload | null>(null)

  const matrix = useMatrixComputation(baseDate, monthsCount)
  const { incomes } = useIncomeStore()

  const handleOpenSubcatDetail = (cat: Category, subcat: MatrixSubcategory) => {
    setSelectedItem({
      id: subcat.id,
      name: subcat.name,
      categoryName: subcat.categoryName || cat.name,
      categoryColor: subcat.categoryColor || cat.color,
      cells: subcat.cells,
      totalInRange: subcat.total,
      periods: matrix.periods,
      obligationId: subcat.obligationId,
      obligationIds: subcat.obligationIds,
      purchaseId: subcat.purchaseId,
      cardAccountId: subcat.cardAccountId,
      type: subcat.type,
      p2pRole: subcat.p2pRole,
      thirdPartyName: subcat.thirdPartyName,
      cardIssuer: subcat.cardIssuer,
      productDescription: subcat.productDescription,
      detail: subcat.detail,
    })
  }

  const handleOpenP2PDetail = (p2p: P2PPersonGroup) => {
    setSelectedItem({
      id: p2p.id,
      name: p2p.personName,
      categoryName: p2p.categoryName,
      cells: p2p.cells,
      totalInRange: p2p.total,
      periods: matrix.periods,
      obligationId: p2p.obligationId,
      purchaseId: p2p.purchaseId,
      cardAccountId: p2p.cardAccountId,
      type: "P2P_DEBT",
      p2pRole: p2p.role,
      thirdPartyName: p2p.personName,
      cardIssuer: p2p.cardIssuer,
      productDescription: p2p.productDescription,
      detail: p2p.detail,
    })
  }

  const handlePrev = () => {
    setBaseDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNext = () => {
    setBaseDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }))
  }

  const areAllExpanded =
    matrix.categories.length > 0 && matrix.categories.every((cat) => expandedCategories[cat.id])

  const toggleExpandAll = () => {
    if (areAllExpanded) {
      setExpandedCategories({})
    } else {
      const all: Record<string, boolean> = {}
      for (const cat of matrix.categories) {
        all[cat.id] = true
      }
      setExpandedCategories(all)
    }
  }

  const totalIncomesInRange = matrix.periods.reduce(
    (sum, p) => sum + getTotalIncomeForPeriod(incomes, p),
    0
  )
  const totalRealIncomesInRange = matrix.periods.reduce(
    (sum, p) => sum + getTotalIncomeForPeriod(incomes, p, "REAL"),
    0
  )
  const totalEstimatedIncomesInRange = matrix.periods.reduce(
    (sum, p) => sum + getTotalIncomeForPeriod(incomes, p, "ESTIMATED"),
    0
  )
  const totalPersonalOutflow = matrix.totalPersonalExpenses
  const totalReceivables = matrix.totalThirdPartyReceivables
  const totalNetMargin = totalIncomesInRange - totalPersonalOutflow

  return (
    <div className="space-y-6">
      {/* Matrix Controls & Summary: Multi-tier Toolbar */}
      <div className="bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800 backdrop-blur-xl flex flex-col gap-4">
        {/* Tier 1: Header & View switches */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Matriz de Consolidación Financiera</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cruce interactivo de Categorías, Cuentas de Terceros y Flujo de Caja proyectado
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Group By Filter Tabs */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setGroupBy("category")}
                className={`min-h-[44px] sm:min-h-[36px] px-3.5 sm:px-3 py-2 sm:py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  groupBy === "category"
                    ? "bg-slate-800 text-emerald-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>📂</span>
                <span>Categorías</span>
              </button>
              <button
                type="button"
                onClick={() => setGroupBy("p2p")}
                className={`min-h-[44px] sm:min-h-[36px] px-3.5 sm:px-3 py-2 sm:py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  groupBy === "p2p"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>👥</span>
                <span>Deudas Terceros ({matrix.p2pGroups.length})</span>
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                aria-label="Vista tabla"
                className={`min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-0 px-3.5 sm:px-3 py-2 sm:py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  viewMode === "table"
                    ? "bg-slate-800 text-emerald-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>📊</span>
                <span className="hidden xs:inline">Tabla</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                aria-label="Vista tarjetas"
                className={`min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-0 px-3.5 sm:px-3 py-2 sm:py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  viewMode === "cards"
                    ? "bg-slate-800 text-emerald-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>🗂️</span>
                <span className="hidden xs:inline">Tarjetas</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tier 2: Navigation & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-800/60">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Period Range Navigator */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Mes anterior"
                className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] p-2 sm:p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
              >
                ←
              </button>
              <span className="text-xs font-semibold text-white px-2.5 whitespace-nowrap">
                {matrix.periods[0]} a {matrix.periods[matrix.periods.length - 1]}
              </span>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Mes siguiente"
                className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] p-2 sm:p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
              >
                →
              </button>
            </div>

            {/* Horizon Selector */}
            <select
              value={monthsCount}
              onChange={(e) => setMonthsCount(Number(e.target.value))}
              aria-label="Cantidad de meses a proyectar"
              className="min-h-[44px] sm:min-h-[36px] px-3.5 sm:px-3 py-2 sm:py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer transition"
            >
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
            </select>
          </div>

          {/* Action Button: Expand / Collapse All (Category mode) */}
          {groupBy === "category" && (
            <button
              type="button"
              onClick={toggleExpandAll}
              aria-expanded={areAllExpanded}
              aria-label={areAllExpanded ? "Contraer subcategorías" : "Desglosar subcategorías"}
              className="min-h-[44px] sm:min-h-[36px] px-3.5 sm:px-3 py-2 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <span>{areAllExpanded ? "🔼" : "🔽"}</span>
              <span>{areAllExpanded ? "Contraer subcategorías" : "Desglosar subcategorías"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Egresos Propios */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs text-rose-400 font-semibold uppercase tracking-wider">
              Egresos Propios
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
              Gastos + Deudas
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-rose-300 mt-2">
            {formatCLP(toMoney(totalPersonalOutflow))}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">En los {monthsCount} meses</div>
        </div>

        {/* Card 2: Por Cobrar a Terceros */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
              Por Cobrar a Terceros
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
              Reembolsos P2P
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-300 mt-2">
            {formatCLP(toMoney(totalReceivables))}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {matrix.p2pGroups.filter((g) => g.role === "LENT_MY_CARD").length} cuentas por cobrar
          </div>
        </div>

        {/* Card 3: Total Ingresos */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs text-sky-300 font-semibold uppercase tracking-wider">
              Total Ingresos
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 font-medium">
              Real + Estimado
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-sky-300 mt-2">
            {formatCLP(toMoney(totalIncomesInRange))}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap items-center gap-1.5 font-mono">
            <span className="text-emerald-400">R: {formatCLP(toMoney(totalRealIncomesInRange))}</span>
            <span>•</span>
            <span className="text-amber-300">E: {formatCLP(toMoney(totalEstimatedIncomesInRange))}</span>
          </div>
        </div>

        {/* Card 4: Margen Neto Real */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white font-semibold uppercase tracking-wider">
              Margen Neto Real
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                totalNetMargin >= 0
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}
            >
              Ingresos - Egresos
            </span>
          </div>
          <div
            className={`text-xl sm:text-2xl font-bold font-mono tracking-tight mt-2 ${
              totalNetMargin >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {totalNetMargin >= 0 ? "+" : ""}
            {formatCLP(toMoney(totalNetMargin))}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Capacidad neta global</div>
        </div>
      </div>

      {/* ─── GROUP BY: TERCEROS / P2P DEDICATED VIEW ─── */}
      {groupBy === "p2p" ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>👥</span> Consolidación de Cuentas y Tarjetas con Terceros
            </h3>
            <span className="text-xs text-slate-400">
              Total compromisos P2P:{" "}
              <span className="text-white font-mono font-bold">
                {formatCLP(toMoney(matrix.p2pGroups.reduce((acc, g) => acc + g.total, 0)))}
              </span>
            </span>
          </div>

          {matrix.p2pGroups.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-xl">
              <div className="text-3xl mb-2">👥</div>
              <h4 className="text-sm font-semibold text-slate-200">No hay deudas o préstamos con terceros</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Registra compras donde prestaste tu tarjeta de crédito o usaste la tarjeta de otra persona para ver aquí el desglose mes a mes.
              </p>
            </div>
          ) : viewMode === "table" ? (
            /* P2P Matrix Table */
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950/90 text-slate-400 uppercase text-[11px] tracking-wider border-b border-slate-800 sticky top-0 z-30">
                  <tr>
                    <th className="px-4 sm:px-5 py-3.5 text-left font-bold text-slate-300 sticky left-0 bg-slate-950 border-r border-slate-800 z-20 min-w-[200px] sm:min-w-[260px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                      Persona / Producto / Medio
                    </th>
                    <th className="px-3 py-3.5 text-center font-bold text-amber-400 min-w-[120px]">
                      Situación
                    </th>
                    {matrix.periods.map((period) => (
                      <th
                        key={period}
                        className="px-3 sm:px-4 py-3.5 text-right font-mono tabular-nums font-semibold min-w-[100px] sm:min-w-[120px]"
                      >
                        {period}
                      </th>
                    ))}
                    <th className="px-4 sm:px-5 py-3.5 text-right font-mono tabular-nums font-bold text-amber-400 min-w-[110px] sm:min-w-[130px]">
                      Total Período
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {matrix.p2pGroups.map((p2p) => {
                    const isLent = p2p.role === "LENT_MY_CARD"
                    const isUsed = p2p.role === "USED_THEIR_CARD"

                    return (
                      <tr
                        key={p2p.id}
                        onClick={() => handleOpenP2PDetail(p2p)}
                        className="hover:bg-slate-800/40 transition bg-slate-900/40 cursor-pointer group"
                      >
                        <td className="px-4 sm:px-5 py-3 font-semibold text-white sticky left-0 bg-slate-950/95 group-hover:bg-slate-900/95 backdrop-blur-md border-r border-slate-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] transition">
                          <div className="flex items-center justify-between gap-2">
                            <div className="space-y-0.5 min-w-0">
                              <div className="text-sm font-bold text-white group-hover:text-amber-300 transition flex items-center gap-1.5 truncate">
                                <span>👤</span>
                                <span>{p2p.personName}</span>
                              </div>
                              <div className="text-xs text-slate-300 flex items-center gap-1 truncate">
                                <span>🛍️ {p2p.productDescription}</span>
                              </div>
                              {p2p.cardIssuer && (
                                <div className="text-[11px] text-amber-400/90 flex items-center gap-1 truncate">
                                  <span>💳 Tarjeta: {p2p.cardIssuer}</span>
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenP2PDetail(p2p)
                              }}
                              aria-label={`Ver detalle de ${p2p.personName}`}
                              className="min-h-[44px] sm:min-h-0 sm:py-0.5 px-2.5 sm:px-2 py-2 rounded-lg opacity-90 group-hover:opacity-100 text-xs sm:text-[10px] text-amber-400 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition flex items-center justify-center gap-1 cursor-pointer flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            >
                              <span>👁️</span>
                              <span className="hidden sm:inline">Detalle</span>
                            </button>
                          </div>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isLent
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                : isUsed
                                ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                : "bg-violet-500/15 text-violet-300 border-violet-500/30"
                            }`}
                          >
                            {isLent ? "💳 Presté tarjeta" : isUsed ? "🛍️ Usé tarjeta" : "🤝 Préstamo"}
                          </span>
                        </td>

                        {matrix.periods.map((period) => {
                          const amount = p2p.cells[period] ?? 0
                          return (
                            <td
                              key={period}
                              className={`px-3 sm:px-4 py-3 text-right font-mono tabular-nums text-xs whitespace-nowrap transition ${
                                amount > 0 ? "text-slate-200 font-medium" : "text-slate-400/80 font-normal"
                              }`}
                            >
                              {amount > 0 ? (
                                formatCLP(toMoney(amount))
                              ) : (
                                <span className="text-slate-500" aria-label="Sin movimientos">—</span>
                              )}
                            </td>
                          )
                        })}

                        <td className="px-4 sm:px-5 py-3 text-right font-mono tabular-nums font-bold text-white whitespace-nowrap">
                          {formatCLP(toMoney(p2p.total))}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* P2P Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matrix.p2pGroups.map((p2p) => {
                const isLent = p2p.role === "LENT_MY_CARD"
                const isUsed = p2p.role === "USED_THEIR_CARD"

                return (
                  <div
                    key={p2p.id}
                    onClick={() => handleOpenP2PDetail(p2p)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        handleOpenP2PDetail(p2p)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Ver detalle de ${p2p.personName}`}
                    className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 backdrop-blur-xl space-y-4 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 group"
                  >
                    <div className="flex items-start justify-between pb-3 border-b border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base">👤</span>
                          <h3 className="font-bold text-white group-hover:text-amber-300 transition text-base">{p2p.personName}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isLent
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                : isUsed
                                ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                : "bg-violet-500/15 text-violet-300 border-violet-500/30"
                            }`}
                          >
                            {isLent ? "Presté tarjeta" : isUsed ? "Usé tarjeta" : "Préstamo"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">🛍️ {p2p.productDescription}</p>
                        {p2p.cardIssuer && (
                          <p className="text-[11px] text-amber-400/90 mt-0.5">💳 {p2p.cardIssuer}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase text-slate-400 font-semibold flex items-center justify-end gap-1">
                          <span>Total</span>
                          <span className="text-slate-500 group-hover:text-slate-300">👁️</span>
                        </div>
                        <div className="font-mono font-bold text-white text-sm">
                          {formatCLP(toMoney(p2p.total))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {matrix.periods.map((period) => {
                        const amount = p2p.cells[period] ?? 0
                        return (
                          <div
                            key={period}
                            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex flex-col justify-between"
                          >
                            <span className="text-[10px] font-semibold text-slate-400 uppercase font-mono">
                              {period}
                            </span>
                            <span
                              className={`font-mono text-xs font-semibold mt-1 ${
                                amount > 0 ? "text-amber-300" : "text-slate-400/80"
                              }`}
                            >
                              {amount > 0 ? (
                                formatCLP(toMoney(amount))
                              ) : (
                                <span className="text-slate-500" aria-label="Sin movimientos">—</span>
                              )}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* ─── GROUP BY: CATEGORÍAS VIEW (DEFAULT) ─── */
        viewMode === "cards" ? (
          <div className="space-y-4" data-testid="matrix-cards-view">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matrix.categories.map((cat) => {
                const rowTotal = matrix.rowTotals[cat.id] ?? 0
                const subcats = matrix.subcategoriesByCategory[cat.id] ?? []
                const isCardExpanded = expandedCategories[cat.id] ?? true
                const avgPerMonth = matrix.periods.length > 0 ? Math.round(rowTotal / matrix.periods.length) : 0

                return (
                  <div
                    key={cat.id}
                    data-testid={`matrix-card-${cat.id}`}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-3.5 transition-all shadow-lg hover:border-slate-700/80"
                  >
                    {/* Interactive Header: Category Name + Total + Accordion Toggle */}
                    <div
                      onClick={() => toggleCategoryExpand(cat.id)}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isCardExpanded}
                      aria-label={`${isCardExpanded ? "Contraer" : "Expandir"} categoría ${cat.name}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          toggleCategoryExpand(cat.id)
                        }
                      }}
                      className="flex items-center justify-between pb-3 border-b border-slate-800/80 cursor-pointer select-none group/header"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block flex-shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                        <div className="min-w-0">
                          <h3 className="font-bold text-white text-base group-hover/header:text-emerald-300 transition truncate">
                            {cat.name}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>Promedio: <strong className="font-mono text-slate-200">{formatCLP(toMoney(avgPerMonth))}</strong>/mes</span>
                            {subcats.length > 0 && (
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                                {subcats.length} subcat.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Total {matrix.periods.length}m</div>
                          <div className="font-mono font-bold text-white text-base text-emerald-400">
                            {formatCLP(toMoney(rowTotal))}
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-slate-800/60 group-hover/header:bg-slate-800 flex items-center justify-center text-slate-400 group-hover/header:text-white transition text-xs border border-slate-700/50">
                          <span>{isCardExpanded ? "▲" : "▼"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Mini-Timeline: Horizontal scrollable month pills */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-slate-400 px-0.5">
                        <span>Mini-Timeline de Cuotas</span>
                        <span className="font-mono">{matrix.periods[0]} → {matrix.periods[matrix.periods.length - 1]}</span>
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {matrix.periods.map((period) => {
                          const amount = matrix.cells[cat.id]?.[period] ?? 0
                          const hasAmount = amount > 0
                          return (
                            <div
                              key={period}
                              className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl border text-center transition min-w-[70px] ${
                                hasAmount
                                  ? "bg-slate-950/80 border-emerald-500/30 text-emerald-300"
                                  : "bg-slate-950/40 border-slate-800/60 text-slate-400"
                              }`}
                            >
                              <div className="text-[9px] uppercase font-mono text-slate-400 font-medium">{period.slice(5)}</div>
                              <div className={`font-mono text-[11px] font-bold ${hasAmount ? "text-slate-100" : "text-slate-400"}`}>
                                {hasAmount ? formatCLP(toMoney(amount)) : "—"}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Subcategories breakdown (Accordion Content) */}
                    {isCardExpanded && (
                      <div className="pt-2 border-t border-slate-800/60 space-y-2 animate-in fade-in-0 duration-150">
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          <span>Subcategorías ({subcats.length})</span>
                          <span className="text-[10px] text-slate-400 font-normal">Toca para ver detalle</span>
                        </div>

                        {subcats.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-1">Sin subcategorías registradas</p>
                        ) : (
                          <div className="space-y-1.5" data-testid={`matrix-card-subcats-${cat.id}`}>
                            {subcats.map((subcat) => {
                              const percent = rowTotal > 0 ? Math.round((subcat.total / rowTotal) * 100) : 0
                              const isP2P = subcat.type === "P2P_DEBT"
                              const isExpense = subcat.type === "EXPENSE"

                              return (
                                <div
                                  key={subcat.id}
                                  onClick={() => handleOpenSubcatDetail(cat, subcat)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault()
                                      handleOpenSubcatDetail(cat, subcat)
                                    }
                                  }}
                                  tabIndex={0}
                                  role="button"
                                  aria-label={`Ver detalle de ${subcat.name}`}
                                  className="p-3 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800/70 hover:border-slate-700 flex items-center justify-between gap-2.5 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 group/subcat min-h-[48px]"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
                                      <span className="group-hover/subcat:text-emerald-300 transition">{subcat.name}</span>
                                      {isP2P && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                          👥 {subcat.p2pRole === "LENT_MY_CARD" ? "Tarjeta Prestada" : "Tercero"}
                                        </span>
                                      )}
                                      {isExpense && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                                          💡 Gasto
                                        </span>
                                      )}
                                    </div>
                                    {subcat.productDescription && (
                                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                        🛍️ {subcat.productDescription}
                                      </div>
                                    )}
                                    {rowTotal > 0 && !subcat.productDescription && (
                                      <div className="text-[10px] text-slate-400 mt-0.5">
                                        {percent}% del total de {cat.name}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-semibold text-xs text-emerald-400 whitespace-nowrap">
                                      {formatCLP(toMoney(subcat.total))}
                                    </span>
                                    <span className="text-xs text-slate-400 group-hover/subcat:text-slate-200 transition">👁️</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* Matrix Grid Table */
          <div className="space-y-2" data-testid="matrix-table-view">
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950/90 text-slate-400 uppercase text-[11px] tracking-wider border-b border-slate-800 sticky top-0 z-30">
                  <tr>
                    <th className="px-4 sm:px-5 py-3.5 sm:py-4 text-left font-bold text-slate-300 sticky left-0 bg-slate-950 border-r border-slate-800 z-20 min-w-[180px] sm:min-w-[240px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                      Categoría / Subcategoría
                    </th>
                    {matrix.periods.map((period) => (
                      <th
                        key={period}
                        className="px-3 sm:px-4 py-3.5 sm:py-4 text-right font-mono tabular-nums font-semibold min-w-[100px] sm:min-w-[120px]"
                      >
                        {period}
                      </th>
                    ))}
                    <th className="px-4 sm:px-5 py-3.5 sm:py-4 text-right font-mono tabular-nums font-bold text-emerald-400 min-w-[110px] sm:min-w-[130px]">
                      Total Fila
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/60">
                  {matrix.categories.map((cat) => {
                    const rowTotal = matrix.rowTotals[cat.id] ?? 0
                    const subcats = matrix.subcategoriesByCategory[cat.id] ?? []
                    const isExpanded = !!expandedCategories[cat.id]

                    return (
                      <React.Fragment key={cat.id}>
                        {/* Main Category Row */}
                        <tr
                          onClick={() => toggleCategoryExpand(cat.id)}
                          className="hover:bg-slate-800/30 transition cursor-pointer bg-slate-900/40"
                        >
                          <td className="px-4 sm:px-5 py-3 sm:py-3.5 font-semibold text-white sticky left-0 bg-slate-950/95 backdrop-blur-md border-r border-slate-800 z-10 flex items-center justify-between gap-2 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 inline-block flex-shrink-0" />
                              <span className="truncate">{cat.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {subcats.length > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-normal border border-slate-700/60">
                                  {subcats.length} subcat.
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleCategoryExpand(cat.id)
                                }}
                                aria-label={`${isExpanded ? "Contraer" : "Expandir"} ${cat.name}`}
                                aria-expanded={isExpanded}
                                className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-white flex items-center justify-center rounded-lg hover:bg-slate-800/80 transition cursor-pointer text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                              >
                                <span>{isExpanded ? "▼" : "▶"}</span>
                              </button>
                            </div>
                          </td>

                          {matrix.periods.map((period) => {
                            const amount = matrix.cells[cat.id]?.[period] ?? 0
                            return (
                              <td
                                key={period}
                                className={`px-3 sm:px-4 py-3 sm:py-3.5 text-right font-mono tabular-nums text-xs whitespace-nowrap transition ${
                                  amount > 0 ? "text-slate-200 font-medium" : "text-slate-400/80 font-normal"
                                }`}
                              >
                                {amount > 0 ? (
                                  formatCLP(toMoney(amount))
                                ) : (
                                  <span className="text-slate-500" aria-label="Sin movimientos">—</span>
                                )}
                              </td>
                            )
                          })}

                          <td className="px-4 sm:px-5 py-3 sm:py-3.5 text-right font-mono tabular-nums font-bold text-white whitespace-nowrap">
                            {formatCLP(toMoney(rowTotal))}
                          </td>
                        </tr>

                        {/* Expanded Subcategory Rows */}
                        {isExpanded &&
                          (subcats.length === 0 ? (
                            <tr className="bg-slate-950/40 border-b border-slate-800/40">
                              <td
                                colSpan={matrix.periods.length + 2}
                                className="px-8 py-2.5 text-xs text-slate-500 italic"
                              >
                                Sin subcategorías registradas para esta categoría
                              </td>
                            </tr>
                          ) : (
                            subcats.map((subcat) => {
                              const isP2P = subcat.type === "P2P_DEBT"
                              const isExpense = subcat.type === "EXPENSE"

                              return (
                                <tr
                                  key={subcat.id}
                                  data-testid={`matrix-subcat-row-${subcat.id}`}
                                  onClick={() => handleOpenSubcatDetail(cat, subcat)}
                                  className="bg-slate-950/50 hover:bg-slate-800/60 transition text-xs border-b border-slate-800/30 cursor-pointer group/subrow"
                                >
                                  <td className="pl-8 sm:pl-10 pr-4 py-2.5 text-slate-300 sticky left-0 bg-slate-950/95 group-hover/subrow:bg-slate-900/95 border-r border-slate-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] transition">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                        <span className="text-slate-500 font-mono text-xs">↳</span>
                                        <span className="font-medium text-slate-200 group-hover/subrow:text-emerald-300 transition">{subcat.name}</span>
                                        {isP2P && (
                                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                            👥 {subcat.p2pRole === "LENT_MY_CARD" ? "Tarjeta Prestada" : "Tercero"}
                                          </span>
                                        )}
                                        {isExpense && (
                                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                                            💡 Gasto
                                          </span>
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleOpenSubcatDetail(cat, subcat)
                                        }}
                                        aria-label={`Ver detalle de ${subcat.name}`}
                                        className="min-h-[44px] sm:min-h-0 sm:py-0.5 px-2.5 sm:px-2 py-2 rounded-lg opacity-90 group-hover/subrow:opacity-100 text-xs sm:text-[10px] text-emerald-400 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition flex items-center justify-center gap-1 cursor-pointer flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                      >
                                        <span>👁️</span>
                                        <span className="hidden sm:inline">Detalle</span>
                                      </button>
                                    </div>
                                    {subcat.productDescription && (
                                      <div className="pl-4 text-[10px] text-slate-400 truncate">
                                        🛍️ {subcat.productDescription}
                                      </div>
                                    )}
                                  </td>

                                  {matrix.periods.map((period) => {
                                    const amount = subcat.cells[period] ?? 0
                                    return (
                                      <td
                                        key={period}
                                        className={`px-3 sm:px-4 py-2.5 text-right font-mono tabular-nums text-xs whitespace-nowrap ${
                                          amount > 0 ? "text-slate-300 font-normal" : "text-slate-700"
                                        }`}
                                      >
                                        {amount > 0 ? formatCLP(toMoney(amount)) : "—"}
                                      </td>
                                    )
                                  })}

                                  <td className="px-4 sm:px-5 py-2.5 text-right font-mono tabular-nums font-semibold text-slate-300 text-xs whitespace-nowrap">
                                    {formatCLP(toMoney(subcat.total))}
                                  </td>
                                </tr>
                              )
                            })
                          ))}
                      </React.Fragment>
                    )
                  })}
                </tbody>

                {/* Totals & Cash Flow Footers */}
                <tfoot className="bg-slate-950/95 text-xs border-t-2 border-slate-700/80 font-bold divide-y divide-slate-800/80">
                  {/* Total Egresos */}
                  <tr>
                    <td className="px-4 sm:px-5 py-3 sm:py-3.5 text-rose-400 uppercase tracking-wider sticky left-0 bg-slate-950 border-r border-slate-800 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                      Total Egresos
                    </td>
                    {matrix.periods.map((period) => {
                      const total = matrix.columnTotals[period] ?? 0
                      return (
                        <td
                          key={period}
                          className="px-3 sm:px-4 py-3 sm:py-3.5 text-right font-mono tabular-nums text-rose-300 whitespace-nowrap"
                        >
                          {formatCLP(toMoney(total))}
                        </td>
                      )
                    })}
                    <td className="px-4 sm:px-5 py-3 sm:py-3.5 text-right font-mono tabular-nums text-rose-300 whitespace-nowrap">
                      {formatCLP(toMoney(matrix.grandTotal))}
                    </td>
                  </tr>

                  {/* Total Ingresos */}
                  <tr>
                    <td className="px-4 sm:px-5 py-3 sm:py-3.5 text-sky-400 uppercase tracking-wider sticky left-0 bg-slate-950 border-r border-slate-800 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                      Total Ingresos
                    </td>
                    {matrix.periods.map((period) => {
                      const income = getTotalIncomeForPeriod(incomes, period)
                      const real = getTotalIncomeForPeriod(incomes, period, "REAL")
                      const est = getTotalIncomeForPeriod(incomes, period, "ESTIMATED")
                      return (
                        <td
                          key={period}
                          className="px-3 sm:px-4 py-3 sm:py-3.5 text-right font-mono tabular-nums text-sky-300 whitespace-nowrap"
                        >
                          <div>{formatCLP(toMoney(income))}</div>
                          {(real > 0 || est > 0) && (
                            <div className="text-[10px] text-slate-400 font-normal">
                              <span className="text-emerald-400">R:{formatCLP(toMoney(real))}</span>
                              {est > 0 && <span className="ml-1 text-amber-300">E:{formatCLP(toMoney(est))}</span>}
                            </div>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-4 sm:px-5 py-3 sm:py-3.5 text-right font-mono tabular-nums text-sky-300 whitespace-nowrap">
                      <div>{formatCLP(toMoney(totalIncomesInRange))}</div>
                      {(totalRealIncomesInRange > 0 || totalEstimatedIncomesInRange > 0) && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          <span className="text-emerald-400">R:{formatCLP(toMoney(totalRealIncomesInRange))}</span>
                          {totalEstimatedIncomesInRange > 0 && (
                            <span className="ml-1 text-amber-300">E:{formatCLP(toMoney(totalEstimatedIncomesInRange))}</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Margen / Flujo de Caja */}
                  <tr className="bg-slate-900/95">
                    <td className="px-4 sm:px-5 py-3.5 sm:py-4 text-white uppercase tracking-wider sticky left-0 bg-slate-950 border-r border-slate-800 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                      Capacidad de Ahorro / Margen
                    </td>
                    {matrix.periods.map((period) => {
                      const expenses = matrix.columnTotals[period] ?? 0
                      const income = getTotalIncomeForPeriod(incomes, period)
                      const margin = income - expenses
                      const isPositive = margin >= 0

                      return (
                        <td
                          key={period}
                          className={`px-3 sm:px-4 py-3.5 sm:py-4 text-right font-mono tabular-nums font-extrabold text-xs sm:text-sm whitespace-nowrap ${
                            isPositive ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {formatCLP(toMoney(margin))}
                        </td>
                      )
                    })}
                    <td className="px-4 sm:px-5 py-3.5 sm:py-4 text-right font-mono tabular-nums text-sm sm:text-base font-extrabold text-white whitespace-nowrap">
                      {totalNetMargin >= 0 ? "+" : ""}
                      {formatCLP(toMoney(totalNetMargin))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )
      )}

      {/* Item Detail Modal */}
      <MatrixItemDetailModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
      />
    </div>
  )
}
