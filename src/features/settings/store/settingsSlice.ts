import { create } from "zustand"
import type { UserPreferences } from "@/shared/types/settings"

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  currency: "CLP",
  dateFormat: "DD/MM/YYYY",
  theme: "dark",
  showCents: false,
  updatedAt: new Date().toISOString(),
}

export interface SettingsState {
  preferences: UserPreferences
  isLoaded: boolean

  // Actions
  setPreferences: (preferences: UserPreferences) => void
  updatePreferences: (updates: Partial<UserPreferences>) => void
  resetPreferences: () => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  preferences: DEFAULT_USER_PREFERENCES,
  isLoaded: false,

  setPreferences: (preferences) => {
    set({
      preferences,
      isLoaded: true,
    })
  },

  updatePreferences: (updates) => {
    set((state) => ({
      preferences: {
        ...state.preferences,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    }))
  },

  resetPreferences: () => {
    set({
      preferences: {
        ...DEFAULT_USER_PREFERENCES,
        updatedAt: new Date().toISOString(),
      },
      isLoaded: false,
    })
  },
}))
