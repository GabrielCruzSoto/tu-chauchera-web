import type { Category, Income, Obligation, Installment, UUID, CreditCardsStore } from "@/shared/types/domain"
import type { UserPreferences } from "@/shared/types/settings"

export interface AppBackupData {
  obligations: Record<UUID, Obligation>
  installments?: Record<UUID, Installment>
  categories: Record<UUID, Category>
  incomes: Record<UUID, Income>
  creditCards?: CreditCardsStore
  preferences?: UserPreferences
}

export interface AppBackupPayload {
  exportDate: string
  schemaVersion: string
  appVersion: string
  data: AppBackupData
}

/**
 * Serializes and triggers browser download of the full backup JSON file.
 */
export function triggerBackupDownload(payload: AppBackupPayload, filename?: string): void {
  const dateStr = new Date().toISOString().split("T")[0]
  const targetFilename = filename ?? `tu-chauchera-backup-${dateStr}.json`

  const jsonString = JSON.stringify(payload, null, 2)
  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = targetFilename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Builds the structured backup payload.
 */
export function buildBackupPayload(
  data: AppBackupData,
  schemaVersion = "v1.1.0",
  appVersion = "1.0.0"
): AppBackupPayload {
  return {
    exportDate: new Date().toISOString(),
    schemaVersion,
    appVersion,
    data,
  }
}
