import React, { useState } from "react"
import { useIncomeStore } from "../store/incomeSlice"
import { formatCLP, toMoney } from "@/shared/types/money"
import { IncomeModal } from "./IncomeModal"

export const IncomeListView: React.FC = () => {
  const { incomes, removeIncome } = useIncomeStore()
  const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().slice(0, 7))
  const [isModalOpen, setIsModalOpen] = useState(false)

  const monthIncomes = Object.values(incomes).filter((inc) => inc.period === currentPeriod)
  const totalMonthIncome = monthIncomes.reduce((acc, inc) => acc + inc.amountCents, 0)

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

  return (
    <div className="space-y-6">
      {/* Month Navigator & Summary Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <button
            onClick={handlePrevMonth}
            aria-label="Mes anterior"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold cursor-pointer flex items-center justify-center transition border border-slate-700/60"
          >
            ←
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide uppercase font-mono">
            Ingresos {currentPeriod}
          </h2>
          <button
            onClick={handleNextMonth}
            aria-label="Mes siguiente"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold cursor-pointer flex items-center justify-center transition border border-slate-700/60"
          >
            →
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between sm:justify-start gap-2">
            <span className="text-emerald-400 font-medium">Total Ingresos:</span>
            <span className="font-bold font-mono text-emerald-300 text-sm sm:text-base">
              {formatCLP(toMoney(totalMonthIncome))}
            </span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-lg cursor-pointer transition flex items-center justify-center gap-1.5"
          >
            <span className="text-base font-bold">+</span>
            <span>Agregar Ingreso</span>
          </button>
        </div>
      </div>

      {/* Income Cards / Table */}
      {monthIncomes.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl">
          <div className="text-3xl mb-2">💵</div>
          <h3 className="text-base font-medium text-slate-300">
            No hay ingresos registrados para {currentPeriod}
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-5 max-w-sm mx-auto">
            Registra tus ingresos para calcular tu capacidad de ahorro y flujo de caja mensual.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs sm:text-sm font-semibold border border-slate-700 cursor-pointer"
          >
            Agregar Ingreso
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
          <table className="w-full text-left text-xs text-slate-300 min-w-[500px] border-collapse">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] sm:text-[11px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Tipo</th>
                <th className="px-4 py-3.5">Descripción</th>
                <th className="px-4 py-3.5">Período</th>
                <th className="px-4 py-3.5">Monto</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {monthIncomes.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-800/30 transition">
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
                  <td className="px-4 py-3.5 font-bold font-mono text-emerald-400 text-sm">
                    {formatCLP(inc.amountCents)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => removeIncome(inc.id)}
                      className="min-h-[36px] px-3 py-1.5 text-slate-400 hover:text-rose-400 text-xs transition cursor-pointer rounded-lg hover:bg-slate-800/50"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <IncomeModal initialPeriod={currentPeriod} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  )
}
