export type CurrencyCode = "CLP" | "USD" | "EUR" | "UF"
export type DateFormatPattern = "DD/MM/YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY"
export type AppTheme = "dark" | "light" | "system"

export interface UserPreferences {
  currency: CurrencyCode
  dateFormat: DateFormatPattern
  theme: AppTheme
  showCents: boolean
  updatedAt: string // ISO-8601
}

export interface DriveStorageFileInfo {
  id: string
  name: string
  sizeBytes: number
  modifiedTime: string
}

export interface DriveStorageMetrics {
  totalSizeBytes: number
  files: DriveStorageFileInfo[]
  lastCheckedAt: string
  schemaVersion: string
}
