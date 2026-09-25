import React, { useState, useEffect, Suspense, lazy } from "react"
import { LoginPage } from "@/features/auth/components/LoginPage"
import { useAuthStore } from "@/store/authSlice"
import { useSyncStore } from "@/features/sync/store/syncSlice"
import { SyncStatusIndicator } from "@/features/sync/components/SyncStatusIndicator"
import { PageLoader } from "@/shared/components/ui/PageLoader"
import { UserMenuDropdown } from "@/shared/components/layout/UserMenuDropdown"
import { SupportModal } from "@/shared/components/ui/SupportModal"
import "@/store/appReset"

const ObligationsList = lazy(() =>
  import("@/features/obligations/components/ObligationsList").then((m) => ({ default: m.ObligationsList }))
)
const MonthlyInstallmentsView = lazy(() =>
  import("@/features/obligations/components/MonthlyInstallmentsView").then((m) => ({ default: m.MonthlyInstallmentsView }))
)
const FinancialMatrix = lazy(() =>
  import("@/features/matrix/components/FinancialMatrix").then((m) => ({ default: m.FinancialMatrix }))
)
const IncomeListView = lazy(() =>
  import("@/features/income/components/IncomeListView").then((m) => ({ default: m.IncomeListView }))
)
const SettingsView = lazy(() =>
  import("@/features/settings/components/SettingsView").then((m) => ({ default: m.SettingsView }))
)
const CreditCardsDashboard = lazy(() =>
  import("@/features/credit-cards/components/CreditCardsDashboard").then((m) => ({ default: m.CreditCardsDashboard }))
)
const MatrixIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
)

const CalendarIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
    <path d="m9 16 2 2 4-4" />
  </svg>
)

const IncomeIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const ObligationsIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

const CardsIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
)

const navItems = [
  { id: "matrix", label: "Matriz Consolidada", shortLabel: "Matriz", shortcut: "1", icon: MatrixIcon },
  { id: "calendar", label: "Flujos & Cuotas", shortLabel: "Flujos", shortcut: "2", icon: CalendarIcon },
  { id: "income", label: "Ingresos", shortLabel: "Ingresos", shortcut: "3", icon: IncomeIcon },
  { id: "obligations", label: "Obligaciones", shortLabel: "Obligaciones", shortcut: "4", icon: ObligationsIcon },
  { id: "cards", label: "Tarjetas", shortLabel: "Tarjetas", shortcut: "5", icon: CardsIcon },
] as const

