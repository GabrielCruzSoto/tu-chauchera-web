import React, { Component, type ErrorInfo, type ReactNode } from "react"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[Tu Chauchera ErrorBoundary] Uncaught error:", error, errorInfo)
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  private handleClearStorageAndReload = (): void => {
    try {
      sessionStorage.clear()
      localStorage.clear()
    } finally {
      window.location.href = "/"
    }
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Algo salió mal</h1>
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            Se ha producido un error inesperado al procesar la interfaz. Tu información local y cifrada permanece protegida.
          </p>

          {this.state.error?.message && (
            <div className="w-full max-w-lg mb-6 p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-left text-xs font-mono text-rose-300 overflow-x-auto">
              {this.state.error.message}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-sm transition cursor-pointer"
            >
              Recargar aplicación
            </button>
            <button
              onClick={this.handleClearStorageAndReload}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-medium text-sm transition cursor-pointer"
            >
              Reiniciar sesión
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
