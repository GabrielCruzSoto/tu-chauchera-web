# Tasks: Schema Versioning & Data Migration Engine

## Phase 1: Core Migration Engine
- [ ] 1.1 Create `src/shared/migrations/types.ts` defining migration contracts, versions and result envelopes.
- [ ] 1.2 Create `src/shared/migrations/registry.ts` with domain schema versions and step definitions.
- [ ] 1.3 Create `src/shared/migrations/migrate.ts` with the sequential migration runner and legacy version fallback.
- [ ] 1.4 Write unit tests in `src/shared/migrations/__tests__/migrate.test.ts` covering current version pass-through, legacy v1 inference, sequential migration chains, and incompatible future version detection.

## Phase 2: Integration with Hydration & Sync
- [ ] 2.1 Update `hydrateFromDrive` in `src/features/sync/store/syncSlice.ts` to pass decrypted domain data through `migrateDomainPayload`.
- [ ] 2.2 Automatically mark and queue syncing (`queueSyncDomain`) if any domain was migrated during hydration.
- [ ] 2.3 Write integration tests for `syncSlice` and hydration migration in `src/features/sync/store/syncSlice.test.ts` (or update existing tests).

## Phase 3: Verification & Quality Gate
- [ ] 3.1 Run full test suite (`npm test`).
- [ ] 3.2 Verify build and typechecks (`npm run build`).
