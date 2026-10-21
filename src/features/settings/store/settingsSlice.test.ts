import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSettingsStore } from './settingsSlice'
import { useSyncStore } from '@/features/sync/store/syncSlice'

describe('settingsSlice', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetPreferences()
  })

  it('initializes with default preferences (CLP-only, no showCents)', () => {
    const state = useSettingsStore.getState()
    expect(state.preferences.currency).toBe('CLP')
    expect(state.preferences.dateFormat).toBe('DD/MM/YYYY')
    expect(state.preferences.theme).toBe('dark')
    expect(state.isLoaded).toBe(false)
  })

  it("updates preferences correctly, sets isLoaded to true and triggers queueSyncDomain('preferences')", () => {
    const queueSpy = vi.spyOn(useSyncStore.getState(), 'queueSyncDomain')

    useSettingsStore.getState().updatePreferences({
      dateFormat: 'YYYY-MM-DD',
      theme: 'light',
    })

    const state = useSettingsStore.getState()
    expect(state.preferences.currency).toBe('CLP')
    expect(state.preferences.dateFormat).toBe('YYYY-MM-DD')
    expect(state.preferences.theme).toBe('light')
    expect(state.isLoaded).toBe(true)
    expect(queueSpy).toHaveBeenCalledWith('preferences')
  })

  it('sets entire preferences object and marks as loaded', () => {
    useSettingsStore.getState().setPreferences({
      currency: 'CLP',
      dateFormat: 'YYYY-MM-DD',
      theme: 'system',
      updatedAt: '2026-09-01T10:00:00.000Z',
    })

    const state = useSettingsStore.getState()
    expect(state.preferences.currency).toBe('CLP')
    expect(state.preferences.dateFormat).toBe('YYYY-MM-DD')
    expect(state.preferences.theme).toBe('system')
    expect(state.isLoaded).toBe(true)
  })

  it('resets preferences to default and resets isLoaded', () => {
    useSettingsStore.getState().updatePreferences({ theme: 'light' })
    useSettingsStore.getState().resetPreferences()

    const state = useSettingsStore.getState()
    expect(state.preferences.currency).toBe('CLP')
    expect(state.preferences.theme).toBe('dark')
    expect(state.isLoaded).toBe(false)
  })
})
