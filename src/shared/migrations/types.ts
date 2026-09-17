/**
 * Types for Schema Versioning, Domain Envelopes and Migrations.
 */
import type { DataDomain, ISODate } from "@/shared/types/domain"

export type SchemaVersion = number // Numeric schema versions: 1, 2, 3...

/**
 * Standard Storage Envelope for all persisted domains on Drive / Local storage.
 */
export interface DomainEnvelope<TPayload = unknown> {
  schemaVersion: SchemaVersion
  domain: DataDomain
  updatedAt: ISODate
  payload: TPayload
}

export type MigrationFunction<TIn = unknown, TOut = unknown> = (payload: TIn) => TOut

export interface DomainMigrationStep {
  fromVersion: SchemaVersion
  toVersion: SchemaVersion
  migrate: MigrationFunction<unknown, unknown>
}

export interface MigrationResult<T> {
  data: T
  wasMigrated: boolean
  fromVersion: SchemaVersion
  toVersion: SchemaVersion
}
