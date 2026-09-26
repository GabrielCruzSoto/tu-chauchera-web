import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach } from "vitest"
import { LoginPage } from "./LoginPage"
import { useAuthStore } from "@/store/authSlice"

describe("LoginPage Security & Flow", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      cryptoKey: null,
      isAuthenticated: false,
      isUnlocked: false,
      isFirstUse: null,
      authError: null,
      isCheckingDrive: false,
    })
  })

  it("renders Google login button when unauthenticated", () => {
    render(<LoginPage />)
    expect(screen.getByRole("heading", { name: "Acceder a Tu Bóveda" })).toBeInTheDocument()
    expect(screen.getByText("Continuar con Google")).toBeInTheDocument()
  })

  it("renders master password setup when authenticated and first use", () => {
    useAuthStore.setState({
      isAuthenticated: true,
      isUnlocked: false,
      isFirstUse: true,
      user: { sub: "gabriel-1", email: "gabrielcruzsoto@gmail.com", name: "Gabriel Cruz" },
    })

    render(<LoginPage />)
    expect(screen.getByRole("heading", { name: "Configurar Bóveda" })).toBeInTheDocument()
    expect(screen.getByText("Crear Contraseña Maestra")).toBeInTheDocument()
    expect(screen.getByText("Confirmar Contraseña")).toBeInTheDocument()
  })

  it("renders unlock form when user already has vault on Drive", () => {
    useAuthStore.setState({
      isAuthenticated: true,
      isUnlocked: false,
      isFirstUse: false,
      user: { sub: "gabriel-1", email: "gabrielcruzsoto@gmail.com", name: "Gabriel Cruz" },
    })

    render(<LoginPage />)
    expect(screen.getByRole("heading", { name: "Desbloquear Bóveda" })).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Ingresa tu contraseña para descifrar")).toBeInTheDocument()
    expect(screen.getByText("gabrielcruzsoto@gmail.com")).toBeInTheDocument()
  })

  it("renders system version and schema version indicators in footer", () => {
    render(<LoginPage />)
    const footer = screen.getByTestId("landing-version-footer")
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveTextContent("Sistema: v0.1.0")
    expect(footer).toHaveTextContent("Schema: v1.1.0")
  })

  it("opens support modal when clicking Ayuda & Soporte in footer", () => {
    render(<LoginPage />)
    const supportBtn = screen.getByRole("button", { name: /ayuda & soporte/i })
    expect(supportBtn).toBeInTheDocument()

    fireEvent.click(supportBtn)
    expect(screen.getByRole("heading", { name: /centro de ayuda & soporte/i })).toBeInTheDocument()
  })

  it("opens support modal when clicking Contactar a soporte link", () => {
    render(<LoginPage />)
    const contactBtn = screen.getByRole("button", { name: /contactar a soporte/i })
    expect(contactBtn).toBeInTheDocument()

    fireEvent.click(contactBtn)
    expect(screen.getByRole("heading", { name: /centro de ayuda & soporte/i })).toBeInTheDocument()
  })

  it("renders privacy policy link in footer and calls onOpenPrivacy when clicked", () => {
    const mockOnOpenPrivacy = vi.fn()
    render(<LoginPage onOpenPrivacy={mockOnOpenPrivacy} />)

    const privacyLink = screen.getByRole("link", { name: /privacidad/i })
    expect(privacyLink).toBeInTheDocument()

    fireEvent.click(privacyLink)
    expect(mockOnOpenPrivacy).toHaveBeenCalledTimes(1)
  })

  it("renders terms of service link in footer and calls onOpenTerms when clicked", () => {
    const mockOnOpenTerms = vi.fn()
    render(<LoginPage onOpenTerms={mockOnOpenTerms} />)

    const termsLink = screen.getByRole("link", { name: /términos/i })
    expect(termsLink).toBeInTheDocument()

    fireEvent.click(termsLink)
    expect(mockOnOpenTerms).toHaveBeenCalledTimes(1)
  })
})

