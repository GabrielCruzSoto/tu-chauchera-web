import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { App } from "../App"
import { useAuthStore } from "@/store/authSlice"
import { useObligationsStore } from "@/features/obligations/store/obligationsSlice"
import { useIncomeStore } from "@/features/income/store/incomeSlice"

vi.mock("@/features/sync/store/syncSlice", () => ({
  useSyncStore: () => ({
    hydrateFromDrive: vi.fn(),
    status: "IDLE",
    lastSyncedAt: null,
    isOnline: true,
  }),
}))

describe("App Responsive Navigation", () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      isUnlocked: true,
      user: { sub: "user-1", email: "test@example.com", name: "Test User" },
      authError: null,
      isFirstUse: false,
    })

    useObligationsStore.setState({
      obligations: {},
      installments: {},
      categories: {},
      isLoaded: true,
    })

    useIncomeStore.setState({
      incomes: {},
      isLoaded: true,
    })
  })

  it("renders desktop navigation and mobile hamburger toggle button", async () => {
    render(<App />)

    const hamburgerBtn = screen.getByRole("button", { name: /Abrir menú/i })
    expect(hamburgerBtn).toBeInTheDocument()
    expect(await screen.findByText("Matriz de Consolidación Financiera")).toBeInTheDocument()
  })

  it("opens mobile drawer when clicking hamburger button and closes it on close button", async () => {
    render(<App />)

    const hamburgerBtn = screen.getByRole("button", { name: /Abrir menú/i })
    expect(screen.queryByTestId("mobile-nav-drawer")).not.toBeInTheDocument()

    fireEvent.click(hamburgerBtn)
    expect(screen.getByTestId("mobile-nav-drawer")).toBeInTheDocument()
    expect(screen.getByText("Menú Principal")).toBeInTheDocument()

    // Close button inside drawer
    const closeBtn = screen.getAllByRole("button", { name: /Cerrar menú/i })[0]!
    fireEvent.click(closeBtn)
    expect(screen.queryByTestId("mobile-nav-drawer")).not.toBeInTheDocument()
  })

  it("closes drawer when clicking backdrop overlay", () => {
    render(<App />)

    const hamburgerBtn = screen.getByRole("button", { name: /Abrir menú/i })
    fireEvent.click(hamburgerBtn)

    const backdrop = screen.getByTestId("mobile-drawer-backdrop")
    expect(backdrop).toBeInTheDocument()

    fireEvent.click(backdrop)
    expect(screen.queryByTestId("mobile-nav-drawer")).not.toBeInTheDocument()
  })

  it("switches tab and closes drawer when clicking a navigation link inside mobile drawer", async () => {
    render(<App />)

    const hamburgerBtn = screen.getByRole("button", { name: /Abrir menú/i })
    fireEvent.click(hamburgerBtn)

    const mobileLinksContainer = screen.getByTestId("mobile-nav-links")
    const obligationsLink = mobileLinksContainer.querySelector("button:nth-child(4)")
    expect(obligationsLink).toBeInTheDocument()

    fireEvent.click(obligationsLink!)
    expect(screen.queryByTestId("mobile-nav-drawer")).not.toBeInTheDocument()
    expect(await screen.findByText("Obligaciones Financieras")).toBeInTheDocument()
  })

  it("switches to settings view when clicking settings navigation tab", async () => {
    render(<App />)

    const settingsTabBtn = screen.getByRole("button", { name: /⚙️ Configuración/i })
    fireEvent.click(settingsTabBtn)

    expect(await screen.findByText("Configuración & Bóveda")).toBeInTheDocument()
  })

  it("renders Suspense fallback spinner when lazy component is loading", () => {
    const { container } = render(<App />)
    expect(container).toBeInTheDocument()
  })
})
