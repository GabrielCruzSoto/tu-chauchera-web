import { describe, it, expect } from 'vitest'
import { parseStatementText } from './statementParser'

describe('statementParser dispatcher', () => {
  it('dispatches to Falabella parser when CMR/Falabella text is provided', () => {
    const rawText = `
      ESTADO DE CUENTA CMR BANCO FALABELLA
      15/04/2026 FALABELLA PARQUE ARAUCO 03/12 $ 45.990
    `
    const result = parseStatementText(rawText)
    expect(result.institution).toBe('BANCO_FALABELLA')
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0]?.description).toBe('FALABELLA PARQUE ARAUCO')
  })

  it('dispatches to Tenpo parser when Tenpo text is provided', () => {
    const rawText = `
      ESTADO DE CUENTA DE TARJETA DE CRÉDITO
      Tenpo Payments S.A
      Pagar Hasta: 05/09/2026
      null 21/07/2026 PAYU UBER TRIP SANTIAGO CH Digital $5.696 $5.696 00/00 $5.696
    `
    const result = parseStatementText(rawText)
    expect(result.institution).toBe('TENPO')
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0]?.description).toBe('PAYU UBER TRIP SANTIAGO CH')
  })

  it('uses institution hint when text is ambiguous', () => {
    const rawText = `
      null 21/07/2026 PAYU UBER TRIP SANTIAGO CH Digital $5.696 $5.696 00/00 $5.696
    `
    const result = parseStatementText(rawText, 'Tenpo')
    expect(result.institution).toBe('TENPO')
    expect(result.transactions).toHaveLength(1)
  })

  it('rejects unsupported banks like Banco Santander with clear error message', () => {
    const rawText = `
      BANCO SANTANDER CHILE - ESTADO DE CUENTA TARJETA DE CREDITO
      01/05/2026 FARMACIAS AHUMADA $ 15.000
    `
    const result = parseStatementText(rawText)
    expect(result.institution).toBe('UNSUPPORTED')
    expect(result.isSupported).toBe(false)
    expect(result.detectedInstitution).toBe('Banco Santander')
    expect(result.errorMessage).toContain('Banco Santander')
    expect(result.transactions).toHaveLength(0)
  })

  it('rejects unsupported banks like Banco de Chile with clear error message', () => {
    const rawText = `
      BANCO DE CHILE - DETALLE DE MOVIMIENTOS VISA INFINITE
      10/05/2026 JUMBO LA REINA $ 80.000
    `
    const result = parseStatementText(rawText)
    expect(result.institution).toBe('UNSUPPORTED')
    expect(result.isSupported).toBe(false)
    expect(result.detectedInstitution).toBe('Banco de Chile')
    expect(result.errorMessage).toContain('Banco de Chile')
    expect(result.transactions).toHaveLength(0)
  })

  it('returns unsupported error when raw text does not match any known institution or format', () => {
    const rawText = `
      Texto aleatorio sin compras ni formato bancario reconocido.
    `
    const result = parseStatementText(rawText)
    expect(result.institution).toBe('UNSUPPORTED')
    expect(result.isSupported).toBe(false)
    expect(result.transactions).toHaveLength(0)
  })
})
