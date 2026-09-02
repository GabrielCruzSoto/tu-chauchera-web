import React from "react"

export interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  color?: "emerald" | "slate" | "white"
  className?: string
  label?: string
}

const sizeClasses = {
  xs: "w-3.5 h-3.5 border-2",
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-[3px]",
  lg: "w-12 h-12 border-4",
  xl: "w-16 h-16 border-4",
}

const colorClasses = {
  emerald: "border-emerald-500/20 border-t-emerald-400 text-emerald-400",
  slate: "border-slate-700 border-t-slate-300 text-slate-300",
  white: "border-white/20 border-t-white text-white",
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  color = "emerald",
  className = "",
  label = "Cargando...",
}) => {
  return (
    <div
      role="status"
      {...(label ? { "aria-label": label } : {})}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
      />
      {label && <span className="sr-only">{label}</span>}
    </div>
  )
}

export default Spinner
