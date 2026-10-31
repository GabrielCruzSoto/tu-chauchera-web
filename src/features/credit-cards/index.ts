// Components
export { CreditCardsDashboard } from './components/CreditCardsDashboard'
export {
  CreditCardAccountModal,
  CHILEAN_FINANCIAL_INSTITUTIONS,
} from './components/CreditCardAccountModal'
export { CreditCardPurchaseModal } from './components/CreditCardPurchaseModal'
export { CreditCardPurchasesModal } from './components/CreditCardPurchasesModal'
export { StatementImportModal } from './components/StatementImportModal'
export { ThirdPartyReceivablesView } from './components/ThirdPartyReceivablesView'

// Store & Types
export { useCreditCardStore } from './store/creditCardSlice'
export type {
  CreditCardState,
  CreateAccountDTO,
  UpdateAccountDTO,
  CreatePurchaseDTO,
  UpdatePurchaseDTO,
} from './store/creditCardSlice'

// Parsers
export { extractTextFromPdf } from './parsers/pdfReader'
export { parseStatementText } from './parsers/statementParser'
export { parseFalabellaStatementText } from './parsers/falabellaParser'
export { parseTenpoStatementText } from './parsers/tenpoParser'
export type { ParsedStatementResult, ParsedStatementTransaction } from './parsers/statementParser'

// Utilities
export {
  calculateBillingPeriod,
  calculateInstallmentPeriods,
  calculateRepaymentStatus,
  offsetPeriod,
} from './utils/cycleCalculators'
export { matchExistingPurchases } from './utils/deduplicationMatcher'
export type { EnhancedParsedTransaction } from './utils/deduplicationMatcher'
