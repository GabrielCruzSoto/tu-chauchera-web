import React, { useState } from "react"
import { useAuthStore } from "@/store/authSlice"
import {
  requestGoogleAccessToken,
  fetchGoogleUserProfile,
} from "@/features/auth/services/googleOAuth"
import { Spinner } from "@/shared/components/ui/Spinner"

export const LoginPage: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isUnlocked,
    isFirstUse,
    authError,
    isCheckingDrive,
    setOAuthSession,
    setupMasterPassword,
    unlockWithMasterPassword,
    logout,
  } = useAuthStore()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
    if (!clientId) {
      setLocalError("VITE_GOOGLE_CLIENT_ID no está configurado en las variables de entorno.")
      return
    }

    setLocalError(null)
    setIsLoading(true)

    try {
      const accessToken = await requestGoogleAccessToken(clientId)
      const profile = await fetchGoogleUserProfile(accessToken)
      setOAuthSession(profile, accessToken)
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Error al conectar con Google")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (isFirstUse) {
      if (password.length < 8) {
        setLocalError("La contraseña debe tener al menos 8 caracteres.")
        return
      }
      if (password !== confirmPassword) {
        setLocalError("Las contraseñas no coinciden.")
        return
      }

      setIsLoading(true)
      try {
        await setupMasterPassword(password)
      } catch (err: unknown) {
        setLocalError(err instanceof Error ? err.message : "Error al configurar la contraseña")
      } finally {
        setIsLoading(false)
      }
    } else {
      setIsLoading(true)
      try {
        const ok = await unlockWithMasterPassword(password)
        if (!ok) {
          setLocalError("Contraseña incorrecta. Intenta nuevamente.")
        }
      } catch (err: unknown) {
        setLocalError(err instanceof Error ? err.message : "Error al desbloquear")
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 sm:p-6">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            Tu Chauchera
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Gestión de finanzas personales local-first con cifrado AES-256
          </p>
        </div>

        {(localError ?? authError) && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
            {localError ?? authError}
          </div>
        )}

        {!isAuthenticated ? (
          <div className="space-y-4">
            <button
              onClick={() => void handleGoogleLogin()}
              disabled={isLoading}
              className="w-full min-h-[44px] flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700 transition duration-200 cursor-pointer shadow-lg disabled:opacity-50 text-sm"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" color="emerald" label="Conectando con Google..." />
                  <span>Conectando con Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continuar con Google</span>
                </>
              )}
            </button>
            <p className="text-xs text-center text-slate-500">
              Tus datos se guardan cifrados directamente en tu propio Google Drive.
            </p>
          </div>
        ) : !isUnlocked ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300 break-words">
              Sesión iniciada como: <span className="font-semibold text-white">{user?.email}</span>
            </div>

            {isCheckingDrive ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <Spinner size="md" color="emerald" label="Verificando Google Drive..." />
                <span className="text-sm text-slate-400">Verificando Google Drive...</span>
              </div>
            ) : isFirstUse ? (
              <form onSubmit={(e) => void handlePasswordSubmit(e)} className="space-y-4">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs leading-relaxed">
                  ⚠️ <strong>IMPORTANTE:</strong> Esta contraseña maestra cifra tus datos localmente. Si la olvidas, tus datos en Google Drive serán <strong>irrecuperables</strong>.
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Crear Contraseña Maestra
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full min-h-[44px] px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full min-h-[44px] px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="Repite tu contraseña"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition duration-150 cursor-pointer disabled:opacity-50"
                >
                  {isLoading && <Spinner size="sm" color="white" />}
                  <span>{isLoading ? "Cifrando y configurando..." : "Crear Bóveda Segura"}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={(e) => void handlePasswordSubmit(e)} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Contraseña Maestra
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="Ingresa tu contraseña para descifrar"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition duration-150 cursor-pointer disabled:opacity-50"
                >
                  {isLoading && <Spinner size="sm" color="white" />}
                  <span>{isLoading ? "Descifrando..." : "Desbloquear Bóveda"}</span>
                </button>
              </form>
            )}

            <button
              onClick={logout}
              className="w-full min-h-[44px] text-center text-xs text-slate-500 hover:text-slate-400 pt-2 cursor-pointer flex items-center justify-center"
            >
              Cerrar sesión de Google
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
              ✨ Bóveda desbloqueada con éxito
            </div>
            <button
              onClick={logout}
              className="w-full min-h-[44px] py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
            >
              Cerrar y bloquear
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
