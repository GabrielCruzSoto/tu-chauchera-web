/**
 * Migration Registry defining current schema versions and migration chains per domain.
 */
import type { DataDomain } from "@/shared/types/domain"
import type { DomainMigrationStep, SchemaVersion } from "./types"

export const DEFAULT_LEGACY_VERSION: SchemaVersion = 1

export const CURRENT_SCHEMA_VERSIONS: Record<DataDomain, SchemaVersion> = {
  obligations: 1,
  categories: 1,
  incomes: 1,
  settings: 1,
}

/**
 * Ordered list of migrations per domain.
 * When a domain schema evolves (e.g. 1 -> 2 -> 3), register the step here.
 */
export const DOMAIN_MIGRATIONS: Record<DataDomain, DomainMigrationStep[]> = {
  obligations: [],
  categories: [],
  incomes: [],
  settings: [],
}

/**
 * Register a new migration step for a domain.
 */
export function registerMigration(domain: DataDomain, step: DomainMigrationStep): void {
  DOMAIN_MIGRATIONS[domain].push(step)
}
