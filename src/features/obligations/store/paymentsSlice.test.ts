import { describe, it, expect, beforeEach } from "vitest"
import { useObligationsStore } from "./obligationsSlice"
import { usePaymentsStore } from "./paymentsSlice"
import { toMoney } from "@/shared/types/money"

describe("paymentsSlice", () => {
  beforeEach(() => {
    useObligationsStore.setState({
      obligations: {},
      installments: {},
      categories: {
        "cat-1": { id: "cat-1", name: "Banco", color: "blue", createdAt: "", updatedAt: "" },
      },
      isLoaded: true,
    })
  })

  it("marks installment as PAID with paidDate and assigns period", () => {
    const oblStore = useObligationsStore.getState()
    const obl = oblStore.addObligation({
      categoryId: "cat-1",
      subcategory: "Crédito Consumo",
      detail: "Test",
      totalAmountCents: toMoney(200000),
      totalInstallments: 2,
      currentInstallment: 1,
      installmentAmountCents: toMoney(100000),
      startDate: "2024-05-10",
      dueDay: 10,
    })

    const installments = Object.values(useObligationsStore.getState().installments).filter(
      (i) => i.obligationId === obl.id
    )
    const firstInst = installments[0]!

    const paymentsStore = usePaymentsStore.getState()
    paymentsStore.markPaid(firstInst.id, "2024-05-08", "Pago online banco")

    const updated = useObligationsStore.getState().installments[firstInst.id]
    expect(updated?.status).toBe("PAID")
    expect(updated?.paidDate).toBe("2024-05-08")
    expect(updated?.period).toBe("2024-05")
    expect(updated?.notes).toBe("Pago online banco")
  })

  it("marks installment as PAID with custom amount including interest", () => {
    const oblStore = useObligationsStore.getState()
    const obl = oblStore.addObligation({
      categoryId: "cat-1",
      subcategory: "Crédito Consumo",
      detail: "Test",
      totalAmountCents: toMoney(200000),
      totalInstallments: 2,
      currentInstallment: 1,
      installmentAmountCents: toMoney(100000),
      startDate: "2024-05-10",
      dueDay: 10,
    })

    const installments = Object.values(useObligationsStore.getState().installments).filter(
      (i) => i.obligationId === obl.id
    )
    const firstInst = installments[0]!

    const paymentsStore = usePaymentsStore.getState()
    // Original cuota is 100.000, paid with 5.000 interest = 105.000
    paymentsStore.markPaid(firstInst.id, "2024-05-25", "Pago atrasado con mora", toMoney(105000))

    const updated = useObligationsStore.getState().installments[firstInst.id]
    expect(updated?.status).toBe("PAID")
    expect(updated?.paidDate).toBe("2024-05-25")
    expect(updated?.amountCents).toBe(toMoney(105000))
    expect(updated?.notes).toBe("Pago atrasado con mora")
  })

  it("reverts PAID installment to PENDING", () => {
    const oblStore = useObligationsStore.getState()
    const obl = oblStore.addObligation({
      categoryId: "cat-1",
      subcategory: "Crédito",
      detail: "Test",
      totalAmountCents: toMoney(100000),
      totalInstallments: 1,
      currentInstallment: 1,
      installmentAmountCents: toMoney(100000),
      startDate: "2024-05-10",
      dueDay: 10,
    })

    const inst = Object.values(useObligationsStore.getState().installments).find((i) => i.obligationId === obl.id)!
    const paymentsStore = usePaymentsStore.getState()

    paymentsStore.markPaid(inst.id, "2024-05-10")
    expect(useObligationsStore.getState().installments[inst.id]?.status).toBe("PAID")

    paymentsStore.revertToPending(inst.id)
    const reverted = useObligationsStore.getState().installments[inst.id]
    expect(reverted?.status).toBe("PENDING")
    expect(reverted?.paidDate).toBeUndefined()
    expect(reverted?.period).toBeUndefined()
  })

  it("renegotiates obligation and freezes remaining pending installments", () => {
    const oblStore = useObligationsStore.getState()
    const oldObl = oblStore.addObligation({
      categoryId: "cat-1",
      subcategory: "Crédito Original",
      detail: "12 cuotas",
      totalAmountCents: toMoney(1200000),
      totalInstallments: 12,
      currentInstallment: 1,
      installmentAmountCents: toMoney(100000),
      startDate: "2024-01-10",
      dueDay: 10,
    })

    const installments = Object.values(useObligationsStore.getState().installments).filter(
      (i) => i.obligationId === oldObl.id
    )

    const paymentsStore = usePaymentsStore.getState()
    // Pay first 2
    paymentsStore.markPaid(installments[0]!.id, "2024-01-10")
    paymentsStore.markPaid(installments[1]!.id, "2024-02-10")

    // Renegotiate from installment 3 into 24 cuotas of 60k
    paymentsStore.markRenegotiated(oldObl.id, 3, {
      categoryId: "cat-1",
      subcategory: "Crédito Repactado",
      detail: "Repactación banco",
      totalAmountCents: toMoney(1440000),
      totalInstallments: 24,
      currentInstallment: 1,
      installmentAmountCents: toMoney(60000),
      startDate: "2024-03-10",
      dueDay: 10,
    })

    const state = useObligationsStore.getState()
    expect(state.obligations[oldObl.id]?.status).toBe("RENEGOTIATED")

    const oldInstallments = Object.values(state.installments).filter(
      (i) => i.obligationId === oldObl.id
    )
    expect(oldInstallments.find((i) => i.installmentNumber === 1)?.status).toBe("PAID")
    expect(oldInstallments.find((i) => i.installmentNumber === 2)?.status).toBe("PAID")
    expect(oldInstallments.find((i) => i.installmentNumber === 3)?.status).toBe("RENEGOTIATED")
    expect(oldInstallments.find((i) => i.installmentNumber === 12)?.status).toBe("RENEGOTIATED")
  })
})
