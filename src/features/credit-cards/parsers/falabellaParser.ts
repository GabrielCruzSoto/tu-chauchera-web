import { toMoney, type Money } from '@/shared/types/money'

export interface ParsedStatementTransaction {
  id: string
  date: string                  // YYYY-MM-DD
  description: string
  currentInstallment: number    // e.g., 3
  totalInstallments: number      // e.g., 12
  amountCents: Money
  suggestedPlasticLastFour?: string | undefined
  isThirdParty: boolean
  thirdPartyName?: string | undefined
  selected: boolean
}

export interface ParsedStatementResult {
  institution: 'BANCO_FALABELLA'
  closingDate?: string | undefined
  dueDate?: string | undefined
  totalBilledCents?: Money | undefined
  transactions: ParsedStatementTransaction[]
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
  const dateRegex = /(\d{2})[-/](\d{2})[-/](\d{4})/
  const installmentRegex = /(\d{1,2})\/(\d{1,2})/
  const amountRegex = /\$?\s*([\d.]+)(?:,\d{2})?\s*$/

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    // Detect Metadata
    if (line.toLowerCase().includes('pagar hasta') || line.toLowerCase().includes('vencimiento')) {
      const match = line.match(dateRegex)
      if (match) {
        dueDate = `${match[3]}-${match[2]}-${match[1]}`
      }
    }

    if (line.toLowerCase().includes('fecha facturacion') || line.toLowerCase().includes('fecha de cierre')) {
      const match = line.match(dateRegex)
      if (match) {
        closingDate = `${match[3]}-${match[2]}-${match[1]}`
      }
    }

    if (line.toLowerCase().includes('total facturado') || line.toLowerCase().includes('total a pagar')) {
      const amountMatch = line.match(/\$?\s*([\d.]+)/)
      if (amountMatch) {
        const cleanAmount = parseInt(amountMatch[1].replace(/\./g, ''), 10)
        if (!isNaN(cleanAmount)) {
          totalBilledCents = toMoney(cleanAmount)
        }
      }
    }

    // Check if line starts with a date (candidate for transaction)
    const dateMatch = line.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/)
    if (dateMatch) {
      const formattedDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
      const restOfLine = line.substring(dateMatch[0].length).trim()

      // Extract amount from the end of the line
      const amountMatch = restOfLine.match(/\$?\s*([\d.]+)\s*$/)
      if (!amountMatch) continue

      const rawAmountStr = amountMatch[1].replace(/\./g, '')
      const numericAmount = parseInt(rawAmountStr, 10)
      if (isNaN(numericAmount) || numericAmount <= 0) continue

      // Content between date and amount
      const middleContent = restOfLine.substring(0, restOfLine.length - amountMatch[0].length).trim()

      // Extract installments if present (e.g. 03/12 or 1/3)
      const instMatch = middleContent.match(installmentRegex)
      let currentInst = 1
      let totalInst = 1
      let description = middleContent

      if (instMatch) {
        currentInst = parseInt(instMatch[1], 10)
        totalInst = parseInt(instMatch[2], 10)
        // Remove installment string from description
        description = middleContent.replace(instMatch[0], '').trim()
      }

      // Cleanup description
      description = description.replace(/^-\s*/, '').replace(/\s{2,}/g, ' ').trim()
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
        isThirdParty: false,
        selected: true,
      })
    }
  }

  return {
    institution: 'BANCO_FALABELLA',
    closingDate,
    dueDate,
    totalBilledCents,
    transactions,
  }
}
