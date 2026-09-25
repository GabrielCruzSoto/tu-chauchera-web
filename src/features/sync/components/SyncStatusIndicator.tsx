import React, { useEffect } from "react"
import { useSyncStore } from "../store/syncSlice"

export const SyncStatusIndicator: React.FC = () => {
  const { status, errorMessage, pendingMutations, lastSyncedAt, setOnlineStatus, forceResync } =
    useSyncStore()

  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true)
    const handleOffline = () => setOnlineStatus(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [setOnlineStatus])

  return (
    <div className="flex items-center gap-2 text-xs">
      {status === "SYNCED" && (
        <div
          title={lastSyncedAt ? `Última sincronización con Google Drive: ${new Date(lastSyncedAt).toLocaleString()}` : "Sincronizado con Google Drive"}
          className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 select-none cursor-default"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="flex flex-col text-left leading-none">
            <span className="font-semibold text-[11px] hidden sm:inline">Drive Sincronizado</span>
            {lastSyncedAt && (
              <span className="text-[9px] text-emerald-400/80 font-mono mt-0.5 hidden sm:inline">
                {new Date(lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
      )}

      {status === "SYNCING" && (
        <div className="flex items-center gap-1.5 text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="font-medium">Subiendo datos...</span>
        </div>
      )}

      {status === "PENDING" && (
        <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="font-medium">
            {pendingMutations} cambio(s) pendiente(s)
          </span>
          <button
            onClick={() => void forceResync()}
            className="min-h-[44px] sm:min-h-0 text-amber-300 hover:text-white underline cursor-pointer text-xs sm:text-[10px] flex items-center px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            Subir ahora
          </button>
        </div>
      )}

      {status === "ERROR" && (
        <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          <span className="font-medium" title={errorMessage ?? "Error de sincronización"}>
            Error al sincronizar
          </span>
          <button
            onClick={() => void forceResync()}
            className="min-h-[44px] sm:min-h-0 text-rose-300 hover:text-white underline cursor-pointer text-xs sm:text-[10px] flex items-center px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            Reintentar
          </button>
        </div>
      )}

      {status === "OFFLINE" && (
        <div className="flex items-center gap-1.5 text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          <span className="font-medium">Sin conexión</span>
        </div>
      )}
    </div>
  )
}