export const App: React.FC = () => {
  const { isAuthenticated, isUnlocked, logout, user } = useAuthStore()
  const { hydrateFromDrive } = useSyncStore()
  const [activeTab, setActiveTab] = useState<"matrix" | "calendar" | "obligations" | "cards" | "income" | "settings">("matrix")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSupportOpen, setIsSupportOpen] = useState(false)

  // Clean residual OAuth URL query params if present
  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  // Hydrate data from Google Drive when unlocked
  useEffect(() => {
    if (isAuthenticated && isUnlocked) {
      void hydrateFromDrive()
    }
  }, [isAuthenticated, isUnlocked, hydrateFromDrive])

  // Global keyboard shortcuts (1 - 6) for rapid navigation
  useEffect(() => {
    if (!isAuthenticated || !isUnlocked) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }
      const keyMap: Record<string, "matrix" | "calendar" | "obligations" | "cards" | "income" | "settings"> = {
        "1": "matrix",
        "2": "calendar",
        "3": "income",
        "4": "obligations",
        "5": "cards",
        "6": "settings",
      }
      const targetTab = keyMap[e.key]
      if (targetTab && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setActiveTab(targetTab)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isAuthenticated, isUnlocked])

  if (!isAuthenticated || !isUnlocked) {
    return <LoginPage />
  }

  const handleTabSelect = (tab: "matrix" | "calendar" | "obligations" | "cards" | "income" | "settings") => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Ambient Lighting Orbs for Glassmorphism depth */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-teal-500/8 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 w-[32rem] h-[32rem] bg-indigo-600/10 rounded-full blur-[140px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Top Navbar — Proposal 1 Segmented Control */}
      <header className="border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 lg:gap-4 xl:gap-6">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Hamburger Button for Mobile / Tablet (<1024px) */}
            <button
              type="button"
              aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden min-h-[44px] min-w-[44px] p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 flex items-center justify-center border border-slate-800 transition cursor-pointer shrink-0"
            >
              {isMobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Brand Logo & Title with enhanced prominence and badge alignment */}
            <div
              className="flex items-center gap-3 cursor-pointer select-none group"
              onClick={() => handleTabSelect("matrix")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleTabSelect("matrix")}
              aria-label="Ir a Matriz Consolidada"
            >
              <div className="relative flex items-center justify-center p-1.5 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-md group-hover:border-emerald-500/40 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all duration-200">
                <img
                  src="/logo.png"
                  alt="Tu Chauchera Logo"
                  className="w-8 h-8 sm:w-8 sm:h-8 object-contain rounded-lg drop-shadow-[0_0_8px_rgba(52,211,153,0.35)] group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="flex flex-col whitespace-nowrap">
                <span className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-teal-100 to-white bg-clip-text text-transparent leading-tight group-hover:from-emerald-200 group-hover:to-white transition-all">
                  Tu Chauchera
                </span>
                <span className="hidden sm:inline text-[9px] text-emerald-400/90 font-mono tracking-wider font-semibold leading-tight mt-0.5">
                  LOCAL-FIRST • AES-256
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs (≥1024px) — Segmented Control */}
          <nav
            aria-label="Navegación principal"
            className="hidden lg:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800/90 shadow-inner shrink-0 gap-0.5 xl:gap-1"
          >
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabSelect(item.id)}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  title={`${item.label} (Tecla ${item.shortcut})`}
                  className={`min-h-[36px] xl:min-h-[38px] px-2 xl:px-2.5 2xl:px-3.5 py-1.5 rounded-lg text-[11px] xl:text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 2xl:gap-2 whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-b from-emerald-500/20 to-emerald-600/10 text-emerald-300 border border-emerald-500/40 shadow-[0_0_14px_rgba(16,185,129,0.2)]"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
                  <span className="hidden 2xl:inline">{item.label}</span>
                  <span className="2xl:hidden">{item.shortLabel}</span>
                  <span
                    aria-hidden="true"
                    className={`hidden 2xl:inline-block text-[9px] font-mono px-1 py-0.2 rounded ${
                      isActive ? "bg-emerald-500/20 text-emerald-200" : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {item.shortcut}
                  </span>
                </button>
              )
            })}
          </nav>

          {/* Right Rail Utilities */}
          <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-2.5 shrink-0">
            <SyncStatusIndicator />
            <UserMenuDropdown
              onOpenSettings={() => handleTabSelect("settings")}
              onOpenSupport={() => setIsSupportOpen(true)}
            />
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay and Menu (<1024px) */}
      {isMobileMenuOpen && (
        <div
          data-testid="mobile-drawer-backdrop"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm lg:hidden flex"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            data-testid="mobile-nav-drawer"
            className="w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 h-full p-5 flex flex-col justify-between shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/logo.png"
                    alt="Tu Chauchera Logo"
                    className="w-7 h-7 object-contain rounded-md"
                  />
                  <span className="font-bold text-white text-lg">Menú Principal</span>
                </div>
                <button
                  type="button"
                  aria-label="Cerrar menú"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-white flex items-center justify-center rounded-xl hover:bg-slate-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <nav className="flex flex-col gap-1.5" data-testid="mobile-nav-links">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabSelect(item.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={`min-h-[44px] w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center justify-between ${
                        isActive
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "text-slate-300 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span>{item.label}</span>
                      </div>
                      {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              {user && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt=""
                      aria-hidden="true"
                      className="w-9 h-9 rounded-lg object-cover border border-emerald-500/30 shrink-0"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/30 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-xs shrink-0"
                    >
                      {user.name ? user.name.slice(0, 2).toUpperCase() : "TC"}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {user.name || "Usuario"}
                    </span>
                    {user.email && (
                      <span className="text-[10px] text-slate-400 font-mono truncate">
                        {user.email}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => handleTabSelect("settings")}
                  className="w-full min-h-[44px] py-2.5 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 hover:text-white text-xs font-semibold text-slate-200 border border-slate-700/80 transition cursor-pointer flex items-center gap-2.5"
                >
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>Configuración</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    setIsSupportOpen(true)
                  }}
                  className="w-full min-h-[44px] py-2.5 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 hover:text-white text-xs font-semibold text-slate-200 border border-slate-700/80 transition cursor-pointer flex items-center gap-2.5"
                >
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Ayuda & Soporte</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    logout()
                  }}
                  className="w-full min-h-[44px] py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-900/50 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer flex items-center gap-2.5"
                >
                  <svg className="w-4 h-4 text-rose-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Bloquear Bóveda (Logout)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Bottom Dock (Ergonomía de Pulgar - Fitts' Law) */}
      <nav
        aria-label="Navegación rápida móvil"
        className="fixed bottom-3 inset-x-3 z-40 lg:hidden max-w-md mx-auto bg-slate-950/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-1.5 shadow-2xl shadow-black/80 flex items-center justify-between mb-[env(safe-area-inset-bottom)]"
      >
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={`dock-${item.id}`}
              onClick={() => handleTabSelect(item.id)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`flex-1 min-h-[44px] flex flex-col items-center justify-center p-1 rounded-xl transition cursor-pointer ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] leading-tight truncate max-w-[48px]">{item.shortLabel}</span>
            </button>
          )
        })}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 lg:pb-8">
        <Suspense fallback={<PageLoader text="Cargando página..." />}>
          {activeTab === "matrix" && <FinancialMatrix />}
          {activeTab === "calendar" && <MonthlyInstallmentsView />}
          {activeTab === "cards" && <CreditCardsDashboard />}
          {activeTab === "income" && <IncomeListView />}
          {activeTab === "obligations" && <ObligationsList />}
          {activeTab === "settings" && <SettingsView />}
        </Suspense>
      </main>

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  )
}

export default App
