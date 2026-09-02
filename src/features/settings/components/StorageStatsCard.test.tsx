import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { StorageStatsCard } from "./StorageStatsCard"

describe("StorageStatsCard", () => {
  const mockMetrics = {
    totalSizeBytes: 3072,
    files: [
      {
        id: "id-1",
        name: "obligations.enc",
        sizeBytes: 2048,
        modifiedTime: "2026-09-01T12:00:00.000Z",
      },
      {
        id: "id-2",
        name: "meta.json",
        sizeBytes: 1024,
        modifiedTime: "2026-09-01T12:00:00.000Z",
      },
    ],
    lastCheckedAt: "2026-09-01T12:00:00.000Z",
    schemaVersion: "v1.1.0",
  }

  it("renders metrics breakdown and formatted bytes", () => {
    render(<StorageStatsCard metrics={mockMetrics} isLoading={false} onRefresh={vi.fn()} />)

    expect(screen.getByText("3.00 KB")).toBeInTheDocument()
    expect(screen.getByText("2 archivos")).toBeInTheDocument()
    expect(screen.getByText("v1.1.0")).toBeInTheDocument()
    expect(screen.getByText("obligations.enc")).toBeInTheDocument()
    expect(screen.getByText("meta.json")).toBeInTheDocument()
    expect(screen.getByText("2.00 KB")).toBeInTheDocument()
    expect(screen.getByText("1.00 KB")).toBeInTheDocument()
  })

  it("triggers onRefresh callback when button is clicked", () => {
    const handleRefresh = vi.fn()
    render(<StorageStatsCard metrics={mockMetrics} isLoading={false} onRefresh={handleRefresh} />)

    const refreshBtn = screen.getByRole("button", { name: /actualizar métricas/i })
    fireEvent.click(refreshBtn)

    expect(handleRefresh).toHaveBeenCalledTimes(1)
  })
})
