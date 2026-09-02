import React, { useState } from "react"
import type { Obligation } from "@/shared/types/domain"
import { usePaymentsStore } from "../store/paymentsSlice"
import { toMoney } from "@/shared/types/money"

interface RenegotiationModalProps {
  oldObligation: Obligation
  fromInstallmentNumber: number
  onClose: () => void
}

export const RenegotiationModal: React.FC<RenegotiationModalProps> = ({
  oldObligation,
  fromInstallmentNumber,
  onClose,
}) => {
  const { markRenegotiated } = usePaymentsStore()

  const [subcategory, setSubcategory] = useState(`${oldObligation.subcategory} (Refinanciado)`)
  const [detail] = useState(`Repactación desde cuota #${fromInstallmentNumber}`)
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [totalInstallments, setTotalInstallments] = useState<number>(24)
  const [installmentAmount, setInstallmentAmount] = useState<number>(0)
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDay, setDueDay] = useState<number>(oldObligation.dueDay)

  const handleTotalChange = (val: number) => {
    setTotalAmount(val)
    if (totalInstallments > 0) {
      setInstallmentAmount(Math.round(val / totalInstallments))
    }
  }

  const handleInstallmentsChange = (val: number) => {
    setTotalInstallments(val)
    if (val > 0 && totalAmount > 0) {
      setInstallmentAmount(Math.round(totalAmount / val))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subcategory.trim()) return

    markRenegotiated(oldObligation.id, fromInstallmentNumber, {
      categoryId: oldObligation.categoryId,
      subcategory: subcategory.trim(),
      detail: detail.trim(),
      totalAmountCents: toMoney(totalAmount),
      totalInstallments,
      currentInstallment: 1,
      installmentAmountCents: toMoney(installmentAmount),
      startDate,
      dueDay,
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col">
        <div className="flex justify-between items-center px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-800 flex-shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-white">Refinanciar / Repactar Deuda</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-white flex items-center justify-center rounded-lg hover:bg-slate-800 cursor-pointer text-lg font-semibold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-4 flex-1">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1">
              <div className="font-semibold">⚠️ Congelamiento de estructura anterior:</div>
              <p>
                Las cuotas pendientes a partir de la <strong>#{fromInstallmentNumber}</strong> quedarán archivadas como <strong>RENEGOCIADAS</strong> manteniendo tu historial intacto. Se creará un nuevo plan de cuotas activo.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nombre Nuevo Plan</label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                required
                className="w-full min-h-[44px] px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nuevo Total (CLP)</label>
                <input
                  type="number"
                  min={0}
                  value={totalAmount || ""}
                  onChange={(e) => handleTotalChange(Number(e.target.value))}
                  required
                  className="w-full min-h-[44px] px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nueva Cuota (CLP)</label>
                <input
                  type="number"
                  min={0}
                  value={installmentAmount || ""}
                  onChange={(e) => setInstallmentAmount(Number(e.target.value))}
                  required
                  className="w-full min-h-[44px] px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Cant. Cuotas</label>
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={totalInstallments}
                  onChange={(e) => handleInstallmentsChange(Number(e.target.value))}
                  required
                  className="w-full min-h-[44px] px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Día de Pago</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={dueDay}
                  onChange={(e) => setDueDay(Number(e.target.value))}
                  required
                  className="w-full min-h-[44px] px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-5 py-4 sm:px-6 sm:py-4 border-t border-slate-800 bg-slate-900/90 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm text-slate-300 cursor-pointer transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs sm:text-sm font-semibold text-white shadow-lg cursor-pointer transition"
            >
              Aplicar Renegociación
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
