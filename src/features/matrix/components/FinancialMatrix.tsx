import React, { useState } from "react"
import { useMatrixComputation, type P2PPersonGroup } from "../hooks/useMatrixComputation"
import { formatCLP, toMoney } from "@/shared/types/money"
import { useIncomeStore, getTotalIncomeForPeriod } from "@/features/income/store/incomeSlice"

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

  const matrix = useMatrixComputation(baseDate, monthsCount)
  const { incomes } = useIncomeStore()

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
                className={`min-h-[36px] px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
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
                className={`min-h-[36px] px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
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
                className={`min-h-[36px] px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
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
                className={`min-h-[36px] px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
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
                className="min-h-[36px] min-w-[36px] p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer flex items-center justify-center"
              >
                ←
              </button>
              <span className="text-xs font-semibold text-white px-2 whitespace-nowrap">
                {matrix.periods[0]} a {matrix.periods[matrix.periods.length - 1]}
              </span>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Mes siguiente"
                className="min-h-[36px] min-w-[36px] p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer flex items-center justify-center"
              >
                →
              </button>
            </div>

            {/* Horizon Selector */}
            <select
              value={monthsCount}
              onChange={(e) => setMonthsCount(Number(e.target.value))}
              aria-label="Cantidad de meses a proyectar"
              className="min-h-[36px] px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none cursor-pointer"
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
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
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
          <div className="text-[11px] text-slate-500 mt-1">En los {monthsCount} meses</div>
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
          <div className="text-[11px] text-slate-500 mt-1">
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
              Ingresos Fijos/Var
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-sky-300 mt-2">
            {formatCLP(toMoney(totalIncomesInRange))}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Sueldos y otros ingresos</div>
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
                      <tr key={p2p.id} className="hover:bg-slate-800/30 transition bg-slate-900/40">
                        <td className="px-4 sm:px-5 py-3 font-semibold text-white sticky left-0 bg-slate-950/95 backdrop-blur-md border-r border-slate-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                          <div className="space-y-0.5">
                            <div className="text-sm font-bold text-white flex items-center gap-1.5">
                              <span>👤</span>
                              <span>{p2p.personName}</span>
                            </div>
                            <div className="text-xs text-slate-300 flex items-center gap-1">
                              <span>🛍️ {p2p.productDescription}</span>
                            </div>
                            {p2p.cardIssuer && (
                              <div className="text-[11px] text-amber-400/90 flex items-center gap-1">
                                <span>💳 Tarjeta: {p2p.cardIssuer}</span>
                              </div>
                            )}
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
                                amount > 0 ? "text-slate-200 font-medium" : "text-slate-600 font-normal"
                              }`}
                            >
                              {amount > 0 ? formatCLP(toMoney(amount)) : "—"}
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
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4"
                  >
                    <div className="flex items-start justify-between pb-3 border-b border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base">👤</span>
                          <h3 className="font-bold text-white text-base">{p2p.personName}</h3>
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
                        <div className="text-[10px] uppercase text-slate-400 font-semibold">Total</div>
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
                                amount > 0 ? "text-amber-300" : "text-slate-600"
                              }`}
                            >
                              {amount > 0 ? formatCLP(toMoney(amount)) : "—"}
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

                return (
                  <div
                    key={cat.id}
                    data-testid={`matrix-card-${cat.id}`}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                        <h3 className="font-bold text-white text-base">{cat.name}</h3>
                        {subcats.length > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                            {subcats.length} subcat.
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase text-slate-400 font-semibold">Total</div>
                        <div className="font-mono font-bold text-white text-sm">
                          {formatCLP(toMoney(rowTotal))}
                        </div>
                      </div>
                    </div>

                    {/* Monthly breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {matrix.periods.map((period) => {
                        const amount = matrix.cells[cat.id]?.[period] ?? 0
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
                                amount > 0 ? "text-slate-100" : "text-slate-600"
                              }`}
                            >
                              {amount > 0 ? formatCLP(toMoney(amount)) : "—"}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Subcategories breakdown */}
                    <div className="pt-3 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <span>Subcategorías ({subcats.length})</span>
                      </div>

                      {subcats.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">Sin subcategorías registradas</p>
                      ) : (
                        <div className="space-y-1.5" data-testid={`matrix-card-subcats-${cat.id}`}>
                          {subcats.map((subcat) => {
                            const percent = rowTotal > 0 ? Math.round((subcat.total / rowTotal) * 100) : 0
                            const isP2P = subcat.type === "P2P_DEBT"
                            const isExpense = subcat.type === "EXPENSE"

                            return (
                              <div
                                key={subcat.id}
                                className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/60 flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-medium text-slate-200 truncate flex items-center gap-1.5">
                                    <span>{subcat.name}</span>
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
                                    <div className="text-[10px] text-slate-400 truncate">
                                      {subcat.productDescription}
                                    </div>
                                  )}
                                  {rowTotal > 0 && !subcat.productDescription && (
                                    <div className="text-[10px] text-slate-400">
                                      {percent}% del total categoría
                                    </div>
                                  )}
                                </div>
                                <div className="font-mono font-semibold text-xs text-emerald-400 whitespace-nowrap">
                                  {formatCLP(toMoney(subcat.total))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
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
                                aria-label={`Expandir ${cat.name}`}
                                aria-expanded={isExpanded}
                                className="text-slate-400 hover:text-white p-0.5 text-xs"
                              >
                                {isExpanded ? "▼" : "▶"}
                              </button>
                            </div>
                          </td>

                          {matrix.periods.map((period) => {
                            const amount = matrix.cells[cat.id]?.[period] ?? 0
                            return (
                              <td
                                key={period}
                                className={`px-3 sm:px-4 py-3 sm:py-3.5 text-right font-mono tabular-nums text-xs whitespace-nowrap transition ${
                                  amount > 0 ? "text-slate-200 font-medium" : "text-slate-600 font-normal"
                                }`}
                              >
                                {amount > 0 ? formatCLP(toMoney(amount)) : "—"}
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
                                  className="bg-slate-950/50 hover:bg-slate-900/50 transition text-xs border-b border-slate-800/30"
                                >
                                  <td className="pl-8 sm:pl-10 pr-4 py-2.5 text-slate-300 sticky left-0 bg-slate-950/95 border-r border-slate-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-slate-500 font-mono text-xs">↳</span>
                                      <span className="font-medium text-slate-200">{subcat.name}</span>
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
                      return (
                        <td
                          key={period}
                          className="px-3 sm:px-4 py-3 sm:py-3.5 text-right font-mono tabular-nums text-sky-300 whitespace-nowrap"
                        >
                          {formatCLP(toMoney(income))}
                        </td>
                      )
                    })}
                    <td className="px-4 sm:px-5 py-3 sm:py-3.5 text-right font-mono tabular-nums text-sky-300 whitespace-nowrap">
                      {formatCLP(toMoney(totalIncomesInRange))}
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
    </div>
  )
}
