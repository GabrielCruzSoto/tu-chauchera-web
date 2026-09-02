import React from "react"
import { Spinner } from "./Spinner"

export interface PageLoaderProps {
  text?: string
  fullScreen?: boolean
  className?: string
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  text = "Cargando página...",
  fullScreen = false,
  className = "",
}) => {
  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md"
    : "w-full min-h-[350px] flex flex-col items-center justify-center py-12"

  return (
    <div
      data-testid="page-loader"
      className={`${containerClasses} ${className}`}
      aria-live="polite"
    >
      <div className="relative flex flex-col items-center gap-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
        {/* Glow effect behind the spinner */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-lg pointer-events-none" />

        <div className="relative flex items-center justify-center">
          <Spinner size="lg" color="emerald" label={text ? "" : "Cargando..."} />
          <span className="absolute text-xl">💰</span>
        </div>

        {text && (
          <p className="relative text-sm font-medium text-slate-300 tracking-wide animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

export default PageLoader
