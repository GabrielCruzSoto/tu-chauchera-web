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
    expect(result.transactions[0]?.date).toBe('2026-04-15')
    expect(result.transactions[0]?.description).toBe('FALABELLA PARQUE ARAUCO')
    expect(result.transactions[0]?.currentInstallment).toBe(3)
    expect(result.transactions[0]?.totalInstallments).toBe(12)
    expect(result.transactions[0]?.amountCents).toBe(45990)

    // Transaction 2 (Single payment, no installments mentioned)
    expect(result.transactions[1]?.date).toBe('2026-04-18')
    expect(result.transactions[1]?.description).toBe('LIDER EXPRESS')
    expect(result.transactions[1]?.currentInstallment).toBe(1)
    expect(result.transactions[1]?.totalInstallments).toBe(1)
    expect(result.transactions[1]?.amountCents).toBe(12500)

    // Transaction 3
    expect(result.transactions[2]?.date).toBe('2026-04-22')
    expect(result.transactions[2]?.description).toBe('PARIS COSTANERA')
    expect(result.transactions[2]?.currentInstallment).toBe(1)
    expect(result.transactions[2]?.totalInstallments).toBe(6)
    expect(result.transactions[2]?.amountCents).toBe(28990)
  })

  it('correctly parses official CMR Falabella PDF statements with location prefixes, deferred installments, and charges', () => {
    const rawText = `
      Fecha Facturación Estado de Cuenta:   19/05/2026
      Pagar hasta   05/06/2026
      Monto total facturado a pagar   41.570

      COMPRAS NACIONALES
      La Florida   14/05/2026   Tuu*area 51 La Florida   T   30.000   30.000   01/03   jun-2026   10.000
      Santiago   15/05/2026   Pronto Pte Alto   T   5.170   5.170   01/01   jun-2026   5.170
      Las Condes   15/05/2026   Mercadopago *sociedad   T   2.700   2.700   01/01   jun-2026   2.700
      Santiago   15/05/2026   Gladis   T   3.000   3.000   01/01   jun-2026   3.000
      Cordillera   15/05/2026   Carnicero Portales   T   10.920   10.920   01/01   jun-2026   10.920

      OTROS
      S/I   14/05/2026   Hip Lider Cordillera   30.772   33.619   00/03   jul-2026
      S/I   15/05/2026   Hip Lider Santa Amalia   164.859   189.301   00/06   jul-2026
      S/I   15/05/2026   Tatanes 2   50.900   55.635   00/03   jul-2026
      S/I   15/05/2026   Copec Asistido   40.000   43.721   00/03   jul-2026

      2.3 Cargos, Comisiones, Impuestos y Abonos
      19/05/2026   Servicio Administracion   8.889   8.889   01/01   8.889
      19/05/2026   Impuesto ITE D.L N°3475 0,8% Anual   894   894   894

      Evolución Montos Facturados y Pagados
      00/00/0000 00/00/0000 00/00/0000 00/00/0000 00/00/0000 19/05/2026
      $6.928
      $13.857
      $20.785
      $27.713
      $34.642
      $41.570

      Vencimiento próximos 4 meses
      Actual   05/07/2026   05/08/2026   05/09/2026   05/10/2026
      Próximo Período a Facturar   20/05/2026   19/06/2026
    `

    const result = parseFalabellaStatementText(rawText)

    expect(result.closingDate).toBe('2026-05-19')
    expect(result.dueDate).toBe('2026-06-05')
    expect(result.totalBilledCents).toBe(41570)

    // 5 Compras nacionales + 4 diferidas (00/XX) + 2 cargos = 11 transacciones
    expect(result.transactions).toHaveLength(11)

    // Check national purchases
    expect(result.transactions[0]).toMatchObject({
      date: '2026-05-14',
      description: 'Tuu*area 51 La Florida',
      currentInstallment: 1,
      totalInstallments: 3,
      amountCents: 30000,
      firstInstallmentPeriod: '2026-06',
    })

    expect(result.transactions[1]).toMatchObject({
      date: '2026-05-15',
      description: 'Pronto Pte Alto',
      currentInstallment: 1,
      totalInstallments: 1,
      amountCents: 5170,
      firstInstallmentPeriod: '2026-06',
    })

    expect(result.transactions[2]).toMatchObject({
      date: '2026-05-15',
      description: 'Mercadopago *sociedad',
      currentInstallment: 1,
      totalInstallments: 1,
      amountCents: 2700,
      firstInstallmentPeriod: '2026-06',
    })

    expect(result.transactions[3]).toMatchObject({
      date: '2026-05-15',
      description: 'Gladis',
      currentInstallment: 1,
      totalInstallments: 1,
      amountCents: 3000,
      firstInstallmentPeriod: '2026-06',
    })

    expect(result.transactions[4]).toMatchObject({
      date: '2026-05-15',
      description: 'Carnicero Portales',
      currentInstallment: 1,
      totalInstallments: 1,
      amountCents: 10920,
      firstInstallmentPeriod: '2026-06',
    })

    // Check deferred purchases
    expect(result.transactions[5]).toMatchObject({
      date: '2026-05-14',
      description: 'Hip Lider Cordillera',
      currentInstallment: 0,
      totalInstallments: 3,
      amountCents: 33619,
      firstInstallmentPeriod: '2026-07',
    })

    expect(result.transactions[6]).toMatchObject({
      date: '2026-05-15',
      description: 'Hip Lider Santa Amalia',
      currentInstallment: 0,
      totalInstallments: 6,
      amountCents: 189301,
      firstInstallmentPeriod: '2026-07',
    })

    // Check charges
    expect(result.transactions[9]).toMatchObject({
      date: '2026-05-19',
      description: 'Servicio Administracion',
      currentInstallment: 1,
      totalInstallments: 1,
      amountCents: 8889,
    })

    expect(result.transactions[10]).toMatchObject({
      date: '2026-05-19',
      description: 'Impuesto ITE D.L N°3475 0,8% Anual',
      currentInstallment: 1,
      totalInstallments: 1,
      amountCents: 894,
    })
  })
})

