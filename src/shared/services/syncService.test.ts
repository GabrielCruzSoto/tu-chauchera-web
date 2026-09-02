import { describe, it, expect, vi, beforeEach } from "vitest"
import { SyncService, type SyncStoreStateProvider } from "./syncService"
import { DriveClient } from "./driveClient"
import { deriveKeyFromPassword } from "@/shared/utils/crypto"

describe("SyncService", () => {
  let driveClient: DriveClient
  let stateProvider: SyncStoreStateProvider
  let syncService: SyncService
  let cryptoKey: CryptoKey

  beforeEach(async () => {
    cryptoKey = await deriveKeyFromPassword("testMasterPassword")
    driveClient = new DriveClient(() => "mock-token")
    
    // Mock DriveClient methods
    driveClient.writeDomain = vi.fn().mockResolvedValue("file-id-123")
    driveClient.writeMeta = vi.fn().mockResolvedValue("meta-id-123")

    stateProvider = {
      getCryptoKey: () => cryptoKey,
      getDomainData: vi.fn().mockReturnValue({ test: "data" }),
      setDomainData: vi.fn(),
      onSyncStatusChange: vi.fn(),
    }

    syncService = new SyncService(driveClient, stateProvider, 50) // 50ms for tests
  })

  it("queues write and marks status as PENDING", () => {
    syncService.queueWrite("obligations")
    expect(syncService.getPendingCount()).toBe(1)
    expect(stateProvider.onSyncStatusChange).toHaveBeenCalledWith("PENDING")
  })

  it("flushes queued writes and notifies SYNCED", async () => {
    syncService.queueWrite("obligations")
    syncService.queueWrite("incomes")
    
    await syncService.flush()

    expect(driveClient.writeDomain).toHaveBeenCalledTimes(2)
    expect(driveClient.writeMeta).toHaveBeenCalledTimes(1)
    expect(stateProvider.onSyncStatusChange).toHaveBeenCalledWith("SYNCED")
    expect(syncService.getPendingCount()).toBe(0)
  })

  it("sets status to ERROR when encryption key is missing", async () => {
    stateProvider.getCryptoKey = () => null
    syncService.queueWrite("obligations")

    await syncService.flush()
    expect(stateProvider.onSyncStatusChange).toHaveBeenCalledWith("ERROR", "No encryption key unlocked")
  })
})
