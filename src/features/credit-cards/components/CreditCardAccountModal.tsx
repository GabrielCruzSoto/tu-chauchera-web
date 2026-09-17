import React, { useState, useEffect } from 'react'
import { useCreditCardStore } from '../store/creditCardSlice'
import { formatCLP, toMoney } from '@/shared/types/money'
import { economicIndicatorService } from '@/shared/services/economicIndicatorService'

import type { CreditCardAccount } from '@/shared/types/domain'

export const CHILEAN_FINANCIAL_INSTITUTIONS = [
  // Bancos
  'Banco Santander Chile',
  'Banco de Chile / Edwards',
  'Banco Estado',
  'Banco BCI',
  'Scotiabank Chile',
  'Itaú Chile',
  'Banco Falabella',
  'Banco Ripley',
  'Banco BICE',
  'Banco Security',
  'Banco Consorcio',
  'Banco Internacional',
  // Retail Financiero y Cooperativas
  'Cencosud Scotiabank',
  'CMR Falabella',
  'Tarjeta Ripley (CAR)',
  'Líder Bci',
  'Tarjeta Cencosud',
  'Tarjeta abcvisa',
  'Tarjeta Tricot',
  'Tarjeta Hites',
  'Tarjeta Corona',
  'Coopeuch',
  'Tenpo',
  'Mercado Pago',
]

interface CreditCardAccountModalProps {
  isOpen: boolean
  onClose: () => void
  editingAccount?: CreditCardAccount | null
}

