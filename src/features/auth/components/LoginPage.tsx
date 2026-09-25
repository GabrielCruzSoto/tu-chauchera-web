import React, { useState } from "react"
import { useAuthStore } from "@/store/authSlice"
import {
  requestGoogleAccessToken,
  fetchGoogleUserProfile,
} from "@/features/auth/services/googleOAuth"
import { Spinner } from "@/shared/components/ui/Spinner"
import { SupportModal } from "@/shared/components/ui/SupportModal"
import { APP_SYSTEM_VERSION, CURRENT_SCHEMA_VERSION } from "@/shared/constants/version"

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
  const [isSupportOpen, setIsSupportOpen] = useState(false)

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
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-10 overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-20 w-72 sm:w-96 h-72 sm:h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 sm:w-[28rem] h-80 sm:h-[28rem] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-32 right-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main container */}
      <div className="relative z-10 w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Column: Branding & Value Proposition (Visible on lg+) */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-center space-y-8 pr-4">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium tracking-wide w-fit">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Local-First &amp; Client-Side Encrypted
            </div>
            
            <div className="flex items-center gap-4">
              <img
                src="/logo.png"
                alt="Tu Chauchera Logo"
                className="w-16 h-16 object-contain rounded-2xl drop-shadow-[0_0_20px_rgba(52,211,153,0.35)]"
              />
              <div>
                <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-200 bg-clip-text text-transparent">
                  Tu Chauchera
                </h1>
                <p className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
                  Gestión Financiera Inteligente
                </p>
              </div>
            </div>

            <p className="text-base text-slate-300 leading-relaxed max-w-xl">
              Toma el control absoluto de tus finanzas personales, flujos de cuotas y obligaciones en una plataforma ultrarrápida, privada y segura.
            </p>
          </div>

          {/* 3 Value Pillars */}
          <div className="space-y-3.5 max-w-xl">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-emerald-500/30 transition duration-200">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-slate-100">Privacidad Local-First</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tus datos se procesan y calculan localmente en tu navegador sin intermediarios ni analíticas invasivas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-teal-500/30 transition duration-200">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-slate-100">Cifrado AES-256 de Grado Militar</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Bóveda protegida con derivación de clave PBKDF2 y cifrado simétrico; sólo tú tienes la llave de acceso.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-cyan-500/30 transition duration-200">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-slate-100">Sincronización Directa con Google Drive</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Respaldo automático y transparente en la carpeta de datos de tu propia cuenta personal de Google.
                </p>
              </div>
            </div>
          </div>

          {/* Support helper hint on desktop */}
          <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
            <span>¿Preguntas o necesitas asistencia?</span>
            <button
              type="button"
              onClick={() => setIsSupportOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 cursor-pointer transition"
            >
              Contactar a soporte
            </button>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="w-full p-6 sm:p-8 rounded-3xl bg-slate-900/70 backdrop-blur-2xl border border-slate-800/90 shadow-2xl shadow-slate-950/60 space-y-6">
            
            {/* Header / Logo (Shown prominently on mobile, compact on desktop) */}
            <div className="text-center space-y-2">
              <img
                src="/logo.png"
                alt="Tu Chauchera Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto object-contain drop-shadow-[0_0_15px_rgba(52,211,153,0.3)] rounded-2xl mb-1 lg:hidden"
              />
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {!isAuthenticated
                  ? "Acceder a Tu Bóveda"
                  : !isUnlocked
                  ? isFirstUse
                    ? "Configurar Bóveda"
                    : "Desbloquear Bóveda"
                  : "Bóveda Activa"}
              </h2>
              <p className="text-xs text-slate-300">
                {!isAuthenticated
                  ? "Inicia sesión con Google para sincronizar tus datos cifrados."
                  : !isUnlocked
                  ? "Introduce tu contraseña maestra para descifrar tu información."
                  : "Tu sesión y bóveda están actualmente activas."}
              </p>
            </div>

            {(localError ?? authError) && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-medium leading-relaxed flex items-start gap-2.5">
                <span className="shrink-0 text-rose-400">⚠️</span>
                <span>{localError ?? authError}</span>
              </div>
            )}

            {!isAuthenticated ? (
              <div className="space-y-4 pt-1">
                <button
                  onClick={() => void handleGoogleLogin()}
                  disabled={isLoading}
                  className="w-full min-h-[48px] flex items-center justify-center gap-3 py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-white font-medium border border-slate-700 hover:border-slate-600 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-emerald-950/20 disabled:opacity-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {isLoading ? (
                    <>
                      <Spinner size="sm" color="emerald" label="Conectando con Google..." />
                      <span className="font-semibold text-slate-200">Conectando con Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                      </svg>
                      <span className="font-semibold text-white">Continuar con Google</span>
                    </>
                  )}
                </button>
                
                <div className="pt-2 text-center">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tus datos se guardan cifrados directamente en tu propio <span className="text-slate-300 font-medium">Google Drive</span>.
                  </p>
                </div>
              </div>
            ) : !isUnlocked ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 break-words flex items-center justify-between gap-2">
                  <div className="truncate">
                    <span className="text-slate-400">Usuario:</span> <span className="font-semibold text-white">{user?.email}</span>
                  </div>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                </div>

                {isCheckingDrive ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-3">
                    <Spinner size="md" color="emerald" label="Verificando Google Drive..." />
                    <span className="text-sm text-slate-300 font-medium">Verificando Google Drive...</span>
                  </div>
                ) : isFirstUse ? (
                  <form onSubmit={(e) => void handlePasswordSubmit(e)} className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs leading-relaxed">
                      ⚠️ <strong>IMPORTANTE:</strong> Esta contraseña maestra cifra tus datos localmente. Si la olvidas, tus datos en Google Drive serán <strong>irrecuperables</strong>.
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                        Crear Contraseña Maestra
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                        placeholder="Mínimo 8 caracteres"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                        Confirmar Contraseña
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                        placeholder="Repite tu contraseña"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm transition duration-150 cursor-pointer shadow-lg shadow-emerald-900/30 disabled:opacity-50"
                    >
                      {isLoading && <Spinner size="sm" color="white" />}
                      <span>{isLoading ? "Cifrando y configurando..." : "Crear Bóveda Segura"}</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={(e) => void handlePasswordSubmit(e)} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                        Contraseña Maestra
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                        placeholder="Ingresa tu contraseña para descifrar"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm transition duration-150 cursor-pointer shadow-lg shadow-emerald-900/30 disabled:opacity-50"
                    >
                      {isLoading && <Spinner size="sm" color="white" />}
                      <span>{isLoading ? "Descifrando..." : "Desbloquear Bóveda"}</span>
                    </button>
                  </form>
                )}

                <button
                  onClick={logout}
                  className="w-full min-h-[44px] text-center text-xs text-slate-400 hover:text-slate-200 pt-2 cursor-pointer flex items-center justify-center transition"
                >
                  Cerrar sesión de Google
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium">
                  ✨ Bóveda desbloqueada con éxito
                </div>
                <button
                  onClick={logout}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition cursor-pointer"
                >
                  Cerrar y bloquear
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
      
      {/* Footer System & Schema Indicators */}
      <footer
        data-testid="landing-version-footer"
        className="relative z-10 mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-2.5 text-xs text-slate-400"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 shadow-sm backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Sistema: <strong className="font-mono text-slate-200">{APP_SYSTEM_VERSION}</strong></span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 shadow-sm backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
          <span>Schema: <strong className="font-mono text-slate-200">{CURRENT_SCHEMA_VERSION}</strong></span>
        </span>
        <button
          type="button"
          onClick={() => setIsSupportOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-emerald-300 shadow-sm backdrop-blur-md cursor-pointer transition"
        >
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>Ayuda & Soporte</span>
        </button>
      </footer>

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  )
}
