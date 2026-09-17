import { toMoney, type Money } from '@/shared/types/money'

export interface ParsedStatementTransaction {
  id: string
  date: string                  // YYYY-MM-DD
  description: string
  currentInstallment: number    // e.g., 3
  totalInstallments: number      // e.g., 12
  amountCents: Money
  firstInstallmentPeriod?: string | undefined // e.g. "2026-06" or "2026-07"
  suggestedPlasticLastFour?: string | undefined
  isThirdParty: boolean
  thirdPartyName?: string | undefined
  selected: boolean
}

export interface ParsedStatementResult {
  institution: 'BANCO_FALABELLA' | 'TENPO' | string
  closingDate?: string | undefined
  dueDate?: string | undefined
  totalBilledCents?: Money | undefined
  transactions: ParsedStatementTransaction[]
}

const MONTH_MAP: Record<string, string> = {
  ene: '01',
  feb: '02',
  mar: '03',
  abr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  ago: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dic: '12',
}

/**
 * Parses raw text extracted from a CMR Banco Falabella account statement.
 * Supports multiple lines with formats like:
 * "15/04/2026 FALABELLA PARQUE ARAUCO 03/12 $ 45.990"
 * "20/04/2026 LIDER EXPRESS 01/01 $ 12.500"
 * "22/04/2026 NETFLIX 8.990"
 */
