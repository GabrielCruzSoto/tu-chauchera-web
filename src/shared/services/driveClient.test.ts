import { describe, it, expect, vi, beforeEach } from "vitest"
import { DriveClient } from "./driveClient"
import type { SyncMeta } from "@/shared/types/domain"

describe("DriveClient", () => {
  let driveClient: DriveClient
  let token = "mock-google-access-token"

  beforeEach(() => {
    token = "mock-google-access-token"
    driveClient = new DriveClient(() => token)
    vi.restoreAllMocks()
  })

  it("throws if access token is missing", async () => {
    const unauthedClient = new DriveClient(() => null)
    await expect(unauthedClient.findFileId("meta.json")).rejects.toThrow("User is not authenticated with Google Drive")
  })

  it("finds file ID and caches it", async () => {
    const mockFilesResponse = {
      files: [{ id: "drive-file-id-123", name: "meta.json" }],
    }

    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockFilesResponse), { status: 200 })
    )

    const fileId = await driveClient.findFileId("meta.json")
    expect(fileId).toBe("drive-file-id-123")
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    // Second call should return from cache without fetch
    const cachedId = await driveClient.findFileId("meta.json")
    expect(cachedId).toBe("drive-file-id-123")
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it("reads and parses meta.json properly", async () => {
    const mockMeta: SyncMeta = {
      version: 1,
      lastSyncedAt: "2026-08-31T10:00:00Z",
      driveFileIds: { obligations: "id-1" },
      pendingChanges: false,
      schemaVersion: "1.0.0",
    }

    // First fetch for findFileId, second for file content
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ files: [{ id: "meta-id", name: "meta.json" }] }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockMeta), { status: 200 })
      )

    const meta = await driveClient.readMeta()
    expect(meta).toEqual(mockMeta)
  })

  it("retrieves storage stats with total bytes and file details", async () => {
    const mockFilesResponse = {
      files: [
        { id: "id-1", name: "obligations.enc", size: "2048", modifiedTime: "2026-09-01T12:00:00Z" },
        { id: "id-2", name: "meta.json", size: "512", modifiedTime: "2026-09-01T12:00:00Z" },
      ],
    }

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockFilesResponse), { status: 200 })
    )

    const stats = await driveClient.getStorageStats()
    expect(stats.totalBytes).toBe(2560)
    expect(stats.files).toHaveLength(2)
    expect(stats.files[0]!.name).toBe("obligations.enc")
    expect(stats.files[0]!.sizeBytes).toBe(2048)
  })

  it("deletes a file by ID", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 204 })
    )

    await driveClient.deleteFile("id-to-delete")
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://www.googleapis.com/drive/v3/files/id-to-delete",
      expect.objectContaining({ method: "DELETE" })
    )
  })

  it("wipes all app data files", async () => {
    const mockFilesResponse = {
      files: [
        { id: "f1", name: "obligations.enc", size: "100" },
        { id: "f2", name: "incomes.enc", size: "200" },
      ],
    }

    // 1st fetch: getStorageStats, 2nd & 3rd: deleteFile
    const fetchSpy = vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify(mockFilesResponse), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await driveClient.wipeAllAppData()
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })
})
