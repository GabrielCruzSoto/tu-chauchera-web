import { describe, it, expect, beforeEach, vi } from "vitest"
import { useIncomeStore, getTotalIncomeForPeriod } from "./incomeSlice"
import { toMoney } from "@/shared/types/money"
import { useSyncStore } from "@/features/sync/store/syncSlice"

describe("incomeSlice", () => {
  beforeEach(() => {
    useIncomeStore.setState({
      incomes: {},
      isLoaded: true,
    })
  })

  it("adds single income entry", () => {
    const store = useIncomeStore.getState()
    const inc = store.addIncome({
      description: "Sueldo",
      amountCents: toMoney(1500000),
      type: "FIXED",
      period: "2024-05",
    })

    const state = useIncomeStore.getState()
    expect(state.incomes[inc.id]).toBeDefined()
    expect(state.incomes[inc.id]?.amountCents).toBe(toMoney(1500000))
  })

  it("adds recurring income up to N individual records (e.g. 12 months)", () => {
    const store = useIncomeStore.getState()
    const incomes = store.addRecurringIncome(
      {
        description: "Salario Base",
        amountCents: toMoney(2000000),
        type: "FIXED",
        period: "2024-01",
      },
      12
    )

    expect(incomes).toHaveLength(12)
    expect(incomes[0]?.period).toBe("2024-01")
    expect(incomes[11]?.period).toBe("2024-12")

    const state = useIncomeStore.getState()
    expect(Object.keys(state.incomes)).toHaveLength(12)

    // Calculate total income for period 2024-06
    const totalJune = getTotalIncomeForPeriod(state.incomes, "2024-06")
    expect(totalJune).toBe(2000000)
  })

  it("allows removing individual income entry without affecting others", () => {
    const store = useIncomeStore.getState()
    const incomes = store.addRecurringIncome(
      {
        description: "Bono",
        amountCents: toMoney(500000),
        type: "VARIABLE",
        period: "2024-01",
      },
      3
    )

    expect(Object.keys(useIncomeStore.getState().incomes)).toHaveLength(3)

    store.removeIncome(incomes[0]!.id)
    const state = useIncomeStore.getState()
    expect(Object.keys(state.incomes)).toHaveLength(2)
    expect(state.incomes[incomes[0]!.id]).toBeUndefined()
    expect(state.incomes[incomes[1]!.id]).toBeDefined()
    expect(state.incomes[incomes[2]!.id]).toBeDefined()
  })

  it("triggers queueSyncDomain for incomes on all mutations", () => {
    const queueSpy = vi.spyOn(useSyncStore.getState(), "queueSyncDomain")
    const store = useIncomeStore.getState()

    const inc = store.addIncome({
      description: "Freelance",
      amountCents: toMoney(300000),
      type: "VARIABLE",
      period: "2024-05",
    })
    expect(queueSpy).toHaveBeenCalledWith("incomes")

    store.updateIncome(inc.id, { description: "Freelance Pro" })
    expect(queueSpy).toHaveBeenCalledWith("incomes")

    store.removeIncome(inc.id)
    expect(queueSpy).toHaveBeenCalledWith("incomes")
  })
})
