import React, { useState } from "react"
import { useIncomeStore, getIncomeBreakdownForPeriod } from "../store/incomeSlice"
import { formatCLP, toMoney } from "@/shared/types/money"
import { IncomeModal } from "./IncomeModal"
import type { Income, IncomeStatus } from "@/shared/types/domain"

type FilterMode = "ALL" | "REAL" | "ESTIMATED"

export const IncomeListView: React.FC = () => {
  const { incomes, removeIncome } = useIncomeStore()
  const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().slice(0, 7))
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [incomeToEdit, setIncomeToEdit] = useState<Income | null>(null)
  const [filterMode, setFilterMode] = useState<FilterMode>("ALL")

  const breakdown = getIncomeBreakdownForPeriod(incomes, currentPeriod)

  const monthIncomes = Object.values(incomes).filter((inc) => inc.period === currentPeriod)

  const filteredIncomes = monthIncomes.filter((inc) => {
    const status: IncomeStatus = inc.status ?? "REAL"
    if (filterMode === "REAL") return status === "REAL"
    if (filterMode === "ESTIMATED") return status === "ESTIMATED"
    return true
  })

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

  const handleOpenAddModal = () => {
    setIncomeToEdit(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (income: Income) => {
    setIncomeToEdit(income)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Month Navigator & Add Button Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <button
            onClick={handlePrevMonth}
            aria-label="Mes anterior"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold cursor-pointer flex items-center justify-center transition border border-slate-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            ←
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide uppercase font-mono">
            Ingresos {currentPeriod}
          </h2>
          <button
            onClick={handleNextMonth}
            aria-label="Mes siguiente"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold cursor-pointer flex items-center justify-center transition border border-slate-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            →
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="min-h-[44px] w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-lg cursor-pointer transition flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <span className="text-base font-bold">+</span>
            <span>Agregar Ingreso</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges: Total, Real, Estimado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Ingreso Total */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Total Ingresos
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
              Real + Estimado
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white mt-2">
            {formatCLP(toMoney(breakdown.total))}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {monthIncomes.length} {monthIncomes.length === 1 ? "registro" : "registros"} en {currentPeriod}
          </div>
        </div>

        {/* Card 2: Ingreso Real */}
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
              Ingreso Real
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              Confirmado
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-300 mt-2">
            {formatCLP(toMoney(breakdown.real))}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Efectivamente recibido
          </div>
        </div>

        {/* Card 3: Ingreso Estimado */}
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
              Ingreso Estimado
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              Proyectado
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-300 mt-2">
            {formatCLP(toMoney(breakdown.estimated))}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Monto esperado o no fijo
          </div>
        </div>
      </div>

      {/* Filter Tabs & Count */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div
          role="tablist"
          aria-label="Filtro de ingresos"
          className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl"
        >
          <button
            role="tab"
            aria-selected={filterMode === "ALL"}
            onClick={() => setFilterMode("ALL")}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
              filterMode === "ALL"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Todos ({monthIncomes.length})
          </button>
          <button
            role="tab"
            aria-selected={filterMode === "REAL"}
            onClick={() => setFilterMode("REAL")}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
              filterMode === "REAL"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Solo Reales
          </button>
          <button
            role="tab"
            aria-selected={filterMode === "ESTIMATED"}
            onClick={() => setFilterMode("ESTIMATED")}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
              filterMode === "ESTIMATED"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Solo Estimados
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Mostrando {filteredIncomes.length} de {monthIncomes.length} ingresos
        </div>
      </div>

      {/* Income Cards / Table */}
      {filteredIncomes.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl">
          <div className="text-3xl mb-2">💵</div>
          <h3 className="text-base font-medium text-slate-300">
            {monthIncomes.length === 0
              ? `No hay ingresos registrados para ${currentPeriod}`
              : `No hay ingresos en la vista ${filterMode === "REAL" ? "Reales" : "Estimados"}`}
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-5 max-w-sm mx-auto">
            Registra tanto sueldos confirmados como ingresos variables o estimados para proyectar tu flujo.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs sm:text-sm font-semibold border border-slate-700 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Agregar Ingreso
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
          <table className="w-full text-left text-xs text-slate-300 min-w-[580px] border-collapse">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] sm:text-[11px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-4 py-3.5">Tipo</th>
                <th className="px-4 py-3.5">Descripción</th>
                <th className="px-4 py-3.5">Período</th>
                <th className="px-4 py-3.5">Monto</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredIncomes.map((inc) => {
                const isReal = (inc.status ?? "REAL") === "REAL"
                return (
                  <tr key={inc.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                          isReal
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isReal ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                          }`}
                        />
                        {isReal ? "REAL" : "ESTIMADO"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          inc.type === "FIXED"
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                            : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        }`}
                      >
                        {inc.type === "FIXED" ? "FIJO" : "VARIABLE"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-white">{inc.description}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">{inc.period}</td>
                    <td
                      className={`px-4 py-3.5 font-bold font-mono text-sm ${
                        isReal ? "text-emerald-400" : "text-amber-300"
                      }`}
                    >
                      {formatCLP(inc.amountCents)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(inc)}
                          aria-label={`Editar ${inc.description}`}
                          className="min-h-[36px] px-2.5 py-1.5 text-slate-300 hover:text-white text-xs transition cursor-pointer rounded-lg hover:bg-slate-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => removeIncome(inc.id)}
                          aria-label={`Eliminar ${inc.description}`}
                          className="min-h-[36px] px-2.5 py-1.5 text-slate-400 hover:text-rose-400 text-xs transition cursor-pointer rounded-lg hover:bg-slate-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <IncomeModal
          initialPeriod={currentPeriod}
          incomeToEdit={incomeToEdit}
          onClose={() => {
            setIsModalOpen(false)
            setIncomeToEdit(null)
          }}
        />
      )}
    </div>
  )
}
