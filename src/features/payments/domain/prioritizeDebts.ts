import type { Obligation, Installment, Category, UUID } from '@/shared/types/domain'
import { toMoney } from '@/shared/types/money'
import type { DebtPayoffStrategy, PrioritizedDebt } from './types'

export interface DebtPrioritizationSources {
  obligations: Record<UUID, Obligation>
  installments: Record<UUID, Installment>
  categories?: Record<UUID, Category>
}

/**
 * Calculates debt prioritization using either:
 * - AVALANCHE: Prioritizes by highest interest rate first (minimizes interest paid).
 * - SNOWBALL: Prioritizes by lowest remaining principal balance first (psychological momentum).
 */
export function prioritizeDebts(
  sources: DebtPrioritizationSources,
  strategy: DebtPayoffStrategy = 'AVALANCHE',
): PrioritizedDebt[] {
  const { obligations, installments, categories = {} } = sources
  const debts: PrioritizedDebt[] = []

  // Group installments by obligation to find pending ones
  const pendingByObligation: Record<UUID, Installment[]> = {}
  for (const inst of Object.values(installments)) {
    if (inst.status === 'PENDING') {
      const list = (pendingByObligation[inst.obligationId] ??= [])
      list.push(inst)
    }
  }

  for (const obligation of Object.values(obligations)) {
    if (obligation.status === 'DELETED' || obligation.status === 'PAID') continue
    if (obligation.type !== 'DEBT' && obligation.type !== 'P2P_DEBT') continue

    const pendingInsts = pendingByObligation[obligation.id] ?? []
    if (pendingInsts.length === 0) continue

    // Calculate remaining balance from pending installments
    const remainingBalanceCents = toMoney(
      pendingInsts.reduce((sum, inst) => sum + inst.amountCents, 0),
    )
    const category = categories[obligation.categoryId]

    debts.push({
      id: obligation.id,
      title: obligation.subcategory || obligation.detail || 'Deuda',
      ...(category?.name !== undefined ? { categoryName: category.name } : {}),
      remainingBalanceCents,
      installmentAmountCents: obligation.installmentAmountCents,
      remainingInstallments: pendingInsts.length,
      ...(obligation.annualRatePercentage !== undefined
        ? { interestRatePercentage: obligation.annualRatePercentage }
        : {}),
      order: 0,
    })
  }

  // Sorting
  if (strategy === 'AVALANCHE') {
    debts.sort((a, b) => {
      const rateA = a.interestRatePercentage ?? 0
      const rateB = b.interestRatePercentage ?? 0
      if (rateB !== rateA) {
        return rateB - rateA // Highest rate first
      }
      // Tie breaker: smallest balance first
      return a.remainingBalanceCents - b.remainingBalanceCents
    })
  } else {
    // SNOWBALL: Smallest balance first
    debts.sort((a, b) => a.remainingBalanceCents - b.remainingBalanceCents)
  }

  return debts.map((debt, index) => ({
    ...debt,
    order: index + 1,
  }))
}
