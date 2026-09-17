import { describe, it, expect, beforeEach } from "vitest"
import { useSettingsStore } from "./settingsSlice"

describe("settingsSlice", () => {
  beforeEach(() => {
    useSettingsStore.getState().resetPreferences()
  })

  it("initializes with default preferences", () => {
    const state = useSettingsStore.getState()
    expect(state.preferences.currency).toBe("CLP")
    expect(state.preferences.dateFormat).toBe("DD/MM/YYYY")
    expect(state.preferences.theme).toBe("dark")
    expect(state.preferences.showCents).toBe(false)
    expect(state.isLoaded).toBe(false)
  })

  it("updates preferences correctly", () => {
    useSettingsStore.getState().updatePreferences({
      currency: "USD",
      theme: "light",
      showCents: true,
    })

    const state = useSettingsStore.getState()
    expect(state.preferences.currency).toBe("USD")
    expect(state.preferences.theme).toBe("light")
    expect(state.preferences.showCents).toBe(true)
    expect(state.preferences.dateFormat).toBe("DD/MM/YYYY") // unmodified
  })

  it("sets entire preferences object and marks as loaded", () => {
    useSettingsStore.getState().setPreferences({
      currency: "EUR",
      dateFormat: "YYYY-MM-DD",
      theme: "system",
      showCents: true,
      updatedAt: "2026-09-01T10:00:00.000Z",
    })

    const state = useSettingsStore.getState()
    expect(state.preferences.currency).toBe("EUR")
    expect(state.preferences.dateFormat).toBe("YYYY-MM-DD")
    expect(state.preferences.theme).toBe("system")
    expect(state.isLoaded).toBe(true)
  })

  it("resets preferences to default", () => {
    useSettingsStore.getState().updatePreferences({ currency: "UF" })
    useSettingsStore.getState().resetPreferences()

    const state = useSettingsStore.getState()
    expect(state.preferences.currency).toBe("CLP")
    expect(state.isLoaded).toBe(false)
  })
})
