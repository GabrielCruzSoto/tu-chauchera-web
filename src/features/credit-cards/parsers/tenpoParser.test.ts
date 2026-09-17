import { describe, it, expect } from 'vitest'
import { parseTenpoStatementText } from './tenpoParser'

describe('tenpoParser', () => {
  it('parses metadata such as digital/physical card digits, due date, closing date and total billed', () => {
    const rawText = `
      ESTADO DE CUENTA DE TARJETA DE CRÉDITO
      Tenpo Payments S.A
      Nombre del Titular: GABRIEL ALEJANDRO CRUZ SOTO
      N° Tarjeta de Crédito Digital: 5155xxxxxxxx1784
      N° Tarjeta de Crédito Física: 5155********8910
      Fecha Estado de Cuenta: 20/08/2026
      Periodo Facturado: Desde 21/07/2026 Hasta 20/08/2026
      Pagar Hasta: 05/09/2026
      Monto Total Facturado (o a Pagar) (A+B+C+D): $363.447
    `

    const result = parseTenpoStatementText(rawText)
    expect(result.institution).toBe('TENPO')
    expect(result.closingDate).toBe('2026-08-20')
    expect(result.dueDate).toBe('2026-09-05')
    expect(result.totalBilledCents).toBe(363447)
  })

  it('filters out card payments and abonos', () => {
    const rawText = `
      Pagar Hasta: 05/09/2026
      null   31/07/2026   PAGO DE TARJETA DE CRÉDITO   $-227.633   $-227.633   01/01   $-227.633
      null   21/07/2026   PAYU UBER TRIP SANTIAGO CH   Digital   $5.696   $5.696   00/00   $5.696
    `

    const result = parseTenpoStatementText(rawText)
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0]?.description).toBe('PAYU UBER TRIP SANTIAGO CH')
    expect(result.transactions[0]?.amountCents).toBe(5696)
  })

  it('correctly handles multi-line wrapped descriptions, interest percentages, and installment periods', () => {
    const rawText = `
      N° Tarjeta de Crédito Digital: 5155xxxxxxxx1784
      N° Tarjeta de Crédito Física: 5155********8910
      Pagar Hasta: 05/09/2026

      null   02/02/2026   MERCADOPAGO SUPLESPO LAS CONDES
      CH (3,00%)   Digital   $92.980   $112.200   07/12   $9.350

      null   31/03/2026   C VESPUCIO URGENCIAS SANTIAGO CH
      (0,00%)   Física   $200.000   $200.000   05/12   $16.666

      null   02/08/2026   CASINO - LOTERIA DE CONCEPCION
      CONCEPCION CH   $10.000   $10.000   00/00   $10.000
    `

    const result = parseTenpoStatementText(rawText)
    expect(result.transactions).toHaveLength(3)

    // Transaction 1: Digital, 7/12 cuotas, interest cleaned from description
    const tx1 = result.transactions[0]
    expect(tx1?.date).toBe('2026-02-02')
    expect(tx1?.description).toBe('MERCADOPAGO SUPLESPO LAS CONDES CH')
    expect(tx1?.currentInstallment).toBe(7)
    expect(tx1?.totalInstallments).toBe(12)
    expect(tx1?.amountCents).toBe(112200)
    expect(tx1?.suggestedPlasticLastFour).toBe('1784')
    expect(tx1?.firstInstallmentPeriod).toBe('2026-03')

    // Transaction 2: Física, 5/12 cuotas
    const tx2 = result.transactions[1]
    expect(tx2?.date).toBe('2026-03-31')
    expect(tx2?.description).toBe('C VESPUCIO URGENCIAS SANTIAGO CH')
    expect(tx2?.currentInstallment).toBe(5)
    expect(tx2?.totalInstallments).toBe(12)
    expect(tx2?.amountCents).toBe(200000)
    expect(tx2?.suggestedPlasticLastFour).toBe('8910')
    expect(tx2?.firstInstallmentPeriod).toBe('2026-05')

    // Transaction 3: Single payment without card type
    const tx3 = result.transactions[2]
    expect(tx3?.date).toBe('2026-08-02')
    expect(tx3?.description).toBe('CASINO - LOTERIA DE CONCEPCION CONCEPCION CH')
    expect(tx3?.currentInstallment).toBe(1)
    expect(tx3?.totalInstallments).toBe(1)
    expect(tx3?.amountCents).toBe(10000)
    expect(tx3?.suggestedPlasticLastFour).toBeUndefined()
  })

  it('correctly parses charges, taxes and administrative fees', () => {
    const rawText = `
      Pagar Hasta: 05/09/2026
      null   03/08/2026   IMPUESTO DECRETO LEY 3475 TASA
      0,066%   $101   $101   01/01   $101
      null   20/08/2026   COSTO DE ADMINISTRACIÓN MENSUAL   $1.990   $1.990   01/01   $1.990
      null   20/08/2026   INTERÉS POR CARGO INMEDIATO   $391   $391   01/01   $391
    `

    const result = parseTenpoStatementText(rawText)
    expect(result.transactions).toHaveLength(3)

    expect(result.transactions[0]?.description).toBe('IMPUESTO DECRETO LEY 3475 TASA 0,066%')
    expect(result.transactions[0]?.amountCents).toBe(101)

    expect(result.transactions[1]?.description).toBe('COSTO DE ADMINISTRACIÓN MENSUAL')
    expect(result.transactions[1]?.amountCents).toBe(1990)

    expect(result.transactions[2]?.description).toBe('INTERÉS POR CARGO INMEDIATO')
    expect(result.transactions[2]?.amountCents).toBe(391)
  })
})
