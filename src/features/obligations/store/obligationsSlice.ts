/**
 * Zustand Slice for Obligation and Category management with eager Installments.
 */
import { create } from 'zustand'
import type {
  Obligation,
  Installment,
  Category,
  CreateObligationDTO,
  CreateCategoryDTO,
  ObligationsStore,
  CategoriesStore,
  UUID,
  Money,
  ISODate,
} from '@/shared/types/domain'
import {
  generateInstallments,
  INDEFINITE_INSTALLMENTS_HORIZON,
} from '../utils/installmentGenerator'
import { DEFAULT_CATEGORIES } from '../constants/categories'
import { getLocalISODate } from '@/shared/utils/date'
import { toMoney } from '@/shared/types/money'
import { useSyncStore } from '@/features/sync/store/syncSlice'

export type QuickExpensePaymentMethod = 'DEBIT' | 'CASH' | 'TRANSFER'

export interface CreateQuickExpenseDTO {
  categoryId: UUID
  description: string
  amountCents: Money
  date?: ISODate | undefined
  paymentMethod?: QuickExpensePaymentMethod | undefined
  notes?: string | undefined
}

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
  addQuickExpense: (dto: CreateQuickExpenseDTO) => Obligation
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

  setObligationsData: data => {
    const currentCategories = get().categories
    const normalizedObligations: Record<UUID, Obligation> = {}

    for (const [id, obl] of Object.entries(data.obligations)) {
      let resolvedType = obl.type
      let resolvedRecurring = obl.isRecurringIndefinite

      if (!resolvedType) {
        if (obl.p2pMetadata) {
          resolvedType = 'P2P_DEBT'
        } else if (obl.isRecurringIndefinite) {
          resolvedType = 'EXPENSE'
        } else {
          const cat = currentCategories[obl.categoryId]
          const catName = cat?.name?.toLowerCase() ?? ''
          const isRecurringCat =
            obl.categoryId === 'cat-servicios' ||
            obl.categoryId === 'cat-suscrip' ||
            catName.includes('servicio') ||
            catName.includes('suscrip')

          if (
            isRecurringCat &&
            (obl.totalInstallments === 60 || obl.totalInstallments === 12) &&
            (obl.totalAmountCents === obl.installmentAmountCents * 60 ||
              obl.totalAmountCents === obl.installmentAmountCents * 12)
          ) {
            resolvedType = 'EXPENSE'
            resolvedRecurring = true
          } else {
            resolvedType = 'DEBT'
          }
        }
      }

      normalizedObligations[id] = {
        ...obl,
        type: resolvedType,
        isRecurringIndefinite: resolvedRecurring,
      }
    }

    set({
      obligations: normalizedObligations,
      installments: data.installments,
      isLoaded: true,
    })
  },

  setCategoriesData: data => {
    set(state => {
      const updatedObligations = { ...state.obligations }
      let hasChanges = false

      for (const [id, obl] of Object.entries(updatedObligations)) {
        if (!obl.type || obl.type === 'DEBT') {
          const cat = data.categories[obl.categoryId]
          const catName = cat?.name?.toLowerCase() ?? ''
          const isRecurringCat =
            obl.categoryId === 'cat-servicios' ||
            obl.categoryId === 'cat-suscrip' ||
            catName.includes('servicio') ||
            catName.includes('suscrip')

          if (
            isRecurringCat &&
            (obl.totalInstallments === 60 || obl.totalInstallments === 12) &&
            (obl.totalAmountCents === obl.installmentAmountCents * 60 ||
              obl.totalAmountCents === obl.installmentAmountCents * 12) &&
            !obl.p2pMetadata
          ) {
            updatedObligations[id] = {
              ...obl,
              type: 'EXPENSE',
              isRecurringIndefinite: true,
            }
            hasChanges = true
          }
        }
      }

      return {
        categories: data.categories,
        ...(hasChanges ? { obligations: updatedObligations } : {}),
      }
    })
  },

  addCategory: dto => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const newCategory: Category = {
      id,
      name: dto.name,
      color: dto.color,
      createdAt: now,
      updatedAt: now,
    }

    set(state => ({
      categories: {
        ...state.categories,
        [id]: newCategory,
      },
    }))

    useSyncStore.getState().queueSyncDomain('categories')
    return newCategory
  },

  updateCategory: (id, updates) => {
    set(state => {
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

    useSyncStore.getState().queueSyncDomain('categories')
  },

  deleteCategory: id => {
    set(state => {
      const copy = { ...state.categories }
      delete copy[id]
      return { categories: copy }
    })

    useSyncStore.getState().queueSyncDomain('categories')
  },

  addObligation: dto => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const isRecurringIndefinite =
      dto.isRecurringIndefinite ?? (dto.type === 'EXPENSE' && dto.totalInstallments === 12)
    const effectiveTotalInstallments = isRecurringIndefinite
      ? Math.max(dto.totalInstallments, INDEFINITE_INSTALLMENTS_HORIZON)
      : dto.totalInstallments
    const effectiveTotalAmountCents = isRecurringIndefinite
      ? toMoney(dto.installmentAmountCents * effectiveTotalInstallments)
      : dto.totalAmountCents

    const newObligation: Obligation = {
      type: dto.type ?? 'DEBT',
      ...dto,
      totalInstallments: effectiveTotalInstallments,
      totalAmountCents: effectiveTotalAmountCents,
      isRecurringIndefinite,
      id,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    }

    const generatedInstallments = generateInstallments(newObligation)
    const installmentsMap: Record<UUID, Installment> = {}
    for (const inst of generatedInstallments) {
      installmentsMap[inst.id] = inst
    }

    set(state => ({
      obligations: {
        ...state.obligations,
        [id]: newObligation,
      },
      installments: {
        ...state.installments,
        ...installmentsMap,
      },
    }))

    useSyncStore.getState().queueSyncDomain('obligations')
    return newObligation
  },

  addQuickExpense: dto => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const expenseDate = dto.date ?? getLocalISODate()
    const dueDay = parseInt(expenseDate.slice(8, 10), 10) || 1
    const period = expenseDate.slice(0, 7)
    const methodLabels: Record<QuickExpensePaymentMethod, string> = {
      DEBIT: 'Tarjeta de Débito',
      CASH: 'Efectivo',
      TRANSFER: 'Transferencia',
    }
    const paymentMethod = dto.paymentMethod ?? 'DEBIT'
    const paymentMethodLabel = methodLabels[paymentMethod] ?? 'Débito'

    const newObligation: Obligation = {
      id,
      type: 'EXPENSE',
      categoryId: dto.categoryId,
      subcategory: dto.description.trim(),
      detail: dto.notes ? `${paymentMethodLabel} — ${dto.notes.trim()}` : paymentMethodLabel,
      totalAmountCents: dto.amountCents,
      totalInstallments: 1,
      currentInstallment: 1,
      installmentAmountCents: dto.amountCents,
      isRecurringIndefinite: false,
      startDate: expenseDate,
      dueDay,
      status: 'PAID',
      createdAt: now,
      updatedAt: now,
    }

    const installmentId = crypto.randomUUID()
    const installment: Installment = {
      id: installmentId,
      obligationId: id,
      installmentNumber: 1,
      dueDate: expenseDate,
      amountCents: dto.amountCents,
      status: 'PAID',
      paidDate: expenseDate,
      period,
      notes: `Gasto puntual (${paymentMethodLabel})`,
    }

    set(state => ({
      obligations: {
        ...state.obligations,
        [id]: newObligation,
      },
      installments: {
        ...state.installments,
        [installmentId]: installment,
      },
    }))

    useSyncStore.getState().queueSyncDomain('obligations')
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
      startDate: getLocalISODate(),
      dueDay: existing.dueDay,
      p2pMetadata: existing.p2pMetadata ? { ...existing.p2pMetadata } : undefined,
      ...overrides,
    }

    return get().addObligation(cloneDTO)
  },

  updateObligation: (id, updates) => {
    set(state => {
      const existing = state.obligations[id]
      if (!existing) return state

      const isRecurringIndefinite = updates.isRecurringIndefinite ?? existing.isRecurringIndefinite
      let effectiveTotalInstallments = updates.totalInstallments ?? existing.totalInstallments
      let effectiveTotalAmountCents = updates.totalAmountCents ?? existing.totalAmountCents
      const effectiveInstallmentAmountCents =
        updates.installmentAmountCents ?? existing.installmentAmountCents

      if (isRecurringIndefinite) {
        effectiveTotalInstallments = Math.max(
          effectiveTotalInstallments,
          INDEFINITE_INSTALLMENTS_HORIZON,
        )
        effectiveTotalAmountCents = toMoney(
          effectiveInstallmentAmountCents * effectiveTotalInstallments,
        )
      }

      const updatedObligation: Obligation = {
        ...existing,
        ...updates,
        totalInstallments: effectiveTotalInstallments,
        totalAmountCents: effectiveTotalAmountCents,
        isRecurringIndefinite,
        updatedAt: new Date().toISOString(),
      }

      let newInstallmentsMap = { ...state.installments }

      // Collect existing installments for this obligation
      const currentObligationInstallments = Object.values(state.installments).filter(
        i => i.obligationId === id,
      )

      // Remove old PENDING installments for this obligation
      for (const inst of currentObligationInstallments) {
        if (inst.status === 'PENDING') {
          delete newInstallmentsMap[inst.id]
        }
      }

      // If currentInstallment was updated in updates, adjust previously generated PAID installments if needed
      let adjustedInstallments = currentObligationInstallments
      if (updates.currentInstallment !== undefined) {
        const newCurrent = updates.currentInstallment
        adjustedInstallments = currentObligationInstallments.map(inst => {
          if (
            inst.installmentNumber < newCurrent &&
            inst.status !== 'PAID' &&
            inst.status !== 'RENEGOTIATED'
          ) {
            const updatedInst: Installment = {
              ...inst,
              status: 'PAID',
              paidDate: inst.paidDate ?? inst.dueDate,
              period: inst.period ?? (inst.dueDate !== '—' ? inst.dueDate.slice(0, 7) : undefined),
              notes: inst.notes ?? 'Amortización registrada',
            }
            newInstallmentsMap[inst.id] = updatedInst
            return updatedInst
          } else if (
            inst.installmentNumber >= newCurrent &&
            inst.status === 'PAID' &&
            inst.notes?.includes('Amortización')
          ) {
            // Revert auto-amortized installments back to PENDING if user decreased paid count
            const updatedInst: Installment = {
              ...inst,
              status: 'PENDING',
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

    useSyncStore.getState().queueSyncDomain('obligations')
  },

  softDeleteObligation: id => {
    set(state => {
      const existing = state.obligations[id]
      if (!existing) return state

      const updatedObligation: Obligation = {
        ...existing,
        status: 'DELETED',
        updatedAt: new Date().toISOString(),
      }

      const newInstallments = { ...state.installments }
      for (const [instId, inst] of Object.entries(newInstallments)) {
        if (inst.obligationId === id && inst.status === 'PENDING') {
          newInstallments[instId] = {
            ...inst,
            status: 'DELETED',
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

    useSyncStore.getState().queueSyncDomain('obligations')
  },
}))
