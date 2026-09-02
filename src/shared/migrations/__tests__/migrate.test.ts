import { describe, it, expect, beforeEach } from "vitest"
import {
  migrateDomainPayload,
  unwrapDomainEnvelope,
  wrapDomainEnvelope,
  validateDomainPayload,
} from "../migrate"
import { DOMAIN_MIGRATIONS, registerMigration, CURRENT_SCHEMA_VERSIONS } from "../registry"

describe("Envelope & Migration Engine with Runtime Zod Validation", () => {
  beforeEach(() => {
    DOMAIN_MIGRATIONS.obligations = []
    DOMAIN_MIGRATIONS.categories = []
    DOMAIN_MIGRATIONS.incomes = []
    DOMAIN_MIGRATIONS.settings = []
    CURRENT_SCHEMA_VERSIONS.obligations = 1
    CURRENT_SCHEMA_VERSIONS.categories = 1
    CURRENT_SCHEMA_VERSIONS.incomes = 1
    CURRENT_SCHEMA_VERSIONS.settings = 1
  })

  describe("Envelope Wrapping & Unwrapping", () => {
    it("wraps payload into standard versioned envelope", () => {
      const payload = { categories: {} }
      const envelope = wrapDomainEnvelope("categories", payload, 1)

      expect(envelope).toMatchObject({
        schemaVersion: 1,
        domain: "categories",
        payload: { categories: {} },
      })
      expect(typeof envelope.updatedAt).toBe("string")
    })

    it("unwraps standard envelope extracting version and inner payload", () => {
      const envelope = {
        schemaVersion: 2,
        domain: "categories",
        updatedAt: "2026-08-31T20:00:00Z",
        payload: { categories: {} },
      }

      const { schemaVersion, payload } = unwrapDomainEnvelope("categories", envelope)
      expect(schemaVersion).toBe(2)
      expect(payload).toEqual({ categories: {} })
    })

    it("unwraps legacy unwrapped payload and defaults version to 1", () => {
      const legacy = {
        categories: {},
      }

      const { schemaVersion, payload } = unwrapDomainEnvelope("categories", legacy)
      expect(schemaVersion).toBe(1)
      expect(payload).toEqual(legacy)
    })
  })

  describe("Zod Runtime Validation", () => {
    it("validates a valid categories store schema", () => {
      const validStore = {
        categories: {
          "cat-1": {
            id: "cat-1",
            name: "Servicios",
            color: "blue-500",
            createdAt: "2026-08-31",
            updatedAt: "2026-08-31",
          },
        },
      }

      expect(() => validateDomainPayload("categories", validStore)).not.toThrow()
    })

    it("throws ZodError on corrupted or invalid payload shape", () => {
      const corruptedStore = {
        categories: {
          "cat-1": {
            id: "cat-1",
            // missing 'name' and 'color'
          },
        },
      }

      expect(() => validateDomainPayload("categories", corruptedStore)).toThrow()
    })
  })

  describe("Sequential Migrations Pipeline", () => {
    it("returns unchanged payload if already on target version and valid", () => {
      const payload = {
        categories: {},
      }
      const envelope = wrapDomainEnvelope("categories", payload, 1)

      const result = migrateDomainPayload("categories", envelope)
      expect(result.wasMigrated).toBe(false)
      expect(result.fromVersion).toBe(1)
      expect(result.toVersion).toBe(1)
      expect(result.data).toEqual(payload)
    })

    it("applies sequential migrations across multiple versions (v1 -> v2 -> v3)", () => {
      CURRENT_SCHEMA_VERSIONS.categories = 3

      // v1 -> v2: Add default color if missing
      registerMigration("categories", {
        fromVersion: 1,
        toVersion: 2,
        migrate: (data: any) => {
          const updatedCategories: Record<string, any> = {}
          for (const [id, cat] of Object.entries<any>(data.categories || {})) {
            updatedCategories[id] = {
              ...cat,
              color: cat.color ?? "gray-500",
            }
          }
          return { categories: updatedCategories }
        },
      })

      // v2 -> v3: Add timestamps if missing
      registerMigration("categories", {
        fromVersion: 2,
        toVersion: 3,
        migrate: (data: any) => {
          const updatedCategories: Record<string, any> = {}
          for (const [id, cat] of Object.entries<any>(data.categories || {})) {
            updatedCategories[id] = {
              ...cat,
              createdAt: cat.createdAt ?? "2026-08-31",
              updatedAt: cat.updatedAt ?? "2026-08-31",
            }
          }
          return { categories: updatedCategories }
        },
      })

      // Legacy v1 payload (without envelope or timestamps or color)
      const legacyPayload = {
        categories: {
          "cat-1": {
            id: "cat-1",
            name: "Supermercado",
          },
        },
      }

      const result = migrateDomainPayload<any>("categories", legacyPayload)
      expect(result.wasMigrated).toBe(true)
      expect(result.fromVersion).toBe(1)
      expect(result.toVersion).toBe(3)
      expect(result.data.categories["cat-1"]).toEqual({
        id: "cat-1",
        name: "Supermercado",
        color: "gray-500",
        createdAt: "2026-08-31",
        updatedAt: "2026-08-31",
      })
    })

    it("prevents execution and throws if payload is from a newer unsupported version", () => {
      CURRENT_SCHEMA_VERSIONS.categories = 1
      const futureEnvelope = wrapDomainEnvelope("categories", { categories: {} }, 3)

      expect(() => {
        migrateDomainPayload("categories", futureEnvelope)
      }).toThrow(/newer than the app's supported version/)
    })
  })
})
