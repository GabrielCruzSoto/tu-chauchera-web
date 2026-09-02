import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { UserProfileTab } from "./UserProfileTab"
import { useAuthStore } from "@/store/authSlice"
import { useSettingsStore } from "../store/settingsSlice"

describe("UserProfileTab", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        sub: "user-123",
        email: "test@example.com",
        name: "Gabriel Soto",
        picture: "https://example.com/avatar.jpg",
      },
      isUnlocked: true,
      isAuthenticated: true,
    })

    useSettingsStore.getState().resetPreferences()
  })

  it("renders user information from auth store", () => {
    render(<UserProfileTab />)

    expect(screen.getByText("Gabriel Soto")).toBeInTheDocument()
    expect(screen.getByText("test@example.com")).toBeInTheDocument()
    expect(screen.getByText(/Desbloqueada/i)).toBeInTheDocument()
    expect(screen.getByText(/AES-GCM \(256-bit\)/i)).toBeInTheDocument()
  })

  it("updates user preferences when form is saved", () => {
    render(<UserProfileTab />)

    const currencySelect = screen.getByLabelText(/moneda principal/i)
    fireEvent.change(currencySelect, { target: { value: "USD" } })

    const dateFormatSelect = screen.getByLabelText(/formato de fecha/i)
    fireEvent.change(dateFormatSelect, { target: { value: "YYYY-MM-DD" } })

    const themeSelect = screen.getByLabelText(/tema visual/i)
    fireEvent.change(themeSelect, { target: { value: "light" } })

    const saveBtn = screen.getByRole("button", { name: /guardar preferencias/i })
    fireEvent.click(saveBtn)

    expect(screen.getByText(/preferencias guardadas exitosamente/i)).toBeInTheDocument()

    const updatedState = useSettingsStore.getState().preferences
    expect(updatedState.currency).toBe("USD")
    expect(updatedState.dateFormat).toBe("YYYY-MM-DD")
    expect(updatedState.theme).toBe("light")
  })
})
