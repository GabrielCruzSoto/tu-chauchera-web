/**
 * Custom error thrown when Google Drive upload fails due to storage quota exceeded (HTTP 403 storageQuotaExceeded).
 */
export class DriveStorageQuotaError extends Error {
  readonly code: number = 403
  readonly reason: string = "storageQuotaExceeded"

  constructor(message = "The user's Drive storage quota has been exceeded.") {
    super(message)
    this.name = "DriveStorageQuotaError"
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/**
 * Type guard to check if an unknown error represents a Google Drive storage quota exceeded error.
 */
export function isDriveStorageQuotaError(err: unknown): boolean {
  if (!err) return false

  if (err instanceof DriveStorageQuotaError) {
    return true
  }

  if (typeof err === "object") {
    const errorObj = err as Record<string, unknown>

    if (errorObj.name === "DriveStorageQuotaError" || errorObj.reason === "storageQuotaExceeded") {
      return true
    }

    if (
      typeof errorObj.message === "string" &&
      (errorObj.message.includes("storage quota has been exceeded") ||
        errorObj.message.includes("storageQuotaExceeded"))
    ) {
      return true
    }

    if (errorObj.error && typeof errorObj.error === "object") {
      const nested = errorObj.error as Record<string, unknown>
      if (
        typeof nested.message === "string" &&
        nested.message.includes("storage quota has been exceeded")
      ) {
        return true
      }
      if (Array.isArray(nested.errors)) {
        if (
          nested.errors.some(
            (e: unknown) =>
              e && typeof e === "object" && (e as Record<string, unknown>).reason === "storageQuotaExceeded"
          )
        ) {
          return true
        }
      }
    }
  }

  if (
    typeof err === "string" &&
    (err.includes("storage quota has been exceeded") || err.includes("storageQuotaExceeded"))
  ) {
    return true
  }

  return false
}
