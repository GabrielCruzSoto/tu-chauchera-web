import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { WipeConfirmModal } from "./WipeConfirmModal"

describe("WipeConfirmModal", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <WipeConfirmModal
        isOpen={false}
        isLoading={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("disables confirmation button until exact phrase is typed", () => {
    const handleConfirm = vi.fn().mockResolvedValue(undefined)
    render(
      <WipeConfirmModal
        isOpen={true}
        isLoading={false}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
      />
    )

    const confirmBtn = screen.getByRole("button", { name: /eliminar bóveda y resetear/i })
    expect(confirmBtn).toBeDisabled()

    const input = screen.getByPlaceholderText("ELIMINAR MIS DATOS")
    fireEvent.change(input, { target: { value: "ELIMINAR" } })
    expect(confirmBtn).toBeDisabled()

    fireEvent.change(input, { target: { value: "ELIMINAR MIS DATOS" } })
    expect(confirmBtn).not.toBeDisabled()

    fireEvent.click(confirmBtn)
    expect(handleConfirm).toHaveBeenCalledTimes(1)
  })

  it("calls onClose when cancel button is clicked", () => {
    const handleClose = vi.fn()
    render(
      <WipeConfirmModal
        isOpen={true}
        isLoading={false}
        onClose={handleClose}
        onConfirm={vi.fn()}
      />
    )

    const cancelBtn = screen.getByRole("button", { name: /cancelar/i })
    fireEvent.click(cancelBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
