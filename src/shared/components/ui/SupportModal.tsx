import React, { useEffect, useState } from "react"
import { SUPPORT_EMAIL } from "@/shared/constants/support"
import { APP_SYSTEM_VERSION, CURRENT_SCHEMA_VERSION } from "@/shared/constants/version"

export interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenPrivacy?: (() => void) | undefined
  onOpenTerms?: (() => void) | undefined
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedDiagnostics, setCopiedDiagnostics] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const getDiagnosticsReport = () => {
    return [
      `--- Diagnóstico Tu Chauchera ---`,
      `Fecha/Hora: ${new Date().toISOString()}`,
      `Versión App: ${APP_SYSTEM_VERSION}`,
      `Versión Schema: ${CURRENT_SCHEMA_VERSION}`,
      `Navegador: ${typeof navigator !== "undefined" ? navigator.userAgent : "N/A"}`,
      `Resolución: ${typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "N/A"}`,
    ].join("\n")
  }

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleCopyDiagnostics = async () => {
    try {
      await navigator.clipboard.writeText(getDiagnosticsReport())
      setCopiedDiagnostics(true)
      setTimeout(() => setCopiedDiagnostics(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-6 text-slate-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div>
              <h2 id="support-modal-title" className="text-xl font-bold text-white tracking-tight">
                Centro de Ayuda & Soporte
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Canales de contacto y asistencia técnica para Tu Chauchera
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal de soporte"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contact Channels */}
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Canales de Contacto Directo
          </h3>

          {/* Email Channel */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Correo Electrónico</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                  Atención Directa
                </span>
              </div>
              <p className="text-xs font-mono text-emerald-400 break-all">{SUPPORT_EMAIL}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => void handleCopyEmail()}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer border border-slate-700"
              >
                {copiedEmail ? "✓ Copiado" : "Copiar"}
              </button>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Consulta%20Soporte%20Tu%20Chauchera`}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition cursor-pointer shadow-sm shadow-emerald-900/40 inline-flex items-center gap-1.5"
              >
                <span>Escribir</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>

          {/* Privacy Policy Link Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Política de Privacidad</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                  Local-First
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Conoce cómo se protegen tus datos financieros con cifrado AES-256 y Google Drive
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onClose()
                  if (onOpenPrivacy) {
                    onOpenPrivacy()
                  } else {
                    window.history.pushState({}, "", "/privacidad")
                    window.dispatchEvent(new PopStateEvent("popstate"))
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer border border-slate-700 inline-flex items-center gap-1.5"
              >
                <span>Leer Política</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Terms of Service Link Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Condiciones del Servicio</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 font-medium">
                  Términos de Uso
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Consulta las condiciones legales, licencias, responsabilidades y descargo financiero
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onClose()
                  if (onOpenTerms) {
                    onOpenTerms()
                  } else {
                    window.history.pushState({}, "", "/terminos")
                    window.dispatchEvent(new PopStateEvent("popstate"))
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer border border-slate-700 inline-flex items-center gap-1.5"
              >
                <span>Ver Términos</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Diagnostics for Support */}
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>🛠️</span> Datos de Diagnóstico
            </h4>
            <button
              type="button"
              onClick={() => void handleCopyDiagnostics()}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline underline-offset-2 transition"
            >
              {copiedDiagnostics ? "✓ ¡Copiado al portapapeles!" : "Copiar diagnóstico"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300">
            <div>
              <span className="text-slate-500">Versión App: </span>
              <span className="text-emerald-300">{APP_SYSTEM_VERSION}</span>
            </div>
            <div>
              <span className="text-slate-500">Schema: </span>
              <span className="text-teal-300">{CURRENT_SCHEMA_VERSION}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Puedes adjuntar esta información técnica en tu mensaje para ayudarnos a resolver incidencias más rápidamente. No incluye datos financieros ni credenciales.
          </p>
        </div>

        {/* Footer info */}
        <div className="pt-2 text-center border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            Tu Chauchera es una aplicación Local-First. Tu información financiera vive cifrada con tu clave maestra y nunca pasa por servidores externos.
          </p>
        </div>
      </div>
    </div>
  )
}
