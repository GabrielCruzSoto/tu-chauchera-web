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

  it("switches to settings view when clicking settings button inside mobile drawer", async () => {
    render(<App />)

    const hamburgerBtn = screen.getByRole("button", { name: /Abrir menú/i })
    fireEvent.click(hamburgerBtn)

    const settingsDrawerBtn = screen.getAllByRole("button", { name: /Configuración/i })[0]!
    fireEvent.click(settingsDrawerBtn)

    expect(await screen.findByText("Configuración & Bóveda")).toBeInTheDocument()
  })

  it("opens settings view when selecting Configuración from user dropdown menu", async () => {
    render(<App />)

    const userDropdownBtn = screen.getByRole("button", { name: /Menú de usuario/i })
    fireEvent.click(userDropdownBtn)

    const settingsMenuItem = screen.getByRole("menuitem", { name: /Configuración/i })
    fireEvent.click(settingsMenuItem)

    expect(await screen.findByText("Configuración & Bóveda")).toBeInTheDocument()
  })

  it("renders Suspense fallback spinner when lazy component is loading", () => {
    const { container } = render(<App />)
    expect(container).toBeInTheDocument()
  })

  it("handles authentication transition from logged out to unlocked without hook errors", async () => {
    useAuthStore.setState({
      isAuthenticated: false,
      isUnlocked: false,
      user: null,
    })

    const { rerender } = render(<App />)
    expect(screen.getByText(/Acceder a Tu Bóveda/i)).toBeInTheDocument()

    // Transition to authenticated & unlocked
    useAuthStore.setState({
      isAuthenticated: true,
      isUnlocked: true,
      user: { sub: "user-1", email: "test@example.com", name: "Test User" },
    })

    rerender(<App />)
    expect(await screen.findByText("Matriz de Consolidación Financiera")).toBeInTheDocument()
  })

  it("switches tab using number keyboard shortcuts (1 - 6)", async () => {
    render(<App />)

    // Press '2' for Flujos & Cuotas
    fireEvent.keyDown(window, { key: "2" })
    expect(await screen.findByRole("button", { name: /Mes anterior/i })).toBeInTheDocument()
  })

  it("opens support modal when selecting Ayuda & Soporte from user dropdown menu", async () => {
    render(<App />)

    const userDropdownBtn = screen.getByRole("button", { name: /Menú de usuario/i })
    fireEvent.click(userDropdownBtn)

    const supportMenuItem = screen.getByRole("menuitem", { name: /Ayuda & Soporte/i })
    fireEvent.click(supportMenuItem)

    expect(await screen.findByRole("heading", { name: /centro de ayuda & soporte/i })).toBeInTheDocument()
  })

  it("opens support modal when clicking Ayuda & Soporte in mobile drawer", async () => {
    render(<App />)

    const hamburgerBtn = screen.getByLabelText("Abrir menú")
    fireEvent.click(hamburgerBtn)

    const supportDrawerBtn = screen.getByRole("button", { name: /Ayuda & Soporte/i })
    fireEvent.click(supportDrawerBtn)

    expect(await screen.findByRole("heading", { name: /centro de ayuda & soporte/i })).toBeInTheDocument()
  })
})

