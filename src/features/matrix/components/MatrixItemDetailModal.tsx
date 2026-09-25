import React, { useEffect, useState, useMemo } from "react"
import type { ObligationType, P2PRole, Period } from "@/shared/types/domain"
import { formatCLP, toMoney } from "@/shared/types/money"
import { useObligationsStore } from "@/features/obligations/store/obligationsSlice"
import { useCreditCardStore } from "@/features/credit-cards/store/creditCardSlice"

export interface MatrixItemDetailPayload {
  id: string
  name: string
  categoryName: string
  categoryColor?: string | undefined
  cells: Record<Period, number>
  totalInRange: number
  periods: Period[]
  obligationId?: string | undefined
  obligationIds?: string[] | undefined
  purchaseId?: string | undefined
  cardAccountId?: string | undefined
  type?: ObligationType | undefined
  p2pRole?: P2PRole | undefined
  thirdPartyName?: string | undefined
  cardIssuer?: string | undefined
  productDescription?: string | undefined
  detail?: string | undefined
}

export interface MatrixItemDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: MatrixItemDetailPayload | null
}

export const MatrixItemDetailModal: React.FC<MatrixItemDetailModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false)
  const { obligations, installments } = useObligationsStore()
  const { accounts: creditCardAccounts, purchases: creditCardPurchases } = useCreditCardStore()

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Resolve obligation details if present
  const resolvedObligation = useMemo(() => {
    if (!item) return null
    if (item.obligationId && obligations[item.obligationId]) {
      return obligations[item.obligationId]
    }
    if (item.obligationIds && item.obligationIds.length > 0) {
      for (const id of item.obligationIds) {
        if (obligations[id]) return obligations[id]
      }
    }
    // Fallback search by subcategory name
    const found = Object.values(obligations).find(
      (o) => o.status !== "DELETED" && o.subcategory.trim().toLowerCase() === item.name.trim().toLowerCase()
    )
    return found ?? null
  }, [item, obligations])

  // Resolve installments list for this obligation
  const relatedInstallments = useMemo(() => {
    if (!resolvedObligation) return []
    return Object.values(installments)
      .filter((i) => i.obligationId === resolvedObligation.id && i.status !== "DELETED")
      .sort((a, b) => a.installmentNumber - b.installmentNumber || a.dueDate.localeCompare(b.dueDate))
  }, [resolvedObligation, installments])

  // Calculate installment metrics
  const paidInstallmentsCount = useMemo(() => {
    return relatedInstallments.filter((i) => i.status === "PAID").length
  }, [relatedInstallments])

  const pendingInstallmentsCount = useMemo(() => {
    return relatedInstallments.filter((i) => i.status === "PENDING").length
  }, [relatedInstallments])

  const totalPaidCents = useMemo(() => {
    return relatedInstallments
      .filter((i) => i.status === "PAID")
      .reduce((sum, i) => sum + i.amountCents, 0)
  }, [relatedInstallments])

  const remainingBalanceCents = useMemo(() => {
    if (relatedInstallments.length > 0) {
      return relatedInstallments
        .filter((i) => i.status === "PENDING")
        .reduce((sum, i) => sum + i.amountCents, 0)
    }
    if (resolvedObligation) {
      const remainingCount = Math.max(
        0,
        resolvedObligation.totalInstallments - (resolvedObligation.currentInstallment - 1)
      )
      return remainingCount * resolvedObligation.installmentAmountCents
    }
    return 0
  }, [relatedInstallments, resolvedObligation])

  // Resolve credit card account if present
  const resolvedCardAccount = useMemo(() => {
    if (!item) return null
    if (item.cardAccountId && creditCardAccounts[item.cardAccountId]) {
      return creditCardAccounts[item.cardAccountId]
    }
    if (item.purchaseId) {
      const purchase = creditCardPurchases[item.purchaseId]
      if (purchase) {
        return creditCardAccounts[purchase.accountId] ?? null
      }
    }
    return null
  }, [item, creditCardAccounts, creditCardPurchases])

  const resolvedPurchase = useMemo(() => {
    if (!item?.purchaseId) return null
    return creditCardPurchases[item.purchaseId] ?? null
  }, [item, creditCardPurchases])

  if (!isOpen || !item) return null

  // Role labels and badges
  const role = item.p2pRole || resolvedObligation?.p2pMetadata?.role
  const isP2P = item.type === "P2P_DEBT" || resolvedObligation?.type === "P2P_DEBT" || !!role
  const isExpense = item.type === "EXPENSE" || resolvedObligation?.type === "EXPENSE"

  const roleBadge = () => {
    if (role === "LENT_MY_CARD") {
      return {
        label: "💳 Presté mi tarjeta (Por cobrar)",
        classes: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      }
    }
    if (role === "USED_THEIR_CARD") {
      return {
        label: "🛍️ Usé tarjeta ajena (Por pagar)",
        classes: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      }
    }
    if (role === "DIRECT_LOAN_GIVEN") {
      return {
        label: "🤝 Préstamo otorgado (Por cobrar)",
        classes: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      }
    }
    if (role === "DIRECT_LOAN_TAKEN") {
      return {
        label: "🤝 Préstamo recibido (Por pagar)",
        classes: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      }
    }
    if (isP2P) {
      return {
        label: "👥 Deuda con terceros",
        classes: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      }
    }
    if (isExpense) {
      return {
        label: "💡 Gasto Recurrente",
        classes: "bg-sky-500/15 text-sky-300 border-sky-500/30",
      }
    }
    if (resolvedCardAccount) {
      return {
        label: "💳 Tarjeta de Crédito",
        classes: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
      }
    }
    return {
      label: "🏦 Crédito / Deuda",
      classes: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    }
  }

  const badge = roleBadge()

  // Copy WhatsApp summary message
  const handleCopyWhatsApp = () => {
    const person =
      item.thirdPartyName ||
      resolvedObligation?.p2pMetadata?.thirdPartyName ||
      item.name
    const card =
      item.cardIssuer || resolvedObligation?.p2pMetadata?.cardIssuer
        ? ` (${item.cardIssuer || resolvedObligation?.p2pMetadata?.cardIssuer})`
        : ""
    const product =
      item.productDescription ||
      resolvedObligation?.p2pMetadata?.productDescription ||
      item.detail ||
      resolvedObligation?.detail ||
      item.name

    const monthlyAmount = resolvedObligation?.installmentAmountCents
      ? formatCLP(resolvedObligation.installmentAmountCents)
      : formatCLP(toMoney(item.totalInRange))

    const dueDayText = resolvedObligation?.dueDay
      ? `\n• Día acordado de pago: ${resolvedObligation.dueDay} de cada mes.`
      : ""

    const cuotaProgress = resolvedObligation?.totalInstallments
      ? `\n• Cuota: ${resolvedObligation.currentInstallment} de ${resolvedObligation.totalInstallments}`
      : ""

    let msg = `Hola ${person}! Te comparto el detalle de tu compromiso por "${product}"${card}:\n`
    msg += `• Monto mensual: ${monthlyAmount}`
    msg += cuotaProgress
    msg += dueDayText
    if (remainingBalanceCents > 0) {
      msg += `\n• Saldo restante: ${formatCLP(toMoney(remainingBalanceCents))}`
    }
    msg += `\n¡Muchas gracias!`

    void navigator.clipboard.writeText(msg)
    setCopiedWhatsApp(true)
    setTimeout(() => setCopiedWhatsApp(false), 2500)
  }

  const detailText =
    item.detail ||
    resolvedObligation?.detail ||
    item.productDescription ||
    resolvedObligation?.p2pMetadata?.productDescription

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="matrix-item-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-t-2xl sm:rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-start px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-800 flex-shrink-0 bg-slate-950/40">
          <div className="space-y-1.5 min-w-0 pr-3">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block flex-shrink-0" />
              <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                {item.categoryName}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.classes}`}>
                {badge.label}
              </span>
            </div>
            <h2
              id="matrix-item-modal-title"
              className="text-lg sm:text-xl font-bold text-white tracking-tight break-words"
            >
              {item.name}
            </h2>
            {detailText && detailText !== item.name && (
              <p className="text-xs text-slate-400 line-clamp-2">
                {detailText}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle"
            className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-white flex items-center justify-center rounded-xl hover:bg-slate-800 cursor-pointer text-lg font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition flex-shrink-0"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-6 flex-1 text-slate-200">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Total in Range */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total en Horizonte
              </span>
              <span className="font-mono text-base sm:text-lg font-bold text-emerald-400 mt-1">
                {formatCLP(toMoney(item.totalInRange))}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                {item.periods.length} meses visualizados
              </span>
            </div>

            {/* Monthly / Base Installment */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Monto Cuota Base
              </span>
              <span className="font-mono text-base sm:text-lg font-bold text-white mt-1">
                {resolvedObligation
                  ? formatCLP(resolvedObligation.installmentAmountCents)
                  : resolvedPurchase
                  ? formatCLP(toMoney(Math.round(resolvedPurchase.totalAmountCents / (resolvedPurchase.totalInstallments || 1))))
                  : formatCLP(toMoney(Math.round(item.totalInRange / (item.periods.length || 1))))}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                {resolvedObligation?.dueDay
                  ? `Vence día ${resolvedObligation.dueDay} de cada mes`
                  : "Por período activo"}
              </span>
            </div>

            {/* Total Debt / Remaining Balance */}
            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isExpense ? "Tipo de Compromiso" : "Saldo Restante Total"}
              </span>
              <span className="font-mono text-base sm:text-lg font-bold text-amber-300 mt-1">
                {isExpense
                  ? "Gasto Fijo / Mensual"
                  : remainingBalanceCents > 0
                  ? formatCLP(toMoney(remainingBalanceCents))
                  : resolvedObligation?.totalAmountCents
                  ? formatCLP(resolvedObligation.totalAmountCents)
                  : "Al día"}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                {resolvedObligation?.isRecurringIndefinite
                  ? "Recurrente indefinido"
                  : resolvedObligation
                  ? `${paidInstallmentsCount} pagadas / ${resolvedObligation.totalInstallments} totales`
                  : "Conforme a programación"}
              </span>
            </div>
          </div>

          {/* Progress Bar (if structured installments) */}
          {resolvedObligation && !resolvedObligation.isRecurringIndefinite && resolvedObligation.totalInstallments > 1 && (
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/60 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">
                  Progreso de Cuotas: Cuota {resolvedObligation.currentInstallment} de {resolvedObligation.totalInstallments}
                </span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {Math.round((paidInstallmentsCount / resolvedObligation.totalInstallments) * 100)}% pagado
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((paidInstallmentsCount / resolvedObligation.totalInstallments) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>{paidInstallmentsCount} cuotas saldadas ({formatCLP(toMoney(totalPaidCents))})</span>
                <span>{pendingInstallmentsCount} cuotas pendientes</span>
              </div>
            </div>
          )}

          {/* Detailed Specifications Box */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>📋</span>
              <span>Detalles del Compromiso</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {item.thirdPartyName && (
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Persona / Tercero:</span>
                  <span className="font-medium text-white">{item.thirdPartyName}</span>
                </div>
              )}

              {(item.productDescription || resolvedObligation?.p2pMetadata?.productDescription) && (
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Producto / Concepto:</span>
                  <span className="font-medium text-slate-200">
                    🛍️ {item.productDescription || resolvedObligation?.p2pMetadata?.productDescription}
                  </span>
                </div>
              )}

              {(item.cardIssuer || resolvedObligation?.p2pMetadata?.cardIssuer) && (
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Medio de Pago / Tarjeta:</span>
                  <span className="font-medium text-amber-300">
                    💳 {item.cardIssuer || resolvedObligation?.p2pMetadata?.cardIssuer}
                  </span>
                </div>
              )}

              {resolvedCardAccount && (
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Cuenta Bancaria:</span>
                  <span className="font-medium text-white">
                    {resolvedCardAccount.institution} - {resolvedCardAccount.accountName}
                  </span>
                </div>
              )}

              {resolvedObligation?.startDate && (
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Fecha de Inicio:</span>
                  <span className="font-medium text-slate-200">{resolvedObligation.startDate}</span>
                </div>
              )}

              {resolvedObligation?.dueDay && (
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Día de Vencimiento:</span>
                  <span className="font-medium text-slate-200">Día {resolvedObligation.dueDay} de cada mes</span>
                </div>
              )}

              {resolvedObligation?.totalAmountCents && (
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Monto Total Contratado:</span>
                  <span className="font-mono font-medium text-slate-200">
                    {formatCLP(resolvedObligation.totalAmountCents)}
                  </span>
                </div>
              )}

              {resolvedObligation?.p2pMetadata?.surcharges?.includeMaintenanceFee && (
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Recargo Mantención:</span>
                  <span className="font-medium text-amber-300">
                    {resolvedObligation.p2pMetadata.surcharges.maintenanceFeeAmountCents
                      ? formatCLP(resolvedObligation.p2pMetadata.surcharges.maintenanceFeeAmountCents)
                      : "Incluido"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Breakdown in Current Matrix Range */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>📅</span>
                <span>Proyección Mes a Mes en la Matriz</span>
              </span>
              <span className="text-[10px] font-normal text-slate-400 lowercase">
                desglose en ventana seleccionada
              </span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {item.periods.map((period) => {
                const amount = item.cells[period] ?? 0
                const instInPeriod = relatedInstallments.find((i) =>
                  i.status === "PAID" && i.period ? i.period === period : i.dueDate.startsWith(period)
                )

                return (
                  <div
                    key={period}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        {period}
                      </span>
                      {instInPeriod && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                            instInPeriod.status === "PAID"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {instInPeriod.status === "PAID" ? "Pagada" : "Pendiente"}
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-mono text-xs font-bold mt-1.5 ${
                        amount > 0 ? "text-slate-100" : "text-slate-500"
                      }`}
                    >
                      {amount > 0 ? formatCLP(toMoney(amount)) : "—"}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Installments Schedule Table (if applicable) */}
          {relatedInstallments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>💳</span>
                  <span>Cronograma Completo de Cuotas ({relatedInstallments.length})</span>
                </span>
              </h3>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2 font-bold">Cuota</th>
                      <th className="px-3 py-2 font-bold">Vencimiento</th>
                      <th className="px-3 py-2 text-right font-bold">Monto</th>
                      <th className="px-3 py-2 text-center font-bold">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {relatedInstallments.map((inst) => {
                      const isPaid = inst.status === "PAID"
                      return (
                        <tr key={inst.id} className="hover:bg-slate-900/50 transition">
                          <td className="px-3 py-2 font-medium text-slate-300">
                            #{inst.installmentNumber}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-400 text-[11px]">
                            {inst.dueDate}
                          </td>
                          <td className="px-3 py-2 font-mono tabular-nums text-right font-semibold text-slate-200">
                            {formatCLP(inst.amountCents)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                isPaid
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {isPaid ? "Pagada" : "Pendiente"}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-2.5 flex-shrink-0">
          <div>
            {isP2P && (
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
              >
                <span>💬</span>
                <span>{copiedWhatsApp ? "¡Copiado a portapapeles!" : "Copiar WhatsApp"}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
