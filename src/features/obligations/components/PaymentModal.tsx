import React, { useState } from "react"
import type { Installment, Obligation } from "@/shared/types/domain"
import { usePaymentsStore } from "../store/paymentsSlice"
import { formatCLP, toMoney } from "@/shared/types/money"

interface PaymentModalProps {
  installment: Installment
  obligation: Obligation
  onClose: () => void
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ installment, obligation, onClose }) => {
  const { markPaid } = usePaymentsStore()
  const [paidDate, setPaidDate] = useState(
    installment.paidDate ?? new Date().toISOString().slice(0, 10)
  )
  const [paidAmount, setPaidAmount] = useState<number>(installment.amountCents)
  const [notes, setNotes] = useState(installment.notes ?? "")

  const difference = paidAmount - installment.amountCents

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!paidDate || paidAmount <= 0) return

    markPaid(
      installment.id,
      paidDate,
      notes.trim() ? notes.trim() : undefined,
      toMoney(paidAmount)
    )
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full sm:max-w-md max-h-[90vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col">
        <div className="flex justify-between items-center px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-800 flex-shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-white">Registrar Pago de Cuota</h3>
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
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
              <div className="text-slate-400">
                Obligación: <span className="font-semibold text-white">{obligation.subcategory}</span>
              </div>
              <div className="text-slate-400">
                Cuota:{" "}
                <span className="font-semibold text-emerald-400">
                  #{installment.installmentNumber} de {obligation.totalInstallments}
                </span>
              </div>
              <div className="text-slate-400">
                Monto programado original:{" "}
                <span className="font-bold text-white text-sm font-mono">
                  {formatCLP(installment.amountCents)}
                </span>
              </div>
              <div className="text-slate-400">
                Vencimiento original: <span className="text-slate-300 font-mono">{installment.dueDate}</span>
              </div>
            </div>

            {/* Editable Paid Amount (with interest / penalty support) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  Monto Real Pagado (CLP)
                </label>
                {difference > 0 && (
                  <span className="text-[11px] font-bold text-amber-400">
                    +{formatCLP(toMoney(difference))} interés/mora
                  </span>
                )}
              </div>
              <input
                type="number"
                min={1}
                value={paidAmount || ""}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                required
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Puedes modificar el monto si pagaste con intereses de mora, multas o reajustes bancarios.
              </p>
            </div>

            {difference > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-0.5">
                <div className="font-semibold">⚠️ Pago con recargo detectado:</div>
                <div className="text-[11px] text-amber-200/90">
                  Se registrará un pago de <strong>{formatCLP(toMoney(paidAmount))}</strong> (Monto cuota: {formatCLP(installment.amountCents)} + Intereses: {formatCLP(toMoney(difference))}).
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Fecha de Pago Real (conciliación)
              </label>
              <input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                required
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                El período asignado será automáticamente: <strong className="text-slate-300">{paidDate.slice(0, 7)}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Notas / Comprobante (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Transferencia #849302 (incluye $3.500 de mora)"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
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
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs sm:text-sm font-semibold text-white shadow-lg cursor-pointer transition"
            >
              Confirmar Pago ({formatCLP(toMoney(paidAmount))})
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
