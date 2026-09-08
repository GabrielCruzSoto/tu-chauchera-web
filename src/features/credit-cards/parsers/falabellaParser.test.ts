import { describe, it, expect } from 'vitest'
import { parseFalabellaStatementText } from './falabellaParser'

describe('falabellaParser', () => {
  it('parses metadata such as due date, closing date and total billed', () => {
    const rawText = `
      ESTADO DE CUENTA CMR BANCO FALABELLA
      FECHA FACTURACION: 20/04/2026
      PAGAR HASTA: 05/05/2026
      TOTAL FACTURADO: $ 125.400
    `

    const result = parseFalabellaStatementText(rawText)
    expect(result.closingDate).toBe('2026-04-20')
    expect(result.dueDate).toBe('2026-05-05')
    expect(result.totalBilledCents).toBe(125400)
  })

  it('parses transactions with installments and single payments', () => {
    const rawText = `
      15/04/2026 FALABELLA PARQUE ARAUCO 03/12 $ 45.990
      18/04/2026 LIDER EXPRESS $ 12.500
      22/04/2026 PARIS COSTANERA 01/06 28.990
    `

    const result = parseFalabellaStatementText(rawText)
    expect(result.transactions).toHaveLength(3)

    // Transaction 1
    expect(result.transactions[0].date).toBe('2026-04-15')
    expect(result.transactions[0].description).toBe('FALABELLA PARQUE ARAUCO')
    expect(result.transactions[0].currentInstallment).toBe(3)
    expect(result.transactions[0].totalInstallments).toBe(12)
    expect(result.transactions[0].amountCents).toBe(45990)

    // Transaction 2 (Single payment, no installments mentioned)
    expect(result.transactions[1].date).toBe('2026-04-18')
    expect(result.transactions[1].description).toBe('LIDER EXPRESS')
    expect(result.transactions[1].currentInstallment).toBe(1)
    expect(result.transactions[1].totalInstallments).toBe(1)
    expect(result.transactions[1].amountCents).toBe(12500)

    // Transaction 3
    expect(result.transactions[2].date).toBe('2026-04-22')
    expect(result.transactions[2].description).toBe('PARIS COSTANERA')
    expect(result.transactions[2].currentInstallment).toBe(1)
    expect(result.transactions[2].totalInstallments).toBe(6)
    expect(result.transactions[2].amountCents).toBe(28990)
  })
})
