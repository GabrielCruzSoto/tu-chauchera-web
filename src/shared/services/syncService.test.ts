import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SyncService, type SyncStoreStateProvider } from './syncService'
import { DriveClient } from './driveClient'
import { deriveKeyFromPassword } from '@/shared/utils/crypto'
import { CURRENT_SCHEMA_VERSION } from '@/shared/constants/version'

describe('SyncService', () => {
  let driveClient: DriveClient
  let stateProvider: SyncStoreStateProvider
  let syncService: SyncService
  let cryptoKey: CryptoKey

  beforeEach(async () => {
    cryptoKey = await deriveKeyFromPassword('testMasterPassword')
    driveClient = new DriveClient(() => 'mock-token')

    // Mock DriveClient methods
    driveClient.writeDomain = vi.fn().mockResolvedValue('file-id-123')
    driveClient.writeMeta = vi.fn().mockResolvedValue('meta-id-123')

    stateProvider = {
      getCryptoKey: () => cryptoKey,
      getDomainData: vi.fn().mockReturnValue({ test: 'data' }),
      setDomainData: vi.fn(),
      onSyncStatusChange: vi.fn(),
    }

    syncService = new SyncService(driveClient, stateProvider, 50) // 50ms for tests
  })

  it('queues write and marks status as PENDING', () => {
    syncService.queueWrite('obligations')
    expect(syncService.getPendingCount()).toBe(1)
    expect(stateProvider.onSyncStatusChange).toHaveBeenCalledWith('PENDING')
  })

  it('flushes queued writes and notifies SYNCED with CURRENT_SCHEMA_VERSION in meta.json', async () => {
    syncService.queueWrite('obligations')
    syncService.queueWrite('incomes')

    await syncService.flush()

    expect(driveClient.writeDomain).toHaveBeenCalledTimes(2)
    expect(driveClient.writeMeta).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaVersion: CURRENT_SCHEMA_VERSION,
      }),
    )
    expect(stateProvider.onSyncStatusChange).toHaveBeenCalledWith('SYNCED')
    expect(syncService.getPendingCount()).toBe(0)
  })

  it('sets status to ERROR when encryption key is missing', async () => {
    stateProvider.getCryptoKey = () => null
    syncService.queueWrite('obligations')

    await syncService.flush()
    expect(stateProvider.onSyncStatusChange).toHaveBeenCalledWith(
      'ERROR',
      'No encryption key unlocked',
    )
  })

  describe('vault security - sentinel protection', () => {
    it("throws when attempting to queue 'settings' write", () => {
      expect(() => {
        // @ts-expect-error settings is excluded from SyncableDomain
        syncService.queueWrite('settings')
      }).toThrow(/Cannot queue "settings" domain in SyncService/)
    })

    it('never writes null or undefined payloads to drive', async () => {
      stateProvider.getDomainData = vi.fn().mockReturnValue(null)
      syncService.queueWrite('preferences')

      await syncService.flush()
      expect(driveClient.writeDomain).not.toHaveBeenCalled()
    })
  })
})
