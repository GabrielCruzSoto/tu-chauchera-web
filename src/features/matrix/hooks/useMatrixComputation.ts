/**
 * Financial Matrix Computation Hook & Utilities.
 * Aggregates Obligation Installments into a Category (rows) × Month (cols) Matrix,
 * with comprehensive P2P (Third-Party) and Obligation Type breakdowns.
 */
import { useMemo } from "react"
import type {
  Category,
  Installment,
  Obligation,
  ObligationType,
  P2PRole,
  UUID,
  Period,
  CreditCardAccount,
  CreditCardPurchase,
} from "@/shared/types/domain"
import { useObligationsStore } from "@/features/obligations/store/obligationsSlice"
import { useCreditCardStore } from "@/features/credit-cards/store/creditCardSlice"
import { calculateInstallmentPeriods } from "@/features/credit-cards/utils/cycleCalculators"

export const CREDIT_CARDS_CATEGORY_ID: UUID = "system-credit-cards"

export interface MatrixSubcategory {
  id: string
  name: string
  cells: Record<Period, number> // period -> amountCents
  total: number // total in range
  obligationId?: string | undefined
  purchaseId?: string | undefined
  type?: ObligationType | undefined
  p2pRole?: P2PRole | undefined
  thirdPartyName?: string | undefined
  cardIssuer?: string | undefined
  productDescription?: string | undefined
  detail?: string | undefined
}

export interface P2PPersonGroup {
  id: string
  personName: string
  role: P2PRole
  cardIssuer?: string | undefined
  productDescription?: string | undefined
  categoryName: string
  cells: Record<Period, number>
  total: number
  obligationId?: string | undefined
  purchaseId?: string | undefined
}

export interface MatrixData {
  categories: Category[]
  periods: Period[]
  cells: Record<UUID, Record<Period, number>> // categoryId -> period -> amountCents
  columnTotals: Record<Period, number> // period -> sum(amountCents)
  rowTotals: Record<UUID, number> // categoryId -> sum(amountCents)
  grandTotal: number
  subcategoriesByCategory: Record<UUID, MatrixSubcategory[]>

  // Specific aggregations for third parties and expense categories
  totalPersonalExpenses: number
  totalThirdPartyReceivables: number // LENT_MY_CARD (reimbursements expected from others)
  totalThirdPartyPayables: number // USED_THEIR_CARD (debts owed to others)
  p2pGroups: P2PPersonGroup[] // Grouped by third party
  periodTypeTotals: Record<Period, { expense: number; debt: number; p2p: number }>
}

/**
 * Generates an array of contiguous periods ("YYYY-MM") starting from a base period.
 */
export function generatePeriodsRange(baseDate: Date, monthsCount = 6): Period[] {
  const periods: Period[] = []
  const current = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)

  for (let i = 0; i < monthsCount; i++) {
    const periodStr = current.toISOString().slice(0, 7)
    periods.push(periodStr)
    current.setMonth(current.getMonth() + 1)
  }

  return periods
}

/**
 * Pure computation of the Category × Period matrix from store data,
 * including subcategory and P2P third-party level breakdown,
 * incorporating credit card purchases and installments.
 */
