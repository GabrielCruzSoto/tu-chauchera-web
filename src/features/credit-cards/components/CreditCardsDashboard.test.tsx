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
})
