import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { StorageQuotaModal } from './StorageQuotaModal'

describe('StorageQuotaModal', () => {
  it('renders modal with header, description, tips, link, and action buttons when open', () => {
    const handleClose = vi.fn()
    const handleRetry = vi.fn()

    render(<StorageQuotaModal isOpen={true} onClose={handleClose} onRetry={handleRetry} />)

    // Header & badge
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /Espacio insuficiente en Google Drive/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Almacenamiento lleno/i)).toBeInTheDocument()

    // Description text
    expect(screen.getByText(/cuota de almacenamiento disponible/i)).toBeInTheDocument()
    expect(screen.getByText('Google Drive')).toBeInTheDocument()
    expect(screen.getByText('Gmail')).toBeInTheDocument()
    expect(screen.getByText('Google Fotos')).toBeInTheDocument()

    // Tips
    expect(screen.getByText(/Vaciar papeleras/i)).toBeInTheDocument()
    expect(screen.getByText(/Archivos pesados en Gmail/i)).toBeInTheDocument()
    expect(screen.getByText(/has:attachment larger:10M/i)).toBeInTheDocument()

    // External link
    const link = screen.getByRole('link', { name: /Liberar espacio en Google/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://one.google.com/storage')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')

    // Buttons
    expect(screen.getByRole('button', { name: /Entendido/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reintentar sincronización/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cerrar modal/i })).toBeInTheDocument()
  })

  it('does not render anything when isOpen is false', () => {
    const handleClose = vi.fn()
    const { container } = render(<StorageQuotaModal isOpen={false} onClose={handleClose} />)

    expect(container.firstChild).toBeNull()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it("calls onClose when clicking the 'Entendido' button", () => {
    const handleClose = vi.fn()
    render(<StorageQuotaModal isOpen={true} onClose={handleClose} />)

    fireEvent.click(screen.getByRole('button', { name: /Entendido/i }))
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it("calls onClose when clicking the top-right close 'X' button", () => {
    const handleClose = vi.fn()
    render(<StorageQuotaModal isOpen={true} onClose={handleClose} />)

    fireEvent.click(screen.getByRole('button', { name: /Cerrar modal/i }))
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it("calls onRetry when clicking 'Reintentar sincronización'", () => {
    const handleClose = vi.fn()
    const handleRetry = vi.fn()
    render(<StorageQuotaModal isOpen={true} onClose={handleClose} onRetry={handleRetry} />)

    fireEvent.click(screen.getByRole('button', { name: /Reintentar sincronización/i }))
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when pressing the Escape key', () => {
    const handleClose = vi.fn()
    render(<StorageQuotaModal isOpen={true} onClose={handleClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when clicking the modal backdrop', () => {
    const handleClose = vi.fn()
    render(<StorageQuotaModal isOpen={true} onClose={handleClose} />)

    const dialogBackdrop = screen.getByRole('dialog')
    fireEvent.click(dialogBackdrop)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when clicking inside the modal content box', () => {
    const handleClose = vi.fn()
    render(<StorageQuotaModal isOpen={true} onClose={handleClose} />)

    const title = screen.getByRole('heading', { name: /Espacio insuficiente en Google Drive/i })
    fireEvent.click(title)
    expect(handleClose).not.toHaveBeenCalled()
  })
})
