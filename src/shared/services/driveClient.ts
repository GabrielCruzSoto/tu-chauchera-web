/**
 * Google Drive REST API v3 Client for Tu Chauchera.
 *
 * Interacts exclusively with the user's secure appDataFolder.
 * Encrypted data files:
 * - obligations.enc
 * - incomes.enc
 * - categories.enc
 * - settings.enc
 *
 * Unencrypted metadata:
 * - meta.json
 */
import type { DataDomain, SyncMeta } from "@/shared/types/domain"
import type { DriveStorageFileInfo } from "@/shared/types/settings"

const DRIVE_API_URL = "https://www.googleapis.com/drive/v3"
const UPLOAD_API_URL = "https://www.googleapis.com/upload/drive/v3"

export class DriveClient {
  private fileIdCache: Map<string, string> = new Map()

  constructor(private readonly getAccessToken: () => string | null) {}

  private getHeaders(contentType?: string): HeadersInit {
    const token = this.getAccessToken()
    if (!token) {
      throw new Error("User is not authenticated with Google Drive")
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    }

    if (contentType) {
      headers["Content-Type"] = contentType
    }

    return headers
  }

  /**
   * Searches for a file by name within appDataFolder.
   */
  async findFileId(fileName: string): Promise<string | null> {
    if (this.fileIdCache.has(fileName)) {
      return this.fileIdCache.get(fileName)!
    }

    const query = encodeURIComponent(
      `name = '${fileName}' and trashed = false`
    )
    const url = `${DRIVE_API_URL}/files?spaces=appDataFolder&q=${query}&fields=files(id,name)`

    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    })

    if (!res.ok) {
      throw new Error(`Failed to query Drive for file ${fileName}: ${res.status} ${res.statusText}`)
    }

    const data = (await res.json()) as { files?: Array<{ id: string; name: string }> }
    const fileId = data.files && data.files.length > 0 && data.files[0]?.id ? data.files[0].id : null

    if (fileId) {
      this.fileIdCache.set(fileName, fileId)
    }

    return fileId
  }

  /**
   * Uploads (creates or updates) binary content in appDataFolder using multipart upload or patch.
   */
  async uploadBinaryFile(fileName: string, buffer: ArrayBuffer): Promise<string> {
    const existingId = await this.findFileId(fileName)

    if (existingId) {
      // Overwrite existing file content
      const url = `${UPLOAD_API_URL}/files/${existingId}?uploadType=media`
      const res = await fetch(url, {
        method: "PATCH",
        headers: this.getHeaders("application/octet-stream"),
        body: buffer,
      })

      if (!res.ok) {
        throw new Error(`Failed to update Drive file ${fileName}: ${res.status} ${res.statusText}`)
      }

      const file = (await res.json()) as { id: string }
      return file.id
    }

    // Create new file with multipart upload
    const boundary = "-------TuChaucheraMultipartBoundary"
    const metadata = JSON.stringify({
      name: fileName,
      parents: ["appDataFolder"],
    })

    const delimiter = `\r\n--${boundary}\r\n`
    const closeDelimiter = `\r\n--${boundary}--`

    const metaPart = `Content-Type: application/json; charset=UTF-8\r\n\r\n${metadata}`
    const mediaHeader = `Content-Type: application/octet-stream\r\n\r\n`

    const metaBytes = new TextEncoder().encode(delimiter + metaPart + delimiter + mediaHeader)
    const closeBytes = new TextEncoder().encode(closeDelimiter)

    const fullPayload = new Uint8Array(metaBytes.byteLength + buffer.byteLength + closeBytes.byteLength)
    fullPayload.set(metaBytes, 0)
    fullPayload.set(new Uint8Array(buffer), metaBytes.byteLength)
    fullPayload.set(closeBytes, metaBytes.byteLength + buffer.byteLength)

    const url = `${UPLOAD_API_URL}/files?uploadType=multipart`
    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(`multipart/related; boundary=${boundary}`),
      body: fullPayload,
    })

    if (!res.ok) {
      throw new Error(`Failed to create Drive file ${fileName}: ${res.status} ${res.statusText}`)
    }

    const created = (await res.json()) as { id: string }
    this.fileIdCache.set(fileName, created.id)
    return created.id
  }

  /**
   * Downloads binary content from Drive by file name.
   * Returns null if file doesn't exist yet.
   */
  async downloadBinaryFile(fileName: string): Promise<ArrayBuffer | null> {
    const fileId = await this.findFileId(fileName)
    if (!fileId) return null

    const url = `${DRIVE_API_URL}/files/${fileId}?alt=media`
    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    })

    if (res.status === 404) return null
    if (!res.ok) {
      throw new Error(`Failed to download Drive file ${fileName}: ${res.status} ${res.statusText}`)
    }

    return await res.arrayBuffer()
  }

  /**
   * Deletes a specific file from Google Drive.
   */
  async deleteFile(fileId: string): Promise<void> {
    const url = `${DRIVE_API_URL}/files/${fileId}`
    const res = await fetch(url, {
      method: "DELETE",
      headers: this.getHeaders(),
    })

    if (!res.ok && res.status !== 404) {
      throw new Error(`Failed to delete Drive file ${fileId}: ${res.status} ${res.statusText}`)
    }
  }

  /**
   * Retrieves all files in appDataFolder with their sizes and modification timestamps.
   */
  async getStorageStats(): Promise<{ totalBytes: number; files: DriveStorageFileInfo[] }> {
    const query = encodeURIComponent("trashed = false")
    const url = `${DRIVE_API_URL}/files?spaces=appDataFolder&q=${query}&fields=files(id,name,size,modifiedTime)`

    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    })

    if (!res.ok) {
      throw new Error(`Failed to retrieve storage stats from Drive: ${res.status} ${res.statusText}`)
    }

    const data = (await res.json()) as {
      files?: Array<{ id: string; name: string; size?: string; modifiedTime?: string }>
    }

    const files: DriveStorageFileInfo[] = (data.files ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      sizeBytes: f.size ? parseInt(f.size, 10) : 0,
      modifiedTime: f.modifiedTime ?? new Date().toISOString(),
    }))

    const totalBytes = files.reduce((acc, curr) => acc + curr.sizeBytes, 0)
    return { totalBytes, files }
  }

  /**
   * Permanently wipes all files in appDataFolder and resets internal cache.
   */
  async wipeAllAppData(): Promise<void> {
    const { files } = await this.getStorageStats()
    for (const file of files) {
      await this.deleteFile(file.id)
    }
    this.clearCache()
  }

  // Domain-specific methods
  async writeDomain(domain: DataDomain, encryptedBuffer: ArrayBuffer): Promise<string> {
    const fileName = `${domain}.enc`
    return this.uploadBinaryFile(fileName, encryptedBuffer)
  }

  async readDomain(domain: DataDomain): Promise<ArrayBuffer | null> {
    const fileName = `${domain}.enc`
    return this.downloadBinaryFile(fileName)
  }

  async readMeta(): Promise<SyncMeta | null> {
    const fileId = await this.findFileId("meta.json")
    if (!fileId) return null

    const url = `${DRIVE_API_URL}/files/${fileId}?alt=media`
    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    })

    if (res.status === 404) return null
    if (!res.ok) {
      throw new Error(`Failed to read meta.json: ${res.status} ${res.statusText}`)
    }

    return (await res.json()) as SyncMeta
  }

  async writeMeta(meta: SyncMeta): Promise<string> {
    const jsonString = JSON.stringify(meta, null, 2)
    const buffer = new TextEncoder().encode(jsonString).buffer
    return this.uploadBinaryFile("meta.json", buffer)
  }

  clearCache(): void {
    this.fileIdCache.clear()
  }
}
