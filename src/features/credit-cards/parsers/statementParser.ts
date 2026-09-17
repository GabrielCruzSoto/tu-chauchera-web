import { parseFalabellaStatementText, type ParsedStatementResult, type ParsedStatementTransaction } from './falabellaParser'
import { parseTenpoStatementText } from './tenpoParser'

export type { ParsedStatementResult, ParsedStatementTransaction }

/**
 * Detects statement institution and parses text accordingly.
 * Supported institutions: CMR / Banco Falabella and Tenpo.
 */
export function parseStatementText(
  rawText: string,
  institutionHint?: string
): ParsedStatementResult {
  const lowerText = rawText.toLowerCase()
  const lowerHint = (institutionHint ?? '').toLowerCase()

  const isTenpo = lowerText.includes('tenpo') || lowerHint.includes('tenpo')
  const isFalabella =
    lowerText.includes('falabella') ||
    lowerText.includes('cmr') ||
    lowerHint.includes('falabella') ||
    lowerHint.includes('cmr')

  // Explicit single match
  if (isTenpo && !isFalabella) {
    return parseTenpoStatementText(rawText)
  }
  if (isFalabella && !isTenpo) {
    return parseFalabellaStatementText(rawText)
  }

  // Check unique keywords in text content
  if (
    lowerText.includes('tenpo payments') ||
    lowerText.includes('tarjeta de crédito digital') ||
    lowerText.includes('total de compras nacionales') ||
    lowerText.includes('cuotizacion compra')
  ) {
    return parseTenpoStatementText(rawText)
  }

  if (
    lowerText.includes('banco falabella') ||
    lowerText.includes('tarjetas cmr') ||
    lowerText.includes('cmr puntos')
  ) {
    return parseFalabellaStatementText(rawText)
  }

  // Priority based on hint if both or neither matched
  if (isTenpo) {
    const res = parseTenpoStatementText(rawText)
    if (res.transactions.length > 0) return res
  }

  // Fallback: test Tenpo first, if no transactions test Falabella
  const tenpoResult = parseTenpoStatementText(rawText)
  if (tenpoResult.transactions.length > 0) {
    return tenpoResult
  }

  return parseFalabellaStatementText(rawText)
}
