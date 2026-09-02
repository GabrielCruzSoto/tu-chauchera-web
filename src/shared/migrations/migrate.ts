/**
 * Migration engine executing envelope extraction, sequential schema transformations, and Zod validations.
 */
import type { DataDomain, ISODate } from "@/shared/types/domain"
import type { DomainEnvelope, MigrationResult, SchemaVersion } from "./types"
import { CURRENT_SCHEMA_VERSIONS, DEFAULT_LEGACY_VERSION, DOMAIN_MIGRATIONS } from "./registry"
import {
  obligationsStoreSchema,
  categoriesStoreSchema,
  incomesStoreSchema,
  settingsStoreSchema,
} from "./schemas"

/**
 * Creates a standard versioned envelope for saving to storage.
 */
export function wrapDomainEnvelope<T>(
  domain: DataDomain,
  payload: T,
  schemaVersion: SchemaVersion = CURRENT_SCHEMA_VERSIONS[domain],
  updatedAt: ISODate = new Date().toISOString()
): DomainEnvelope<T> {
  return {
    schemaVersion,
    domain,
    updatedAt,
    payload,
  }
}

/**
 * Unwraps raw storage data into standard envelope structure.
 * Handles both legacy raw payloads (without envelope) and new standard envelopes.
 */
export function unwrapDomainEnvelope(
  domain: DataDomain,
  rawContent: unknown
): { schemaVersion: SchemaVersion; payload: unknown } {
  if (typeof rawContent !== "object" || rawContent === null) {
    throw new Error(`Invalid payload for domain "${domain}": expected object, got ${typeof rawContent}`)
  }

  const obj = rawContent as Record<string, unknown>

  // Check if it's already a standard envelope
  if ("schemaVersion" in obj && "payload" in obj && "domain" in obj) {
    const v = obj.schemaVersion
    const versionNum = typeof v === "number" ? v : parseInt(String(v), 10)
    return {
      schemaVersion: Number.isNaN(versionNum) ? DEFAULT_LEGACY_VERSION : versionNum,
      payload: obj.payload,
    }
  }

  // Legacy data: the object itself is the payload
  let legacyVersion = DEFAULT_LEGACY_VERSION
  if ("schemaVersion" in obj) {
    const v = obj.schemaVersion
    const versionNum = typeof v === "number" ? v : parseInt(String(v), 10)
    if (!Number.isNaN(versionNum)) {
      legacyVersion = versionNum
    }
  }

  return {
    schemaVersion: legacyVersion,
    payload: rawContent,
  }
}

/**
 * Validates domain payload with Zod runtime schemas.
 */
export function validateDomainPayload<T>(domain: DataDomain, payload: unknown): T {
  switch (domain) {
    case "obligations":
      return obligationsStoreSchema.parse(payload) as T
    case "categories":
      return categoriesStoreSchema.parse(payload) as T
    case "incomes":
      return incomesStoreSchema.parse(payload) as T
    case "settings":
      return settingsStoreSchema.parse(payload) as T
    default:
      return payload as T
  }
}

/**
 * Migrates a raw domain payload up to the current schema version and validates with Zod.
 */
export function migrateDomainPayload<T>(
  domain: DataDomain,
  rawContent: unknown,
  targetVersion: SchemaVersion = CURRENT_SCHEMA_VERSIONS[domain]
): MigrationResult<T> {
  const { schemaVersion: initialVersion, payload } = unwrapDomainEnvelope(domain, rawContent)

  let currentVersion = initialVersion
  let currentPayload: any = typeof payload === "object" && payload !== null ? { ...(payload as object) } : payload

  if (currentVersion === targetVersion) {
    const validated = validateDomainPayload<T>(domain, currentPayload)
    return {
      data: validated,
      wasMigrated: false,
      fromVersion: initialVersion,
      toVersion: targetVersion,
    }
  }

  if (currentVersion > targetVersion) {
    throw new Error(
      `Payload for domain "${domain}" has schema version ${currentVersion}, which is newer than the app's supported version ${targetVersion}. Please update the application.`
    )
  }

  const migrations = DOMAIN_MIGRATIONS[domain] || []

  // Sequentially apply matching migration steps
  let stepApplied = true
  while (currentVersion < targetVersion && stepApplied) {
    stepApplied = false
    const step = migrations.find((m) => m.fromVersion === currentVersion)

    if (step) {
      currentPayload = step.migrate(currentPayload)
      currentVersion = step.toVersion
      stepApplied = true
    }
  }

  if (currentVersion !== targetVersion) {
    throw new Error(
      `Cannot migrate domain "${domain}" from schema version ${initialVersion} to ${targetVersion}: missing migration step at version ${currentVersion}.`
    )
  }

  const validated = validateDomainPayload<T>(domain, currentPayload)

  return {
    data: validated,
    wasMigrated: true,
    fromVersion: initialVersion,
    toVersion: targetVersion,
  }
}
