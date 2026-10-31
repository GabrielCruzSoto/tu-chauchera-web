import React, { useEffect } from 'react'

export interface StorageQuotaModalProps {
  isOpen?: boolean
  onClose: () => void
  onRetry?: () => void | Promise<void>
}

export const StorageQuotaModal: React.FC<StorageQuotaModalProps> = ({
  isOpen = true,
  onClose,
  onRetry,
}) => {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="storage-quota-title"
      aria-describedby="storage-quota-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-6 text-slate-100 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7.5 7.5 0 01-7.5 7.5c-.8 0-1.56-.12-2.28-.35M19 11a7.5 7.5 0 00-7.5-7.5c-3.14 0-5.83 1.94-6.91 4.71M19 11h.5a4.5 4.5 0 010 9H8M5 11a4.5 4.5 0 00-.5 8.97M12 9v4m0 4h.01"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="storage-quota-title"
                  className="text-lg sm:text-xl font-bold text-white tracking-tight"
                >
                  Espacio insuficiente en Google Drive
                </h2>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 mt-1">
                Almacenamiento lleno
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body Content */}
        <div className="space-y-4">
          <p
            id="storage-quota-description"
            className="text-xs sm:text-sm text-slate-300 leading-relaxed"
          >
            Tu cuenta de Google ha superado la cuota de almacenamiento disponible, compartida entre{' '}
            <strong className="text-white">Google Drive</strong>,{' '}
            <strong className="text-white">Gmail</strong> y{' '}
            <strong className="text-white">Google Fotos</strong>. Debido a esto, Tu Chauchera no
            puede sincronizar tus cambios ni subir respaldos a la nube.
          </p>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span>💡</span> Acciones recomendadas para liberar espacio:
            </h3>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-normal">
              <li>
                <strong>Vaciar papeleras:</strong> Vacía la papelera en Google Drive y Gmail (los
                archivos eliminados siguen usando espacio por 30 días).
              </li>
              <li>
                <strong>Archivos pesados en Gmail:</strong> Elimina correos con archivos adjuntos
                grandes buscando{' '}
                <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">
                  has:attachment larger:10M
                </code>
                .
              </li>
              <li>
                <strong>Google Fotos:</strong> Limpia videos extensos o fotos duplicadas.
              </li>
              <li>
                <strong>Ampliar espacio:</strong> Considera un plan de suscripción en Google One si
                necesitas más capacidad.
              </li>
            </ul>
          </div>

          <a
            href="https://one.google.com/storage"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-semibold transition cursor-pointer"
          >
            <span>Liberar espacio en Google</span>
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Entendido
          </button>
          {onRetry && (
            <button
              type="button"
              onClick={() => void onRetry()}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Reintentar sincronización</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
