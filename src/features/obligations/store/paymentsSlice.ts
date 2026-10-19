/**
 * Zustand Slice for handling Payment and Renegotiation workflows.
 */
import { create } from "zustand"
import { useObligationsStore } from "./obligationsSlice"
import { useSyncStore } from "@/features/sync/store/syncSlice"
import type { UUID, ISODate, CreateObligationDTO, Installment, Money } from "@/shared/types/domain"

export interface PaymentsState {
  markPaid: (installmentId: UUID, paidDate: ISODate, notes?: string, paidAmountCents?: Money) => void
  updatePayment: (installmentId: UUID, paidDate: ISODate, notes?: string, paidAmountCents?: Money) => void
  markRenegotiated: (
    oldObligationId: UUID,
    fromInstallmentNumber: number,
    newObligationDTO: CreateObligationDTO
  ) => void
  revertToPending: (installmentId: UUID) => void
  postponeToNextMonth: (installmentId: UUID) => void
  revertPostpone: (installmentId: UUID) => void
  moveToPreviousMonth: (installmentId: UUID) => void
}

export const usePaymentsStore = create<PaymentsState>(() => ({
  markPaid: (installmentId: UUID, paidDate: ISODate, notes?: string, paidAmountCents?: Money) => {
    const period = paidDate.slice(0, 7) // Extract YYYY-MM
    useObligationsStore.setState((state) => {
      const existing = state.installments[installmentId]
      if (!existing) return state

      const updated: Installment = {
        ...existing,
        status: "PAID",
        paidDate,
        period,
        amountCents: paidAmountCents !== undefined ? paidAmountCents : existing.amountCents,
        notes: notes !== undefined ? (notes.trim() ? notes.trim() : undefined) : existing.notes,
      }

      return {
        installments: {
          ...state.installments,
          [installmentId]: updated,
        },
      }
    })
  },

  updatePayment: (installmentId: UUID, paidDate: ISODate, notes?: string, paidAmountCents?: Money) => {
    usePaymentsStore.getState().markPaid(installmentId, paidDate, notes, paidAmountCents)
  },

  revertToPending: (installmentId: UUID) => {
    useObligationsStore.setState((state) => {
      const existing = state.installments[installmentId]
      if (!existing) return state

      const obl = state.obligations[existing.obligationId]
      const originalAmount = obl ? obl.installmentAmountCents : existing.amountCents

      const updated: Installment = {
        ...existing,
        status: "PENDING",
        paidDate: undefined,
        period: undefined,
        amountCents: originalAmount,
      }

      return {
        installments: {
          ...state.installments,
          [installmentId]: updated,
        },
      }
    })
  },

  postponeToNextMonth: (installmentId: UUID) => {
    useObligationsStore.setState((state) => {
      const existing = state.installments[installmentId]
      if (!existing) return state

      const [year, month, day] = existing.dueDate.split("-").map(Number)
      if (!year || !month || !day) return state

      let nextYear = year
      let nextMonth = month + 1
      if (nextMonth > 12) {
        nextMonth = 1
        nextYear += 1
      }
      const daysInNextMonth = new Date(nextYear, nextMonth, 0).getDate()
      const cleanDay = Math.min(day, daysInNextMonth)
      const nextDueDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(cleanDay).padStart(2, "0")}`

      const updated: Installment = {
        ...existing,
        dueDate: nextDueDate,
        originalDueDate: existing.originalDueDate || existing.dueDate,
        isOverdueRollover: true,
        notes: existing.notes
          ? `${existing.notes} | Pasada al mes siguiente por no pago en plazo`
          : `Pasada al mes siguiente por no pago en plazo (vencía el ${existing.dueDate})`,
      }

      return {
        installments: {
          ...state.installments,
          [installmentId]: updated,
        },
      }
    })

    useSyncStore.getState().queueSyncDomain("obligations")
  },

  moveToPreviousMonth: (installmentId: UUID) => {
    useObligationsStore.setState((state) => {
      const existing = state.installments[installmentId]
      if (!existing) return state

      let targetDueDate: string
      if (existing.originalDueDate) {
        targetDueDate = existing.originalDueDate
      } else {
        const [year, month, day] = existing.dueDate.split("-").map(Number)
        if (!year || !month || !day) return state

        let prevYear = year
        let prevMonth = month - 1
        if (prevMonth < 1) {
          prevMonth = 12
          prevYear -= 1
        }
        const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate()
        const cleanDay = Math.min(day, daysInPrevMonth)
        targetDueDate = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(cleanDay).padStart(2, "0")}`
      }

      let cleanNotes = existing.notes
      if (cleanNotes) {
        cleanNotes = cleanNotes.replace(/\s*\|\s*Pasada al mes siguiente por no pago en plazo/g, "")
        cleanNotes = cleanNotes.replace(/^Pasada al mes siguiente por no pago en plazo \(vencía el \d{4}-\d{2}-\d{2}\)\s*/g, "")
        cleanNotes = cleanNotes.trim() || undefined
      }

      const updated: Installment = {
        ...existing,
        dueDate: targetDueDate,
        originalDueDate: undefined,
        isOverdueRollover: undefined,
        notes: cleanNotes,
      }

      return {
        installments: {
          ...state.installments,
          [installmentId]: updated,
        },
      }
    })

    useSyncStore.getState().queueSyncDomain("obligations")
  },

  revertPostpone: (installmentId: UUID) => {
    usePaymentsStore.getState().moveToPreviousMonth(installmentId)
  },

  markRenegotiated: (oldObligationId, fromInstallmentNumber, newObligationDTO) => {
    // 1. Create new obligation with reference to old
    const store = useObligationsStore.getState()
    const newObligation = store.addObligation(newObligationDTO)

    // Link new obligation
    useObligationsStore.setState((state) => {
      const newObl = state.obligations[newObligation.id]
      if (!newObl) return state

      return {
        obligations: {
          ...state.obligations,
          [newObligation.id]: {
            ...newObl,
            renegotiatedFromId: oldObligationId,
          },
        },
      }
    })

    // 2. Mark old obligation and its remaining installments (>= fromInstallmentNumber) as RENEGOTIATED
    useObligationsStore.setState((state) => {
      const oldObl = state.obligations[oldObligationId]
      const updatedOldObl = oldObl
        ? { ...oldObl, status: "RENEGOTIATED" as const, updatedAt: new Date().toISOString() }
        : null

      const newInstallments = { ...state.installments }
      for (const [id, inst] of Object.entries(newInstallments)) {
        if (
          inst.obligationId === oldObligationId &&
          inst.installmentNumber >= fromInstallmentNumber &&
          inst.status === "PENDING"
        ) {
          newInstallments[id] = {
            ...inst,
            status: "RENEGOTIATED",
          }
        }
      }

      return {
        obligations: updatedOldObl
          ? { ...state.obligations, [oldObligationId]: updatedOldObl }
          : state.obligations,
        installments: newInstallments,
      }
    })
  },
}))
