# Spec: Sync Migrations and Schema Versioning

## Requirements

### Requirement 1: Domain Payload Schema Versioning
Every domain payload serialized to Drive (`obligations`, `incomes`, `categories`, `settings`) MUST declare a `schemaVersion` attribute indicating its schema format.
- Current format is baseline `1.0.0`.
- Missing or malformed `schemaVersion` in incoming data MUST default to `1.0.0`.

### Requirement 2: Domain Migration Pipeline
The system MUST provide a pure, deterministic migration runner:
- `migrateDomainPayload<T>(domain: DataDomain, rawPayload: unknown): MigrationResult<T>`
- The migration registry defines ordered migration steps per domain (e.g. `1.0.0` -> `1.1.0` -> `2.0.0`).
- If `rawPayload.schemaVersion === CURRENT_SCHEMA_VERSIONS[domain]`, the runner passes the payload through without transformation.
- If `rawPayload.schemaVersion < CURRENT_SCHEMA_VERSIONS[domain]`, the runner applies all intermediate migration functions sequentially.
- If `rawPayload.schemaVersion > CURRENT_SCHEMA_VERSIONS[domain]`, the runner marks the migration as incompatible/unsupported with a clear error preventing corrupt writes.

### Requirement 3: Automated Re-sync upon Migration
When data is migrated during `hydrateFromDrive`:
- The migrated in-memory state MUST be applied to the corresponding Zustand store.
- The domain MUST be automatically queued for sync (`queueSyncDomain`) so Google Drive is updated to the latest schema version.
