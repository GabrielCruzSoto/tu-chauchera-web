import React, { useState } from 'react'
import type { Installment, Obligation } from '@/shared/types/domain'
import { usePaymentsStore } from '../store/paymentsSlice'
import { formatCLP, toMoney } from '@/shared/types/money'
import { getLocalISODate } from '@/shared/utils/date'

interface PaymentModalProps {
  installment: Installment
  obligation: Obligation
  onClose: () => void
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ installment, obligation, onClose }) => {
  const { markPaid } = usePaymentsStore()
  const isEditing = installment.status === 'PAID'
  const isP2P = obligation.type === 'P2P_DEBT'
  const isLent =
    isP2P &&
    (obligation.p2pMetadata?.role === 'LENT_MY_CARD' ||
      obligation.p2pMetadata?.role === 'DIRECT_LOAN_GIVEN')
  const conceptText = isP2P
    ? (obligation.p2pMetadata?.productDescription ?? obligation.detail)
    : obligation.detail
  const hasDistinctConcept =
    conceptText && conceptText.trim().toLowerCase() !== obligation.subcategory.trim().toLowerCase()

  const [paidDate, setPaidDate] = useState(installment.paidDate ?? getLocalISODate())
  const [paidAmount, setPaidAmount] = useState<number>(installment.amountCents)
  const [notes, setNotes] = useState(installment.notes ?? '')

  const scheduledAmount = obligation.installmentAmountCents || installment.amountCents
  const difference = paidAmount - scheduledAmount

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!paidDate || paidAmount <= 0) return

    markPaid(installment.id, paidDate, notes.trim(), toMoney(paidAmount))
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md"
    >
      <div className="w-full sm:max-w-md max-h-[90vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col">
        <div className="flex justify-between items-center px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h3 id="payment-modal-title" className="text-base sm:text-lg font-bold text-white">
              {isEditing
                ? isLent
                  ? 'Modificar Cobro de Cuota'
                  : 'Modificar Pago de Cuota'
                : isLent
                  ? 'Registrar Cobro de Cuota'
                  : 'Registrar Pago de Cuota'}
            </h3>
            {isEditing && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Pagado
              </span>
            )}
          </div>
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
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
              <div className="text-slate-400">
                {isP2P ? 'Persona / Contacto:' : 'Obligación / Entidad:'}{' '}
                <span className="font-semibold text-white">{obligation.subcategory}</span>
              </div>
              {hasDistinctConcept && (
                <div className="text-slate-400">
                  Concepto / Ítem:{' '}
                  <span className="font-semibold text-emerald-300">{conceptText}</span>
                </div>
              )}
              {isP2P && obligation.p2pMetadata?.cardIssuer && (
                <div className="text-slate-400">
                  Tarjeta:{' '}
                  <span className="font-medium text-slate-200">
                    💳 {obligation.p2pMetadata.cardIssuer}
                  </span>
                </div>
              )}
              {isP2P && (
                <div className="text-slate-400">
                  Situación:{' '}
                  <span className="font-medium text-amber-300">
                    {obligation.p2pMetadata?.role === 'LENT_MY_CARD'
                      ? 'Presté mi tarjeta (Por cobrar)'
                      : obligation.p2pMetadata?.role === 'USED_THEIR_CARD'
                        ? 'Usé tarjeta ajena (Por pagar)'
                        : obligation.p2pMetadata?.role === 'DIRECT_LOAN_GIVEN'
                          ? 'Préstamo otorgado (Por cobrar)'
                          : obligation.p2pMetadata?.role === 'DIRECT_LOAN_TAKEN'
                            ? 'Préstamo recibido (Por pagar)'
                            : 'Compromiso entre personas'}
                  </span>
                </div>
              )}
              <div className="text-slate-400">
                Cuota:{' '}
                <span className="font-semibold text-emerald-400">
                  #{installment.installmentNumber} de {obligation.totalInstallments}
                </span>
              </div>
              <div className="text-slate-400">
                Monto programado original:{' '}
                <span className="font-bold text-white text-sm font-mono">
                  {formatCLP(scheduledAmount)}
                </span>
              </div>
              <div className="text-slate-400">
                Vencimiento programado:{' '}
                <span className="text-slate-300 font-mono">{installment.dueDate}</span>
              </div>
              {isEditing && installment.paidDate && (
                <div className="text-slate-400">
                  Fecha de pago registrada:{' '}
                  <span className="text-emerald-400 font-mono font-medium">
                    {installment.paidDate}
                  </span>
                </div>
              )}
            </div>

            {(Boolean(installment.isOverdueRollover) || Boolean(installment.originalDueDate)) && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <div>
                  <div className="font-semibold text-rose-200">
                    Cuota no pagada en plazo original
                  </div>
                  <div className="text-[11px] text-rose-300/80">
                    Vencimiento original: {installment.originalDueDate ?? installment.dueDate}. Fue
                    trasladada a este período.
                  </div>
                </div>
              </div>
            )}

            {/* Editable Paid Amount (with interest / penalty / discount support) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="paid-amount-input"
                  className="block text-xs font-medium text-slate-300"
                >
                  Monto Real Pagado (CLP)
                </label>
                {difference > 0 && (
                  <span className="text-[11px] font-bold text-amber-400">
                    +{formatCLP(toMoney(difference))} recargo / mora
                  </span>
                )}
                {difference < 0 && (
                  <span className="text-[11px] font-bold text-sky-400">
                    -{formatCLP(toMoney(Math.abs(difference)))} menor al programado
                  </span>
                )}
              </div>
              <input
                id="paid-amount-input"
                type="number"
                min={1}
                value={paidAmount || ''}
                onChange={e => setPaidAmount(Number(e.target.value))}
                required
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {isEditing
                  ? 'Puedes actualizar el monto final si difiere de lo registrado previamente.'
                  : 'Puedes modificar el monto si pagaste con intereses de mora, multas o reajustes bancarios.'}
              </p>
            </div>

            {difference > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-0.5">
                <div className="font-semibold">⚠️ Pago con recargo detectado:</div>
                <div className="text-[11px] text-amber-200/90">
                  Se registrará un pago de <strong>{formatCLP(toMoney(paidAmount))}</strong> (Monto
                  cuota: {formatCLP(scheduledAmount)} + Recargo: {formatCLP(toMoney(difference))}).
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="paid-date-input"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Fecha de Pago Real (conciliación)
              </label>
              <input
                id="paid-date-input"
                type="date"
                value={paidDate}
                onChange={e => setPaidDate(e.target.value)}
                required
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 font-mono transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                El período asignado será automáticamente:{' '}
                <strong className="text-slate-300">{paidDate.slice(0, 7)}</strong>
              </p>
            </div>

            <div>
              <label
                htmlFor="payment-notes-input"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Notas / Comprobante (opcional)
              </label>
              <input
                id="payment-notes-input"
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ej. Transferencia #849302 (incluye $3.500 de mora)"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition"
              />
            </div>
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
              {isEditing
                ? `Guardar Cambios (${formatCLP(toMoney(paidAmount))})`
                : isLent
                  ? `Confirmar Cobro (${formatCLP(toMoney(paidAmount))})`
                  : `Confirmar Pago (${formatCLP(toMoney(paidAmount))})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
