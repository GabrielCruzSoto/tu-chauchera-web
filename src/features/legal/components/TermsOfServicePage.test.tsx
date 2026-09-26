import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { TermsOfServicePage } from "./TermsOfServicePage"

describe("TermsOfServicePage Component", () => {
  const mockOnBack = vi.fn()
  const mockOnNavigateToPrivacy = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    window.scrollTo = vi.fn()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    })
  })

  it("renders main title, badges and key sections", () => {
    render(<TermsOfServicePage onBack={mockOnBack} onNavigateToPrivacy={mockOnNavigateToPrivacy} />)

    expect(screen.getByRole("heading", { level: 1, name: /condiciones del servicio y términos de uso/i })).toBeInTheDocument()
    expect(screen.getByText(/Vigente \(v1\.0\.0\)/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Local-First & Zero-Backend/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Sin Intermediación Financiera/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Legislación Chilena/i)).toBeInTheDocument()

    // Table of contents and section titles
    expect(screen.getAllByText(/1\. Aceptación de/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/4\. Descargo Financiero/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/6\. Bóveda Criptográfica/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/13\. Ley/i).length).toBeGreaterThanOrEqual(1)
  })

  it("calls onBack when clicking Volver button", () => {
    render(<TermsOfServicePage onBack={mockOnBack} onNavigateToPrivacy={mockOnNavigateToPrivacy} />)

    const backBtn = screen.getByRole("button", { name: /volver a la aplicación/i })
    expect(backBtn).toBeInTheDocument()

    fireEvent.click(backBtn)
    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  it("calls onNavigateToPrivacy when clicking Privacy navigation button", () => {
    render(<TermsOfServicePage onBack={mockOnBack} onNavigateToPrivacy={mockOnNavigateToPrivacy} />)

    const privacyBtns = screen.getAllByRole("button", { name: /política de privacidad/i })
    expect(privacyBtns.length).toBeGreaterThanOrEqual(1)

    fireEvent.click(privacyBtns[0]!)
    expect(mockOnNavigateToPrivacy).toHaveBeenCalledTimes(1)
  })

  it("copies link to clipboard when clicking Copiar Enlace", async () => {
    render(<TermsOfServicePage onBack={mockOnBack} onNavigateToPrivacy={mockOnNavigateToPrivacy} />)

    const copyBtn = screen.getByRole("button", { name: /copiar enlace/i })
    fireEvent.click(copyBtn)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining("/terminos"))
    expect(await screen.findByText("✓ Copiado")).toBeInTheDocument()
  })

  it("handles markdown download trigger", () => {
    const createObjectURLMock = vi.fn(() => "blob:mock-url")
    const revokeObjectURLMock = vi.fn()
    global.URL.createObjectURL = createObjectURLMock
    global.URL.revokeObjectURL = revokeObjectURLMock

    render(<TermsOfServicePage onBack={mockOnBack} onNavigateToPrivacy={mockOnNavigateToPrivacy} />)

    const downloadBtn = screen.getByRole("button", { name: /descargar documento en markdown/i })
    expect(downloadBtn).toBeInTheDocument()

    fireEvent.click(downloadBtn)
    expect(createObjectURLMock).toHaveBeenCalled()
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url")
  })

  it("scrolls to section when clicking an item from table of contents", () => {
    const scrollIntoViewMock = vi.fn()
    const targetElem = document.createElement("div")
    targetElem.id = "seccion-4"
    targetElem.scrollIntoView = scrollIntoViewMock
    document.body.appendChild(targetElem)

    render(<TermsOfServicePage onBack={mockOnBack} onNavigateToPrivacy={mockOnNavigateToPrivacy} />)

    const tocItemBtn = screen.getByRole("button", { name: /4\. Descargo Financiero/i })
    fireEvent.click(tocItemBtn)

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth", block: "start" })
    document.body.removeChild(targetElem)
  })
})
