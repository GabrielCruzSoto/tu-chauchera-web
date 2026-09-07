import React, { useState } from 'react'
import { useCreditCardStore } from '../store/creditCardSlice'
import { formatCLP, toMoney } from '@/shared/types/money'
import type { UUID } from '@/shared/types/domain'

export const ThirdPartyReceivablesView: React.FC = () => {
  const purchases = useCreditCardStore((s) => s.purchases)
  const accounts = useCreditCardStore((s) => s.accounts)
  const addRepayment = useCreditCardStore((s) => s.addRepayment)

  // Filter only purchases with thirdPartyReceivable
  const thirdPartyPurchases = Object.values(purchases).filter(
    (p) => p.payerType === 'TERCERO' && p.thirdPartyReceivable
  )

  const [selectedPurchaseId, setSelectedPurchaseId] = useState<UUID | null>(null)
  const [repaymentAmount, setRepaymentAmount] = useState('')
  const [repaymentDate, setRepaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [destinationAccount, setDestinationAccount] = useState('Cuenta Corriente')

  const handleRepaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPurchaseId || !repaymentAmount) return

    addRepayment(selectedPurchaseId, {
      amountCents: toMoney(Number(repaymentAmount)),
      paymentDate: repaymentDate,
      destinationAccount,
    })

    setSelectedPurchaseId(null)
    setRepaymentAmount('')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COBRADO_TOTAL':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-xs font-semibold">PAGADO TOTAL</span>
      case 'COBRADO_PARCIAL':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-xs font-semibold">PARCIAL</span>
      default:
        return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full text-xs font-semibold">PENDIENTE</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            👥 Compras de Terceros y Cobranzas Pendientes
          </h2>
          <p className="text-sm text-slate-400">
            Seguimiento de compras prestadas en tus tarjetas de crédito y registro de pagos recibidos.
          </p>
        </div>
      </div>

      {thirdPartyPurchases.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-400">
          <p className="text-base font-medium text-slate-300">No hay compras prestadas a terceros registradas.</p>
          <p className="text-xs mt-1">Al registrar consumos con tarjeta marcados como "Tercero", aparecerán automáticamente en este tablero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {thirdPartyPurchases.map((purchase) => {
            const rec = purchase.thirdPartyReceivable!
            const account = accounts[purchase.accountId]
            const pendingAmount = rec.totalOwedCents - rec.amountCollectedCents

            return (
              <div
                key={purchase.id}
                className="bg-slate-900/80 border border-slate-700/70 rounded-2xl p-5 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                        {rec.thirdPartyName}
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5">{purchase.description}</h4>
                    </div>
                    {getStatusBadge(rec.status)}
                  </div>

                  <div className="text-xs text-slate-400 space-y-1">
                    <div>Tarjeta: <span className="text-slate-200">{account ? `${account.institution} (${account.accountName})` : 'Tarjeta'}</span></div>
                    <div>Período de corte: <span className="text-slate-200">{purchase.firstInstallmentPeriod}</span></div>
                    <div>Cuotas: <span className="text-slate-200">{purchase.totalInstallments}</span></div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-emerald-400">Cobrado: {formatCLP(rec.amountCollectedCents)}</span>
                      <span className="text-rose-400">Resta: {formatCLP(toMoney(pendingAmount))}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (rec.amountCollectedCents / rec.totalOwedCents) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-400">
                    Total: <strong className="text-white">{formatCLP(rec.totalOwedCents)}</strong>
                  </span>

                  {rec.status !== 'COBRADO_TOTAL' && (
                    <button
                      onClick={() => setSelectedPurchaseId(purchase.id)}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-semibold transition-all"
                    >
                      + Registrar Pago
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Repayment Modal */}
      {selectedPurchaseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm overflow-hidden p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">💰 Registrar Abono / Pago de Tercero</h3>
            <form onSubmit={handleRepaymentSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Monto Recibido (CLP)</label>
                <input
                  type="number"
                  placeholder="ej. 25000"
                  value={repaymentAmount}
                  onChange={(e) => setRepaymentAmount(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Fecha de Recepción</label>
                <input
                  type="date"
                  value={repaymentDate}
                  onChange={(e) => setRepaymentDate(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Cuenta de Destino</label>
                <input
                  type="text"
                  value={destinationAccount}
                  onChange={(e) => setDestinationAccount(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPurchaseId(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                >
                  Guardar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
