import React, { useState } from 'react'
import { useCreditCardStore } from '../store/creditCardSlice'
import { formatCLP, toMoney } from '@/shared/types/money'

interface CreditCardAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreditCardAccountModal: React.FC<CreditCardAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const addAccount = useCreditCardStore((s) => s.addAccount)
  const addPlastic = useCreditCardStore((s) => s.addPlastic)

  const [institution, setInstitution] = useState('')
  const [accountName, setAccountName] = useState('')
  const [creditLimit, setCreditLimit] = useState('')
  const [closingDay, setClosingDay] = useState(20)
  const [dueDay, setDueDay] = useState(5)
  const [primaryHolderName, setPrimaryHolderName] = useState('')
  const [primaryLastFour, setPrimaryLastFour] = useState('')

  // Additional plastics to add upon creation
  const [additionals, setAdditionals] = useState<{ holderName: string; lastFour: string }[]>([])
  const [newAddHolder, setNewAddHolder] = useState('')
  const [newAddLastFour, setNewAddLastFour] = useState('')

  if (!isOpen) return null

  const handleAddPlasticLocal = () => {
    if (!newAddHolder.trim() || !newAddLastFour.trim()) return
    setAdditionals([...additionals, { holderName: newAddHolder.trim(), lastFour: newAddLastFour.trim() }])
    setNewAddHolder('')
    setNewAddLastFour('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!institution || !accountName || !creditLimit || !primaryHolderName || !primaryLastFour) return

    const account = addAccount({
      institution,
      accountName,
      creditLimitCents: Number(creditLimit),
      closingDay: Number(closingDay),
      dueDay: Number(dueDay),
      primaryHolderName,
      primaryLastFour,
    })

    // Add additionals
    for (const add of additionals) {
      addPlastic(account.id, add.holderName, add.lastFour)
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            💳 Nueva Tarjeta de Crédito
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Institución / Banco</label>
              <input
                type="text"
                placeholder="ej. Banco Santander"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Nombre Tarjeta</label>
              <input
                type="text"
                placeholder="ej. Visa Signature"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Límite Total de Crédito (CLP)</label>
            <input
              type="number"
              placeholder="ej. 2000000"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Día de Cierre (Corte)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={closingDay}
                onChange={(e) => setClosingDay(Number(e.target.value))}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Día de Vencimiento (Pago)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(Number(e.target.value))}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700 space-y-3">
            <h4 className="text-sm font-semibold text-indigo-400">Plástico Titular</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Nombre del Titular"
                  value={primaryHolderName}
                  onChange={(e) => setPrimaryHolderName(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm"
                />
              </div>
              <div>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="Últimos 4"
                  value={primaryLastFour}
                  onChange={(e) => setPrimaryLastFour(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm text-center"
                />
              </div>
            </div>
          </div>

          {/* Additional cards section */}
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-3">
            <h4 className="text-sm font-semibold text-emerald-400 flex items-center justify-between">
              <span>Tarjetas Adicionales (Opcional)</span>
              <span className="text-xs text-slate-400 font-normal">{additionals.length} agregada(s)</span>
            </h4>

            {additionals.map((add, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-slate-300">{add.holderName} (•••• {add.lastFour})</span>
                <span className="text-emerald-400 uppercase font-semibold text-[10px]">Adicional</span>
              </div>
            ))}

            <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-700/50">
              <input
                type="text"
                placeholder="Nombre adicional"
                value={newAddHolder}
                onChange={(e) => setNewAddHolder(e.target.value)}
                className="col-span-3 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
              />
              <input
                type="text"
                maxLength={4}
                placeholder="4 dígitos"
                value={newAddLastFour}
                onChange={(e) => setNewAddLastFour(e.target.value)}
                className="col-span-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs text-center"
              />
              <button
                type="button"
                onClick={handleAddPlasticLocal}
                className="col-span-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
              >
                +
              </button>
            </div>
          </div>

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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30"
            >
              Guardar Tarjeta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
