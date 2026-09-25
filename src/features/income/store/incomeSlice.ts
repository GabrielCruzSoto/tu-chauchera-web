/**
 * Zustand Slice for Income management and Cash Flow computations.
 */
import { create } from "zustand"
import type { Income, CreateIncomeDTO, IncomesStore, UUID, Period, IncomeStatus } from "@/shared/types/domain"
import { useSyncStore } from "@/features/sync/store/syncSlice"

export interface IncomeState {
  incomes: Record<UUID, Income>
  isLoaded: boolean

  // Domain setters from Drive
  setIncomesData: (data: IncomesStore) => void

  // Actions
  addIncome: (dto: CreateIncomeDTO) => Income
  addRecurringIncome: (dto: CreateIncomeDTO, monthsCount: number) => Income[]
  updateIncome: (id: UUID, updates: Partial<Income>) => void
  removeIncome: (id: UUID) => void
  resetIncomes: () => void
}

export const useIncomeStore = create<IncomeState>((set) => ({
  incomes: {},
  isLoaded: false,

  resetIncomes: () => {
    set({
      incomes: {},
      isLoaded: false,
    })
  },

  setIncomesData: (data) => {
    set({
      incomes: data.incomes,
      isLoaded: true,
    })
  },

  addIncome: (dto) => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const newIncome: Income = {
      id,
      description: dto.description,
      amountCents: dto.amountCents,
      type: dto.type,
      status: dto.status ?? "REAL",
      period: dto.period,
      receivedDate: dto.receivedDate,
      categoryId: dto.categoryId,
      createdAt: now,
    }

    set((state) => ({
      incomes: {
        ...state.incomes,
        [id]: newIncome,
      },
    }))

    useSyncStore.getState().queueSyncDomain("incomes")
    return newIncome
  },

  addRecurringIncome: (dto, monthsCount = 12) => {
    const maxMonths = Math.min(Math.max(1, monthsCount), 24)
    const [yearStr, monthStr] = dto.period.split("-")
    const year = Number(yearStr)
    const month = Number(monthStr)

    const createdIncomes: Income[] = []
    const newIncomesMap: Record<UUID, Income> = {}
    const now = new Date().toISOString()

    for (let i = 0; i < maxMonths; i++) {
      const current = new Date(year, month - 1 + i, 1)
      const period = current.toISOString().slice(0, 7)
      const id = crypto.randomUUID()

      const inc: Income = {
        id,
        description: `${dto.description} (${period})`,
        amountCents: dto.amountCents,
        type: dto.type,
        status: dto.status ?? "REAL",
        period,
        receivedDate: dto.receivedDate,
        categoryId: dto.categoryId,
        createdAt: now,
      }

      createdIncomes.push(inc)
      newIncomesMap[id] = inc
    }

    set((state) => ({
      incomes: {
        ...state.incomes,
        ...newIncomesMap,
      },
    }))

    useSyncStore.getState().queueSyncDomain("incomes")
    return createdIncomes
  },

  updateIncome: (id, updates) => {
    set((state) => {
      const existing = state.incomes[id]
      if (!existing) return state

      return {
        incomes: {
          ...state.incomes,
          [id]: {
            ...existing,
            ...updates,
          },
        },
      }
    })

    useSyncStore.getState().queueSyncDomain("incomes")
  },

  removeIncome: (id) => {
    set((state) => {
      const copy = { ...state.incomes }
      delete copy[id]
      return { incomes: copy }
    })

    useSyncStore.getState().queueSyncDomain("incomes")
  },
}))

/**
 * Computes the total income for a specific period ("YYYY-MM").
 * Optionally filters by status ("REAL" | "ESTIMATED"). If not specified, sums all.
 */
export function getTotalIncomeForPeriod(
  incomes: Record<UUID, Income>,
  period: Period,
  statusFilter?: IncomeStatus
): number {
  return Object.values(incomes)
    .filter((inc) => {
      if (inc.period !== period) return false
      if (!statusFilter) return true
      const itemStatus: IncomeStatus = inc.status ?? "REAL"
      return itemStatus === statusFilter
    })
    .reduce((sum, inc) => sum + inc.amountCents, 0)
}

/**
 * Computes separate real, estimated, and combined totals for a period.
 */
export function getIncomeBreakdownForPeriod(
  incomes: Record<UUID, Income>,
  period: Period
): { real: number; estimated: number; total: number } {
  let real = 0
  let estimated = 0

  for (const inc of Object.values(incomes)) {
    if (inc.period === period) {
      if (inc.status === "ESTIMATED") {
        estimated += inc.amountCents
      } else {
        real += inc.amountCents
      }
    }
  }

  return {
    real,
    estimated,
    total: real + estimated,
  }
}
