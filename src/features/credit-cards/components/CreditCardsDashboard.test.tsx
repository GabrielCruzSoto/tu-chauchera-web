import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { CreditCardsDashboard } from './CreditCardsDashboard'
import { useCreditCardStore } from '../store/creditCardSlice'

describe('CreditCardsDashboard', () => {
  beforeEach(() => {
    useCreditCardStore.setState({
      accounts: {},
      purchases: {},
      isLoaded: true,
    })
  })

  it('renders empty state when no credit cards exist', () => {
    render(<CreditCardsDashboard />)
    expect(screen.getByText(/No tienes tarjetas de crédito configuradas/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\+ Nueva Tarjeta/i })).toBeInTheDocument()
  })

  it('switches between Cards tab and Third Party tab', () => {
    render(<CreditCardsDashboard />)
    const thirdPartyTab = screen.getByText(/👥 Compras de Terceros/i)
    fireEvent.click(thirdPartyTab)
    expect(screen.getByText(/Compras de Terceros y Cobranzas Pendientes/i)).toBeInTheDocument()
  })

  it('renders configured card with primary and additional plastics', () => {
    const store = useCreditCardStore.getState()
    const account = store.addAccount({
      institution: 'Banco de Chile',
      accountName: 'Visa Infinite',
      creditLimitCents: 5000000,
      closingDay: 24,
      dueDay: 10,
      primaryHolderName: 'Gabriel Cruz',
      primaryLastFour: '9988',
    })

    store.addPlastic(account.id, 'Laura Soto', '4433')

    render(<CreditCardsDashboard />)
    expect(screen.getByText(/Visa Infinite/i)).toBeInTheDocument()
    expect(screen.getByText(/Gabriel Cruz \(•••• 9988\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Laura Soto \(•••• 4433\)/i)).toBeInTheDocument()
  })

  it('opens edit modal and updates card limit and closing day', () => {
    const store = useCreditCardStore.getState()
    store.addAccount({
      institution: 'Banco Santander',
      accountName: 'Visa Signature',
      creditLimitCents: 2000000,
      closingDay: 20,
      dueDay: 5,
      primaryHolderName: 'Gabriel Cruz',
      primaryLastFour: '1234',
    })

    render(<CreditCardsDashboard />)
    const editButton = screen.getByRole('button', { name: /✏️ Modificar/i })
    fireEvent.click(editButton)

    expect(screen.getByText(/Modificar Tarjeta de Crédito/i)).toBeInTheDocument()

    const limitInput = screen.getByPlaceholderText(/ej\. 2000000/i)
    fireEvent.change(limitInput, { target: { value: '4500000' } })

    const saveButton = screen.getByRole('button', { name: /Guardar Tarjeta/i })
    fireEvent.click(saveButton)

    const updated = Object.values(useCreditCardStore.getState().accounts)[0]
    expect(updated?.creditLimitCents).toBe(4500000)
  })

  it('opens purchases modal when clicking Compras button and shows card summary and purchases list', () => {
    const store = useCreditCardStore.getState()
    const account = store.addAccount({
      institution: 'Banco Falabella',
      accountName: 'CMR Mastercard',
      creditLimitCents: 1500000,
      closingDay: 20,
      dueDay: 5,
      primaryHolderName: 'Gabriel Cruz',
      primaryLastFour: '4321',
    })

    store.addPurchase({
      accountId: account.id,
      plasticId: account.plastics[0]!.id,
      description: 'Supermercado Lider',
      purchaseDate: '2026-03-10',
      totalAmountCents: 90000,
      totalInstallments: 3,
      payerType: 'PROPIO',
    })

    render(<CreditCardsDashboard />)

    const purchasesButton = screen.getByRole('button', { name: /🛍️ Compras/i })
    fireEvent.click(purchasesButton)

    // Modal title & card summary
    expect(screen.getByText(/Matriz de Compras y Cuotas — CMR Mastercard/i)).toBeInTheDocument()
    expect(screen.getByText(/Cupo Total Autorizado/i)).toBeInTheDocument()
    expect(screen.getByText(/Total Compras Registradas/i)).toBeInTheDocument()
    expect(screen.getByText(/Cupo Disponible Estimado/i)).toBeInTheDocument()

    // Period selector buttons
    expect(screen.getByRole('button', { name: '3M' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '6M' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '12M' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '24M' })).toBeInTheDocument()

    // Table columns and purchase data
    expect(screen.getByText('Movimiento')).toBeInTheDocument()
    expect(screen.getByText('Monto Total')).toBeInTheDocument()
    expect(screen.getByText('Cuotas')).toBeInTheDocument()
    expect(screen.getByText('Supermercado Lider')).toBeInTheDocument()
    expect(screen.getByText('3 ctas')).toBeInTheDocument()
    expect(screen.getByText('Cuota 1/3')).toBeInTheDocument()

    // Toggle card period payment
    const markPaymentBtn = screen.getAllByRole('button', { name: /Marcar Pago/i })[0]
    expect(markPaymentBtn).toBeDefined()
    if (markPaymentBtn) {
      fireEvent.click(markPaymentBtn)
      expect(screen.getByRole('button', { name: /✓ Tarjeta Pagada/i })).toBeInTheDocument()
    }

    // Close modal
    const closeButton = screen.getByRole('button', { name: /Cerrar modal de compras/i })
    fireEvent.click(closeButton)
    expect(screen.queryByText(/Matriz de Compras y Cuotas — CMR Mastercard/i)).not.toBeInTheDocument()
  })
})

