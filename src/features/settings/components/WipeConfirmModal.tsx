import React, { useState } from "react"

interface WipeConfirmModalProps {
  isOpen: boolean
  isLoading: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

const CONFIRMATION_PHRASE = "ELIMINAR MIS DATOS"

export const WipeConfirmModal: React.FC<WipeConfirmModalProps> = ({
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}) => {
  const [inputValue, setInputValue] = useState("")
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const isMatched = inputValue.trim() === CONFIRMATION_PHRASE

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isMatched) {
      setError(`Debes escribir exactamente "${CONFIRMATION_PHRASE}" para continuar.`)
      return
    }

    try {
      setError(null)
      await onConfirm()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar los datos.")
    }
  }

  return (
    <div
      data-testid="wipe-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wipe-dialog-title"
        className="w-full max-w-lg rounded-2xl bg-slate-900 border border-rose-500/40 shadow-2xl p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 id="wipe-dialog-title" className="text-base sm:text-lg font-bold text-white">
              ¿Eliminar definitivamente todos los datos?
            </h3>
            <p className="text-xs text-rose-300">
              Esta acción es destructiva, irreversible y no se puede deshacer.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-300 space-y-2 bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/20">
          <p>
            Al confirmar, se eliminarán de forma permanente:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li>Todas tus obligaciones, deudas y amortizaciones registradas.</li>
            <li>Todos tus ingresos y registros de flujo de caja.</li>
            <li>Todas las tarjetas de crédito, plásticos y compras asociadas.</li>
            <li>Todas las categorías personalizadas y preferencias de configuración.</li>
            <li>Todos los archivos cifrados en tu <span className="font-mono text-white">appDataFolder</span> de Google Drive.</li>
          </ul>
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-lg bg-rose-500/20 text-rose-200 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="wipe-confirm-input"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              Para confirmar, escribe <span className="text-rose-400 font-mono select-all">"{CONFIRMATION_PHRASE}"</span>:
            </label>
            <input
              id="wipe-confirm-input"
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setError(null)
              }}
              placeholder={CONFIRMATION_PHRASE}
              disabled={isLoading}
              className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500 transition font-mono"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs sm:text-sm text-slate-300 cursor-pointer transition text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isMatched || isLoading}
              className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow transition text-center flex items-center justify-center gap-2 ${
                isMatched && !isLoading
                  ? "bg-rose-600 hover:bg-rose-500 cursor-pointer"
                  : "bg-rose-900/40 text-slate-500 border border-rose-900/30 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">🔄</span> Eliminando datos...
                </>
              ) : (
                "Eliminar Bóveda y Resetear"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
