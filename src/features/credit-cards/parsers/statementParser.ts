import {
  parseFalabellaStatementText,
  type ParsedStatementResult,
  type ParsedStatementTransaction,
} from './falabellaParser'
import { parseTenpoStatementText } from './tenpoParser'

export type { ParsedStatementResult, ParsedStatementTransaction }

const UNSUPPORTED_INSTITUTIONS: Record<string, string> = {
  santander: 'Banco Santander',
  'banco de chile': 'Banco de Chile',
  edwards: 'Banco Edwards',
  bci: 'BCI',
  bancoestado: 'BancoEstado',
  'banco estado': 'BancoEstado',
  scotiabank: 'Scotiabank',
  itau: 'Banco Itaú',
  itaú: 'Banco Itaú',
  cencosud: 'Cencosud Scotiabank',
  ripley: 'Banco Ripley',
  bice: 'Banco BICE',
  security: 'Banco Security',
  consorcio: 'Banco Consorcio',
  coopeuch: 'Coopeuch',
}

/**
 * Detects statement institution and parses text accordingly.
 * Supported institutions: CMR / Banco Falabella and Tenpo.
 * Explicitly rejects unsupported banking institutions with a clear message.
 */
export function parseStatementText(
  rawText: string,
  institutionHint?: string,
): ParsedStatementResult {
  const lowerText = rawText.toLowerCase()
  const lowerHint = (institutionHint ?? '').toLowerCase()

  // 1. Check if the statement or hint matches an unsupported institution
  for (const [key, displayName] of Object.entries(UNSUPPORTED_INSTITUTIONS)) {
    if (lowerText.includes(key) || lowerHint.includes(key)) {
      // Ensure it doesn't accidentally trigger if it's Falabella or Tenpo
      const hasFalabella = lowerText.includes('falabella') || lowerText.includes('cmr')
      const hasTenpo = lowerText.includes('tenpo')
      if (!hasFalabella && !hasTenpo) {
        return {
          institution: 'UNSUPPORTED',
          isSupported: false,
          detectedInstitution: displayName,
          errorMessage: `La institución ${displayName} aún no tiene un parser automatizado de estado de cuenta. Actualmente soportamos CMR Banco Falabella y Tarjetas Tenpo.`,
          transactions: [],
        }
      }
    }
  }

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

  if (isFalabella) {
    const res = parseFalabellaStatementText(rawText)
    if (res.transactions.length > 0) return res
  }

  // Test Tenpo first, if valid transactions found return it
  const tenpoResult = parseTenpoStatementText(rawText)
  if (tenpoResult.transactions.length > 0) {
    return tenpoResult
  }

  // Test Falabella
  const falabellaResult = parseFalabellaStatementText(rawText)
  if (falabellaResult.transactions.length > 0) {
    return falabellaResult
  }

  // Not recognized as supported
  return {
    institution: 'UNSUPPORTED',
    isSupported: false,
    errorMessage:
      'No se reconoció el formato del estado de cuenta o la institución emisora no es soportada. Actualmente soportamos estados de cuenta de CMR Falabella y Tenpo.',
    transactions: [],
  }
}
