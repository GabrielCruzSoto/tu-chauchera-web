import React, { useState } from 'react'
import { useCreditCardStore } from '../store/creditCardSlice'
import { CreditCardAccountModal } from './CreditCardAccountModal'
import { CreditCardPurchaseModal } from './CreditCardPurchaseModal'
import { StatementImportModal } from './StatementImportModal'
import { ThirdPartyReceivablesView } from './ThirdPartyReceivablesView'
import { formatCLP, toMoney } from '@/shared/types/money'

export const CreditCardsDashboard: React.FC = () => {
  const accounts = useCreditCardStore((s) => s.accounts)
  const purchases = useCreditCardStore((s) => s.purchases)

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'CARDS' | 'THIRD_PARTY'>('CARDS')

  const accountList = Object.values(accounts)
  const purchaseList = Object.values(purchases)

  return (
    <div className="space-y-6">
      {/* Header with Navigation and Action buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            💳 Tarjetas de Crédito y Cobranzas
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Administra tus cuentas, plásticos adicionales y conciliación de compras prestadas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-xl text-xs font-semibold border border-emerald-500/40 transition-all cursor-pointer"
          >
            📄 Importar Cartola
          </button>
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            + Nueva Tarjeta
          </button>
          <button
            onClick={() => setIsPurchaseModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            + Cargar Compra
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('CARDS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'CARDS'
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          💳 Mis Tarjetas y Plásticos ({accountList.length})
        </button>
        <button
          onClick={() => setActiveTab('THIRD_PARTY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'THIRD_PARTY'
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          👥 Compras de Terceros
        </button>
      </div>

      {activeTab === 'THIRD_PARTY' ? (
        <ThirdPartyReceivablesView />
      ) : (
        <>
          {accountList.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-400">
              <p className="text-base font-medium text-slate-300">No tienes tarjetas de crédito configuradas.</p>
              <p className="text-xs mt-1">Haz clic en "+ Nueva Tarjeta" para registrar tu primer plástico titular y adicionales.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {accountList.map((acc) => {
                const accPurchases = purchaseList.filter((p) => p.accountId === acc.id)
                const totalDebt = accPurchases.reduce((sum, p) => sum + p.totalAmountCents, 0)

                return (
                  <div
                    key={acc.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs text-indigo-400 font-bold uppercase">{acc.institution}</span>
                        <h3 className="text-lg font-bold text-white">{acc.accountName}</h3>
                      </div>
                      <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                        Cierre día {acc.closingDay}
                      </span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-xl space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Límite Total:</span>
                        <span className="text-white font-medium">{formatCLP(acc.creditLimitCents)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Vence:</span>
                        <span className="text-white font-medium">Día {acc.dueDay} de cada mes</span>
                      </div>
                    </div>

                    {/* Plastics list */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Plásticos Habilitados ({acc.plastics.length}):
                      </div>
                      <div className="space-y-1.5">
                        {acc.plastics.map((plastic) => (
                          <div
                            key={plastic.id}
                            className="flex justify-between items-center bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-700/40 text-xs"
                          >
                            <span className="text-slate-200">
                              {plastic.holderName} (•••• {plastic.lastFourDigits})
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                plastic.type === 'TITULAR'
                                  ? 'bg-indigo-500/20 text-indigo-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {plastic.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <StatementImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
      <CreditCardAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />
      <CreditCardPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
      />
    </div>
  )
}
