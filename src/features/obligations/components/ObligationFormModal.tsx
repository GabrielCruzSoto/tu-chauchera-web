import React, { useState } from "react"
import { useObligationsStore } from "../store/obligationsSlice"
import { toMoney, formatCLP } from "@/shared/types/money"
import type {
  Obligation,
  ObligationType,
  P2PRole,
  MaintenanceSplitMode,
  CommissionMode,
  CardFeeSurcharge,
} from "@/shared/types/domain"
import { computeDueDate } from "../utils/installmentGenerator"
import { computeP2PInstallmentCharge } from "../utils/surchargeCalculator"
import { CategorySettingsModal } from "./CategorySettingsModal"

interface ObligationFormProps {
  obligationToEdit?: Obligation | null
  obligationToClone?: Obligation | null
  onClose: () => void
}

export const ObligationFormModal: React.FC<ObligationFormProps> = ({
  obligationToEdit,
  obligationToClone,
  onClose,
}) => {
  const { categories, addObligation, updateObligation, addCategory } = useObligationsStore()

  const categoryList = Object.values(categories).sort((a, b) =>
    a.name.localeCompare(b.name, "es", { sensitivity: "base" })
  )

  const sourceObl = obligationToEdit ?? obligationToClone
  const isEditing = Boolean(obligationToEdit)
  const isCloning = Boolean(obligationToClone)

  // Primary Tab
  const [activeType, setActiveType] = useState<ObligationType>(sourceObl?.type ?? "DEBT")

  const ensureThirdPartyCategoryId = (): string => {
    const currentCats = useObligationsStore.getState().categories
    const existing = Object.values(currentCats).find(
      (c) =>
        c.name.toLowerCase().includes("deudas con terceros") ||
        c.name.toLowerCase() === "terceros" ||
        c.name.toLowerCase() === "deudas terceros"
    )
    if (existing) {
      return existing.id
    }
    const newCat = addCategory({
      name: "Deudas con terceros",
      color: "amber",
    })
    return newCat.id
  }

  // Common Fields
  const [categoryId, setCategoryId] = useState(() => {
    if (sourceObl?.categoryId) return sourceObl.categoryId
    if (sourceObl?.type === "P2P_DEBT") {
      const existing = Object.values(categories).find(
        (c) =>
          c.name.toLowerCase().includes("deudas con terceros") ||
          c.name.toLowerCase() === "terceros" ||
          c.name.toLowerCase() === "deudas terceros"
      )
      if (existing) return existing.id
    }
    return categoryList[0]?.id ?? ""
  })

  const handleSelectTab = (type: ObligationType) => {
    setActiveType(type)
    if (type === "P2P_DEBT") {
      const p2pCatId = ensureThirdPartyCategoryId()
      setCategoryId(p2pCatId)
    }
  }
  const [subcategory, setSubcategory] = useState(() => {
    if (obligationToClone) return `${obligationToClone.subcategory} (Copia)`
    return obligationToEdit?.subcategory ?? ""
  })
  const [detail, setDetail] = useState(sourceObl?.detail ?? "")
  const [startDate, setStartDate] = useState(
    sourceObl?.startDate
      ? sourceObl.startDate.slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  )
  const [dueDay, setDueDay] = useState<number>(sourceObl?.dueDay ?? new Date().getDate())
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

  // Debt & Expense specific
  const [totalAmount, setTotalAmount] = useState<number>(sourceObl?.totalAmountCents ?? 0)
  const [totalInstallments, setTotalInstallments] = useState<number>(
    sourceObl?.totalInstallments ?? 12
  )
  const [currentInstallment, setCurrentInstallment] = useState<number>(
    isCloning ? 1 : (obligationToEdit?.currentInstallment ?? 1)
  )
  const [installmentAmount, setInstallmentAmount] = useState<number>(
    sourceObl?.installmentAmountCents ?? 0
  )
  const [isRecurringIndefinite, setIsRecurringIndefinite] = useState<boolean>(
    sourceObl?.isRecurringIndefinite ?? true
  )

  // P2P Specific
  const p2pMeta = sourceObl?.p2pMetadata
  const [p2pRole, setP2pRole] = useState<P2PRole>(p2pMeta?.role ?? "LENT_MY_CARD")
  const [thirdPartyName, setThirdPartyName] = useState(() => {
    if (obligationToClone && p2pMeta?.thirdPartyName) return `${p2pMeta.thirdPartyName} (Copia)`
    return p2pMeta?.thirdPartyName ?? ""
  })
  const [cardIssuer, setCardIssuer] = useState(p2pMeta?.cardIssuer ?? "")
  const [productDescription, setProductDescription] = useState(p2pMeta?.productDescription ?? "")
  const [baseInstallmentAmount, setBaseInstallmentAmount] = useState<number>(() => {
    if (p2pMeta?.baseInstallmentAmountCents) return p2pMeta.baseInstallmentAmountCents
    if (sourceObl?.installmentAmountCents) return sourceObl.installmentAmountCents
    return 0
  })

  // Surcharges
  const surcharges = p2pMeta?.surcharges
  const [includeMaintenance, setIncludeMaintenance] = useState(
    surcharges?.includeMaintenanceFee ?? false
  )
  const [maintenanceFee, setMaintenanceFee] = useState<number>(
    surcharges?.maintenanceFeeAmountCents ?? 3500
  )
  const [maintenanceSplitMode, setMaintenanceSplitMode] = useState<MaintenanceSplitMode>(
    surcharges?.maintenanceSplitMode ?? "FULL"
  )
  const [customMaintenance, setCustomMaintenance] = useState<number>(
    surcharges?.customMaintenanceCents ?? 0
  )

  const [includeCommission, setIncludeCommission] = useState(
    surcharges?.includeOneTimeCommission ?? false
  )
  const [commissionAmount, setCommissionAmount] = useState<number>(
    surcharges?.totalCommissionCents ?? 0
  )
  const [commissionMode, setCommissionMode] = useState<CommissionMode>(
    surcharges?.commissionCollectionMode ?? "SPREAD_ACROSS_INSTALLMENTS"
  )

  // Two-way sync for Cuotas Pagadas vs Cuota Actual
  const paidCount = Math.max(0, currentInstallment - 1)
  const pendingCount = Math.max(0, totalInstallments - currentInstallment + 1)

  const handlePaidInstallmentsChange = (paid: number) => {
    const cleanPaid = Math.max(0, Math.min(totalInstallments - 1, paid))
    setCurrentInstallment(cleanPaid + 1)
  }

  const handleCurrentInstallmentChange = (curr: number) => {
    const cleanCurr = Math.max(1, Math.min(totalInstallments, curr))
    setCurrentInstallment(cleanCurr)
  }

  // Auto-calculate for DEBT mode
  const handleTotalAmountChange = (val: number) => {
    setTotalAmount(val)
    if (totalInstallments > 0) {
      setInstallmentAmount(Math.round(val / totalInstallments))
    }
  }

  const handleTotalInstallmentsChange = (val: number) => {
    const cleanTotal = Math.max(1, val)
    setTotalInstallments(cleanTotal)
    if (currentInstallment > cleanTotal) {
      setCurrentInstallment(cleanTotal)
    }
    if (cleanTotal > 0 && totalAmount > 0) {
      setInstallmentAmount(Math.round(totalAmount / cleanTotal))
      setBaseInstallmentAmount(Math.round(totalAmount / cleanTotal))
    }
  }

  // Auto-calculate for EXPENSE mode
  const handleExpenseAmountChange = (val: number) => {
    setInstallmentAmount(val)
    setTotalAmount(val * (isRecurringIndefinite ? 12 : totalInstallments))
  }

  // Auto-calculate for P2P mode
  const handleP2PTotalAmountChange = (val: number) => {
    setTotalAmount(val)
    if (totalInstallments > 0) {
      setBaseInstallmentAmount(Math.round(val / totalInstallments))
    }
  }

  const handleP2PBaseInstallmentChange = (val: number) => {
    setBaseInstallmentAmount(val)
    if (totalInstallments > 0) {
      setTotalAmount(val * totalInstallments)
    }
  }

  const handleCategorySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === "__NEW_CATEGORY__") {
      setIsCategoryModalOpen(true)
    } else {
      setCategoryId(val)
    }
  }

  // Live P2P Surcharge calculation
  const currentSurcharges: CardFeeSurcharge | undefined =
    p2pRole === "LENT_MY_CARD"
      ? {
          includeMaintenanceFee: includeMaintenance,
          maintenanceFeeAmountCents: toMoney(maintenanceFee),
          maintenanceSplitMode,
          customMaintenanceCents: toMoney(customMaintenance),
          includeOneTimeCommission: includeCommission,
          totalCommissionCents: toMoney(commissionAmount),
          commissionCollectionMode: commissionMode,
        }
      : undefined

  const p2pBreakdown = computeP2PInstallmentCharge(
    toMoney(baseInstallmentAmount),
    totalInstallments,
    currentSurcharges
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryId) return

    const cleanStartDate = startDate.trim() || new Date().toISOString().slice(0, 10)
    const cleanDueDay = Number.isFinite(dueDay) && dueDay >= 1 ? Math.min(Math.floor(dueDay), 31) : new Date().getDate()

    if (activeType === "EXPENSE") {
      if (!subcategory.trim()) return
      const finalMonths = isRecurringIndefinite ? 12 : totalInstallments
      const payload = {
        type: "EXPENSE" as ObligationType,
        categoryId,
        subcategory: subcategory.trim(),
        detail: detail.trim(),
        totalAmountCents: toMoney(installmentAmount * finalMonths),
        totalInstallments: finalMonths,
        currentInstallment: 1,
        installmentAmountCents: toMoney(installmentAmount),
        isRecurringIndefinite,
        startDate: cleanStartDate,
        dueDay: cleanDueDay,
        p2pMetadata: undefined,
      }

      if (isEditing && obligationToEdit) {
        updateObligation(obligationToEdit.id, payload)
      } else {
        addObligation(payload)
      }
    } else if (activeType === "DEBT") {
      if (!subcategory.trim()) return
      const payload = {
        type: "DEBT" as ObligationType,
        categoryId,
        subcategory: subcategory.trim(),
        detail: detail.trim(),
        totalAmountCents: toMoney(totalAmount),
        totalInstallments,
        currentInstallment,
        installmentAmountCents: toMoney(installmentAmount),
        isRecurringIndefinite: false,
        startDate: cleanStartDate,
        dueDay: cleanDueDay,
        p2pMetadata: undefined,
      }

      if (isEditing && obligationToEdit) {
        updateObligation(obligationToEdit.id, payload)
      } else {
        addObligation(payload)
      }
    } else if (activeType === "P2P_DEBT") {
      const finalThirdParty = thirdPartyName.trim() || subcategory.trim()
      if (!finalThirdParty) return

      const finalDetail = productDescription.trim() || detail.trim()
      const totalCharge = p2pBreakdown.totalMonthlyChargeCents

      const payload = {
        type: "P2P_DEBT" as ObligationType,
        categoryId,
        subcategory: finalThirdParty,
        detail: finalDetail,
        totalAmountCents: toMoney(totalCharge * totalInstallments),
        totalInstallments,
        currentInstallment,
        installmentAmountCents: totalCharge,
        isRecurringIndefinite: false,
        startDate: cleanStartDate,
        dueDay: cleanDueDay,
        p2pMetadata: {
          role: p2pRole,
          thirdPartyName: finalThirdParty,
          cardIssuer: cardIssuer.trim() || undefined,
          productDescription: finalDetail,
          baseInstallmentAmountCents: toMoney(baseInstallmentAmount),
          surcharges: currentSurcharges,
          totalMonthlyChargeCents: totalCharge,
          linkedPaymentDueDay: cleanDueDay,
        },
      }

      if (isEditing && obligationToEdit) {
        updateObligation(obligationToEdit.id, payload)
      } else {
        addObligation(payload)
      }
    }

    onClose()
  }

  // Consistent input styling classes across the entire modal
  const inputClass =
    "w-full h-11 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition cursor-text"
  const selectClass =
    "w-full h-11 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition cursor-pointer"

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md">
        <div className="w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-t-2xl sm:rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-800 flex-shrink-0">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {isEditing
                  ? "Editar Obligación Financiera"
                  : isCloning
                  ? "Clonar Obligación Financiera"
                  : "Nueva Obligación Financiera"}
              </h2>
              {isCloning && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Crea una nueva obligación basada en una existente con sus datos prellenados.
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar modal"
              className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-white text-lg font-semibold cursor-pointer flex items-center justify-center rounded-lg hover:bg-slate-800 transition"
            >
              ✕
            </button>
          </div>

          {/* Top Segmented Tabs */}
          <div className="px-5 sm:px-6 pt-4 pb-3 border-b border-slate-800/80 bg-slate-950/40">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Tipo de Registro
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectTab("EXPENSE")}
                className={`min-h-[42px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                  activeType === "EXPENSE"
                    ? "bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sm"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800/60"
                }`}
              >
                <span>💡</span> Gasto Recurrente
              </button>
              <button
                type="button"
                onClick={() => handleSelectTab("DEBT")}
                className={`min-h-[42px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                  activeType === "DEBT"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800/60"
                }`}
              >
                <span>🏦</span> Deuda Financiera
              </button>
              <button
                type="button"
                onClick={() => handleSelectTab("P2P_DEBT")}
                className={`min-h-[42px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                  activeType === "P2P_DEBT"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800/60"
                }`}
              >
                <span>👥</span> Entre Personas
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-4 flex-1">
              {/* Category & Subcategory Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div>
                  <div className="flex justify-between items-center h-6 mb-1.5">
                    <label className="block text-xs font-medium text-slate-300">Categoría</label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer flex items-center transition"
                    >
                      + Nueva categoría
                    </button>
                  </div>
                  <select
                    value={categoryId}
                    onChange={handleCategorySelectChange}
                    required
                    className={selectClass}
                  >
                    {categoryList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                    <option value="__NEW_CATEGORY__" className="text-emerald-400 font-medium">
                      + Crear nueva categoría...
                    </option>
                  </select>
                </div>

                {activeType !== "P2P_DEBT" && (
                  <div>
                    <div className="flex items-center h-6 mb-1.5">
                      <label className="block text-xs font-medium text-slate-300">
                        {activeType === "EXPENSE" ? "Servicio / Proveedor" : "Institución / Subcategoría"}
                      </label>
                    </div>
                    <input
                      type="text"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      required
                      placeholder={
                        activeType === "EXPENSE"
                          ? "Ej. Enel, VTR, Netflix, Arriendo"
                          : "Ej. Banco Estado - Crédito Hipotecario"
                      }
                      className={inputClass}
                    />
                  </div>
                )}
              </div>

              {/* ─── TAB 1: GASTO RECURRENTE ─── */}
              {activeType === "EXPENSE" && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center h-6 mb-1.5">
                      <label className="block text-xs font-medium text-slate-300">
                        Detalle / Descripción
                      </label>
                    </div>
                    <input
                      type="text"
                      value={detail}
                      onChange={(e) => setDetail(e.target.value)}
                      placeholder="Ej. Plan hogar fibra óptica 500MB"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div>
                      <div className="flex items-center h-6 mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">
                          Monto Mensual Estimado (CLP)
                        </label>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={installmentAmount || ""}
                        onChange={(e) => handleExpenseAmountChange(Number(e.target.value))}
                        required
                        placeholder="Ej. 29990"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <div className="flex items-center h-6 mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">Tipo de Vigencia</label>
                      </div>
                      <div className="h-11 px-3.5 py-2 bg-slate-950/60 border border-slate-700/80 rounded-xl flex items-center">
                        <label className="relative flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isRecurringIndefinite}
                            onChange={(e) => setIsRecurringIndefinite(e.target.checked)}
                            className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700 focus:ring-sky-500 cursor-pointer"
                          />
                          <span>Gasto continuo / permanente (sin fin)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    <div>
                      <div className="flex items-center h-6 mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">Día de Pago</label>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={dueDay}
                        onChange={(e) => setDueDay(Number(e.target.value))}
                        required
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <div className="flex items-center h-6 mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">Fecha Inicio</label>
                      </div>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-800/40 text-xs text-sky-300/90 space-y-1">
                    <div className="font-semibold text-sky-200">Proyección de Gasto:</div>
                    <div>
                      Se proyectará mensualmente un cargo estimado de{" "}
                      <span className="font-bold text-white">{formatCLP(toMoney(installmentAmount))}</span> el
                      día <span className="font-bold text-white">{dueDay}</span> de cada mes.
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 2: DEUDA FINANCIERA ─── */}
              {activeType === "DEBT" && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center h-6 mb-1.5">
                      <label className="block text-xs font-medium text-slate-300">
                        Detalle / Descripción
                      </label>
                    </div>
                    <input
                      type="text"
                      value={detail}
                      onChange={(e) => setDetail(e.target.value)}
                      placeholder="Ej. Cuota crédito de consumo"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div>
                      <div className="flex items-center h-6 mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">
                          Monto Total Deuda (CLP)
                        </label>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={totalAmount || ""}
                        onChange={(e) => handleTotalAmountChange(Number(e.target.value))}
                        required
                        placeholder="Ej. 12000000"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <div className="flex items-center h-6 mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">
                          Monto por Cuota (CLP)
                        </label>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={installmentAmount || ""}
                        onChange={(e) => setInstallmentAmount(Number(e.target.value))}
                        required
                        placeholder="Ej. 250000"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Cuotas: Total, Pagadas y Próxima Cuota */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                    <div>
                      <div className="flex items-center h-6 mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">Total Cuotas</label>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={600}
                        value={totalInstallments}
                        onChange={(e) => handleTotalInstallmentsChange(Number(e.target.value))}
                        required
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <div className="flex items-center h-6 mb-1.5">
                        <label className="block text-xs font-medium text-emerald-400">
                          Cuotas Pagadas
                        </label>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={totalInstallments - 1}
                        value={paidCount}
                        onChange={(e) => handlePaidInstallmentsChange(Number(e.target.value))}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <div className="flex items-center h-6 mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">
                          Próxima Cuota (Actual)
                        </label>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={totalInstallments}
                        value={currentInstallment}
                        onChange={(e) => handleCurrentInstallmentChange(Number(e.target.value))}
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Día de pago y Fecha de inicio */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                    <div>
                      <div className="flex items-center h-6 mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">Día de Pago</label>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={dueDay}
                        onChange={(e) => setDueDay(Number(e.target.value))}
                        required
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <div className="flex items-center h-6 mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">Fecha Inicio (Cuota 1)</label>
                      </div>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Proyección Completa */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-2">
                    <div className="font-semibold text-slate-200 flex justify-between items-center pb-1.5 border-b border-slate-800/80">
                      <span>Resumen de Cuotas y Amortización:</span>
                      <span className="text-emerald-400 font-bold">
                        {paidCount} pagadas / {pendingCount} pendientes ({totalInstallments} total)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        Monto ya pagado:{" "}
                        <span className="text-slate-200 font-medium">
                          {formatCLP(toMoney(paidCount * installmentAmount))}
                        </span>
                      </div>
                      <div>
                        Saldo restante por pagar:{" "}
                        <span className="text-amber-300 font-bold">
                          {formatCLP(toMoney(pendingCount * installmentAmount))}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-800/60 text-[11px] text-slate-400 flex flex-col sm:flex-row justify-between gap-1">
                      <div>
                        Próximo vencimiento (Cuota #{currentInstallment}):{" "}
                        <span className="text-white font-medium">
                          {computeDueDate(startDate, currentInstallment - 1, dueDay)}
                        </span>
                      </div>
                      <div>
                        Fin del crédito (Cuota #{totalInstallments}):{" "}
                        <span className="text-white font-medium">
                          {computeDueDate(startDate, totalInstallments - 1, dueDay)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 3: ENTRE PERSONAS (P2P) ─── */}
              {activeType === "P2P_DEBT" && (
                <div className="space-y-4">
                  {/* P2P Sub-role Selector */}
                  <div>
                    <div className="flex items-center h-6 mb-1.5">
                      <label className="block text-xs font-medium text-slate-300">
                        Situación con la persona
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setP2pRole("LENT_MY_CARD")}
                        className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer text-left flex items-center gap-2 ${
                          p2pRole === "LENT_MY_CARD"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                        }`}
                      >
                        <span>💳</span> Presté mi tarjeta
                      </button>
                      <button
                        type="button"
                        onClick={() => setP2pRole("USED_THEIR_CARD")}
                        className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer text-left flex items-center gap-2 ${
                          p2pRole === "USED_THEIR_CARD"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                        }`}
                      >
                        <span>🛍️</span> Usé tarjeta ajena
                      </button>
                      <button
                        type="button"
                        onClick={() => setP2pRole("DIRECT_LOAN_GIVEN")}
                        className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer text-left flex items-center gap-2 ${
                          p2pRole === "DIRECT_LOAN_GIVEN"
                            ? "bg-violet-500/20 text-violet-300 border-violet-500/50 shadow-sm"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                        }`}
                      >
                        <span>🤝</span> Préstamo directo
                      </button>
                    </div>
                  </div>

                  {/* Person & Card Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    <div>
                      <div className="flex items-center h-6 mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">
                          {p2pRole === "LENT_MY_CARD"
                            ? "¿Quién te debe?"
                            : p2pRole === "USED_THEIR_CARD"
                            ? "¿A quién le debes?"
                            : "Nombre de la persona"}
                        </label>
                      </div>
                      <input
                        type="text"
                        value={thirdPartyName}
                        onChange={(e) => {
                          setThirdPartyName(e.target.value)
                          setSubcategory(e.target.value)
                        }}
                        required
                        placeholder="Ej. Juan Pérez (Hermano)"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <div className="flex items-center h-6 mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">
                          {p2pRole === "LENT_MY_CARD"
                            ? "Tarjeta de crédito utilizada"
                            : p2pRole === "USED_THEIR_CARD"
                            ? "Tarjeta de origen del titular"
                            : "Concepto / Medio"}
                        </label>
                      </div>
                      <input
                        type="text"
                        value={cardIssuer}
                        onChange={(e) => setCardIssuer(e.target.value)}
                        placeholder="Ej. CMR Falabella, Santander Visa"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center h-6 mb-1.5">
                      <label className="block text-xs font-medium text-slate-300">
                        Producto / Descripción de la compra
                      </label>
                    </div>
                    <input
                      type="text"
                      value={productDescription}
                      onChange={(e) => {
                        setProductDescription(e.target.value)
                        setDetail(e.target.value)
                      }}
                      required
                      placeholder="Ej. Smart TV Samsung 55 en 12 cuotas"
                      className={inputClass}
                    />
                  </div>

                  {/* Two-Way Monto Total & Cuota Mensual Base */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div>
                      <div className="flex items-center h-6 mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">
                          Monto Total Producto / Compra (CLP)
                        </label>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={totalAmount || ""}
                        onChange={(e) => handleP2PTotalAmountChange(Number(e.target.value))}
                        required
                        placeholder="Ej. 839990"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <div className="flex items-center h-6 mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">
                          Cuota Base Producto (CLP)
                        </label>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={baseInstallmentAmount || ""}
                        onChange={(e) => handleP2PBaseInstallmentChange(Number(e.target.value))}
                        required
                        placeholder="Ej. 209998"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Cuotas: Total, Pagadas y Próxima Cuota */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                    <div>
                      <div className="flex items-center h-6 mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">Total Cuotas</label>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={600}
                        value={totalInstallments}
                        onChange={(e) => handleTotalInstallmentsChange(Number(e.target.value))}
                        required
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <div className="flex items-center h-6 mb-1.5">
                        <label className="block text-xs font-medium text-amber-400">
                          Cuotas Pagadas
                        </label>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={totalInstallments - 1}
                        value={paidCount}
                        onChange={(e) => handlePaidInstallmentsChange(Number(e.target.value))}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <div className="flex items-center h-6 mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">
                          Próxima Cuota (Actual)
                        </label>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={totalInstallments}
                        value={currentInstallment}
                        onChange={(e) => handleCurrentInstallmentChange(Number(e.target.value))}
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Día de cobro y Fecha de inicio */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                    <div>
                      <div className="flex items-center h-6 mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">Día Cobro/Pago</label>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={dueDay}
                        onChange={(e) => setDueDay(Number(e.target.value))}
                        required
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <div className="flex items-center h-6 mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">Fecha Inicio (Cuota 1)</label>
                      </div>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Surcharges Section for LENT_MY_CARD */}
                  {p2pRole === "LENT_MY_CARD" && (
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <span>⚙️</span> Traspaso de Costos de Tarjeta (Opcional)
                      </div>

                      {/* Maintenance Fee */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={includeMaintenance}
                            onChange={(e) => setIncludeMaintenance(e.target.checked)}
                            className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500 cursor-pointer"
                          />
                          <span className="font-medium">Traspasar Mantención / Administración Mensual</span>
                        </label>

                        {includeMaintenance && (
                          <div className="pl-6 grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                            <div>
                              <div className="flex items-center h-5 mb-1">
                                <label className="block text-[11px] text-slate-400">Monto Mantención</label>
                              </div>
                              <input
                                type="number"
                                min={0}
                                value={maintenanceFee || ""}
                                onChange={(e) => setMaintenanceFee(Number(e.target.value))}
                                className="w-full h-10 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                              />
                            </div>
                            <div>
                              <div className="flex items-center h-5 mb-1">
                                <label className="block text-[11px] text-slate-400">Modo de cobro</label>
                              </div>
                              <select
                                value={maintenanceSplitMode}
                                onChange={(e) => setMaintenanceSplitMode(e.target.value as MaintenanceSplitMode)}
                                className="w-full h-10 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs cursor-pointer"
                              >
                                <option value="FULL">100% al tercero (+{formatCLP(toMoney(maintenanceFee))})</option>
                                <option value="SPLIT_50_50">
                                  Dividir 50/50 (+{formatCLP(toMoney(Math.floor(maintenanceFee / 2)))})
                                </option>
                                <option value="CUSTOM_AMOUNT">Monto fijo personalizado</option>
                              </select>
                            </div>
                            {maintenanceSplitMode === "CUSTOM_AMOUNT" && (
                              <div className="sm:col-span-2">
                                <div className="flex items-center h-5 mb-1">
                                  <label className="block text-[11px] text-slate-400">
                                    Monto personalizado a traspasar (CLP)
                                  </label>
                                </div>
                                <input
                                  type="number"
                                  min={0}
                                  value={customMaintenance || ""}
                                  onChange={(e) => setCustomMaintenance(Number(e.target.value))}
                                  className="w-full h-10 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Commissions & ITE */}
                      <div className="space-y-2 pt-2 border-t border-slate-800/80">
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={includeCommission}
                            onChange={(e) => setIncludeCommission(e.target.checked)}
                            className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500 cursor-pointer"
                          />
                          <span className="font-medium">
                            Traspasar Impuestos / Comisiones del Banco (ITE, timbres)
                          </span>
                        </label>

                        {includeCommission && (
                          <div className="pl-6 grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                            <div>
                              <div className="flex items-center h-5 mb-1">
                                <label className="block text-[11px] text-slate-400">
                                  Total Comisión / Impuesto
                                </label>
                              </div>
                              <input
                                type="number"
                                min={0}
                                value={commissionAmount || ""}
                                onChange={(e) => setCommissionAmount(Number(e.target.value))}
                                placeholder="Ej. 6000"
                                className="w-full h-10 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                              />
                            </div>
                            <div>
                              <div className="flex items-center h-5 mb-1">
                                <label className="block text-[11px] text-slate-400">Cómo cobrarlo</label>
                              </div>
                              <select
                                value={commissionMode}
                                onChange={(e) => setCommissionMode(e.target.value as CommissionMode)}
                                className="w-full h-10 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs cursor-pointer"
                              >
                                <option value="SPREAD_ACROSS_INSTALLMENTS">
                                  Prorrateado en las cuotas (+
                                  {formatCLP(toMoney(Math.floor(commissionAmount / Math.max(1, totalInstallments))))}
                                  /mes)
                                </option>
                                <option value="FIRST_INSTALLMENT_ONLY">En la primera cuota</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Live Calculation Banner */}
                      <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                        <div className="text-amber-300 font-semibold flex justify-between items-center">
                          <span>Total mensual a cobrar al tercero:</span>
                          <span className="text-sm font-bold text-white">
                            {formatCLP(p2pBreakdown.totalMonthlyChargeCents)} / mes
                          </span>
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          Cuota producto: {formatCLP(p2pBreakdown.baseAmountCents)}
                          {includeMaintenance && ` + Mantención: ${formatCLP(p2pBreakdown.maintenanceSurchargeCents)}`}
                          {includeCommission && ` + Comisión: ${formatCLP(p2pBreakdown.commissionSurchargeCents)}`}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Proyección Preview */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-2">
                    <div className="font-semibold text-slate-200 flex justify-between items-center pb-1.5 border-b border-slate-800/80">
                      <span>Proyección del Compromiso P2P:</span>
                      <span className="text-amber-400 font-bold">
                        {paidCount} pagadas / {pendingCount} pendientes ({totalInstallments} total)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        Monto ya cancelado:{" "}
                        <span className="text-slate-200 font-medium">
                          {formatCLP(toMoney(paidCount * baseInstallmentAmount))}
                        </span>
                      </div>
                      <div>
                        Saldo restante:{" "}
                        <span className="text-amber-300 font-bold">
                          {formatCLP(toMoney(pendingCount * baseInstallmentAmount))}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-800/60 text-[11px] text-slate-400 flex flex-col sm:flex-row justify-between gap-1">
                      <div>
                        Próximo vencimiento (Cuota #{currentInstallment}):{" "}
                        <span className="text-white font-medium">
                          {computeDueDate(startDate, currentInstallment - 1, dueDay)}
                        </span>
                      </div>
                      <div>
                        Fin (Cuota #{totalInstallments}):{" "}
                        <span className="text-white font-medium">
                          {computeDueDate(startDate, totalInstallments - 1, dueDay)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 sm:px-6 sm:py-4 border-t border-slate-800 bg-slate-900/90 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 cursor-pointer transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer shadow-lg transition ${
                  activeType === "EXPENSE"
                    ? "bg-sky-600 hover:bg-sky-500"
                    : activeType === "P2P_DEBT"
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                {isEditing
                  ? "Guardar Cambios"
                  : isCloning
                  ? "Clonar y Crear Obligación"
                  : "Guardar Obligación"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {isCategoryModalOpen && (
        <CategorySettingsModal
          onClose={() => setIsCategoryModalOpen(false)}
          onCategoryCreated={(newCat) => {
            setCategoryId(newCat.id)
            setIsCategoryModalOpen(false)
          }}
        />
      )}
    </>
  )
}
