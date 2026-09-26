import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { PrivacyPolicyPage } from "./PrivacyPolicyPage"

describe("PrivacyPolicyPage Component", () => {
  const mockOnBack = vi.fn()

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
    render(<PrivacyPolicyPage onBack={mockOnBack} />)

    expect(screen.getByRole("heading", { level: 1, name: /política de privacidad de tu chauchera/i })).toBeInTheDocument()
    expect(screen.getByText(/Vigente \(v1\.0\.0\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Local-First & Zero-Backend/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Cifrado AES-256-GCM/i).length).toBeGreaterThanOrEqual(1)

    // Table of contents and section titles
    expect(screen.getAllByText(/1\. Introducción y Responsable/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/2\. Datos Personales Recopilados/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/5\. Arquitectura Técnica y Seguridad/i).length).toBeGreaterThanOrEqual(1)
  })

  it("calls onBack when clicking Volver button", () => {
    render(<PrivacyPolicyPage onBack={mockOnBack} />)

    const backBtn = screen.getByRole("button", { name: /volver a la aplicación/i })
    expect(backBtn).toBeInTheDocument()

    fireEvent.click(backBtn)
    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  it("copies link to clipboard when clicking Copiar Enlace", async () => {
    render(<PrivacyPolicyPage onBack={mockOnBack} />)

    const copyBtn = screen.getByRole("button", { name: /copiar enlace/i })
    fireEvent.click(copyBtn)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining("/privacidad"))
    expect(await screen.findByText("✓ Copiado")).toBeInTheDocument()
  })

  it("handles markdown download trigger", () => {
    const createObjectURLMock = vi.fn(() => "blob:mock-url")
    const revokeObjectURLMock = vi.fn()
    global.URL.createObjectURL = createObjectURLMock
    global.URL.revokeObjectURL = revokeObjectURLMock

    render(<PrivacyPolicyPage onBack={mockOnBack} />)

    const downloadBtn = screen.getByRole("button", { name: /descargar documento en markdown/i })
    expect(downloadBtn).toBeInTheDocument()

    fireEvent.click(downloadBtn)
    expect(createObjectURLMock).toHaveBeenCalled()
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url")
  })

  it("scrolls to section when clicking an item from table of contents", () => {
    const scrollIntoViewMock = vi.fn()
    const targetElem = document.createElement("div")
    targetElem.id = "seccion-5"
    targetElem.scrollIntoView = scrollIntoViewMock
    document.body.appendChild(targetElem)

    render(<PrivacyPolicyPage onBack={mockOnBack} />)

    const tocItemBtn = screen.getByRole("button", { name: /5\. Arquitectura Técnica y Seguridad/i })
    fireEvent.click(tocItemBtn)

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth", block: "start" })
    document.body.removeChild(targetElem)
  })
})
