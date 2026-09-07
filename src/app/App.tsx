import React, { useState, useEffect, Suspense, lazy } from "react"
import { LoginPage } from "@/features/auth/components/LoginPage"
import { useAuthStore } from "@/store/authSlice"
import { useSyncStore } from "@/features/sync/store/syncSlice"
import { SyncStatusIndicator } from "@/features/sync/components/SyncStatusIndicator"
import { PageLoader } from "@/shared/components/ui/PageLoader"

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

export const App: React.FC = () => {
  const { isAuthenticated, isUnlocked, logout, user } = useAuthStore()
  const { hydrateFromDrive } = useSyncStore()
  const [activeTab, setActiveTab] = useState<"matrix" | "calendar" | "obligations" | "cards" | "income" | "settings">("matrix")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

  if (!isAuthenticated || !isUnlocked) {
    return <LoginPage />
  }

  const navItems = [
    { id: "matrix", label: "📊 Matriz Consolidada" },
    { id: "calendar", label: "📅 Flujos & Cuotas" },
    { id: "income", label: "💵 Ingresos" },
    { id: "obligations", label: "💳 Obligaciones (Core)" },
    { id: "cards", label: "💳 Tarjetas" },
    { id: "settings", label: "⚙️ Configuración" },
  ] as const

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

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Hamburger Button for Mobile / Tablet (<1024px) */}
            <button
              type="button"
              aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden min-h-[44px] min-w-[44px] p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center justify-center border border-slate-700/60 transition cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Tu Chauchera Logo"
                className="w-8 h-8 object-contain rounded-lg drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]"
              />
              <span className="text-xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                Tu Chauchera
              </span>
            </div>

            {/* Desktop Navigation Tabs (≥1024px) */}
            <nav className="hidden lg:flex items-center gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabSelect(item.id)}
                  className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === item.id
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <SyncStatusIndicator />
            <span className="text-xs text-slate-400 hidden lg:inline">{user?.email}</span>
            <button
              onClick={logout}
              className="min-h-[40px] px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition cursor-pointer"
            >
              Bloquear Bóveda
            </button>
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
                  className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-white flex items-center justify-center rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <nav className="flex flex-col gap-2" data-testid="mobile-nav-links">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabSelect(item.id)}
                    className={`min-h-[44px] w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center ${
                      activeTab === item.id
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              {user?.email && (
                <div className="text-xs text-slate-400 truncate px-1">
                  Usuario: <span className="text-slate-200 font-medium">{user.email}</span>
                </div>
              )}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  logout()
                }}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition cursor-pointer text-center"
              >
                Bloquear Bóveda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Suspense fallback={<PageLoader text="Cargando página..." />}>
          {activeTab === "matrix" && <FinancialMatrix />}
          {activeTab === "calendar" && <MonthlyInstallmentsView />}
          {activeTab === "cards" && <CreditCardsDashboard />}
          {activeTab === "income" && <IncomeListView />}
          {activeTab === "obligations" && <ObligationsList />}
          {activeTab === "settings" && <SettingsView />}
        </Suspense>
      </main>
    </div>
  )
}

export default App
