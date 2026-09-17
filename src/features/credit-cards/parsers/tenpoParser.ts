import { toMoney, type Money } from '@/shared/types/money'
import type { ParsedStatementTransaction, ParsedStatementResult } from './falabellaParser'

/**
 * Parses raw text extracted from a Tenpo credit card account statement (PDF or text).
 */
export function parseTenpoStatementText(rawText: string): ParsedStatementResult {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const transactions: ParsedStatementTransaction[] = []

  let closingDate: string | undefined = undefined
  let dueDate: string | undefined = undefined
  let totalBilledCents: Money | undefined = undefined

  // Extract digital and physical card last 4 digits
  let digitalLastFour: string | undefined = undefined
  let physicalLastFour: string | undefined = undefined

  const cardMatches = [...rawText.matchAll(/5155[xX*]+(\d{4})/g)]
  if (cardMatches.length >= 2) {
    digitalLastFour = cardMatches[0]?.[1]
    physicalLastFour = cardMatches[1]?.[1]
  } else if (cardMatches.length === 1) {
    digitalLastFour = cardMatches[0]?.[1]
  }

  // Header metadata scan
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const nextLine = lines[i + 1] ?? ''

    if (line.includes('Fecha Estado de Cuenta') || line.includes('Fecha de Cierre')) {
      const m = (line + ' ' + nextLine).match(/([0-3]\d)[/-]([0-1]\d)[/-]((?:20|19)\d{2})/)
      if (m?.[1] && m[2] && m[3]) {
        closingDate = `${m[3]}-${m[2]}-${m[1]}`
      }
    }

    if (line.includes('Pagar Hasta') || line.toLowerCase().includes('fecha de vencimiento')) {
      const m = (line + ' ' + nextLine).match(/([0-3]\d)[/-]([0-1]\d)[/-]((?:20|19)\d{2})/)
      if (m?.[1] && m[2] && m[3]) {
        dueDate = `${m[3]}-${m[2]}-${m[1]}`
      }
    }

    if (line.includes('Monto Total Facturado')) {
      const m = (line + ' ' + nextLine).match(/\$\s*([\d.]+)/)
      if (m?.[1]) {
        const val = parseInt(m[1].replace(/\./g, ''), 10)
        if (!isNaN(val)) {
          totalBilledCents = toMoney(val)
        }
      }
    }
  }

  // Group multiline transaction rows
  const dateRegex = /^(?:null\s+)?([0-3]\d)[/-]([0-1]\d)[/-]((?:20|19)\d{2})\b/
  const txBlocks: string[][] = []
  let currentBlock: string[] | null = null

  const isStopSection = (line: string) =>
    line.startsWith('Total de compras') ||
    line.startsWith('Total de pagos') ||
    line.startsWith('Total pagos') ||
    line.startsWith('III. Información') ||
    line.startsWith('IV. Costos') ||
    line.startsWith('Evolución Montos') ||
    line.startsWith('Infórmese sobre') ||
    line.startsWith('ESTADO DE CUENTA') ||
    line.startsWith('Tenpo Payments') ||
    line.startsWith('2. Productos o Servicios') ||
    line.startsWith('Vencimiento Próximos') ||
    line.startsWith('Periodo Facturado') ||
    line.startsWith('Periodo de Facturación') ||
    line.startsWith('Saldo Adeudado') ||
    line.startsWith('Monto Facturado') ||
    line.startsWith('Cupo Total')

  for (const line of lines) {
    if (isStopSection(line)) {
      if (currentBlock) {
        txBlocks.push(currentBlock)
        currentBlock = null
      }
      continue
    }

    const dateMatch = line.match(dateRegex)
    if (dateMatch) {
      if (currentBlock) {
        txBlocks.push(currentBlock)
      }
      currentBlock = [line]
    } else if (currentBlock) {
      currentBlock.push(line)
    }
  }
  if (currentBlock) {
    txBlocks.push(currentBlock)
  }

  // Process transaction blocks
  for (const block of txBlocks) {
    const combined = block.join(' ').replace(/\s+/g, ' ').trim()
    const dateMatch = combined.match(dateRegex)
    if (!dateMatch?.[1] || !dateMatch[2] || !dateMatch[3]) continue

    const day = dateMatch[1]
    const month = dateMatch[2]
    const year = dateMatch[3]
    const formattedDate = `${year}-${month}-${day}`

    // Skip payments and abonos to the card
    if (
      combined.toUpperCase().includes('PAGO DE TARJETA') ||
      combined.toUpperCase().includes('TOTAL DE PAGOS') ||
      combined.includes('$-')
    ) {
      continue
    }

    // Tenpo standard statement line pattern:
    // [null]? [DD/MM/YYYY] [DESCRIPCIÓN] [Digital|Física]? $[montoOp] $[montoTotal] [cuotaActual/cuotaTotal] $[valorCuota]
    const standardMatch = combined.match(
      /(?:(Digital|F[ií]sica)\s+)?\$\s*([\d.]+)\s+\$\s*([\d.]+)\s+(\d{1,2}\/\d{1,2})\s+\$\s*([\d.]+)$/i
    )

    let description: string
    let amountCents: number
    let currentInstallment = 1
    let totalInstallments = 1
    let plasticType: string | undefined = undefined

    if (standardMatch) {
      plasticType = standardMatch[1]
      const montoOp = parseInt((standardMatch[2] ?? '').replace(/\./g, ''), 10)
      const montoTotal = parseInt((standardMatch[3] ?? '').replace(/\./g, ''), 10)
      const cuotaStr = standardMatch[4] ?? '00/00'

      const [cCurStr, cTotStr] = cuotaStr.split('/')
      const cCur = parseInt(cCurStr ?? '0', 10)
      const cTot = parseInt(cTotStr ?? '0', 10)

      if (cTot === 0 || (cCur === 1 && cTot === 1)) {
        currentInstallment = 1
        totalInstallments = 1
        amountCents = montoTotal || montoOp
      } else {
        currentInstallment = cCur
        totalInstallments = cTot
        amountCents = montoTotal || montoOp
      }

      const descStartIndex = dateMatch[0].length
      const descEndIndex = standardMatch.index ?? combined.length
      description = combined.substring(descStartIndex, descEndIndex).trim()
    } else {
      // Fallback matching for manual copy-paste or irregular lines
      const instMatch = combined.match(/\b(\d{1,2})\/(\d{1,2})\b/)
      const amountMatches = [...combined.matchAll(/(?:\$|\b)([\d.]+)/g)]
      if (amountMatches.length === 0) continue

      const lastAmountStr = amountMatches[amountMatches.length - 1]?.[1] ?? '0'
      amountCents = parseInt(lastAmountStr.replace(/\./g, ''), 10)

      if (instMatch?.[1] && instMatch[2]) {
        const cCur = parseInt(instMatch[1], 10)
        const cTot = parseInt(instMatch[2], 10)
        if (cTot === 0 || (cCur === 1 && cTot === 1)) {
          currentInstallment = 1
          totalInstallments = 1
        } else {
          currentInstallment = cCur
          totalInstallments = cTot
        }
      }

      const descStart = dateMatch[0].length
      const descEnd = instMatch ? instMatch.index : amountMatches[0]?.index
      description = combined.substring(descStart, descEnd).trim()
    }

    if (isNaN(amountCents) || amountCents <= 0) continue

    // Clean up merchant description: remove interest percentage tag like "(3,20%)" or "(0,00%)"
    description = description
      .replace(/\s*\(\d+,\d+%\)$/, '')
      .replace(/^[$\s-]+/, '')
      .replace(/[$\s-]+$/, '')
      .replace(/\s{2,}/g, ' ')
      .trim()

    if (!description) {
      description = 'Compra Tarjeta Tenpo'
    }

    // Determine plastic attribution
    let suggestedPlasticLastFour: string | undefined = undefined
    if (plasticType) {
      if (/digital/i.test(plasticType)) {
        suggestedPlasticLastFour = digitalLastFour
      } else if (/f[ií]sica/i.test(plasticType)) {
        suggestedPlasticLastFour = physicalLastFour
      }
    }

    // Calculate firstInstallmentPeriod if installments and dueDate are available
    let firstInstallmentPeriod: string | undefined = undefined
    if (dueDate && totalInstallments > 1) {
      const [dueYStr = '2026', dueMStr = '01'] = dueDate.split('-')
      const dueY = parseInt(dueYStr, 10)
      const dueM = parseInt(dueMStr, 10)

      let startYear = dueY
      let startMonth = dueM - (currentInstallment - 1)
      while (startMonth < 1) {
        startMonth += 12
        startYear -= 1
      }
      firstInstallmentPeriod = `${startYear}-${String(startMonth).padStart(2, '0')}`
    }

    transactions.push({
      id: crypto.randomUUID(),
      date: formattedDate,
      description,
      currentInstallment,
      totalInstallments,
      amountCents: toMoney(amountCents),
      firstInstallmentPeriod,
      suggestedPlasticLastFour,
      isThirdParty: false,
      selected: true,
    })
  }

  return {
    institution: 'TENPO',
    closingDate,
    dueDate,
    totalBilledCents,
    transactions,
  }
}
