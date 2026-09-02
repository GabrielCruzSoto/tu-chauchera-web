# Design: Schema Versioning & Migration Pipeline

## Architecture Overview
The migration engine sits between the decryption layer (`decryptData`) and the Zustand state store hydration (`setObligationsData`, `setIncomesData`, etc.).

```
Google Drive Encrypted File (.enc)
           │
           ▼
     decryptData()
           │
           ▼  (raw JSON / legacy payload)
  migrateDomainPayload(domain, rawPayload)
           │
           ├── If migrated: queueSyncDomain(domain) (auto-upgrade on Drive)
           ▼
 Zustand Store (Hydrated with latest schema version)
```

## Module Structure

1. **`src/shared/migrations/types.ts`**:
   - `MigrationFn<TIn, TOut>`: pure function transforming data from version A to version B.
   - `MigrationRegistry`: lookup table of ordered migration steps for each `DataDomain`.
   - `MigrationResult<T>`: `{ data: T, wasMigrated: boolean, fromVersion: string, toVersion: string }`.

2. **`src/shared/migrations/registry.ts`**:
   - Holds current target versions: `CURRENT_SCHEMA_VERSIONS: Record<DataDomain, string> = { obligations: "1.0.0", incomes: "1.0.0", categories: "1.0.0", settings: "1.0.0" }`.
   - Registration and sequential execution of migration steps.

3. **`src/shared/migrations/migrate.ts`**:
   - `migrateDomainPayload(domain, rawPayload)` engine.
   - Defensive validation and default handling for legacy data without `schemaVersion`.

4. **Integration with `src/features/sync/store/syncSlice.ts`**:
   - `hydrateFromDrive` uses `migrateDomainPayload` for all domains.
   - If `wasMigrated` is `true`, calls `get().queueSyncDomain(domain)` to persist the migrated payload on Drive.