export function parseFalabellaStatementText(rawText: string): ParsedStatementResult {
  const lines = rawText.split(/\r?\n/)
  const transactions: ParsedStatementTransaction[] = []

  let closingDate: string | undefined = undefined
  let dueDate: string | undefined = undefined
  let totalBilledCents: Money | undefined = undefined

  // Common Falabella patterns
  const dateRegex = /(?:^|\s)([0-3]\d)[/-]([0-1]\d)[/-]((?:20|19)\d{2})(?:\s|$)/
  const installmentRegex = /\b(\d{1,2})\/(\d{1,2})\b/
  const monthPeriodRegex = /\b([a-z]{3})-(\d{4})\b/i

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    // Filter out chart axis / legends / future forecast tables
    if (
      line.includes('00/00/0000') ||
      line.toLowerCase().includes('evolución') ||
      line.toLowerCase().includes('prepago') ||
      line.toLowerCase().includes('puntos') ||
      line.toLowerCase().includes('vencimiento próximos') ||
      line.toLowerCase().includes('próximo período')
    ) {
      if (line.toLowerCase().includes('pagar hasta') || line.toLowerCase().includes('vencimiento')) {
        const match = line.match(dateRegex)
        if (match && match[1] !== '00' && match[2] !== '00') {
          dueDate = `${match[3]}-${match[2]}-${match[1]}`
        }
      }
      continue
    }

    // Detect Metadata
    if (line.toLowerCase().includes('pagar hasta') || line.toLowerCase().includes('vencimiento')) {
      const match = line.match(dateRegex)
      if (match && match[1] !== '00' && match[2] !== '00') {
        dueDate = `${match[3]}-${match[2]}-${match[1]}`
      }
    }

    if (
      line.toLowerCase().includes('fecha facturacion') ||
      line.toLowerCase().includes('fecha de cierre') ||
      line.toLowerCase().includes('fecha facturación')
    ) {
      const match = line.match(dateRegex)
      if (match && match[1] !== '00' && match[2] !== '00') {
        closingDate = `${match[3]}-${match[2]}-${match[1]}`
      }
    }

    if (line.toLowerCase().includes('total facturado') || line.toLowerCase().includes('total a pagar')) {
      const amountMatch = line.match(/(?:\$|\b)([\d.]+)/)
      if (amountMatch?.[1]) {
        const cleanAmount = parseInt(amountMatch[1].replace(/\./g, ''), 10)
        if (!isNaN(cleanAmount)) {
          totalBilledCents = toMoney(cleanAmount)
        }
      }
    }

    // Skip non-transaction headers and summaries
    const lower = line.toLowerCase()
    if (
      lower.startsWith('lugar') ||
      lower.startsWith('operación') ||
      lower.startsWith('fecha') ||
      lower.startsWith('período') ||
      lower.startsWith('tasas') ||
      lower.startsWith('actual') ||
      lower.includes('cupo') ||
      lower.includes('interés') ||
      lower.includes('sin movimientos')
    ) {
      continue
    }

    // Check if line contains a valid transaction date (at start or preceded by place name like "Santiago", "La Florida", "S/I")
    const dateMatch = line.match(dateRegex)
    if (!dateMatch) continue

    const day = dateMatch[1]
    const month = dateMatch[2]
    const year = dateMatch[3]

    // Discard placeholder/invalid dates like 00/00/0000
    if (day === '00' || month === '00') continue

    const formattedDate = `${year}-${month}-${day}`
    const dateIndex = dateMatch.index !== undefined ? dateMatch.index + (dateMatch[0].startsWith(' ') ? 1 : 0) : 0
    const restOfLine = line.substring(dateIndex + dateMatch[0].trim().length).trim()
    if (!restOfLine) continue

    // Extract installments if present (e.g. 01/03, 00/03, 03/12, 1/1)
    const instMatch = restOfLine.match(installmentRegex)
    let currentInst = 1
    let totalInst = 1
    let hasInstallment = false

    if (instMatch?.[1] && instMatch[2]) {
      currentInst = parseInt(instMatch[1], 10)
      totalInst = parseInt(instMatch[2], 10)
      hasInstallment = true
    }

    // Extract first installment period if explicitly stated (e.g. "jun-2026" or "jul-2026")
    const periodMatch = restOfLine.match(monthPeriodRegex)
    let firstInstallmentPeriod: string | undefined = undefined
    if (periodMatch?.[1] && periodMatch[2]) {
      const monthPrefix = periodMatch[1].toLowerCase()
      const yearStr = periodMatch[2]
      const monthNumber = MONTH_MAP[monthPrefix]
      if (monthNumber) {
        firstInstallmentPeriod = `${yearStr}-${monthNumber}`
      }
    }

    let numericAmount = 0
    let description = ''

    if (hasInstallment && instMatch) {
      const instIndex = instMatch.index ?? 0
      const beforeInst = restOfLine.substring(0, instIndex).trim()
      const afterInst = restOfLine.substring(instIndex + instMatch[0].length).trim()

      // In official CMR tables, beforeInst has: [Desc] [Plastic T/A]? [Monto Operacion] [Monto Total a Pagar]
      const trailingAmountsMatch = beforeInst.match(/(?:\s+[TA])?\s+([\d.]+)(?:\s+([\d.]+))?$/)
      if (trailingAmountsMatch?.[1]) {
        const num1 = parseInt(trailingAmountsMatch[1].replace(/\./g, ''), 10)
        const num2 = trailingAmountsMatch[2] ? parseInt(trailingAmountsMatch[2].replace(/\./g, ''), 10) : undefined
        // If two numbers, num2 is Monto Total a Pagar (including interest). Otherwise num1.
        numericAmount = num2 !== undefined && !isNaN(num2) ? num2 : num1
        description = beforeInst.substring(0, trailingAmountsMatch.index).trim()
      } else {
        // Fallback: amount might be after the installment (e.g. simple format "03/12 $ 45.990")
        description = beforeInst
        const afterAmountMatch = afterInst.match(/(?:\$|\b)([\d.]+)\s*$/)
        if (afterAmountMatch?.[1]) {
          numericAmount = parseInt(afterAmountMatch[1].replace(/\./g, ''), 10)
        }
      }

      description = description.replace(/\s+[TA]$/, '').trim()
    } else {
      // Single payment or tax/charge without installment
      const trailingAmountMatch = restOfLine.match(/(?:\$|\b)([\d.]+)\s*$/)
      if (trailingAmountMatch?.[1]) {
        numericAmount = parseInt(trailingAmountMatch[1].replace(/\./g, ''), 10)
        let remaining = restOfLine.substring(0, restOfLine.length - trailingAmountMatch[0].length).trim()
        remaining = remaining.replace(/\b[a-z]{3}-\d{4}\b/i, '').trim()
        let clean = remaining.replace(/\s+[\d.]+(\s+[\d.]+)*\s*$/, '').trim()
        clean = clean.replace(/\s+[TA]\s*$/, '').trim()
        description = clean
      }
    }

    if (isNaN(numericAmount) || numericAmount <= 0) continue

    // Clean up description symbols, repeated spaces and punctuation
    description = description
      .replace(/^[$\s-]+/, '')
      .replace(/[$\s-]+$/, '')
      .replace(/\s{2,}/g, ' ')
      .trim()

    if (!description) {
      description = 'Compra CMR Falabella'
    }

    transactions.push({
      id: crypto.randomUUID(),
      date: formattedDate,
      description,
      currentInstallment: currentInst,
      totalInstallments: totalInst,
      amountCents: toMoney(numericAmount),
      firstInstallmentPeriod,
      isThirdParty: false,
      selected: true,
    })
  }

  return {
    institution: 'BANCO_FALABELLA',
    closingDate,
    dueDate,
    totalBilledCents,
    transactions,
  }
}
