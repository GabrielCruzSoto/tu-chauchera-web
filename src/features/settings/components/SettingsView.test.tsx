import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SettingsView } from "./SettingsView"
import { useAuthStore } from "@/store/authSlice"

describe("SettingsView", () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: "mock-token",
      user: {
        sub: "user-123",
        email: "test@example.com",
        name: "Gabriel Soto",
        picture: "https://example.com/avatar.jpg",
      },
      isUnlocked: true,
      isAuthenticated: true,
    })

    // Mock fetch for Google Drive calls in DataStorageTab
    vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ files: [] }), { status: 200 })
      )
    )
  })

  it("renders tabs and defaults to Categories tab", () => {
    render(<SettingsView />)

    expect(screen.getByText("🏷️ Categorías")).toBeInTheDocument()
    expect(screen.getByText("👤 Usuario & Preferencias")).toBeInTheDocument()
    expect(screen.getByText("💾 Almacenamiento & Bóveda")).toBeInTheDocument()
    expect(screen.getByText("💬 Soporte & Ayuda")).toBeInTheDocument()
    expect(screen.getByText(/mantenedor de categorías/i)).toBeInTheDocument()
  })

  it("switches to User Profile tab when clicked", () => {
    render(<SettingsView />)

    const profileTabBtn = screen.getByRole("button", { name: /👤 usuario & preferencias/i })
    fireEvent.click(profileTabBtn)

    expect(screen.getByText(/información de usuario & preferencias/i)).toBeInTheDocument()
    expect(screen.getByText("Gabriel Soto")).toBeInTheDocument()
  })

  it("switches to Storage tab when clicked", () => {
    render(<SettingsView />)

    const storageTabBtn = screen.getByRole("button", { name: /💾 almacenamiento & bóveda/i })
    fireEvent.click(storageTabBtn)

    expect(screen.getByText(/almacenamiento & gestión de datos/i)).toBeInTheDocument()
    expect(screen.getByText(/copia de seguridad descifrada/i)).toBeInTheDocument()
  })

  it("switches to Support tab when clicked", () => {
    render(<SettingsView />)

    const supportTabBtn = screen.getByRole("button", { name: /💬 soporte & ayuda/i })
    fireEvent.click(supportTabBtn)

    expect(screen.getByText(/centro de ayuda & asistencia técnica/i)).toBeInTheDocument()
    expect(screen.getByText(/soporte por correo/i)).toBeInTheDocument()
    expect(screen.getByText(/reporte de diagnóstico del sistema/i)).toBeInTheDocument()
  })
})
