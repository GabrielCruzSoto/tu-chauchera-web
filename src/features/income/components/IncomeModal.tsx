import React, { useState } from "react"
import { useIncomeStore } from "../store/incomeSlice"
import { toMoney } from "@/shared/types/money"
import type { IncomeType } from "@/shared/types/domain"

interface IncomeModalProps {
  initialPeriod: string
  onClose: () => void
}

export const IncomeModal: React.FC<IncomeModalProps> = ({ initialPeriod, onClose }) => {
  const { addIncome, addRecurringIncome } = useIncomeStore()

  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState<number>(0)
  const [type, setType] = useState<IncomeType>("FIXED")
  const [period, setPeriod] = useState(initialPeriod)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringMonths, setRecurringMonths] = useState<number>(12)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || amount <= 0) return

    const dto = {
      description: description.trim(),
      amountCents: toMoney(amount),
      type,
      period,
    }

    if (isRecurring && type === "FIXED") {
      addRecurringIncome(dto, recurringMonths)
    } else {
      addIncome(dto)
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full sm:max-w-md max-h-[90vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col">
        <div className="flex justify-between items-center px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-800 flex-shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-white">Registrar Ingreso</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-white flex items-center justify-center rounded-xl hover:bg-slate-800 cursor-pointer text-lg font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-4 flex-1">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Descripción</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Ej. Sueldo Principal, Arriendo, Freelance"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Monto (CLP)</label>
                <input
                  type="number"
                  min={1}
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                  placeholder="Ej. 1500000"
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Ingreso</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as IncomeType)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition cursor-pointer"
                >
                  <option value="FIXED">Fijo (Mensual)</option>
                  <option value="VARIABLE">Variable (Esporádico)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Período / Mes</label>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                required
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 font-mono transition"
              />
            </div>

            {type === "FIXED" && (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 min-h-[32px]">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Repetir automáticamente en meses sucesivos</span>
                </label>

                {isRecurring && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Cantidad de meses a proyectar (máx 24):
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={24}
                      value={recurringMonths}
                      onChange={(e) => setRecurringMonths(Number(e.target.value))}
                      className="w-full min-h-[40px] px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Se crearán {recurringMonths} registros individuales editables independientemente.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-5 py-4 sm:px-6 sm:py-4 border-t border-slate-800 bg-slate-900/90 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm text-slate-300 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs sm:text-sm font-semibold text-white shadow-lg cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Guardar Ingreso
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
