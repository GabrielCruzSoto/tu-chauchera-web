import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { CreditCardPurchaseModal } from './CreditCardPurchaseModal'
import { useCreditCardStore } from '../store/creditCardSlice'
import { toMoney } from '@/shared/types/money'
import type { CreditCardAccount, CreditCardPurchase } from '@/shared/types/domain'

describe('CreditCardPurchaseModal', () => {
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
    ],
    paidPeriods: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  }

  const mockPurchase: CreditCardPurchase = {
    id: 'purch-1',
    accountId: 'account-1',
    plasticId: 'plastic-1',
    description: 'Suscripción Streaming',
    purchaseDate: '2026-05-10',
    firstInstallmentPeriod: '2026-06',
    totalAmountCents: toMoney(15000),
    totalInstallments: 1,
    payerType: 'PROPIO',
    createdAt: '2026-05-10',
    updatedAt: '2026-05-10',
  }

  beforeEach(() => {
    useCreditCardStore.setState({
      accounts: { [mockAccount.id]: mockAccount },
      purchases: { [mockPurchase.id]: mockPurchase },
      isLoaded: true,
    })
  })

  it('renders creation mode when editingPurchase is not provided', () => {
    render(<CreditCardPurchaseModal isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByText('🛍️ Cargar Compra con Tarjeta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cargar Compra' })).toBeInTheDocument()
  })

  it('renders modification mode when editingPurchase is provided and updates purchase', () => {
    const onClose = vi.fn()
    render(
      <CreditCardPurchaseModal isOpen={true} editingPurchase={mockPurchase} onClose={onClose} />,
    )

    expect(screen.getByText('✏️ Modificar Compra con Tarjeta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar Cambios' })).toBeInTheDocument()

    const descInput = screen.getByPlaceholderText(/ej. Falabella/i)
    expect(descInput).toHaveValue('Suscripción Streaming')

    fireEvent.change(descInput, { target: { value: 'Suscripción Anual Streaming' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }))

    expect(useCreditCardStore.getState().purchases['purch-1']?.description).toBe(
      'Suscripción Anual Streaming',
    )
    expect(onClose).toHaveBeenCalled()
  })

  it('switches between Gasto Propio and Tercero in edit mode', () => {
    render(
      <CreditCardPurchaseModal isOpen={true} editingPurchase={mockPurchase} onClose={vi.fn()} />,
    )

    const thirdPartyBtn = screen.getByRole('button', { name: /Presté la Tarjeta/i })
    fireEvent.click(thirdPartyBtn)

    const personInput = screen.getByPlaceholderText(/ej. Juan Pérez/i)
    expect(personInput).toBeInTheDocument()

    fireEvent.change(personInput, { target: { value: 'Camila' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }))

    const updated = useCreditCardStore.getState().purchases['purch-1']
    expect(updated?.payerType).toBe('TERCERO')
    expect(updated?.thirdPartyReceivable?.thirdPartyName).toBe('Camila')
  })
})
