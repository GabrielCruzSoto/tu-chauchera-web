import React, { useState } from 'react'
import { useCreditCardStore } from '../store/creditCardSlice'
import { parseFalabellaStatementText, type ParsedStatementTransaction } from '../parsers/falabellaParser'
import { formatCLP, toMoney } from '@/shared/types/money'
import type { UUID } from '@/shared/types/domain'

interface StatementImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export const StatementImportModal: React.FC<StatementImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const accounts = useCreditCardStore((s) => s.accounts)
  const addPurchase = useCreditCardStore((s) => s.addPurchase)

  const accountList = Object.values(accounts)
  const [selectedAccountId, setSelectedAccountId] = useState<UUID>(accountList[0]?.id || '')
  const [rawText, setRawText] = useState('')
  const [parsedRows, setParsedRows] = useState<ParsedStatementTransaction[]>([])
  const [step, setStep] = useState<'INPUT' | 'PREVIEW'>('INPUT')

  if (!isOpen) return null

  const currentAccount = accounts[selectedAccountId]
  const defaultPlasticId = currentAccount?.plastics[0]?.id || ''

  const handleParse = () => {
    if (!rawText.trim()) return
    const result = parseFalabellaStatementText(rawText)
    setParsedRows(result.transactions)
    setStep('PREVIEW')
  }

  const handleToggleSelect = (index: number) => {
    const updated = [...parsedRows]
    updated[index].selected = !updated[index].selected
    setParsedRows(updated)
  }

  const handleTogglePayer = (index: number) => {
    const updated = [...parsedRows]
    updated[index].isThirdParty = !updated[index].isThirdParty
    if (!updated[index].isThirdParty) {
      updated[index].thirdPartyName = undefined
    }
    setParsedRows(updated)
  }

  const handleThirdPartyNameChange = (index: number, name: string) => {
    const updated = [...parsedRows]
    updated[index].thirdPartyName = name
    setParsedRows(updated)
  }

  const handleConfirmImport = () => {
    if (!selectedAccountId || !defaultPlasticId) return

    const selectedTransactions = parsedRows.filter((row) => row.selected)

    for (const tx of selectedTransactions) {
      addPurchase({
        accountId: selectedAccountId,
        plasticId: defaultPlasticId,
        description: tx.description,
        purchaseDate: tx.date,
        totalAmountCents: tx.amountCents,
        totalInstallments: tx.totalInstallments,
        payerType: tx.isThirdParty ? 'TERCERO' : 'PROPIO',
        thirdPartyName: tx.isThirdParty ? tx.thirdPartyName : undefined,
      })
    }

    onClose()
    setStep('INPUT')
    setRawText('')
    setParsedRows([])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/90">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              📄 Importador de Estado de Cuenta CMR Falabella
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Extracción local privada sin enviar datos fuera de tu navegador.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {accountList.length === 0 ? (
            <div className="text-amber-400 text-sm p-4 bg-amber-950/40 rounded-xl border border-amber-800/60">
              Debes registrar al menos una tarjeta de crédito antes de importar un estado de cuenta.
            </div>
          ) : step === 'INPUT' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Tarjeta de Crédito Destino
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
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
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Copia y Pega el texto de tus movimientos desde tu cartola/PDF CMR Falabella:
                </label>
                <textarea
                  rows={8}
                  placeholder={`Ejemplo:\n15/04/2026 FALABELLA PARQUE ARAUCO 03/12 $ 45.990\n18/04/2026 LIDER EXPRESS 01/01 $ 12.500\n22/04/2026 PARIS COSTANERA 28.990`}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 Abre el PDF de tu estado de cuenta, selecciona y copia las líneas de movimientos y pégalas aquí.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-300">
                  Transacciones detectadas: <strong className="text-white">{parsedRows.length}</strong>
                </span>
                <span className="text-xs text-indigo-400 font-semibold">
                  Seleccionadas para importar: {parsedRows.filter((r) => r.selected).length}
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-700 rounded-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3 w-10 text-center">Sel.</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Descripción</th>
                      <th className="p-3 text-center">Cuota</th>
                      <th className="p-3 text-right">Monto Mes</th>
                      <th className="p-3 text-center">Atribución</th>
                      <th className="p-3">Tercero (si aplica)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                    {parsedRows.map((row, idx) => (
                      <tr key={row.id} className={row.selected ? 'hover:bg-slate-800/30' : 'opacity-40 bg-slate-950/40'}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => handleToggleSelect(idx)}
                            className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-mono text-slate-400">{row.date}</td>
                        <td className="p-3 font-medium text-white">{row.description}</td>
                        <td className="p-3 text-center font-mono">
                          {row.currentInstallment}/{row.totalInstallments}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-white">
                          {formatCLP(row.amountCents)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleTogglePayer(idx)}
                            className={`px-2.5 py-1 rounded-md font-bold text-[10px] transition-all cursor-pointer ${
                              row.isThirdParty
                                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {row.isThirdParty ? '👥 Tercero' : '🙋‍♂️ Propio'}
                          </button>
                        </td>
                        <td className="p-3">
                          {row.isThirdParty ? (
                            <input
                              type="text"
                              placeholder="Nombre contacto"
                              value={row.thirdPartyName || ''}
                              onChange={(e) => handleThirdPartyNameChange(idx, e.target.value)}
                              className="bg-slate-800 border border-emerald-600/40 rounded px-2 py-1 text-white text-xs w-full focus:outline-none"
                            />
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-between items-center bg-slate-900/90">
          {step === 'PREVIEW' ? (
            <button
              type="button"
              onClick={() => setStep('INPUT')}
              className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-medium"
            >
              ← Volver a editar texto
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-medium"
            >
              Cancelar
            </button>

            {step === 'INPUT' ? (
              <button
                type="button"
                disabled={!rawText.trim() || accountList.length === 0}
                onClick={handleParse}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
              >
                Analizar Movimientos →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={parsedRows.filter((r) => r.selected).length === 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30"
              >
                Confirmar e Importar {parsedRows.filter((r) => r.selected).length} Compras
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
