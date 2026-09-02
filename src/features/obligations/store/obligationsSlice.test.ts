import { describe, it, expect, beforeEach, vi } from "vitest"
import { useObligationsStore } from "./obligationsSlice"
import { toMoney } from "@/shared/types/money"
import { DEFAULT_CATEGORIES } from "../constants/categories"
import { useSyncStore } from "@/features/sync/store/syncSlice"

describe("obligationsSlice", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useObligationsStore.setState({
      obligations: {},
      installments: {},
      categories: {
        "cat-1": {
          id: "cat-1",
          name: "Test Cat",
          color: "blue",
          createdAt: "",
          updatedAt: "",
        },
      },
      isLoaded: true,
    })
  })

  it("seeds default Chilean categories by default", () => {
    // Reset to default initial state
    const defaultCategoriesKeys = Object.keys(DEFAULT_CATEGORIES)
    expect(defaultCategoriesKeys.length).toBeGreaterThanOrEqual(9)
    expect(DEFAULT_CATEGORIES["cat-bancos"]?.name).toBe("Bancos & Créditos")
    expect(DEFAULT_CATEGORIES["cat-hipotecario"]?.name).toBe("Hipotecario")
    expect(DEFAULT_CATEGORIES["cat-automotriz"]?.name).toBe("Automotriz")
    expect(DEFAULT_CATEGORIES["cat-retail"]?.name).toBe("Tarjetas & Retail")
    expect(DEFAULT_CATEGORIES["cat-educacion"]?.name).toBe("Educación")
    expect(DEFAULT_CATEGORIES["cat-salud"]?.name).toBe("Salud & Seguros")
    expect(DEFAULT_CATEGORIES["cat-servicios"]?.name).toBe("Servicios Básicos")
    expect(DEFAULT_CATEGORIES["cat-suscrip"]?.name).toBe("Suscripciones")
    expect(DEFAULT_CATEGORIES["cat-impuestos"]?.name).toBe("Impuestos & Contribuciones")
  })

  it("adds category and triggers categories sync queue", () => {
    const queueSpy = vi.spyOn(useSyncStore.getState(), "queueSyncDomain")
    const store = useObligationsStore.getState()

    const created = store.addCategory({
      name: "Seguros Médicos",
      color: "rose",
    })

    const state = useObligationsStore.getState()
    expect(state.categories[created.id]).toBeDefined()
    expect(state.categories[created.id]?.name).toBe("Seguros Médicos")
    expect(state.categories[created.id]?.color).toBe("rose")
    expect(queueSpy).toHaveBeenCalledWith("categories")
  })

  it("updates category and triggers categories sync queue", () => {
    const queueSpy = vi.spyOn(useSyncStore.getState(), "queueSyncDomain")
    const store = useObligationsStore.getState()

    store.updateCategory("cat-1", {
      name: "Cuentas del Hogar",
      color: "amber",
    })

    const state = useObligationsStore.getState()
    expect(state.categories["cat-1"]?.name).toBe("Cuentas del Hogar")
    expect(state.categories["cat-1"]?.color).toBe("amber")
    expect(queueSpy).toHaveBeenCalledWith("categories")
  })

  it("deletes category and triggers categories sync queue", () => {
    const queueSpy = vi.spyOn(useSyncStore.getState(), "queueSyncDomain")
    const store = useObligationsStore.getState()

    store.deleteCategory("cat-1")

    const state = useObligationsStore.getState()
    expect(state.categories["cat-1"]).toBeUndefined()
    expect(queueSpy).toHaveBeenCalledWith("categories")
  })

  it("adds obligation and eagerly creates all installments", () => {
    const store = useObligationsStore.getState()
    const obl = store.addObligation({
      categoryId: "cat-1",
      subcategory: "Crédito Consumo",
      detail: "3 cuotas de prueba",
      totalAmountCents: toMoney(300000),
      totalInstallments: 3,
      currentInstallment: 1,
      installmentAmountCents: toMoney(100000),
      startDate: "2024-05-10",
      dueDay: 10,
    })

    const state = useObligationsStore.getState()
    expect(state.obligations[obl.id]).toBeDefined()
    
    const relatedInstallments = Object.values(state.installments).filter(
      (i) => i.obligationId === obl.id
    )
    expect(relatedInstallments).toHaveLength(3)
    expect(relatedInstallments.map((i) => i.dueDate)).toEqual([
      "2024-05-10",
      "2024-06-10",
      "2024-07-10",
    ])
  })

  it("soft-deletes obligation and its PENDING installments", () => {
    const store = useObligationsStore.getState()
    const obl = store.addObligation({
      categoryId: "cat-1",
      subcategory: "Crédito",
      detail: "Test",
      totalAmountCents: toMoney(200000),
      totalInstallments: 2,
      currentInstallment: 1,
      installmentAmountCents: toMoney(100000),
      startDate: "2024-05-10",
      dueDay: 10,
    })

    store.softDeleteObligation(obl.id)
    const state = useObligationsStore.getState()

    expect(state.obligations[obl.id]?.status).toBe("DELETED")
    const installments = Object.values(state.installments).filter((i) => i.obligationId === obl.id)
    expect(installments.every((i) => i.status === "DELETED")).toBe(true)
  })

  it("creates an EXPENSE obligation with recurring indefinite flag", () => {
    const store = useObligationsStore.getState()
    const exp = store.addObligation({
      type: "EXPENSE",
      categoryId: "cat-1",
      subcategory: "Enel Luz",
      detail: "Cuenta de luz mensual",
      totalAmountCents: toMoney(420000),
      totalInstallments: 12,
      currentInstallment: 1,
      installmentAmountCents: toMoney(35000),
      isRecurringIndefinite: true,
      startDate: "2024-05-10",
      dueDay: 10,
    })

    const state = useObligationsStore.getState()
    expect(state.obligations[exp.id]?.type).toBe("EXPENSE")
    expect(state.obligations[exp.id]?.isRecurringIndefinite).toBe(true)
  })

  it("creates a P2P_DEBT obligation with metadata and surcharges", () => {
    const store = useObligationsStore.getState()
    const p2p = store.addObligation({
      type: "P2P_DEBT",
      categoryId: "cat-1",
      subcategory: "Juan Pérez",
      detail: "Smart TV",
      totalAmountCents: toMoney(588000),
      totalInstallments: 12,
      currentInstallment: 1,
      installmentAmountCents: toMoney(49000),
      startDate: "2024-05-05",
      dueDay: 5,
      p2pMetadata: {
        role: "LENT_MY_CARD",
        thirdPartyName: "Juan Pérez",
        cardIssuer: "CMR Falabella",
        productDescription: "Smart TV 55",
        baseInstallmentAmountCents: toMoney(45000),
        totalMonthlyChargeCents: toMoney(49000),
        surcharges: {
          includeMaintenanceFee: true,
          maintenanceFeeAmountCents: toMoney(3500),
          maintenanceSplitMode: "FULL",
          includeOneTimeCommission: true,
          totalCommissionCents: toMoney(6000),
          commissionCollectionMode: "SPREAD_ACROSS_INSTALLMENTS",
        },
      },
    })

    const state = useObligationsStore.getState()
    expect(state.obligations[p2p.id]?.type).toBe("P2P_DEBT")
    expect(state.obligations[p2p.id]?.p2pMetadata?.thirdPartyName).toBe("Juan Pérez")
    expect(state.obligations[p2p.id]?.p2pMetadata?.role).toBe("LENT_MY_CARD")
  })

  it("clones an obligation creating a new obligation with suffix (Copia) and fresh installments", () => {
    const store = useObligationsStore.getState()
    const original = store.addObligation({
      categoryId: "cat-1",
      subcategory: "Crédito Automotriz",
      detail: "Cuota auto",
      totalAmountCents: toMoney(4800000),
      totalInstallments: 24,
      currentInstallment: 5,
      installmentAmountCents: toMoney(200000),
      startDate: "2024-01-10",
      dueDay: 10,
    })

    const cloned = store.cloneObligation(original.id)
    expect(cloned).toBeDefined()
    expect(cloned?.id).not.toBe(original.id)
    expect(cloned?.subcategory).toBe("Crédito Automotriz (Copia)")
    expect(cloned?.detail).toBe("Cuota auto")
    expect(cloned?.totalAmountCents).toBe(toMoney(4800000))
    expect(cloned?.currentInstallment).toBe(1)
    expect(cloned?.totalInstallments).toBe(24)

    const state = useObligationsStore.getState()
    expect(state.obligations[cloned!.id]).toBeDefined()
    const clonedInstallments = Object.values(state.installments).filter(
      (i) => i.obligationId === cloned!.id
    )
    expect(clonedInstallments).toHaveLength(24)
  })
})
