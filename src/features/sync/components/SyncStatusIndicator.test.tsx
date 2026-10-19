import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { SyncStatusIndicator } from "./SyncStatusIndicator"
import { useSyncStore } from "../store/syncSlice"

describe("SyncStatusIndicator", () => {
  beforeEach(() => {
    useSyncStore.setState({
      status: "SYNCED",
      lastSyncedAt: null,
      pendingMutations: 0,
      errorMessage: null,
      isOnline: true,
      isQuotaExceeded: false,
    })
    vi.restoreAllMocks()
  })

  it("renders SYNCED status", () => {
    useSyncStore.setState({ status: "SYNCED", lastSyncedAt: "2026-09-30T10:00:00Z" })
    render(<SyncStatusIndicator />)

    expect(screen.getByText("Drive Sincronizado")).toBeInTheDocument()
  })

  it("renders SYNCING status", () => {
    useSyncStore.setState({ status: "SYNCING" })
    render(<SyncStatusIndicator />)

    expect(screen.getByText("Subiendo datos...")).toBeInTheDocument()
  })

  it("renders PENDING status with mutation count", () => {
    useSyncStore.setState({ status: "PENDING", pendingMutations: 3 })
    render(<SyncStatusIndicator />)

    expect(screen.getByText("3 cambio(s) pendiente(s)")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Subir ahora/i })).toBeInTheDocument()
  })

  it("renders regular ERROR status when no quota error", () => {
    useSyncStore.setState({
      status: "ERROR",
      errorMessage: "Network request failed",
      isQuotaExceeded: false,
    })
    render(<SyncStatusIndicator />)

    expect(screen.getByText("Error al sincronizar")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Reintentar/i })).toBeInTheDocument()
  })

  it("renders quota error state with 'Sin espacio en Drive' when isQuotaExceeded is true", () => {
    const setQuotaExceededSpy = vi.fn()
    useSyncStore.setState({
      status: "ERROR",
      errorMessage: "The user's Drive storage quota has been exceeded.",
      isQuotaExceeded: true,
      setQuotaExceeded: setQuotaExceededSpy,
    })

    render(<SyncStatusIndicator />)

    expect(screen.getByText("Sin espacio en Drive")).toBeInTheDocument()
    const statusBtn = screen.getByRole("button", { name: /Sin espacio en Drive/i })
    expect(statusBtn).toBeInTheDocument()

    // Clicking status triggers setQuotaExceeded(true)
    fireEvent.click(statusBtn)
    expect(setQuotaExceededSpy).toHaveBeenCalledWith(true)
  })

  it("renders quota error state when errorMessage has quota exceeded message", () => {
    const setQuotaExceededSpy = vi.fn()
    useSyncStore.setState({
      status: "ERROR",
      errorMessage: "The user's Drive storage quota has been exceeded.",
      isQuotaExceeded: false,
      setQuotaExceeded: setQuotaExceededSpy,
    })

    render(<SyncStatusIndicator />)

    expect(screen.getByText("Sin espacio en Drive")).toBeInTheDocument()
    const statusBtn = screen.getByRole("button", { name: /Sin espacio en Drive/i })
    fireEvent.click(statusBtn)
    expect(setQuotaExceededSpy).toHaveBeenCalledWith(true)
  })

  it("triggers forceResync when clicking Reintentar button without propagating to modal", () => {
    const forceResyncSpy = vi.fn().mockResolvedValue(undefined)
    const setQuotaExceededSpy = vi.fn()

    useSyncStore.setState({
      status: "ERROR",
      isQuotaExceeded: true,
      setQuotaExceeded: setQuotaExceededSpy,
      forceResync: forceResyncSpy,
    })

    render(<SyncStatusIndicator />)

    const retryBtn = screen.getByRole("button", { name: /Reintentar/i })
    fireEvent.click(retryBtn)

    expect(forceResyncSpy).toHaveBeenCalledTimes(1)
    expect(setQuotaExceededSpy).not.toHaveBeenCalled()
  })
})
