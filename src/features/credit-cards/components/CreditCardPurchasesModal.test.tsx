import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { CreditCardPurchasesModal } from './CreditCardPurchasesModal'
import { useCreditCardStore } from '../store/creditCardSlice'
import { offsetPeriod } from '../utils/cycleCalculators'
import { toMoney } from '@/shared/types/money'
import { getLocalISODate, getLocalPeriod } from '@/shared/utils/date'
import type { CreditCardAccount, CreditCardPurchase } from '@/shared/types/domain'

describe('CreditCardPurchasesModal', () => {
  const mockAccount: CreditCardAccount = {
    id: 'account-1',
    institution: 'Banco de Chile',
    accountName: 'Visa Signature',
    creditLimitCents: toMoney(3000000),
    hasInternationalLimit: false,
    closingDay: 20,
    dueDay: 5,
    plastics: [
      {
        id: 'plastic-1',
        accountId: 'account-1',
        holderName: 'Gabriel Cruz',
        lastFourDigits: '1234',
        type: 'TITULAR',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'plastic-2',
        accountId: 'account-1',
        holderName: 'Laura Soto',
        lastFourDigits: '5678',
        type: 'ADICIONAL',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
    paidPeriods: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  }

  const todayStr = getLocalISODate()
  const currentMonthPeriod = getLocalPeriod()
  const prevMonthPeriod = offsetPeriod(currentMonthPeriod, -1)

  const mockPurchases: CreditCardPurchase[] = [
    {
      id: 'purch-1',
      accountId: 'account-1',
      plasticId: 'plastic-1',
      description: 'Supermercado Lider',
      purchaseDate: todayStr,
      firstInstallmentPeriod: currentMonthPeriod,
      totalAmountCents: toMoney(60000),
      totalInstallments: 3,
      payerType: 'PROPIO',
      createdAt: todayStr,
      updatedAt: todayStr,
    },
    {
      id: 'purch-2',
      accountId: 'account-1',
      plasticId: 'plastic-2',
      description: 'Farmacia Cruz Verde',
      purchaseDate: '2026-01-10',
      firstInstallmentPeriod: '2026-02',
      totalAmountCents: toMoney(20000),
      totalInstallments: 1,
      payerType: 'PROPIO',
      createdAt: '2026-01-10',
      updatedAt: '2026-01-10',
    },
  ]

  beforeEach(() => {
    useCreditCardStore.setState({
      accounts: { [mockAccount.id]: mockAccount },
      purchases: {
        'purch-1': mockPurchases[0]!,
        'purch-2': mockPurchases[1]!,
      },
      isLoaded: true,
    })
  })

  it('renders default 3-month window with Mes Anterior, Mes Actual and Próximo Mes', () => {
    render(
      <CreditCardPurchasesModal
        isOpen={true}
        account={mockAccount}
        purchases={mockPurchases}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText(/Matriz de Compras y Cuotas — Visa Signature/i)).toBeInTheDocument()

    // Contextual badges
    expect(screen.getByText('Mes Anterior')).toBeInTheDocument()
    expect(screen.getByText('Mes Actual')).toBeInTheDocument()
    expect(screen.getByText('Próximo Mes')).toBeInTheDocument()

    // Purchases in current view
    expect(screen.getByText('Supermercado Lider')).toBeInTheDocument()
    expect(screen.getByText('Cuota 1/3')).toBeInTheDocument()
  })

  it('allows indicating custom period count via numeric input', () => {
    render(
      <CreditCardPurchasesModal
        isOpen={true}
        account={mockAccount}
        purchases={mockPurchases}
        onClose={vi.fn()}
      />,
    )

    const periodInput = screen.getByLabelText(/Indicar cantidad de períodos a mostrar/i)
    expect(periodInput).toHaveValue(3)

    fireEvent.change(periodInput, { target: { value: '6' } })
    expect(periodInput).toHaveValue(6)

    // Should now show 6 columns
    const paymentButtons = screen.getAllByRole('button', { name: /Marcar Pago/i })
    expect(paymentButtons.length).toBe(6)
  })

  it('allows indicating starting period via Desde input', () => {
    render(
      <CreditCardPurchasesModal
        isOpen={true}
        account={mockAccount}
        purchases={mockPurchases}
        onClose={vi.fn()}
      />,
    )

    const startInput = screen.getByLabelText(/Indicar período inicial/i)
    fireEvent.change(startInput, { target: { value: '2026-02' } })

    // Old purchase in 2026-02 should now have its installment visible
    expect(screen.getByText('Farmacia Cruz Verde')).toBeInTheDocument()
    expect(screen.getByText('Cuota 1/1')).toBeInTheDocument()
  })

  it('navigates periods backward, forward, and resets with Hoy', () => {
    render(
      <CreditCardPurchasesModal
        isOpen={true}
        account={mockAccount}
        purchases={mockPurchases}
        onClose={vi.fn()}
      />,
    )

    const startInput = screen.getByLabelText(/Indicar período inicial/i)
    expect(startInput).toHaveValue(prevMonthPeriod)

    // Click backward (←)
    const prevBtn = screen.getByRole('button', { name: 'Mes anterior' })
    fireEvent.click(prevBtn)
    expect(startInput).toHaveValue(offsetPeriod(prevMonthPeriod, -1))

    // Click forward (→)
    const nextBtn = screen.getByRole('button', { name: 'Mes siguiente' })
    fireEvent.click(nextBtn)
    expect(startInput).toHaveValue(prevMonthPeriod)

    // Click forward again
    fireEvent.click(nextBtn)
    expect(startInput).toHaveValue(currentMonthPeriod)

    // Click Hoy
    const hoyBtn = screen.getByRole('button', { name: 'Hoy' })
    fireEvent.click(hoyBtn)
    expect(startInput).toHaveValue(prevMonthPeriod)
  })

  it('switches periods using 3M, 6M, 12M, 24M preset buttons', () => {
    render(
      <CreditCardPurchasesModal
        isOpen={true}
        account={mockAccount}
        purchases={mockPurchases}
        onClose={vi.fn()}
      />,
    )

    const periodInput = screen.getByLabelText(/Indicar cantidad de períodos a mostrar/i)

    fireEvent.click(screen.getByRole('button', { name: '6M' }))
    expect(periodInput).toHaveValue(6)

    fireEvent.click(screen.getByRole('button', { name: '12M' }))
    expect(periodInput).toHaveValue(12)

    fireEvent.click(screen.getByRole('button', { name: '24M' }))
    expect(periodInput).toHaveValue(24)

    fireEvent.click(screen.getByRole('button', { name: '3M' }))
    expect(periodInput).toHaveValue(3)
  })

  it('navigates to earliest purchase when clicking Primera compra shortcut', () => {
    render(
      <CreditCardPurchasesModal
        isOpen={true}
        account={mockAccount}
        purchases={mockPurchases}
        onClose={vi.fn()}
      />,
    )

    const shortcut = screen.getByRole('button', { name: /⏪ Primera compra/i })
    fireEvent.click(shortcut)

    const startInput = screen.getByLabelText(/Indicar período inicial/i)
    expect(startInput).toHaveValue('2026-02')
  })

  it('filters by plastic', () => {
    render(
      <CreditCardPurchasesModal
        isOpen={true}
        account={mockAccount}
        purchases={mockPurchases}
        onClose={vi.fn()}
      />,
    )

    const plasticSelect = screen.getByLabelText(/Plástico:/i)
    fireEvent.change(plasticSelect, { target: { value: 'plastic-1' } })

    expect(screen.getByText('Supermercado Lider')).toBeInTheDocument()
    expect(screen.queryByText('Farmacia Cruz Verde')).not.toBeInTheDocument()
  })

  it('renders Acciones column with edit and delete buttons for purchases', () => {
    render(
      <CreditCardPurchasesModal
        isOpen={true}
        account={mockAccount}
        purchases={mockPurchases}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole('columnheader', { name: 'Acciones' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Modificar compra Supermercado Lider' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Eliminar compra Supermercado Lider' }),
    ).toBeInTheDocument()
  })

  it('deletes a purchase when confirmed by user', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <CreditCardPurchasesModal
        isOpen={true}
        account={mockAccount}
        purchases={mockPurchases}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText('Supermercado Lider')).toBeInTheDocument()

    const deleteBtn = screen.getByRole('button', { name: 'Eliminar compra Supermercado Lider' })
    fireEvent.click(deleteBtn)

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('Supermercado Lider'))
    expect(useCreditCardStore.getState().purchases['purch-1']).toBeUndefined()
    expect(screen.queryByText('Supermercado Lider')).not.toBeInTheDocument()

    confirmSpy.mockRestore()
  })

  it('does not delete a purchase if user cancels confirmation', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(
      <CreditCardPurchasesModal
        isOpen={true}
        account={mockAccount}
        purchases={mockPurchases}
        onClose={vi.fn()}
      />,
    )

    const deleteBtn = screen.getByRole('button', { name: 'Eliminar compra Supermercado Lider' })
    fireEvent.click(deleteBtn)

    expect(confirmSpy).toHaveBeenCalled()
    expect(useCreditCardStore.getState().purchases['purch-1']).toBeDefined()
    expect(screen.getByText('Supermercado Lider')).toBeInTheDocument()

    confirmSpy.mockRestore()
  })

  it('opens edit modal and modifies purchase successfully', () => {
    render(
      <CreditCardPurchasesModal
        isOpen={true}
        account={mockAccount}
        purchases={mockPurchases}
        onClose={vi.fn()}
      />,
    )

    const editBtn = screen.getByRole('button', { name: 'Modificar compra Supermercado Lider' })
    fireEvent.click(editBtn)

    // Edit modal should open with current description
    expect(screen.getByText('✏️ Modificar Compra con Tarjeta')).toBeInTheDocument()
    const descInput = screen.getByPlaceholderText(/ej. Falabella/i)
    expect(descInput).toHaveValue('Supermercado Lider')

    // Change description and submit
    fireEvent.change(descInput, { target: { value: 'Supermercado Lider Express' } })
    const saveBtn = screen.getByRole('button', { name: 'Guardar Cambios' })
    fireEvent.click(saveBtn)

    // Store and matrix table should reflect the update
    expect(useCreditCardStore.getState().purchases['purch-1']?.description).toBe(
      'Supermercado Lider Express',
    )
    expect(screen.getByText('Supermercado Lider Express')).toBeInTheDocument()
  })

  it('opens new purchase modal when clicking + Cargar Compra in header', () => {
    render(
      <CreditCardPurchasesModal
        isOpen={true}
        account={mockAccount}
        purchases={mockPurchases}
        onClose={vi.fn()}
      />,
    )

    const addBtn = screen.getByRole('button', { name: '+ Cargar Compra' })
    fireEvent.click(addBtn)

    expect(screen.getByText('🛍️ Cargar Compra con Tarjeta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cargar Compra' })).toBeInTheDocument()
  })
})
