/**
 * Auth Zustand Slice for two-phase authentication:
 * 1. Google OAuth 2.0 (Identity & Drive token)
 * 2. Master Password unlock (Local WebCrypto key derivation)
 */
import { create } from "zustand"
import type { GoogleUser } from "@/features/auth/services/googleOAuth"
import {
  deriveKeyFromPassword,
  createPasswordSentinel,
  verifyPasswordSentinel,
  base64ToBuffer,
  bufferToBase64,
  encryptData,
  decryptData,
} from "@/shared/utils/crypto"
import { DriveClient } from "@/shared/services/driveClient"
import type { SettingsStore } from "@/shared/types/domain"

export interface AuthState {
  user: GoogleUser | null
  accessToken: string | null
  cryptoKey: CryptoKey | null
  isAuthenticated: boolean
  isUnlocked: boolean
  isFirstUse: boolean | null // null until we check Drive settings.enc
  authError: string | null
  isCheckingDrive: boolean

  // Actions
  setOAuthSession: (user: GoogleUser, accessToken: string) => void
  checkDriveStatus: () => Promise<void>
  setupMasterPassword: (password: string) => Promise<void>
  unlockWithMasterPassword: (password: string) => Promise<boolean>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  cryptoKey: null,
  isAuthenticated: false,
  isUnlocked: false,
  isFirstUse: null,
  authError: null,
  isCheckingDrive: false,

  setOAuthSession: (user, accessToken) => {
    set({
      user,
      accessToken,
      isAuthenticated: true,
      authError: null,
    })
    void get().checkDriveStatus()
  },

  checkDriveStatus: async () => {
    const { accessToken } = get()
    if (!accessToken) return

    set({ isCheckingDrive: true, authError: null })
    try {
      const driveClient = new DriveClient(() => accessToken)
      const settingsBuffer = await driveClient.readDomain("settings")

      if (!settingsBuffer) {
        set({ isFirstUse: true, isCheckingDrive: false })
      } else {
        set({ isFirstUse: false, isCheckingDrive: false })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error checking Drive storage"
      set({ authError: msg, isCheckingDrive: false })
    }
  },

  setupMasterPassword: async (password: string) => {
    const { accessToken } = get()
    if (!accessToken) throw new Error("OAuth session required")

    set({ authError: null })
    try {
      const key = await deriveKeyFromPassword(password)
      const sentinelBuffer = await createPasswordSentinel(key)
      const sentinelBase64 = bufferToBase64(sentinelBuffer)

      const settingsData: SettingsStore = {
        passwordSentinel: sentinelBase64,
        schemaVersion: "1.0.0",
        createdAt: new Date().toISOString(),
      }

      // Encrypt settingsData with the derived key
      const encryptedSettings = await encryptData(key, settingsData)

      const driveClient = new DriveClient(() => accessToken)
      await driveClient.writeDomain("settings", encryptedSettings)

      set({
        cryptoKey: key,
        isUnlocked: true,
        isFirstUse: false,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to set up master password"
      set({ authError: msg })
      throw err
    }
  },

  unlockWithMasterPassword: async (password: string) => {
    const { accessToken } = get()
    if (!accessToken) throw new Error("OAuth session required")

    set({ authError: null })
    try {
      const key = await deriveKeyFromPassword(password)
      const driveClient = new DriveClient(() => accessToken)
      const encryptedSettings = await driveClient.readDomain("settings")

      if (!encryptedSettings) {
        throw new Error("No settings found on Drive. Please setup password first.")
      }

      // Try decrypting settings
      const settings = await decryptData<SettingsStore>(key, encryptedSettings)
      const sentinelBuffer = base64ToBuffer(settings.passwordSentinel)
      const isValid = await verifyPasswordSentinel(key, sentinelBuffer)

      if (!isValid) {
        set({ authError: "Contraseña maestra incorrecta" })
        return false
      }

      set({
        cryptoKey: key,
        isUnlocked: true,
      })
      return true
    } catch {
      set({ authError: "Contraseña maestra incorrecta o datos corruptos" })
      return false
    }
  },

  logout: () => {
    set({
      user: null,
      accessToken: null,
      cryptoKey: null,
      isAuthenticated: false,
      isUnlocked: false,
      isFirstUse: null,
      authError: null,
    })
  },
}))
