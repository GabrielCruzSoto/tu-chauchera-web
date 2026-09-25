import React, { useState, useRef, useEffect, useId } from "react"
import { useAuthStore } from "@/store/authSlice"

export interface UserMenuDropdownProps {
  onOpenSettings?: () => void
  onOpenSupport?: () => void
  className?: string
}

export const UserMenuDropdown: React.FC<UserMenuDropdownProps> = ({
  onOpenSettings,
  onOpenSupport,
  className = "",
}) => {
  const { user, isUnlocked, logout } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

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

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen((prev) => !prev)
  }

  const handleSelectSettings = () => {
    setIsOpen(false)
    if (onOpenSettings) {
      onOpenSettings()
    }
  }

  const handleSelectSupport = () => {
    setIsOpen(false)
    if (onOpenSupport) {
      onOpenSupport()
    }
  }

  const handleLogout = () => {
    setIsOpen(false)
    logout()
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      {/* Trigger Button: User Avatar + Name/Email + Chevron */}
      <button
        ref={buttonRef}
        type="button"
        id={`${menuId}-button`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={isOpen ? `${menuId}-menu` : undefined}
        aria-label={`Menú de usuario: ${user?.name || user?.email || "Mi cuenta"}`}
        onClick={handleToggle}
        className={`h-10 px-2.5 sm:px-3 rounded-xl flex items-center gap-2.5 border transition-all duration-200 cursor-pointer select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 shrink-0 ${
          isOpen
            ? "bg-slate-800 border-slate-700 shadow-md ring-1 ring-emerald-500/30"
            : "bg-slate-900/90 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700/90 shadow-sm"
        }`}
      >
        {/* User Avatar with subtle emerald status ring */}
        {user?.picture ? (
          <img
            src={user.picture}
            alt=""
            aria-hidden="true"
            className="w-7 h-7 rounded-lg object-cover ring-1 ring-emerald-500/40 shrink-0"
          />
        ) : (
          <div
            aria-hidden="true"
            className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/30 ring-1 ring-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-xs shrink-0"
          >
            {getInitials(user?.name, user?.email)}
          </div>
        )}

        {/* User Info (Hidden on very compact viewports, expanded on desktop) */}
        <div className="hidden sm:flex flex-col text-left max-w-[140px] md:max-w-[170px] xl:max-w-[220px]">
          <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate leading-tight">
            {user?.name || "Usuario"}
          </span>
          {user?.email && (
            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 font-mono truncate leading-tight mt-0.5">
              {user.email}
            </span>
          )}
        </div>

        {/* Chevron Icon with fluid rotation & distinct affordance */}
        <div className="w-5 h-5 rounded-md flex items-center justify-center bg-slate-800/60 group-hover:bg-slate-700/60 transition-colors shrink-0">
          <svg
            className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-emerald-400" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div
          id={`${menuId}-menu`}
          role="menu"
          aria-labelledby={`${menuId}-button`}
          tabIndex={-1}
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl shadow-black/70 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 focus:outline-none"
        >
          {/* Header Section: Full identity & Vault security badge */}
          <div className="px-4 py-2.5 border-b border-slate-800/80">
            <p className="text-xs font-bold text-white truncate">
              {user?.name || "Usuario de Tu Chauchera"}
            </p>
            <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
              {user?.email || "Sin correo"}
            </p>
            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isUnlocked ? "Bóveda Cifrada Activa" : "Bóveda Bloqueada"}
              </span>
              <span className="text-slate-400 font-mono">AES-256</span>
            </div>
          </div>

          {/* Menu Action Items */}
          <div className="p-1.5 space-y-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleSelectSettings}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/90 flex items-center gap-3 transition-colors cursor-pointer group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
            >
              <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div className="flex flex-col flex-1">
                <span>Configuración</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Categorías, preferencias y bóveda
                </span>
              </div>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handleSelectSupport}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/90 flex items-center gap-3 transition-colors cursor-pointer group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
            >
              <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="flex flex-col flex-1">
                <span>Ayuda & Soporte</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Canales de contacto y asistencia
                </span>
              </div>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 flex items-center gap-3 transition-colors cursor-pointer group text-left border border-transparent hover:border-rose-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/70"
            >
              <div className="p-1.5 rounded-lg bg-slate-800/80 group-hover:bg-rose-900/40 text-slate-400 group-hover:text-rose-400 transition-colors shrink-0">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="flex flex-col flex-1">
                <span>Cerrar Sesión / Bloquear</span>
                <span className="text-[10px] text-rose-400/80 font-normal">
                  Cifra la sesión en memoria local
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