export const CreditCardAccountModal: React.FC<CreditCardAccountModalProps> = ({
  isOpen,
  onClose,
  editingAccount = null,
}) => {
  const addAccount = useCreditCardStore((s) => s.addAccount)
  const updateAccount = useCreditCardStore((s) => s.updateAccount)
  const addPlastic = useCreditCardStore((s) => s.addPlastic)
  const removePlastic = useCreditCardStore((s) => s.removePlastic)

  const primaryPlastic = editingAccount?.plastics.find((p) => p.type === 'TITULAR')
  const existingAdditionals = editingAccount?.plastics.filter((p) => p.type === 'ADICIONAL') ?? []

  const [institution, setInstitution] = useState(editingAccount?.institution ?? '')
  const [accountName, setAccountName] = useState(editingAccount?.accountName ?? '')
  const [creditLimit, setCreditLimit] = useState(editingAccount ? String(editingAccount.creditLimitCents) : '')
  const [hasInternationalLimit, setHasInternationalLimit] = useState(editingAccount?.hasInternationalLimit ?? false)
  const [internationalLimitUSD, setInternationalLimitUSD] = useState(editingAccount?.internationalCreditLimitUSD ? String(editingAccount.internationalCreditLimitUSD) : '')
  const [maintenanceFeeCurrency, setMaintenanceFeeCurrency] = useState<'CLP' | 'UF'>(editingAccount?.monthlyMaintenanceFeeCurrency ?? 'CLP')
  const [maintenanceFeeAmount, setMaintenanceFeeAmount] = useState(
    editingAccount?.monthlyMaintenanceFeeAmount !== undefined
      ? String(editingAccount.monthlyMaintenanceFeeAmount)
      : editingAccount?.monthlyMaintenanceFeeCents
      ? String(editingAccount.monthlyMaintenanceFeeCents)
      : ''
  )
  const [closingDay, setClosingDay] = useState(editingAccount?.closingDay ?? 20)
  const [dueDay, setDueDay] = useState(editingAccount?.dueDay ?? 5)
  const [primaryHolderName, setPrimaryHolderName] = useState(primaryPlastic?.holderName ?? '')
  const [primaryLastFour, setPrimaryLastFour] = useState(primaryPlastic?.lastFourDigits ?? '')

  // mindicador observed dollar and UF rates
  const [dolarObserved, setDolarObserved] = useState<number | null>(null)
  const [ufObserved, setUfObserved] = useState<number | null>(null)
  const [isLoadingIndicators, setIsLoadingIndicators] = useState(false)

  // Additional plastics to add
  const [additionals, setAdditionals] = useState<{ holderName: string; lastFour: string }[]>([])
  const [newAddHolder, setNewAddHolder] = useState('')
  const [newAddLastFour, setNewAddLastFour] = useState('')

  // Fetch indicators when modal opens
  useEffect(() => {
    if (!isOpen) return
    let isMounted = true
    setIsLoadingIndicators(true)
    void Promise.all([
      economicIndicatorService.getDolarObserved(),
      economicIndicatorService.getUfObserved(),
    ])
      .then(([dollarRate, ufRate]) => {
        if (isMounted) {
          setDolarObserved(dollarRate)
          setUfObserved(ufRate)
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingIndicators(false)
      })
    return () => {
      isMounted = false
    }
  }, [isOpen])

  // Sync state when editingAccount changes
  useEffect(() => {
    if (editingAccount) {
      const primary = editingAccount.plastics.find((p) => p.type === 'TITULAR')
      setInstitution(editingAccount.institution)
      setAccountName(editingAccount.accountName)
      setCreditLimit(String(editingAccount.creditLimitCents))
      setHasInternationalLimit(editingAccount.hasInternationalLimit ?? (editingAccount.internationalCreditLimitUSD ? true : false))
      setInternationalLimitUSD(editingAccount.internationalCreditLimitUSD ? String(editingAccount.internationalCreditLimitUSD) : '')
      setMaintenanceFeeCurrency(editingAccount.monthlyMaintenanceFeeCurrency ?? 'CLP')
      setMaintenanceFeeAmount(
        editingAccount.monthlyMaintenanceFeeAmount !== undefined
          ? String(editingAccount.monthlyMaintenanceFeeAmount)
          : editingAccount.monthlyMaintenanceFeeCents
          ? String(editingAccount.monthlyMaintenanceFeeCents)
          : ''
      )
      setClosingDay(editingAccount.closingDay)
      setDueDay(editingAccount.dueDay)
      setPrimaryHolderName(primary?.holderName ?? '')
      setPrimaryLastFour(primary?.lastFourDigits ?? '')
    } else {
      setInstitution('')
      setAccountName('')
      setCreditLimit('')
      setHasInternationalLimit(false)
      setInternationalLimitUSD('')
      setMaintenanceFeeCurrency('CLP')
      setMaintenanceFeeAmount('')
      setClosingDay(20)
      setDueDay(5)
      setPrimaryHolderName('')
      setPrimaryLastFour('')
    }
    setAdditionals([])
    setNewAddHolder('')
    setNewAddLastFour('')
  }, [editingAccount, isOpen])

  if (!isOpen) return null

  const handleAddPlasticLocal = () => {
    if (!newAddHolder.trim() || !newAddLastFour.trim()) return

    if (editingAccount) {
      // In edit mode, immediately persist the new plastic
      addPlastic(editingAccount.id, newAddHolder.trim(), newAddLastFour.trim())
    } else {
      setAdditionals([...additionals, { holderName: newAddHolder.trim(), lastFour: newAddLastFour.trim() }])
    }
    setNewAddHolder('')
    setNewAddLastFour('')
  }

  const handleRemoveExistingPlastic = (plasticId: string) => {
    if (editingAccount) {
      removePlastic(editingAccount.id, plasticId)
    }
  }

  const calculateMaintenanceFeeCents = (): number | undefined => {
    const rawVal = parseFloat(maintenanceFeeAmount)
    if (isNaN(rawVal) || rawVal <= 0) return undefined

    if (maintenanceFeeCurrency === 'UF') {
      if (ufObserved) {
        return Math.round(rawVal * ufObserved)
      }
      return undefined
    }
    return Math.round(rawVal)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!institution || !accountName || !creditLimit || !primaryHolderName || !primaryLastFour) return

    const feeCents = calculateMaintenanceFeeCents()
    const feeAmountNum = maintenanceFeeAmount ? parseFloat(maintenanceFeeAmount) : undefined

    if (editingAccount) {
      updateAccount(editingAccount.id, {
        institution,
        accountName,
        creditLimitCents: Number(creditLimit),
        hasInternationalLimit,
        internationalCreditLimitUSD: hasInternationalLimit && internationalLimitUSD ? Number(internationalLimitUSD) : undefined,
        monthlyMaintenanceFeeCents: feeCents,
        monthlyMaintenanceFeeCurrency: maintenanceFeeCurrency,
        monthlyMaintenanceFeeAmount: isNaN(Number(feeAmountNum)) ? undefined : feeAmountNum,
        closingDay: Number(closingDay),
        dueDay: Number(dueDay),
        primaryHolderName,
        primaryLastFour,
      })
    } else {
      const account = addAccount({
        institution,
        accountName,
        creditLimitCents: Number(creditLimit),
        hasInternationalLimit,
        internationalCreditLimitUSD: hasInternationalLimit && internationalLimitUSD ? Number(internationalLimitUSD) : undefined,
        monthlyMaintenanceFeeCents: feeCents,
        monthlyMaintenanceFeeCurrency: maintenanceFeeCurrency,
        monthlyMaintenanceFeeAmount: isNaN(Number(feeAmountNum)) ? undefined : feeAmountNum,
        closingDay: Number(closingDay),
        dueDay: Number(dueDay),
        primaryHolderName,
        primaryLastFour,
      })

      // Add additionals
      for (const add of additionals) {
        addPlastic(account.id, add.holderName, add.lastFour)
      }
    }

    onClose()
  }

  const estimatedCLPFromUSD = hasInternationalLimit && internationalLimitUSD && dolarObserved
    ? Math.round(Number(internationalLimitUSD) * dolarObserved)
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            💳 {editingAccount ? 'Modificar Tarjeta de Crédito' : 'Nueva Tarjeta de Crédito'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Institución / Banco</label>
              <input
                type="text"
                list="institutions-list"
                placeholder="ej. Banco Santander Chile"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <datalist id="institutions-list">
                {CHILEAN_FINANCIAL_INSTITUTIONS.map((inst) => (
                  <option key={inst} value={inst} />
                ))}
              </datalist>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  Mantención Mensual <span className="text-[10px] text-slate-500 lowercase">(opcional)</span>
                </label>
                <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setMaintenanceFeeCurrency('CLP')}
                    className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                      maintenanceFeeCurrency === 'CLP'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    CLP
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaintenanceFeeCurrency('UF')}
                    className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                      maintenanceFeeCurrency === 'UF'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    UF
                  </button>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm">
                  {maintenanceFeeCurrency === 'CLP' ? '$' : 'UF'}
                </span>
                <input
                  type="number"
                  step={maintenanceFeeCurrency === 'UF' ? '0.01' : '1'}
                  placeholder={maintenanceFeeCurrency === 'CLP' ? 'ej. 3500' : 'ej. 0.10'}
                  value={maintenanceFeeAmount}
                  onChange={(e) => setMaintenanceFeeAmount(e.target.value)}
                  className={`w-full bg-slate-800 border border-slate-700 rounded-lg pr-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 ${
                    maintenanceFeeCurrency === 'UF' ? 'pl-9' : 'pl-7'
                  }`}
                />
              </div>

              {/* UF Conversion preview */}
              {maintenanceFeeCurrency === 'UF' && maintenanceFeeAmount && (
                <div className="mt-1.5 flex items-center justify-between text-[11px] bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
                  <span className="text-slate-400">
                    UF actual: {ufObserved ? `$${ufObserved.toLocaleString('es-CL', { minimumFractionDigits: 1 })}` : 'Cargando...'}
                  </span>
                  {ufObserved && !isNaN(parseFloat(maintenanceFeeAmount)) && (
                    <span className="text-emerald-400 font-medium">
                      ≈ {formatCLP(toMoney(Math.round(parseFloat(maintenanceFeeAmount) * ufObserved)))}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cupo Internacional Toggle & Inputs */}
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="intl-toggle" className="text-sm font-semibold text-sky-400 cursor-pointer flex items-center gap-1.5">
                  🌐 Cupo Internacional (USD)
                </label>
                <p className="text-xs text-slate-400">Habilita compras y cupo separado en dólares</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="intl-toggle"
                  type="checkbox"
                  checked={hasInternationalLimit}
                  onChange={(e) => setHasInternationalLimit(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>

            {hasInternationalLimit && (
              <div className="pt-2 border-t border-slate-700/50 space-y-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Límite Internacional (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      placeholder="ej. 1500"
                      value={internationalLimitUSD}
                      onChange={(e) => setInternationalLimitUSD(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1">
                    💵 Dólar Observado (mindicador.cl):
                  </span>
                  <span className="text-sky-300 font-mono font-medium">
                    {isLoadingIndicators
                      ? 'Cargando...'
                      : dolarObserved
                      ? `$${dolarObserved.toLocaleString('es-CL', { minimumFractionDigits: 2 })} CLP`
                      : 'No disponible'}
                  </span>
                </div>

                {estimatedCLPFromUSD !== null && (
                  <div className="text-xs text-slate-400 flex justify-between px-1">
                    <span>Equivalente aproximado en CLP:</span>
                    <span className="text-white font-semibold">{formatCLP(toMoney(estimatedCLPFromUSD))}</span>
                  </div>
                )}
              </div>
            )}
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
              <span className="text-xs text-slate-400 font-normal">
                {editingAccount ? existingAdditionals.length : additionals.length} agregada(s)
              </span>
            </h4>

            {/* Existing additionals in edit mode */}
            {editingAccount && existingAdditionals.map((add) => (
              <div key={add.id} className="flex justify-between items-center text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-slate-300">{add.holderName} (•••• {add.lastFourDigits})</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 uppercase font-semibold text-[10px]">Adicional</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingPlastic(add.id)}
                    className="text-rose-400 hover:text-rose-300 font-bold px-1"
                    title="Eliminar adicional"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            {/* Pending additionals in create mode */}
            {!editingAccount && additionals.map((add, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-slate-300">{add.holderName} (•••• {add.lastFour})</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 uppercase font-semibold text-[10px]">Adicional</span>
                  <button
                    type="button"
                    onClick={() => setAdditionals(additionals.filter((_, i) => i !== idx))}
                    className="text-rose-400 hover:text-rose-300 font-bold px-1"
                    title="Quitar adicional"
                  >
                    ✕
                  </button>
                </div>
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
                title="Agregar adicional"
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
