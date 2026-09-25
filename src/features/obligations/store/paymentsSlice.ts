/**
 * Zustand Slice for handling Payment and Renegotiation workflows.
 */
import { create } from "zustand"
import { useObligationsStore } from "./obligationsSlice"
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
