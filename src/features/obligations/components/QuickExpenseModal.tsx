import React, { useState, useEffect } from "react"
import { useObligationsStore, type QuickExpensePaymentMethod } from "../store/obligationsSlice"
import { formatCLP, toMoney } from "@/shared/types/money"
import { getLocalISODate } from "@/shared/utils/date"

interface QuickExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const QuickExpenseModal: React.FC<QuickExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { categories, addQuickExpense } = useObligationsStore()

  const categoryList = Object.values(categories).sort((a, b) =>
    a.name.localeCompare(b.name, "es", { sensitivity: "base" })
  )

  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState<number | "">("")
  const [categoryId, setCategoryId] = useState<string>(() => categoryList[0]?.id ?? "")
  const [paymentMethod, setPaymentMethod] = useState<QuickExpensePaymentMethod>("DEBIT")
  const [date, setDate] = useState<string>(getLocalISODate())
  const [notes, setNotes] = useState("")

  // Update default category when categories load or change
  useEffect(() => {
    if (!categoryId && categoryList.length > 0) {
      setCategoryId(categoryList[0]!.id)
    }
  }, [categories, categoryId, categoryList])

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

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || !amount || Number(amount) <= 0 || !categoryId) return

    addQuickExpense({
      categoryId,
      description: description.trim(),
      amountCents: toMoney(Number(amount)),
      paymentMethod,
      date,
      notes: notes.trim() || undefined,
    })

    // Reset fields
    setDescription("")
    setAmount("")
    setNotes("")
    setDate(getLocalISODate())

    onSuccess?.()
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-expense-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[92vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-800 flex-shrink-0 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-base">
              ⚡
            </span>
            <div>
              <h3 id="quick-expense-modal-title" className="text-base sm:text-lg font-bold text-white">
                Gasto Rápido (Débito / Caja)
              </h3>
              <p className="text-[11px] text-slate-400">
                Registra compras puntuales sin cuotas ni endeudamiento
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de gasto rápido"
            className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-white flex items-center justify-center rounded-xl hover:bg-slate-800 cursor-pointer text-lg font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-4 flex-1">
            {/* Monto */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="quick-expense-amount" className="block text-xs font-semibold text-slate-300">
                  Monto del Gasto (CLP) <span className="text-rose-400">*</span>
                </label>
                {amount && Number(amount) > 0 && (
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {formatCLP(toMoney(Number(amount)))}
                  </span>
                )}
              </div>
              <input
                id="quick-expense-amount"
                name="amount"
                type="number"
                min={1}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                required
                autoFocus
                placeholder="Ej. 12500"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-base sm:text-lg font-mono font-bold focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition placeholder:font-normal placeholder:text-sm"
              />
            </div>

            {/* Descripción / Comercio */}
            <div>
              <label htmlFor="quick-expense-description" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Descripción / Comercio <span className="text-rose-400">*</span>
              </label>
              <input
                id="quick-expense-description"
                name="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Ej. Almuerzo, Supermercado Lider, Farmacia, Uber"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition"
              />
            </div>

            {/* Categoría */}
            <div>
              <label htmlFor="quick-expense-category" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Categoría <span className="text-rose-400">*</span>
              </label>
              <select
                id="quick-expense-category"
                name="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition cursor-pointer"
              >
                {categoryList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Método de Pago */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Medio de Pago
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("DEBIT")}
                  className={`min-h-[40px] px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    paymentMethod === "DEBIT"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <span>💳 Débito</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`min-h-[40px] px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    paymentMethod === "CASH"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <span>💵 Efectivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("TRANSFER")}
                  className={`min-h-[40px] px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    paymentMethod === "TRANSFER"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <span>📲 Transf.</span>
                </button>
              </div>
            </div>

            {/* Fecha y Notas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="quick-expense-date" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Fecha
                </label>
                <input
                  id="quick-expense-date"
                  name="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition"
                />
              </div>

              <div>
                <label htmlFor="quick-expense-notes" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Detalle / Comprobante (opcional)
                </label>
                <input
                  id="quick-expense-notes"
                  name="notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Boleta #1029"
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-5 py-4 sm:px-6 sm:py-4 border-t border-slate-800 bg-slate-900/95 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-semibold text-slate-300 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!description.trim() || !amount || Number(amount) <= 0 || !categoryId}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold text-white shadow-lg cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 flex items-center gap-2"
            >
              <span>⚡ Guardar Gasto</span>
              {amount && Number(amount) > 0 && (
                <span className="font-mono text-emerald-200">
                  ({formatCLP(toMoney(Number(amount)))})
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
