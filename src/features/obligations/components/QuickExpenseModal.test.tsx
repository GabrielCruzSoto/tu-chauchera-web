import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuickExpenseModal } from './QuickExpenseModal'
import { useObligationsStore } from '../store/obligationsSlice'

describe('QuickExpenseModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useObligationsStore.setState({
      obligations: {},
      installments: {},
      categories: {
        'cat-alim': {
          id: 'cat-alim',
          name: 'Alimentación',
          color: 'emerald',
          createdAt: '',
          updatedAt: '',
        },
        'cat-transporte': {
          id: 'cat-transporte',
          name: 'Transporte',
          color: 'blue',
          createdAt: '',
          updatedAt: '',
        },
      },
      isLoaded: true,
    })
  })

  it('does not render when isOpen is false', () => {
    render(<QuickExpenseModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders with accessible fields when isOpen is true', () => {
    render(<QuickExpenseModal isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Gasto Rápido/i })).toBeInTheDocument()

    // Form inputs and their labels
    expect(screen.getByLabelText(/Monto del Gasto/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Descripción \/ Comercio/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Categoría/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Fecha/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Detalle \/ Comprobante/i)).toBeInTheDocument()
  })

  it('closes when Cancelar button is clicked', () => {
    const onClose = vi.fn()
    render(<QuickExpenseModal isOpen={true} onClose={onClose} />)

    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' })
    fireEvent.click(cancelBtn)
    expect(onClose).toHaveBeenCalled()
  })

  it('submits a quick expense and persists it in the obligations store', () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()
    render(<QuickExpenseModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />)

    // Amount
    const amountInput = screen.getByLabelText(/Monto del Gasto/i)
    fireEvent.change(amountInput, { target: { value: '8500' } })

    // Description
    const descInput = screen.getByLabelText(/Descripción \/ Comercio/i)
    fireEvent.change(descInput, { target: { value: 'Almuerzo Café Tavelli' } })

    // Category
    const catSelect = screen.getByLabelText(/Categoría/i)
    fireEvent.change(catSelect, { target: { value: 'cat-alim' } })

    // Payment method: Cash
    const cashBtn = screen.getByRole('button', { name: /Efectivo/i })
    fireEvent.click(cashBtn)

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Guardar Gasto/i })
    fireEvent.click(submitBtn)

    const state = useObligationsStore.getState()
    const createdObligations = Object.values(state.obligations)
    expect(createdObligations).toHaveLength(1)

    const obl = createdObligations[0]!
    expect(obl.type).toBe('EXPENSE')
    expect(obl.status).toBe('PAID')
    expect(obl.subcategory).toBe('Almuerzo Café Tavelli')
    expect(obl.installmentAmountCents).toBe(8500)
    expect(obl.totalAmountCents).toBe(8500)
    expect(obl.totalInstallments).toBe(1)
    expect(obl.detail).toContain('Efectivo')

    const installments = Object.values(state.installments).filter(i => i.obligationId === obl.id)
    expect(installments).toHaveLength(1)
    expect(installments[0]?.status).toBe('PAID')
    expect(installments[0]?.amountCents).toBe(8500)

    expect(onSuccess).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})