export function computeFinancialMatrix(
  categoriesMap: Record<UUID, Category>,
  obligationsMap: Record<UUID, Obligation>,
  installmentsMap: Record<UUID, Installment>,
  periods: Period[],
  creditCardAccountsMap: Record<UUID, CreditCardAccount> = {},
  creditCardPurchasesMap: Record<UUID, CreditCardPurchase> = {}
): MatrixData {
  const categoriesList = [...Object.values(categoriesMap)]

  // If there are credit card accounts or purchases, append the virtual system category "Tarjetas de Crédito"
  const hasCreditCards =
    Object.keys(creditCardAccountsMap).length > 0 || Object.keys(creditCardPurchasesMap).length > 0

  if (hasCreditCards && !categoriesMap[CREDIT_CARDS_CATEGORY_ID]) {
    categoriesList.push({
      id: CREDIT_CARDS_CATEGORY_ID,
      name: "Tarjetas de Crédito",
      color: "indigo",
      createdAt: "",
      updatedAt: "",
    })
  }

  const cells: Record<UUID, Record<Period, number>> = {}
  const columnTotals: Record<Period, number> = {}
  const rowTotals: Record<UUID, number> = {}
  const subcatMap: Record<UUID, Record<string, MatrixSubcategory>> = {}
  const subcategoriesByCategory: Record<UUID, MatrixSubcategory[]> = {}
  const p2pMap: Record<string, P2PPersonGroup> = {}
  const periodTypeTotals: Record<Period, { expense: number; debt: number; p2p: number }> = {}

  let grandTotal = 0
  let totalPersonalExpenses = 0
  let totalThirdPartyReceivables = 0
  let totalThirdPartyPayables = 0

  // Initialize data structures
  for (const period of periods) {
    columnTotals[period] = 0
    periodTypeTotals[period] = { expense: 0, debt: 0, p2p: 0 }
  }

  for (const cat of categoriesList) {
    cells[cat.id] = {}
    rowTotals[cat.id] = 0
    subcatMap[cat.id] = {}
    subcategoriesByCategory[cat.id] = []
    for (const period of periods) {
      cells[cat.id]![period] = 0
    }
  }

  // Pre-populate all active obligations' subcategories & P2P groups
  for (const obl of Object.values(obligationsMap)) {
    if (obl.status === "DELETED") continue
    const catId = obl.categoryId
    const cat = categoriesMap[catId]
    if (!cat) continue

    const subcatName = obl.subcategory?.trim() || "Sin subcategoría"
    const subcatKey = subcatName.toLowerCase()

    subcatMap[catId] ??= {}
    if (!subcatMap[catId]![subcatKey]) {
      const cellsRecord: Record<Period, number> = {}
      for (const p of periods) cellsRecord[p] = 0
      subcatMap[catId]![subcatKey] = {
        id: `${catId}-${subcatKey}`,
        name: subcatName,
        cells: cellsRecord,
        total: 0,
        obligationId: obl.id,
        type: obl.type ?? "DEBT",
        p2pRole: obl.p2pMetadata?.role,
        thirdPartyName: obl.p2pMetadata?.thirdPartyName,
        cardIssuer: obl.p2pMetadata?.cardIssuer,
        productDescription: obl.p2pMetadata?.productDescription,
        detail: obl.detail,
      }
    }

    if (obl.type === "P2P_DEBT" && obl.p2pMetadata) {
      const personKey = `${obl.id}`
      const cellsRecord: Record<Period, number> = {}
      for (const p of periods) cellsRecord[p] = 0
      p2pMap[personKey] = {
        id: personKey,
        personName: obl.p2pMetadata.thirdPartyName || obl.subcategory,
        role: obl.p2pMetadata.role,
        cardIssuer: obl.p2pMetadata.cardIssuer,
        productDescription: obl.p2pMetadata.productDescription || obl.detail,
        categoryName: cat.name,
        cells: cellsRecord,
        total: 0,
        obligationId: obl.id,
      }
    }
  }

  // Iterate over active installments and place them into the matrix
  for (const inst of Object.values(installmentsMap)) {
    if (inst.status === "DELETED") continue

    const obl = obligationsMap[inst.obligationId]
    if (!obl || obl.status === "DELETED") continue

    const catId = obl.categoryId
    const targetPeriod = inst.status === "PAID" && inst.period ? inst.period : inst.dueDate.slice(0, 7)

    if (periods.includes(targetPeriod)) {
      if (!cells[catId]) {
        cells[catId] = {}
        for (const p of periods) cells[catId]![p] = 0
        rowTotals[catId] = 0
      }

      cells[catId]![targetPeriod] = (cells[catId]![targetPeriod] ?? 0) + inst.amountCents
      columnTotals[targetPeriod] = (columnTotals[targetPeriod] ?? 0) + inst.amountCents
      rowTotals[catId] = (rowTotals[catId] ?? 0) + inst.amountCents
      grandTotal += inst.amountCents

      // Type-based sums
      const oblType = obl.type ?? "DEBT"
      if (oblType === "EXPENSE") {
        periodTypeTotals[targetPeriod]!.expense += inst.amountCents
        totalPersonalExpenses += inst.amountCents
      } else if (oblType === "DEBT") {
        periodTypeTotals[targetPeriod]!.debt += inst.amountCents
        totalPersonalExpenses += inst.amountCents
      } else if (oblType === "P2P_DEBT") {
        periodTypeTotals[targetPeriod]!.p2p += inst.amountCents
        if (obl.p2pMetadata?.role === "LENT_MY_CARD") {
          totalThirdPartyReceivables += inst.amountCents
        } else {
          totalThirdPartyPayables += inst.amountCents
          totalPersonalExpenses += inst.amountCents
        }
      }

      // Subcategory accumulation
      const subcatName = obl.subcategory?.trim() || "Sin subcategoría"
      const subcatKey = subcatName.toLowerCase()

      subcatMap[catId] ??= {}
      if (!subcatMap[catId]![subcatKey]) {
        const cellsRecord: Record<Period, number> = {}
        for (const p of periods) cellsRecord[p] = 0
        subcatMap[catId]![subcatKey] = {
          id: `${catId}-${subcatKey}`,
          name: subcatName,
          cells: cellsRecord,
          total: 0,
          obligationId: obl.id,
          type: obl.type ?? "DEBT",
          p2pRole: obl.p2pMetadata?.role,
          thirdPartyName: obl.p2pMetadata?.thirdPartyName,
          cardIssuer: obl.p2pMetadata?.cardIssuer,
          productDescription: obl.p2pMetadata?.productDescription,
          detail: obl.detail,
        }
      }
      const existingSubcat = subcatMap[catId]![subcatKey]!
      existingSubcat.cells[targetPeriod] =
        (existingSubcat.cells[targetPeriod] ?? 0) + inst.amountCents
      existingSubcat.total += inst.amountCents

      // P2P accumulation
      if (obl.type === "P2P_DEBT") {
        const personKey = `${obl.id}`
        if (p2pMap[personKey]) {
          p2pMap[personKey]!.cells[targetPeriod] =
            (p2pMap[personKey]!.cells[targetPeriod] ?? 0) + inst.amountCents
          p2pMap[personKey]!.total += inst.amountCents
        }
      }
    }
  }

  // Iterate over Credit Card Purchases and distribute their installments into the Matrix
  if (hasCreditCards) {
    const cardCatId = CREDIT_CARDS_CATEGORY_ID

    // Pre-create subcategories for all registered credit card accounts so they appear in Tarjetas de Crédito
    for (const account of Object.values(creditCardAccountsMap)) {
      const cardSubcatKey = account.id
      const cardName = `${account.institution} - ${account.accountName}`
      subcatMap[cardCatId] ??= {}
      if (!subcatMap[cardCatId]![cardSubcatKey]) {
        const cellsRecord: Record<Period, number> = {}
        for (const p of periods) cellsRecord[p] = 0
        subcatMap[cardCatId]![cardSubcatKey] = {
          id: `${cardCatId}-${account.id}`,
          name: cardName,
          cells: cellsRecord,
          total: 0,
          type: "DEBT",
          cardIssuer: account.institution,
          productDescription: account.accountName,
        }
      }
    }

    for (const purchase of Object.values(creditCardPurchasesMap)) {
      const cardAccount = creditCardAccountsMap[purchase.accountId]
      const cardName = cardAccount ? `${cardAccount.institution} - ${cardAccount.accountName}` : "Tarjeta de Crédito"
      const cardSubcatKey = purchase.accountId || "unknown-card"
      const totalInstallments = purchase.totalInstallments || 1
      const installmentAmount = Math.round(purchase.totalAmountCents / totalInstallments)
      const purchasePeriods = calculateInstallmentPeriods(purchase.firstInstallmentPeriod, totalInstallments)
      const isThirdParty = purchase.payerType === "TERCERO"
      const thirdPartyName = purchase.thirdPartyReceivable?.thirdPartyName ?? "Tercero"

      subcatMap[cardCatId] ??= {}

      if (!subcatMap[cardCatId]![cardSubcatKey]) {
        const cellsRecord: Record<Period, number> = {}
        for (const p of periods) cellsRecord[p] = 0
        subcatMap[cardCatId]![cardSubcatKey] = {
          id: `${cardCatId}-${cardSubcatKey}`,
          name: cardName,
          cells: cellsRecord,
          total: 0,
          type: "DEBT",
          cardIssuer: cardAccount?.institution,
          productDescription: cardAccount?.accountName,
        }
      }

      const existingSubcat = subcatMap[cardCatId]![cardSubcatKey]!

      purchasePeriods.forEach((targetPeriod) => {
        if (periods.includes(targetPeriod)) {
          if (!cells[cardCatId]) {
            cells[cardCatId] = {}
            for (const p of periods) cells[cardCatId]![p] = 0
            rowTotals[cardCatId] = 0
          }

          cells[cardCatId]![targetPeriod] = (cells[cardCatId]![targetPeriod] ?? 0) + installmentAmount
          columnTotals[targetPeriod] = (columnTotals[targetPeriod] ?? 0) + installmentAmount
          rowTotals[cardCatId] = (rowTotals[cardCatId] ?? 0) + installmentAmount
          grandTotal += installmentAmount

          // Type-based sums
          if (isThirdParty) {
            periodTypeTotals[targetPeriod]!.p2p += installmentAmount
            totalThirdPartyReceivables += installmentAmount
          } else {
            periodTypeTotals[targetPeriod]!.debt += installmentAmount
            totalPersonalExpenses += installmentAmount
          }

          // Subcategory accumulation (grouped per card account)
          existingSubcat.cells[targetPeriod] = (existingSubcat.cells[targetPeriod] ?? 0) + installmentAmount
          existingSubcat.total += installmentAmount

          // P2P group accumulation if third party
          if (isThirdParty) {
            const personKey = `cc-purchase-${purchase.id}`
            if (!p2pMap[personKey]) {
              const cellsRecord: Record<Period, number> = {}
              for (const p of periods) cellsRecord[p] = 0
              p2pMap[personKey] = {
                id: personKey,
                personName: thirdPartyName,
                role: "LENT_MY_CARD",
                cardIssuer: cardAccount?.institution,
                productDescription: purchase.description,
                categoryName: "Tarjetas de Crédito",
                cells: cellsRecord,
                total: 0,
                purchaseId: purchase.id,
              }
            }
            p2pMap[personKey]!.cells[targetPeriod] =
              (p2pMap[personKey]!.cells[targetPeriod] ?? 0) + installmentAmount
            p2pMap[personKey]!.total += installmentAmount
          }
        }
      })
    }
  }

  // Populate sorted subcategories list per category
  for (const cat of categoriesList) {
    const subcats = Object.values(subcatMap[cat.id] ?? {})
    subcats.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }))
    subcategoriesByCategory[cat.id] = subcats
  }

  const p2pGroups = Object.values(p2pMap).sort((a, b) =>
    a.personName.localeCompare(b.personName, "es", { sensitivity: "base" })
  )

  return {
    categories: categoriesList,
    periods,
    cells,
    columnTotals,
    rowTotals,
    grandTotal,
    subcategoriesByCategory,
    totalPersonalExpenses,
    totalThirdPartyReceivables,
    totalThirdPartyPayables,
    p2pGroups,
    periodTypeTotals,
  }
}

export function useMatrixComputation(startDate: Date = new Date(), monthsCount = 6): MatrixData {
  const { categories, obligations, installments } = useObligationsStore()
  const { accounts: creditCardAccounts, purchases: creditCardPurchases } = useCreditCardStore()

  const periods = useMemo(
    () => generatePeriodsRange(startDate, monthsCount),
    [startDate, monthsCount]
  )

  return useMemo(
    () =>
      computeFinancialMatrix(
        categories,
        obligations,
        installments,
        periods,
        creditCardAccounts,
        creditCardPurchases
      ),
    [categories, obligations, installments, periods, creditCardAccounts, creditCardPurchases]
  )
}
