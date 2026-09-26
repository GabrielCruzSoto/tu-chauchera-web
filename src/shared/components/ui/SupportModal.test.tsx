import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { SupportModal } from "./SupportModal"
import { SUPPORT_EMAIL } from "@/shared/constants/support"

describe("SupportModal Component", () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    })
  })

  it("does not render when isOpen is false", () => {
    render(<SupportModal isOpen={false} onClose={mockOnClose} />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("renders modal with channels and diagnostics when isOpen is true", () => {
    render(<SupportModal isOpen={true} onClose={mockOnClose} />)

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /centro de ayuda & soporte/i })).toBeInTheDocument()
    expect(screen.getByText(SUPPORT_EMAIL)).toBeInTheDocument()
  })

  it("copies email to clipboard when clicking Copiar button", async () => {
    render(<SupportModal isOpen={true} onClose={mockOnClose} />)

    const copyBtn = screen.getByRole("button", { name: "Copiar" })
    fireEvent.click(copyBtn)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(SUPPORT_EMAIL)
    expect(await screen.findByText("✓ Copiado")).toBeInTheDocument()
  })

  it("copies diagnostic report to clipboard when clicking Copiar diagnóstico", async () => {
    render(<SupportModal isOpen={true} onClose={mockOnClose} />)

    const copyDiagBtn = screen.getByRole("button", { name: /copiar diagnóstico/i })
    fireEvent.click(copyDiagBtn)

    expect(navigator.clipboard.writeText).toHaveBeenCalled()
    expect(await screen.findByText("✓ ¡Copiado al portapapeles!")).toBeInTheDocument()
  })

  it("calls onClose when pressing Escape key", () => {
    render(<SupportModal isOpen={true} onClose={mockOnClose} />)

    fireEvent.keyDown(document, { key: "Escape" })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it("calls onClose when clicking close button", () => {
    render(<SupportModal isOpen={true} onClose={mockOnClose} />)

    const closeBtn = screen.getByRole("button", { name: /cerrar modal de soporte/i })
    fireEvent.click(closeBtn)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it("renders privacy policy card and triggers onOpenPrivacy when clicked", () => {
    const mockOnOpenPrivacy = vi.fn()
    render(<SupportModal isOpen={true} onClose={mockOnClose} onOpenPrivacy={mockOnOpenPrivacy} />)

    expect(screen.getByText("Política de Privacidad")).toBeInTheDocument()
    const privacyBtn = screen.getByRole("button", { name: /leer política/i })
    expect(privacyBtn).toBeInTheDocument()

    fireEvent.click(privacyBtn)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
    expect(mockOnOpenPrivacy).toHaveBeenCalledTimes(1)
  })

  it("renders terms of service action and calls onOpenTerms when clicked", () => {
    const mockOnOpenTerms = vi.fn()
    render(<SupportModal isOpen={true} onClose={mockOnClose} onOpenTerms={mockOnOpenTerms} />)

    expect(screen.getByText("Condiciones del Servicio")).toBeInTheDocument()
    const termsBtn = screen.getByRole("button", { name: /ver términos/i })
    expect(termsBtn).toBeInTheDocument()

    fireEvent.click(termsBtn)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
    expect(mockOnOpenTerms).toHaveBeenCalledTimes(1)
  })
})
