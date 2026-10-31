import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSyncStore } from './syncSlice'
import { DriveStorageQuotaError } from '@/shared/services/driveErrors'
import { useAuthStore } from '@/store/authSlice'
import { useSettingsStore } from '@/features/settings/store/settingsSlice'

describe('syncSlice', () => {
  beforeEach(() => {
    useSyncStore.getState().resetSync()
    useSettingsStore.getState().resetPreferences()
    useAuthStore.setState({
      accessToken: 'mock-token',
      cryptoKey: {} as CryptoKey,
    })
  })

  describe('quota error handling', () => {
    it('has isQuotaExceeded default to false', () => {
      expect(useSyncStore.getState().isQuotaExceeded).toBe(false)
    })

    it('sets isQuotaExceeded to true when setStatus receives DriveStorageQuotaError instance', () => {
      useSyncStore.getState().setStatus('ERROR', new DriveStorageQuotaError())

      const state = useSyncStore.getState()
      expect(state.status).toBe('ERROR')
      expect(state.isQuotaExceeded).toBe(true)
      expect(state.errorMessage).toContain('storage quota has been exceeded')
    })

    it('sets isQuotaExceeded to true when setStatus receives quota error string', () => {
      useSyncStore
        .getState()
        .setStatus('ERROR', "The user's Drive storage quota has been exceeded.")

      const state = useSyncStore.getState()
      expect(state.status).toBe('ERROR')
      expect(state.isQuotaExceeded).toBe(true)
    })

    it('does not set isQuotaExceeded to true when generic error is passed', () => {
      useSyncStore.getState().setStatus('ERROR', new Error('Connection refused'))

      const state = useSyncStore.getState()
      expect(state.status).toBe('ERROR')
      expect(state.isQuotaExceeded).toBe(false)
      expect(state.errorMessage).toBe('Connection refused')
    })

    it('dismissQuotaModal sets isQuotaExceeded to false', () => {
      useSyncStore.getState().setStatus('ERROR', new DriveStorageQuotaError())
      expect(useSyncStore.getState().isQuotaExceeded).toBe(true)

      useSyncStore.getState().dismissQuotaModal()
      expect(useSyncStore.getState().isQuotaExceeded).toBe(false)
    })

    it('setQuotaExceeded explicitly controls isQuotaExceeded', () => {
      useSyncStore.getState().setQuotaExceeded(true)
      expect(useSyncStore.getState().isQuotaExceeded).toBe(true)

      useSyncStore.getState().setQuotaExceeded(false)
      expect(useSyncStore.getState().isQuotaExceeded).toBe(false)
    })

    it('clears isQuotaExceeded when status becomes SYNCED', () => {
      useSyncStore.getState().setQuotaExceeded(true)
      expect(useSyncStore.getState().isQuotaExceeded).toBe(true)

      useSyncStore.getState().setStatus('SYNCED')
      expect(useSyncStore.getState().isQuotaExceeded).toBe(false)
    })
  })

  describe('vault security and domain protection (settings.enc vs preferences.enc)', () => {
    it("strictly refuses to queue 'settings' domain to avoid corrupting master password sentinel", () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Force invocation with 'settings'
      // @ts-expect-error settings is excluded from SyncableDomain
      useSyncStore.getState().queueSyncDomain('settings')

      expect(useSyncStore.getState().pendingMutations).toBe(0)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Refusing to queue "settings" domain'),
      )
      consoleSpy.mockRestore()
    })

    it("queues 'preferences' domain successfully into separate preferences.enc stream", () => {
      useSyncStore.getState().queueSyncDomain('preferences')
      expect(useSyncStore.getState().pendingMutations).toBe(1)
    })
  })
})
