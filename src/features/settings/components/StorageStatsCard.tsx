import React from "react"
import type { DriveStorageMetrics } from "@/shared/types/settings"

interface StorageStatsCardProps {
  metrics: DriveStorageMetrics | null
  isLoading: boolean
  onRefresh: () => void
}

export const StorageStatsCard: React.FC<StorageStatsCardProps> = ({
  metrics,
  isLoading,
  onRefresh,
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    if (bytes < 1024) return `${bytes} Bytes`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const formatDate = (isoString?: string) => {
    if (!isoString) return "N/A"
    try {
      return new Date(isoString).toLocaleString()
    } catch {
      return isoString
    }
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>📊</span> Estado del Almacenamiento en Google Drive
          </h4>
          <p className="text-xs text-slate-400">
            Archivos cifrados almacenados de forma privada en tu <span className="font-mono text-emerald-300">appDataFolder</span>.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="self-start sm:self-auto min-h-[38px] px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-medium text-slate-200 border border-slate-700 transition flex items-center gap-2 cursor-pointer"
        >
          <span className={isLoading ? "animate-spin" : ""}>🔄</span>
          {isLoading ? "Consultando..." : "Actualizar Métricas"}
        </button>
      </div>

      {/* Summary Highlight */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] text-slate-400 block mb-1">Tamaño Total Ocupado</span>
          <span className="text-base font-bold text-emerald-400">
            {metrics ? formatBytes(metrics.totalSizeBytes) : "Calculando..."}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] text-slate-400 block mb-1">Total de Archivos</span>
          <span className="text-base font-bold text-slate-200">
            {metrics ? `${metrics.files.length} archivos` : "—"}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] text-slate-400 block mb-1">Versión del Schema</span>
          <span className="text-base font-bold text-teal-300">
            {metrics?.schemaVersion || "v1.1.0"}
          </span>
        </div>
      </div>

      {/* File Breakdown Table */}
      <div className="rounded-xl border border-slate-800/80 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3 font-semibold">Archivo</th>
              <th className="py-2.5 px-3 font-semibold">Tipo</th>
              <th className="py-2.5 px-3 font-semibold text-right">Tamaño</th>
              <th className="py-2.5 px-3 font-semibold text-right">Última Modificación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {metrics && metrics.files.length > 0 ? (
              metrics.files.map((file) => (
                <tr key={file.id} className="hover:bg-slate-800/20 transition">
                  <td className="py-2.5 px-3 font-mono font-medium text-emerald-300">
                    {file.name}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {file.name.endsWith(".enc") ? "Bóveda Cifrada (AES)" : "Metadatos (JSON)"}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {formatBytes(file.sizeBytes)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {formatDate(file.modifiedTime)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-500">
                  {isLoading
                    ? "Consultando archivos en Google Drive..."
                    : "No se encontraron archivos en Google Drive aún (o no se ha sincronizado)."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
