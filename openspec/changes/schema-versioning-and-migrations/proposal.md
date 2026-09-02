# Proposal: Schema Versioning & Data Migration Engine for Sync Storage

## Problem Statement
Actualmente, los datos serializados y encriptados en Google Drive (`obligations.enc`, `incomes.enc`, `categories.enc`, `settings.enc`, y `meta.json`) no cuentan con un mecanismo activo de validación y migración de esquemas en tiempo de ejecución. 

Si el modelo de datos cambia en el futuro (ej. renombrar campos, reestructurar relaciones, añadir campos requeridos con valores por defecto), los clientes con datos existentes sufrirán fallos de deserialización, pérdida de datos o inconsistencias en los stores de Zustand.

## Proposed Solution
Implementar un **Motor de Migraciones y Versionado de Esquemas** desacoplado en el cliente web:

1. **Definición de Versión por Dominio**:
   - Cada payload serializado almacena un `schemaVersion` explícito (ej. `"1.0.0"` o versión numérica `1`).
   - Si falta el atributo `schemaVersion` (formato legado), se infiere automáticamente como versión base (`1.0.0`).

2. **Pipeline de Migraciones Secuenciales (Migration Registry)**:
   - Funciones puras e inmutables de transformación paso a paso: `v1_to_v2`, `v2_to_v3`.
   - Motor `migrateDomainPayload(domain, rawPayload, targetVersion)` que aplica las transformaciones en orden ascendente hasta alcanzar la versión actual del cliente.

3. **Integración con Hidratación y Sincronización**:
   - En `hydrateFromDrive`, interceptar cada payload desencriptado antes de asignarlo a los stores de Zustand (`useObligationsStore`, `useIncomeStore`, etc.).
   - Si se detecta que un dominio fue migrado hacia una versión más reciente durante la hidratación, marcarlo como pendiente de guardado (`queueSyncDomain`) para persistir automáticamente el formato actualizado en Google Drive.

4. **Validación y Resiliencia**:
   - Validación estructural post-migración.
   - En caso de fallo irrecuperable en la migración, aislar el error para no congelar la aplicación completa y permitir rescate/backup de datos crudos.

## Success Criteria
- [ ] Módulo de migraciones puras con pruebas unitarias exhaustivas para cada dominio.
- [ ] Soporte para datos legados v1 sin `schemaVersion`.
- [ ] Integración transparente en `hydrateFromDrive` y `SyncService`.
- [ ] Actualización automática a la última versión en Drive tras una migración exitosa.
- [ ] Suite de pruebas completa pasando al 100%.
