import { describe, it, expect, beforeEach } from "vitest"
import { useSyncStore } from "./syncSlice"
import { DriveStorageQuotaError } from "@/shared/services/driveErrors"

describe("syncSlice quota error handling", () => {
  beforeEach(() => {
    useSyncStore.getState().resetSync()
  })

  it("has isQuotaExceeded default to false", () => {
    expect(useSyncStore.getState().isQuotaExceeded).toBe(false)
  })

  it("sets isQuotaExceeded to true when setStatus receives DriveStorageQuotaError instance", () => {
    useSyncStore.getState().setStatus("ERROR", new DriveStorageQuotaError())

    const state = useSyncStore.getState()
    expect(state.status).toBe("ERROR")
    expect(state.isQuotaExceeded).toBe(true)
    expect(state.errorMessage).toContain("storage quota has been exceeded")
  })

  it("sets isQuotaExceeded to true when setStatus receives quota error string", () => {
    useSyncStore
      .getState()
      .setStatus("ERROR", "The user's Drive storage quota has been exceeded.")

    const state = useSyncStore.getState()
    expect(state.status).toBe("ERROR")
    expect(state.isQuotaExceeded).toBe(true)
  })

  it("does not set isQuotaExceeded to true when generic error is passed", () => {
    useSyncStore.getState().setStatus("ERROR", new Error("Connection refused"))

    const state = useSyncStore.getState()
    expect(state.status).toBe("ERROR")
    expect(state.isQuotaExceeded).toBe(false)
    expect(state.errorMessage).toBe("Connection refused")
  })

  it("dismissQuotaModal sets isQuotaExceeded to false", () => {
    useSyncStore.getState().setStatus("ERROR", new DriveStorageQuotaError())
    expect(useSyncStore.getState().isQuotaExceeded).toBe(true)

    useSyncStore.getState().dismissQuotaModal()
    expect(useSyncStore.getState().isQuotaExceeded).toBe(false)
  })

  it("setQuotaExceeded explicitly controls isQuotaExceeded", () => {
    useSyncStore.getState().setQuotaExceeded(true)
    expect(useSyncStore.getState().isQuotaExceeded).toBe(true)

    useSyncStore.getState().setQuotaExceeded(false)
    expect(useSyncStore.getState().isQuotaExceeded).toBe(false)
  })

  it("clears isQuotaExceeded when status becomes SYNCED", () => {
    useSyncStore.getState().setQuotaExceeded(true)
    expect(useSyncStore.getState().isQuotaExceeded).toBe(true)

    useSyncStore.getState().setStatus("SYNCED")
    expect(useSyncStore.getState().isQuotaExceeded).toBe(false)
  })
})
