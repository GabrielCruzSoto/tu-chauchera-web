import React, { useState } from "react"
import { SUPPORT_EMAIL } from "@/shared/constants/support"
import { APP_SYSTEM_VERSION, CURRENT_SCHEMA_VERSION } from "@/shared/constants/version"
import { useAuthStore } from "@/store/authSlice"
import { useSyncStore } from "@/features/sync/store/syncSlice"

export const SupportTab: React.FC = () => {
  const { user, isUnlocked } = useAuthStore()
  const { status: syncStatus, lastSyncedAt } = useSyncStore()
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedDiagnostics, setCopiedDiagnostics] = useState(false)

  const getDiagnosticsReport = () => {
    return [
      `--- Diagnóstico Tu Chauchera ---`,
      `Fecha/Hora: ${new Date().toISOString()}`,
      `Versión App: ${APP_SYSTEM_VERSION}`,
      `Versión Schema: ${CURRENT_SCHEMA_VERSION}`,
      `Bóveda Desbloqueada: ${isUnlocked ? "Sí" : "No"}`,
      `Estado Sincronización: ${syncStatus}`,
      `Última Sincronización: ${lastSyncedAt ? new Date(lastSyncedAt).toISOString() : "Nunca"}`,
      `Navegador: ${typeof navigator !== "undefined" ? navigator.userAgent : "N/A"}`,
      `Resolución Pantalla: ${typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "N/A"}`,
      `Usuario: ${user?.email ?? "N/A"}`,
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
    <div className="space-y-6 max-w-4xl">
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🎧</span> Centro de Ayuda & Asistencia Técnica
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              ¿Tienes problemas con la sincronización, cifrado o importación de estados de cuenta?
            </p>
          </div>
        </div>

        {/* Contact cards */}
        <div className="space-y-4">
          {/* Card Email */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Soporte por Correo Electrónico</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                  Atención Directa
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Escríbenos directamente para dudas funcionales, asistencia con tus datos o problemas con la aplicación.
              </p>
              <p className="text-xs font-mono text-emerald-400 pt-1 break-all">{SUPPORT_EMAIL}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => void handleCopyEmail()}
                className="py-2 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer border border-slate-700"
              >
                {copiedEmail ? "✓ Copiado" : "Copiar Correo"}
              </button>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Consulta%20Soporte%20Tu%20Chauchera`}
                className="py-2 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition cursor-pointer shadow-sm shadow-emerald-900/40 text-center inline-flex items-center justify-center gap-1.5"
              >
                <span>Redactar</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Diagnostics Box */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>🛠️</span> Reporte de Diagnóstico del Sistema
            </h4>
            <button
              type="button"
              onClick={() => void handleCopyDiagnostics()}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline underline-offset-2 transition"
            >
              {copiedDiagnostics ? "✓ ¡Diagnóstico copiado!" : "Copiar diagnóstico"}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-900/90 p-3 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-500 block">App:</span>
              <span className="text-emerald-400 font-bold">{APP_SYSTEM_VERSION}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Schema:</span>
              <span className="text-teal-400 font-bold">{CURRENT_SCHEMA_VERSION}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Bóveda:</span>
              <span className={isUnlocked ? "text-emerald-400" : "text-amber-400"}>
                {isUnlocked ? "Desbloqueada" : "Bloqueada"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Sync:</span>
              <span className="text-slate-300 capitalize">{syncStatus}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Este reporte permite identificar rápidamente inconsistencias de versión o sincronización sin exponer tus movimientos, montos ni contraseñas.
          </p>
        </div>
      </div>
    </div>
  )
}
