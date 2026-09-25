import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { UserMenuDropdown } from "./UserMenuDropdown"
import { useAuthStore } from "@/store/authSlice"

describe("UserMenuDropdown Component", () => {
  const mockLogout = vi.fn()
  const mockOnOpenSettings = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      isAuthenticated: true,
      isUnlocked: true,
      user: {
        sub: "user-123",
        email: "usuario@ejemplo.com",
        name: "Gabriel Cruz",
        picture: "https://example.com/avatar.jpg",
      },
      logout: mockLogout,
    })
  })

  it("renders user information and starts closed with aria-expanded false", () => {
    render(<UserMenuDropdown onOpenSettings={mockOnOpenSettings} />)

    const triggerBtn = screen.getByRole("button", { name: /Menú de usuario: Gabriel Cruz/i })
    expect(triggerBtn).toBeInTheDocument()
    expect(triggerBtn).toHaveAttribute("aria-expanded", "false")
    expect(screen.getByText("Gabriel Cruz")).toBeInTheDocument()
    expect(screen.getByText("usuario@ejemplo.com")).toBeInTheDocument()
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })

  it("opens menu when trigger button is clicked and shows settings and logout options", () => {
    render(<UserMenuDropdown onOpenSettings={mockOnOpenSettings} />)

    const triggerBtn = screen.getByRole("button", { name: /Menú de usuario: Gabriel Cruz/i })
    fireEvent.click(triggerBtn)

    expect(triggerBtn).toHaveAttribute("aria-expanded", "true")
    const menu = screen.getByRole("menu")
    expect(menu).toBeInTheDocument()

    // Options exist with menuitem roles
    const menuItems = screen.getAllByRole("menuitem")
    expect(menuItems).toHaveLength(3)

    expect(screen.getByRole("menuitem", { name: /Configuración/i })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /Ayuda & Soporte/i })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /Cerrar Sesión/i })).toBeInTheDocument()
  })

  it("triggers onOpenSettings and closes menu when clicking Configuración", () => {
    render(<UserMenuDropdown onOpenSettings={mockOnOpenSettings} />)

    const triggerBtn = screen.getByRole("button", { name: /Menú de usuario: Gabriel Cruz/i })
    fireEvent.click(triggerBtn)

    const settingsOption = screen.getByRole("menuitem", { name: /Configuración/i })
    fireEvent.click(settingsOption)

    expect(mockOnOpenSettings).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })

  it("triggers onOpenSupport and closes menu when clicking Ayuda & Soporte", () => {
    const mockOnOpenSupport = vi.fn()
    render(<UserMenuDropdown onOpenSettings={mockOnOpenSettings} onOpenSupport={mockOnOpenSupport} />)

    const triggerBtn = screen.getByRole("button", { name: /Menú de usuario: Gabriel Cruz/i })
    fireEvent.click(triggerBtn)

    const supportOption = screen.getByRole("menuitem", { name: /Ayuda & Soporte/i })
    fireEvent.click(supportOption)

    expect(mockOnOpenSupport).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })

  it("triggers logout and closes menu when clicking Cerrar Sesión", () => {
    render(<UserMenuDropdown onOpenSettings={mockOnOpenSettings} />)

    const triggerBtn = screen.getByRole("button", { name: /Menú de usuario: Gabriel Cruz/i })
    fireEvent.click(triggerBtn)

    const logoutOption = screen.getByRole("menuitem", { name: /Cerrar Sesión/i })
    fireEvent.click(logoutOption)

    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })

  it("closes dropdown when pressing Escape key and returns focus to trigger button", () => {
    render(<UserMenuDropdown onOpenSettings={mockOnOpenSettings} />)

    const triggerBtn = screen.getByRole("button", { name: /Menú de usuario: Gabriel Cruz/i })
    fireEvent.click(triggerBtn)
    expect(screen.getByRole("menu")).toBeInTheDocument()

    fireEvent.keyDown(document, { key: "Escape" })
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })

  it("closes dropdown when clicking outside", () => {
    render(
      <div>
        <div data-testid="outside-area">Afuera</div>
        <UserMenuDropdown onOpenSettings={mockOnOpenSettings} />
      </div>
    )

    const triggerBtn = screen.getByRole("button", { name: /Menú de usuario: Gabriel Cruz/i })
    fireEvent.click(triggerBtn)
    expect(screen.getByRole("menu")).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByTestId("outside-area"))
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })

  it("handles fallback initials when user has no picture", () => {
    useAuthStore.setState({
      user: {
        sub: "user-456",
        email: "test@chauchera.cl",
        name: "María Pérez",
        picture: undefined,
      },
    })

    render(<UserMenuDropdown />)
    expect(screen.getByText("MP")).toBeInTheDocument()
  })
})
