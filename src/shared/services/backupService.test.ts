import { describe, it, expect, vi } from "vitest"
import { buildBackupPayload, triggerBackupDownload } from "./backupService"

describe("backupService", () => {
  it("builds structured backup payload properly", () => {
    const mockData = {
      obligations: {},
      payments: {},
      categories: {},
      incomes: {},
      preferences: {
        currency: "CLP" as const,
        dateFormat: "DD/MM/YYYY" as const,
        theme: "dark" as const,
        showCents: false,
        updatedAt: "2026-09-01T00:00:00.000Z",
      },
    }

    const payload = buildBackupPayload(mockData, "v1.1.0", "1.0.0")

    expect(payload.schemaVersion).toBe("v1.1.0")
    expect(payload.appVersion).toBe("1.0.0")
    expect(payload.data).toEqual(mockData)
    expect(payload.exportDate).toBeDefined()
  })

  it("triggers browser download properly", () => {
    const mockData = {
      obligations: {},
      payments: {},
      categories: {},
      incomes: {},
    }
    const payload = buildBackupPayload(mockData)

    const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url")
    const revokeObjectURLMock = vi.fn()
    global.URL.createObjectURL = createObjectURLMock
    global.URL.revokeObjectURL = revokeObjectURLMock

    const appendChildSpy = vi.spyOn(document.body, "appendChild")
    const removeChildSpy = vi.spyOn(document.body, "removeChild")

    triggerBackupDownload(payload, "test-backup.json")

    expect(createObjectURLMock).toHaveBeenCalledTimes(1)
    expect(appendChildSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url")
  })
})
