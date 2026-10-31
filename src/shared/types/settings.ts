export type CurrencyCode = 'CLP' | 'USD' | 'EUR' | 'UF'
export type DateFormatPattern = 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY'
export type AppTheme = 'dark' | 'light' | 'system'

/**
 * User preferences stored in preferences.enc (never in settings.enc, which is
 * reserved for the master password sentinel).
 * Note: The financial engine is CLP-only (integer pesos without decimals/cents).
 */
export interface UserPreferences {
  currency: CurrencyCode
  dateFormat: DateFormatPattern
  theme: AppTheme
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
