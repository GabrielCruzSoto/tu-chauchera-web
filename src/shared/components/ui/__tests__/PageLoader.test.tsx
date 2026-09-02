import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Spinner } from "../Spinner"
import { PageLoader } from "../PageLoader"

describe("Spinner Component", () => {
  it("renders with default props and accessibility attributes", () => {
    render(<Spinner />)
    const spinner = screen.getByRole("status")
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveAttribute("aria-label", "Cargando...")
    expect(screen.getByText("Cargando...")).toBeInTheDocument()
  })

  it("renders with custom label, size and color", () => {
    render(<Spinner size="lg" color="white" label="Procesando pago..." />)
    const spinner = screen.getByRole("status")
    expect(spinner).toHaveAttribute("aria-label", "Procesando pago...")
    expect(screen.getByText("Procesando pago...")).toBeInTheDocument()
  })
})

describe("PageLoader Component", () => {
  it("renders page loader with spinner and text", () => {
    render(<PageLoader text="Cargando página..." />)
    const loader = screen.getByTestId("page-loader")
    expect(loader).toBeInTheDocument()
    expect(screen.getByText("Cargando página...")).toBeInTheDocument()
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("renders fullScreen overlay when fullScreen prop is set", () => {
    render(<PageLoader fullScreen text="Cargando..." />)
    const loader = screen.getByTestId("page-loader")
    expect(loader).toHaveClass("fixed", "inset-0", "z-50")
  })
})
