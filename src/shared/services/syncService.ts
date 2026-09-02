/**
 * SyncService coordinates debounced uploading of dirty domains to Google Drive.
 */
import type { DataDomain, SyncStatus, SyncMeta } from "@/shared/types/domain"
import type { DriveClient } from "./driveClient"
import { encryptData } from "@/shared/utils/crypto"

export interface SyncStoreStateProvider {
  getCryptoKey: () => CryptoKey | null
  getDomainData: (domain: DataDomain) => unknown
  setDomainData: (domain: DataDomain, data: unknown) => void
  onSyncStatusChange: (status: SyncStatus, error?: string | null) => void
}

export class SyncService {
  private pendingDomains = new Set<DataDomain>()
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private readonly debounceMs: number

  constructor(
    private readonly driveClient: DriveClient,
    private readonly stateProvider: SyncStoreStateProvider,
    debounceMs = 1500
  ) {
    this.debounceMs = debounceMs
  }

  queueWrite(domain: DataDomain): void {
    this.pendingDomains.add(domain)
    this.stateProvider.onSyncStatusChange("PENDING")

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
      this.stateProvider.onSyncStatusChange("ERROR", "No encryption key unlocked")
      return
    }

    const domainsToSync = Array.from(this.pendingDomains)
    this.stateProvider.onSyncStatusChange("SYNCING")

    try {
      for (const domain of domainsToSync) {
        const payload = this.stateProvider.getDomainData(domain)
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
        schemaVersion: "1.0.0",
      }
      await this.driveClient.writeMeta(meta)

      this.stateProvider.onSyncStatusChange("SYNCED")
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Sync upload failed"
      this.stateProvider.onSyncStatusChange("ERROR", errorMsg)
    }
  }

  async forceSync(): Promise<void> {
    return this.flush()
  }

  getPendingCount(): number {
    return this.pendingDomains.size
  }
}
