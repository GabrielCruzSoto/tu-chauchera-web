# SDD Tasks: Módulo de Configuración del Usuario (`user-settings-module`)

## Review Workload Forecast
- **Estimated Changed Lines**: ~550 lines
- **400-line budget risk**: Medium (<800 review budget)
- **Chained PRs recommended**: Yes
- **Delivery Strategy**: `auto-chain`
- **Chain Strategy**: `feature-branch-chain`
- **Decision needed before apply**: No (preflight auto-chain approved)

---

## Work Breakdown Structure (WBS)

### Slice 1: Tipos, Extensiones de Servicios y Store de Configuración
- [ ] **Task 1.1**: Crear `src/shared/types/settings.ts` con interfaces de `UserPreferences`, `DriveStorageFileInfo`, `DriveStorageMetrics`.
- [ ] **Task 1.2**: Extender `DriveClient` en `src/shared/services/driveClient.ts` con `getStorageStats()`, `deleteFile()`, y `wipeAllAppData()`.
- [ ] **Task 1.3**: Crear `src/shared/services/backupService.ts` con funciones de serialización y descarga de JSON de respaldo.
- [ ] **Task 1.4**: Crear `src/features/settings/store/settingsSlice.ts` con Zustand para manejo de preferencias de usuario.
- [ ] **Task 1.5**: Tests unitarios para `driveClient.ts` (storage stats & wipe), `backupService.ts` y `settingsSlice.ts`.

### Slice 2: Componentes del Módulo de Configuración
- [ ] **Task 2.1**: Crear `src/features/settings/components/CategoryManagerTab.tsx` para mantenedor de categorías con feedback de uso y protección de borrado.
- [ ] **Task 2.2**: Crear `src/features/settings/components/UserProfileTab.tsx` para mostrar cuenta Google, estado de bóveda y formulario de preferencias (moneda, fecha, tema).
- [ ] **Task 2.3**: Crear `src/features/settings/components/StorageStatsCard.tsx` y `src/features/settings/components/DataStorageTab.tsx` para métricas de Drive, versión de schema y exportación JSON.
- [ ] **Task 2.4**: Crear `src/features/settings/components/WipeConfirmModal.tsx` con frase de seguridad (`ELIMINAR MIS DATOS`).
- [ ] **Task 2.5**: Crear `src/features/settings/components/SettingsView.tsx` como contenedor principal con sub-tabs.
- [ ] **Task 2.6**: Tests unitarios de componentes (`CategoryManagerTab.test.tsx`, `UserProfileTab.test.tsx`, `DataStorageTab.test.tsx`, `WipeConfirmModal.test.tsx`, `SettingsView.test.tsx`).

### Slice 3: Integración de Navegación y Exportación de Módulo
- [ ] **Task 3.1**: Crear `src/features/settings/index.ts` exportando `SettingsView` y componentes públicos.
- [ ] **Task 3.2**: Actualizar `src/app/App.tsx` integrando la pestaña `settings` ("⚙️ Configuración") en navbar de escritorio y drawer móvil.
- [ ] **Task 3.3**: Actualizar y ejecutar suite completa de tests de la aplicación (`npm run test` y `npm run build`) para verificar cero regresiones.
