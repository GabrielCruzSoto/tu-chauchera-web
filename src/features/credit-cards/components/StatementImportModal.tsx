import React, { useState } from 'react'
import { useCreditCardStore } from '../store/creditCardSlice'
import { parseStatementText } from '../parsers/statementParser'
import { extractTextFromPdf } from '../parsers/pdfReader'
import { matchExistingPurchases, type EnhancedParsedTransaction } from '../utils/deduplicationMatcher'
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
  const purchases = useCreditCardStore((s) => s.purchases)
  const addPurchase = useCreditCardStore((s) => s.addPurchase)

  const accountList = Object.values(accounts)
  const [selectedAccountId, setSelectedAccountId] = useState<UUID>(accountList[0]?.id ?? '')

  // Keep selectedAccountId synced if accounts load or update after modal opens
  const effectiveAccountId = accounts[selectedAccountId] ? selectedAccountId : (accountList[0]?.id ?? '')
  const currentAccount = accounts[effectiveAccountId]
  const availablePlastics = currentAccount?.plastics ?? []
  const defaultPlasticId = availablePlastics[0]?.id ?? ''

  const [rawText, setRawText] = useState('')
  const [isReadingPdf, setIsReadingPdf] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [parsedRows, setParsedRows] = useState<(EnhancedParsedTransaction & { plasticId?: UUID })[]>([])
  const [step, setStep] = useState<'INPUT' | 'PREVIEW'>('INPUT')
  const [isDragging, setIsDragging] = useState(false)

  if (!isOpen) return null

  const existingPurchasesForAccount = Object.values(purchases).filter(
    (p) => p.accountId === effectiveAccountId
  )

  const processExtractedText = (text: string) => {
    const institutionHint = currentAccount?.institution
    const result = parseStatementText(text, institutionHint)
    if (result.transactions.length === 0) {
      setErrorMessage('No se encontraron líneas de compra reconocibles en el PDF. Puedes intentar copiando el texto manualmente.')
      setRawText(text)
    } else {
      const enhanced = matchExistingPurchases(result.transactions, existingPurchasesForAccount)
      setParsedRows(
        enhanced.map((row) => {
          let plasticId = defaultPlasticId
          if (row.suggestedPlasticLastFour) {
            const matchedPlastic = availablePlastics.find(
              (p) => p.lastFourDigits === row.suggestedPlasticLastFour
            )
            if (matchedPlastic) {
              plasticId = matchedPlastic.id
            }
          }
          return {
            ...row,
            plasticId,
          }
        })
      )
      setStep('PREVIEW')
    }
  }

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Por favor sube un archivo con formato PDF.')
      return
    }

    setIsReadingPdf(true)
    setErrorMessage(null)

    try {
      const buffer = await file.arrayBuffer()
      const extracted = await extractTextFromPdf(buffer)
      processExtractedText(extracted)
    } catch (err) {
      console.error(err)
      setErrorMessage('Error al leer el archivo PDF. Asegúrate de que no esté protegido por contraseña.')
    } finally {
      setIsReadingPdf(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // Check if moving outside the drop target container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return
    await processFile(file)
  }

  const handleParse = () => {
    if (!rawText.trim()) return
    processExtractedText(rawText)
  }

  const handleToggleSelect = (index: number) => {
    const updated = [...parsedRows]
    const item = updated[index]
    if (item) {
      item.selected = !item.selected
      setParsedRows(updated)
    }
  }

  const handlePlasticChange = (index: number, plasticId: UUID) => {
    const updated = [...parsedRows]
    const item = updated[index]
    if (item) {
      item.plasticId = plasticId
      setParsedRows(updated)
    }
  }

  const handleTogglePayer = (index: number) => {
    const updated = [...parsedRows]
    const item = updated[index]
    if (item) {
      item.isThirdParty = !item.isThirdParty
      if (!item.isThirdParty) {
        item.thirdPartyName = undefined
      }
      setParsedRows(updated)
    }
  }

  const handleThirdPartyNameChange = (index: number, name: string) => {
    const updated = [...parsedRows]
    const item = updated[index]
    if (item) {
      item.thirdPartyName = name
      setParsedRows(updated)
    }
  }

  const handleConfirmImport = () => {
    if (!effectiveAccountId) {
      setErrorMessage('No hay una tarjeta de crédito seleccionada.')
      return
    }

    const targetPlasticId = defaultPlasticId || crypto.randomUUID()
    const selectedTransactions = parsedRows.filter((row) => row.selected)

    if (selectedTransactions.length === 0) return

    for (const tx of selectedTransactions) {
      addPurchase({
        accountId: effectiveAccountId,
        plasticId: tx.plasticId ?? targetPlasticId,
        description: tx.description,
        purchaseDate: tx.date,
        totalAmountCents: tx.amountCents,
        totalInstallments: tx.totalInstallments,
        firstInstallmentPeriod: tx.firstInstallmentPeriod,
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
              📄 Importador de Estado de Cuenta {currentAccount?.institution ? `(${currentAccount.institution})` : ''}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Extracción local privada sin enviar datos fuera de tu navegador. Compatible con CMR Falabella y Tenpo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar importador de estado de cuenta"
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center justify-center text-lg font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <span aria-hidden="true">✕</span>
          </button>
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
                  value={effectiveAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full min-h-[44px] bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 cursor-pointer transition"
                >
                  {accountList.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.institution} - {acc.accountName}
                    </option>
                  ))}
                </select>
              </div>

              {/* PDF File Upload Dropzone */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase">
                  Subir Estado de Cuenta (PDF)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-950/40 scale-[1.01]'
                      : 'border-slate-700 hover:border-indigo-500/70 bg-slate-950/60'
                  }`}
                >
                  <div className="text-3xl">📄</div>
                  {isReadingPdf ? (
                    <div className="text-indigo-400 text-xs font-semibold animate-pulse">
                      Leyendo y procesando archivo PDF localmente...
                    </div>
                  ) : (
                    <>
                      <p className={`text-sm font-medium ${isDragging ? 'text-indigo-300' : 'text-slate-200'}`}>
                        {isDragging ? '¡Suelta tu archivo PDF aquí!' : 'Arrastra tu archivo PDF aquí o búscalo en tu equipo (CMR Falabella o Tenpo)'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Lectura 100% segura y privada en tu navegador (sin subir a servidores externos)
                      </p>
                      <label className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-indigo-600/30 transition-all">
                        Seleccionar Archivo PDF
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
                  ⚠️ {errorMessage}
                </div>
              )}

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">O pegar texto manualmente</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Pegar texto de movimientos:
                </label>
                <textarea
                  rows={4}
                  placeholder={`Ejemplo (CMR Falabella o Tenpo):\n15/04/2026 FALABELLA PARQUE ARAUCO 03/12 $ 45.990\n21/07/2026 PAYU UBER TRIP SANTIAGO CH Digital $5.696 $5.696 00/00 $5.696`}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition"
                />
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
                      <th className="p-3 text-right">Monto Total</th>
                      <th className="p-3">Atribución</th>
                      <th className="p-3">Plástico</th>
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
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{row.description}</span>
                            {row.firstInstallmentPeriod && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-700/50">
                                📅 1ª Cuota: {row.firstInstallmentPeriod}
                              </span>
                            )}
                            {row.isDuplicateOrOngoing && (
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-amber-500/30">
                                {row.duplicateReason === 'ONGOING_INSTALLMENT'
                                  ? '🔄 Cuota en curso'
                                  : '⚠️ Ya registrada'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono">
                          {row.currentInstallment}/{row.totalInstallments}
                        </td>
                        <td className="p-3 text-right font-mono">
                          <div className="font-bold text-white">{formatCLP(row.amountCents)}</div>
                          {row.totalInstallments > 1 && (
                            <div className="text-[10px] text-slate-400">
                              ({formatCLP(toMoney(Math.round(row.amountCents / row.totalInstallments)))}/mes)
                            </div>
                          )}
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
                          {availablePlastics.length > 1 ? (
                            <select
                              value={row.plasticId ?? defaultPlasticId}
                              onChange={(e) => handlePlasticChange(idx, e.target.value)}
                              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:outline-none"
                            >
                              {availablePlastics.map((plastic) => (
                                <option key={plastic.id} value={plastic.id}>
                                  {plastic.holderName} (•••• {plastic.lastFourDigits})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-slate-400 text-xs">
                              {availablePlastics[0]?.holderName ?? 'Titular'}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {row.isThirdParty ? (
                            <input
                              type="text"
                              placeholder="Nombre contacto"
                              value={row.thirdPartyName ?? ''}
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
              className="min-h-[44px] px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-medium cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Cancelar
            </button>

            {step === 'INPUT' ? (
              <button
                type="button"
                disabled={!rawText.trim() || accountList.length === 0}
                onClick={handleParse}
                className="min-h-[44px] px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                Analizar Movimientos →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={parsedRows.filter((r) => r.selected).length === 0}
                className="min-h-[44px] px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
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
