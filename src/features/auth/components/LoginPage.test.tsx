import React from "react"
import { render, screen } from "@testing-library/react"
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
})
