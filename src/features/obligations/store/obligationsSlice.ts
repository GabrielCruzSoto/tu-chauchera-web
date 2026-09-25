/**
 * Zustand Slice for Obligation and Category management with eager Installments.
 */
import { create } from "zustand"
import type {
  Obligation,
  Installment,
  Category,
  CreateObligationDTO,
  CreateCategoryDTO,
  ObligationsStore,
  CategoriesStore,
  UUID,
} from "@/shared/types/domain"
import { generateInstallments } from "../utils/installmentGenerator"
import { DEFAULT_CATEGORIES } from "../constants/categories"
import { useSyncStore } from "@/features/sync/store/syncSlice"

export interface ObligationsState {
  obligations: Record<UUID, Obligation>
  installments: Record<UUID, Installment>
  categories: Record<UUID, Category>
  isLoaded: boolean

  // Domain setters from Drive
  setObligationsData: (data: ObligationsStore) => void
  setCategoriesData: (data: CategoriesStore) => void

  // Actions
  addCategory: (dto: CreateCategoryDTO) => Category
  updateCategory: (id: UUID, updates: Partial<Category>) => void
  deleteCategory: (id: UUID) => void

  addObligation: (dto: CreateObligationDTO) => Obligation
  cloneObligation: (id: UUID, overrides?: Partial<CreateObligationDTO>) => Obligation | null
  updateObligation: (id: UUID, updates: Partial<Obligation>) => void
  softDeleteObligation: (id: UUID) => void
  resetObligations: () => void
}

export const useObligationsStore = create<ObligationsState>((set, get) => ({
  obligations: {},
  installments: {},
  categories: { ...DEFAULT_CATEGORIES },
  isLoaded: false,

  resetObligations: () => {
    set({
      obligations: {},
      installments: {},
      categories: { ...DEFAULT_CATEGORIES },
      isLoaded: false,
    })
  },

  setObligationsData: (data) => {
    set({
      obligations: data.obligations,
      installments: data.installments,
      isLoaded: true,
    })
  },

  setCategoriesData: (data) => {
    set({
      categories: data.categories,
    })
  },

  addCategory: (dto) => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const newCategory: Category = {
      id,
      name: dto.name,
      color: dto.color,
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({
      categories: {
        ...state.categories,
        [id]: newCategory,
      },
    }))

    useSyncStore.getState().queueSyncDomain("categories")
    return newCategory
  },

  updateCategory: (id, updates) => {
    set((state) => {
      const existing = state.categories[id]
      if (!existing) return state

      return {
        categories: {
          ...state.categories,
          [id]: {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        },
      }
    })

    useSyncStore.getState().queueSyncDomain("categories")
  },

  deleteCategory: (id) => {
    set((state) => {
      const copy = { ...state.categories }
      delete copy[id]
      return { categories: copy }
    })

    useSyncStore.getState().queueSyncDomain("categories")
  },

  addObligation: (dto) => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const newObligation: Obligation = {
      type: dto.type ?? "DEBT",
      ...dto,
      id,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    }

    const generatedInstallments = generateInstallments(newObligation)
    const installmentsMap: Record<UUID, Installment> = {}
    for (const inst of generatedInstallments) {
      installmentsMap[inst.id] = inst
    }

    set((state) => ({
      obligations: {
        ...state.obligations,
        [id]: newObligation,
      },
      installments: {
        ...state.installments,
        ...installmentsMap,
      },
    }))

    useSyncStore.getState().queueSyncDomain("obligations")
    return newObligation
  },

  cloneObligation: (id, overrides = {}) => {
    const state = get()
    const existing = state.obligations[id]
    if (!existing) return null

    const cloneDTO: CreateObligationDTO = {
      type: existing.type,
      categoryId: existing.categoryId,
      subcategory: `${existing.subcategory} (Copia)`,
      detail: existing.detail,
      totalAmountCents: existing.totalAmountCents,
      totalInstallments: existing.totalInstallments,
      currentInstallment: 1,
      installmentAmountCents: existing.installmentAmountCents,
      isRecurringIndefinite: existing.isRecurringIndefinite,
      startDate: new Date().toISOString().slice(0, 10),
      dueDay: existing.dueDay,
      p2pMetadata: existing.p2pMetadata ? { ...existing.p2pMetadata } : undefined,
      ...overrides,
    }

    return get().addObligation(cloneDTO)
  },

  updateObligation: (id, updates) => {
    set((state) => {
      const existing = state.obligations[id]
      if (!existing) return state

      const updatedObligation: Obligation = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      let newInstallmentsMap = { ...state.installments }

      // Collect existing installments for this obligation
      const currentObligationInstallments = Object.values(state.installments).filter(
        (i) => i.obligationId === id
      )

      // Remove old PENDING installments for this obligation
      for (const inst of currentObligationInstallments) {
        if (inst.status === "PENDING") {
          delete newInstallmentsMap[inst.id]
        }
      }

      // If currentInstallment was updated in updates, adjust previously generated PAID installments if needed
      let adjustedInstallments = currentObligationInstallments
      if (updates.currentInstallment !== undefined) {
        const newCurrent = updates.currentInstallment
        adjustedInstallments = currentObligationInstallments.map((inst) => {
          if (inst.installmentNumber < newCurrent && inst.status !== "PAID" && inst.status !== "RENEGOTIATED") {
            const updatedInst: Installment = {
              ...inst,
              status: "PAID",
              paidDate: inst.paidDate || inst.dueDate,
              period: inst.period || (inst.dueDate !== "—" ? inst.dueDate.slice(0, 7) : undefined),
              notes: inst.notes || "Amortización registrada",
            }
            newInstallmentsMap[inst.id] = updatedInst
            return updatedInst
          } else if (inst.installmentNumber >= newCurrent && inst.status === "PAID" && inst.notes?.includes("Amortización")) {
            // Revert auto-amortized installments back to PENDING if user decreased paid count
            const updatedInst: Installment = {
              ...inst,
              status: "PENDING",
              paidDate: undefined,
              period: undefined,
              notes: undefined,
            }
            delete newInstallmentsMap[inst.id]
            return updatedInst
          }
          return inst
        })
      }

      // Regenerate pending installments and any missing historical paid installments
      const regenerated = generateInstallments(updatedObligation, adjustedInstallments)
      for (const inst of regenerated) {
        newInstallmentsMap[inst.id] = inst
      }

      return {
        obligations: {
          ...state.obligations,
          [id]: updatedObligation,
        },
        installments: newInstallmentsMap,
      }
    })

    useSyncStore.getState().queueSyncDomain("obligations")
  },

  softDeleteObligation: (id) => {
    set((state) => {
      const existing = state.obligations[id]
      if (!existing) return state

      const updatedObligation: Obligation = {
        ...existing,
        status: "DELETED",
        updatedAt: new Date().toISOString(),
      }

      const newInstallments = { ...state.installments }
      for (const [instId, inst] of Object.entries(newInstallments)) {
        if (inst.obligationId === id && inst.status === "PENDING") {
          newInstallments[instId] = {
            ...inst,
            status: "DELETED",
          }
        }
      }

      return {
        obligations: {
          ...state.obligations,
          [id]: updatedObligation,
        },
        installments: newInstallments,
      }
    })

    useSyncStore.getState().queueSyncDomain("obligations")
  },
}))
