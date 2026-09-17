import React, { useState, useEffect, useCallback } from "react"
import { useAuthStore } from "@/store/authSlice"
import { useObligationsStore } from "@/features/obligations/store/obligationsSlice"
import { useIncomeStore } from "@/features/income/store/incomeSlice"
import { useCreditCardStore } from "@/features/credit-cards/store/creditCardSlice"
import { useSettingsStore } from "../store/settingsSlice"
import { DriveClient } from "@/shared/services/driveClient"
import { StorageStatsCard } from "./StorageStatsCard"
import { WipeConfirmModal } from "./WipeConfirmModal"
import { buildBackupPayload, triggerBackupDownload } from "@/shared/services/backupService"
import { resetAllAppData } from "@/store/appReset"
import type { DriveStorageMetrics } from "@/shared/types/settings"

export const DataStorageTab: React.FC = () => {
  const { accessToken } = useAuthStore()
  const { obligations, categories, installments } = useObligationsStore()
  const { incomes } = useIncomeStore()
  const { accounts, purchases } = useCreditCardStore()
  const { preferences } = useSettingsStore()

  const [metrics, setMetrics] = useState<DriveStorageMetrics | null>(null)
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false)
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false)
  const [isWiping, setIsWiping] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const driveClient = React.useMemo(() => {
    return new DriveClient(() => accessToken)
  }, [accessToken])

  const fetchStorageMetrics = useCallback(async () => {
    if (!accessToken) return
    setIsLoadingMetrics(true)
    try {
      const stats = await driveClient.getStorageStats()
      const meta = await driveClient.readMeta()

      setMetrics({
        totalSizeBytes: stats.totalBytes,
        files: stats.files,
        lastCheckedAt: new Date().toISOString(),
        schemaVersion: meta?.schemaVersion ?? "v1.1.0",
      })
    } catch (err) {
      console.error("Failed to load storage metrics:", err)
      // Fallback empty metrics if remote query fails
      setMetrics({
        totalSizeBytes: 0,
        files: [],
        lastCheckedAt: new Date().toISOString(),
        schemaVersion: "v1.1.0",
      })
    } finally {
      setIsLoadingMetrics(false)
    }
  }, [accessToken, driveClient])

  useEffect(() => {
    void fetchStorageMetrics()
  }, [fetchStorageMetrics])

  const handleExportBackup = () => {
    try {
      const backupPayload = buildBackupPayload(
        {
          obligations,
          categories,
          installments,
          incomes,
          creditCards: { accounts, purchases },
          preferences,
        },
        metrics?.schemaVersion ?? "v1.1.0"
      )

      triggerBackupDownload(backupPayload)
      setToastMessage("Respaldo JSON generado y descargado correctamente.")
      setTimeout(() => setToastMessage(null), 4000)
    } catch (err) {
      console.error("Export backup failed:", err)
      setToastMessage("Error al generar el archivo de respaldo.")
    }
  }

  const handleConfirmWipe = async () => {
    setIsWiping(true)
    try {
      await driveClient.wipeAllAppData()
      resetAllAppData()
      setIsWipeModalOpen(false)
    } catch (err) {
      console.error("Wipe failed:", err)
      resetAllAppData()
      setIsWipeModalOpen(false)
      throw err
    } finally {
      setIsWiping(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>💾</span> Almacenamiento & Gestión de Datos
        </h3>
        <p className="text-xs text-slate-400">
          Administra la sincronización de archivos cifrados en Google Drive, copias de seguridad y reseteo de bóveda.
        </p>
      </div>

      {toastMessage && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex justify-between items-center"
        >
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 ml-2 min-h-[32px] px-2 flex items-center"
          >
            ✕
          </button>
        </div>
      )}

      {/* Storage Breakdown Card */}
      <StorageStatsCard
        metrics={metrics}
        isLoading={isLoadingMetrics}
        onRefresh={fetchStorageMetrics}
      />

      {/* Backup & Export Section */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>📥</span> Copia de Seguridad Descifrada (JSON)
            </h4>
            <p className="text-xs text-slate-400">
              Descarga un archivo JSON completo e independiente con todas tus categorías, obligaciones, ingresos y pagos actuales.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportBackup}
            className="self-start sm:self-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs sm:text-sm font-semibold text-white cursor-pointer shadow transition flex items-center gap-2"
          >
            <span>⬇️</span> Exportar Respaldo JSON
          </button>
        </div>

        <div className="text-xs text-slate-400 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
          💡 <span className="text-slate-300 font-medium">Nota de Privacidad:</span> El archivo JSON exportado contendrá tus datos en texto claro en tu dispositivo local. Guárdalo en un lugar seguro.
        </div>
      </div>

      {/* Danger Zone: Safe Wipe */}
      <div className="p-5 sm:p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-rose-300 flex items-center gap-2">
              <span>🚨</span> Zona de Peligro: Reseteo de Bóveda
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Elimina todos los archivos cifrados almacenados en tu Google Drive y reinicia la aplicación desde cero. Requiere confirmación explícita mediante frase de seguridad.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsWipeModalOpen(true)}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs sm:text-sm font-semibold cursor-pointer transition shadow"
          >
            Borrar Bóveda y Resetear
          </button>
        </div>
      </div>

      {/* Wipe Confirmation Modal */}
      <WipeConfirmModal
        isOpen={isWipeModalOpen}
        isLoading={isWiping}
        onClose={() => setIsWipeModalOpen(false)}
        onConfirm={handleConfirmWipe}
      />
    </div>
  )
}
