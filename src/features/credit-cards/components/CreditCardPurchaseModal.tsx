import React, { useState } from 'react'
import { useCreditCardStore } from '../store/creditCardSlice'
import type { UUID } from '@/shared/types/domain'

interface CreditCardPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreditCardPurchaseModal: React.FC<CreditCardPurchaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const accounts = useCreditCardStore((s) => s.accounts)
  const addPurchase = useCreditCardStore((s) => s.addPurchase)

  const accountList = Object.values(accounts)
  const [selectedAccountId, setSelectedAccountId] = useState<UUID>(accountList[0]?.id || '')
  const [selectedPlasticId, setSelectedPlasticId] = useState<UUID>('')
  const [description, setDescription] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [totalAmount, setTotalAmount] = useState('')
  const [totalInstallments, setTotalInstallments] = useState(1)
  const [payerType, setPayerType] = useState<'PROPIO' | 'TERCERO'>('PROPIO')
  const [thirdPartyName, setThirdPartyName] = useState('')

  if (!isOpen) return null

  const currentAccount = accounts[selectedAccountId]
  const availablePlastics = currentAccount?.plastics || []

  // Ensure selected plastic matches current account
  const activePlasticId = selectedPlasticId || availablePlastics[0]?.id || ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccountId || !activePlasticId || !description || !totalAmount) return

    addPurchase({
      accountId: selectedAccountId,
      plasticId: activePlasticId,
      description,
      purchaseDate,
      totalAmountCents: Number(totalAmount),
      totalInstallments: Number(totalInstallments),
      payerType,
      thirdPartyName: payerType === 'TERCERO' ? thirdPartyName : undefined,
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            🛍️ Cargar Compra con Tarjeta
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {accountList.length === 0 ? (
            <div className="text-amber-400 text-sm p-4 bg-amber-950/40 rounded-xl border border-amber-800/60">
              No tienes tarjetas de crédito registradas. Crea una primero para poder cargar compras.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Tarjeta / Cuenta</label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => {
                      setSelectedAccountId(e.target.value)
                      setSelectedPlasticId('')
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {accountList.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.institution} - {acc.accountName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Plástico Emisor</label>
                  <select
                    value={activePlasticId}
                    onChange={(e) => setSelectedPlasticId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {availablePlastics.map((plastic) => (
                      <option key={plastic.id} value={plastic.id}>
                        {plastic.holderName} (•••• {plastic.lastFourDigits}) - {plastic.type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Comercio / Detalle</label>
                <input
                  type="text"
                  placeholder="ej. Falabella, Supermercado Lider"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Fecha Compra</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Monto Total (CLP)</label>
                  <input
                    type="number"
                    placeholder="50000"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Cuotas</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(Number(e.target.value))}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Payer Selection Segmented Control */}
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 space-y-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase">¿De quién es el gasto?</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPayerType('PROPIO')}
                    className={`py-2 text-xs font-semibold rounded-md transition-all ${
                      payerType === 'PROPIO'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🙋‍♂️ Gasto Propio
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayerType('TERCERO')}
                    className={`py-2 text-xs font-semibold rounded-md transition-all ${
                      payerType === 'TERCERO'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    👥 Presté la Tarjeta (Tercero)
                  </button>
                </div>

                {payerType === 'TERCERO' && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-emerald-400 mb-1">
                      Nombre de la Persona que debe reintegrar:
                    </label>
                    <input
                      type="text"
                      placeholder="ej. Juan Pérez, Hermano"
                      value={thirdPartyName}
                      onChange={(e) => setThirdPartyName(e.target.value)}
                      required={payerType === 'TERCERO'}
                      className="w-full bg-slate-850 border border-emerald-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-400"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      ✨ Esta compra se registrará como cuenta por cobrar y no ensuciará tus gráficos de gastos personales.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={accountList.length === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30"
            >
              Cargar Compra
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
