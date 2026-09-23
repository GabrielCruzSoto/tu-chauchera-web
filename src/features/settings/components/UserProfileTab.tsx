import React, { useState } from "react"
import { useAuthStore } from "@/store/authSlice"
import { useSettingsStore } from "../store/settingsSlice"
import type { CurrencyCode, DateFormatPattern, AppTheme } from "@/shared/types/settings"

export const UserProfileTab: React.FC = () => {
  const { user, isUnlocked } = useAuthStore()
  const { preferences, updatePreferences } = useSettingsStore()

  const [currency, setCurrency] = useState<CurrencyCode>(preferences.currency)
  const [dateFormat, setDateFormat] = useState<DateFormatPattern>(preferences.dateFormat)
  const [theme, setTheme] = useState<AppTheme>(preferences.theme)
  const [showCents, setShowCents] = useState<boolean>(preferences.showCents)
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null)

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault()
    updatePreferences({
      currency,
      dateFormat,
      theme,
      showCents,
    })
    setSavedFeedback("Preferencias guardadas exitosamente.")
    setTimeout(() => setSavedFeedback(null), 3000)
  }

  // Get initials for avatar fallback
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(/\s+/)
      if (parts.length >= 2 && parts[0] && parts[1]) {
        const first = parts[0][0] || ""
        const second = parts[1][0] || ""
        return `${first}${second}`.toUpperCase()
      }
      return name.slice(0, 2).toUpperCase()
    }
    if (email) return email.slice(0, 2).toUpperCase()
    return "TC"
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>👤</span> Información de Usuario & Preferencias
        </h3>
        <p className="text-xs text-slate-400">
          Consulta la cuenta asociada y personaliza los formatos visuales y regionales de la aplicación.
        </p>
      </div>

      {savedFeedback && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex justify-between items-center"
        >
          <span>{savedFeedback}</span>
          <button
            type="button"
            onClick={() => setSavedFeedback(null)}
            aria-label="Cerrar notificación de guardado"
            className="text-emerald-400 hover:text-emerald-200 ml-2 min-h-[36px] min-w-[36px] p-2 flex items-center justify-center rounded-lg hover:bg-emerald-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition cursor-pointer"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      )}

      {/* User Google Profile Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {user?.picture ? (
            <img
              src={user.picture}
              alt="Avatar de usuario"
              className="w-14 h-14 rounded-2xl border-2 border-emerald-500/40 object-cover shadow"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/30 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-lg shadow">
              {getInitials(user?.name, user?.email)}
            </div>
          )}

          <div>
            <h4 className="text-base font-bold text-white">
              {user?.name || "Usuario de Tu Chauchera"}
            </h4>
            <p className="text-xs text-slate-400">{user?.email || "Sin correo disponible"}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Cuenta Google Conectada
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5 w-full sm:w-auto">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Estado Bóveda:</span>
            <span className="text-emerald-300 font-semibold">
              {isUnlocked ? "🔓 Desbloqueada" : "🔒 Bloqueada"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Cifrado:</span>
            <span className="text-slate-300 font-mono">AES-GCM (256-bit)</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Derivación Clave:</span>
            <span className="text-slate-300 font-mono">PBKDF2 (100k)</span>
          </div>
        </div>
      </div>

      {/* Preferences Form */}
      <form onSubmit={handleSavePreferences} className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
        <h4 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
          ⚙️ Preferencias Generales
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="currency-select" className="block text-xs font-medium text-slate-300 mb-1.5">
              Moneda Principal
            </label>
            <select
              id="currency-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition cursor-pointer"
            >
              <option value="CLP">CLP — Peso Chileno ($)</option>
              <option value="USD">USD — Dólar Estadounidense ($)</option>
              <option value="EUR">EUR — Euro (€)</option>
              <option value="UF">UF — Unidad de Fomento (UF)</option>
            </select>
          </div>

          <div>
            <label htmlFor="date-format-select" className="block text-xs font-medium text-slate-300 mb-1.5">
              Formato de Fecha
            </label>
            <select
              id="date-format-select"
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value as DateFormatPattern)}
              className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition cursor-pointer"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (Ej. 31/12/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (Ej. 2026-12-31)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (Ej. 12/31/2026)</option>
            </select>
          </div>

          <div>
            <label htmlFor="theme-select" className="block text-xs font-medium text-slate-300 mb-1.5">
              Tema Visual
            </label>
            <select
              id="theme-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value as AppTheme)}
              className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition cursor-pointer"
            >
              <option value="dark">🌙 Modo Oscuro (Predeterminado)</option>
              <option value="light">☀️ Modo Claro</option>
              <option value="system">💻 Seguir Sistema Operativo</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="show-cents-check"
              checked={showCents}
              onChange={(e) => setShowCents(e.target.checked)}
              className="w-5 h-5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="show-cents-check" className="text-xs font-medium text-slate-300 cursor-pointer">
              Mostrar decimales/centavos en montos monetarios
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            type="submit"
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs sm:text-sm font-semibold text-white cursor-pointer shadow transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            Guardar Preferencias
          </button>
        </div>
      </form>
    </div>
  )
}
