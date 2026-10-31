/**
 * SyncService coordinates debounced uploading of dirty domains to Google Drive.
 */
import type { DataDomain, SyncableDomain, SyncStatus, SyncMeta } from '@/shared/types/domain'
import type { DriveClient } from './driveClient'
import { encryptData } from '@/shared/utils/crypto'
import { CURRENT_SCHEMA_VERSION } from '@/shared/constants/version'

export interface SyncStoreStateProvider {
  getCryptoKey: () => CryptoKey | null
  getDomainData: (domain: SyncableDomain) => unknown
  setDomainData: (domain: SyncableDomain, data: unknown) => void
  onSyncStatusChange: (status: SyncStatus, error?: unknown) => void
}

export class SyncService {
  private pendingDomains = new Set<SyncableDomain>()
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private readonly debounceMs: number

  constructor(
    private readonly driveClient: DriveClient,
    private readonly stateProvider: SyncStoreStateProvider,
    debounceMs = 1500,
  ) {
    this.debounceMs = debounceMs
  }

  queueWrite(domain: SyncableDomain): void {
    if ((domain as DataDomain) === 'settings') {
      throw new Error(
        'Cannot queue "settings" domain in SyncService: settings.enc is reserved for master password sentinel',
      )
    }

    this.pendingDomains.add(domain)
    this.stateProvider.onSyncStatusChange('PENDING')

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = setTimeout(() => {
      void this.flush()
    }, this.debounceMs)
  }

  async flush(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    if (this.pendingDomains.size === 0) return

    const key = this.stateProvider.getCryptoKey()
    if (!key) {
      this.stateProvider.onSyncStatusChange('ERROR', 'No encryption key unlocked')
      return
    }

    const domainsToSync = Array.from(this.pendingDomains)
    this.stateProvider.onSyncStatusChange('SYNCING')

    try {
      for (const domain of domainsToSync) {
        if ((domain as DataDomain) === 'settings') {
          this.pendingDomains.delete(domain)
          continue
        }

        const payload = this.stateProvider.getDomainData(domain)
        if (payload === null || payload === undefined) {
          this.pendingDomains.delete(domain)
          continue
        }

        const encrypted = await encryptData(key, payload)
        await this.driveClient.writeDomain(domain, encrypted)
        this.pendingDomains.delete(domain)
      }

      // Update unencrypted meta.json
      const meta: SyncMeta = {
        version: Date.now(),
        lastSyncedAt: new Date().toISOString(),
        driveFileIds: {},
        pendingChanges: false,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      }
      await this.driveClient.writeMeta(meta)

      this.stateProvider.onSyncStatusChange('SYNCED')
    } catch (err: unknown) {
      this.stateProvider.onSyncStatusChange('ERROR', err)
    }
  }

  async forceSync(): Promise<void> {
    return this.flush()
  }

  getPendingCount(): number {
    return this.pendingDomains.size
  }

  cancel(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    this.pendingDomains.clear()
  }
}
