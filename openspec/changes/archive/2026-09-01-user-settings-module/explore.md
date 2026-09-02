# SDD Exploration: Módulo de Configuración del Usuario (`user-settings-module`)

## 1. Contexto y Objetivos

El objetivo de este cambio es implementar una vista/módulo integral de **Configuración del Usuario** en **Tu Chauchera Web**, que consolide:
1. **Mantenedor de Categorías**: Administración de categorías base fijas y categorías personalizadas del usuario (con selector de color e icono, conteo de uso y protección ante eliminación de categorías en uso).
2. **Información y Preferencias del Usuario**: Visualización de perfil Google (Nombre, Email, Avatar), estado de autenticación/bóveda y configuración de preferencias de la aplicación (moneda principal, formato de fecha, modo oscuro).
3. **Gestión de Datos y Storage en Google Drive**:
   - Diagnóstico del almacenamiento en Google Drive (`appDataFolder`): tamaño total y por dominio (`obligations.enc`, `incomes.enc`, `categories.enc`, `settings.enc`, `meta.json`).
   - Versión actual del Schema y estado de compatibilidad/migraciones.
   - Exportación de Respaldo Completo en formato JSON descifrado.
   - Reseteo Seguro / Borrado de Bóveda con confirmación de seguridad (escribir palabra clave de seguridad para evitar borrado accidental).

---

## 2. Análisis del Estado Actual de la Base de Código

### A. Categorías (`src/features/obligations/`)
- **Estado Actual**:
  - `DEFAULT_CATEGORIES` fijas definidas en `src/features/obligations/constants/categories.ts`.
  - Paleta de colores `CATEGORY_PALETTE` disponible con 9 opciones.
  - Existe un modal básico `CategorySettingsModal.tsx` que permite agregar, editar y eliminar categorías no utilizadas.
  - El store de obligaciones `obligationsSlice.ts` almacena `categories: Record<UUID, Category>`.
- **Oportunidades de Mejora**:
  - Centralizar el acceso a la gestión de categorías en la nueva pestaña/módulo de Configuración sin depender de abrirlo únicamente desde el formulario de obligaciones.
  - Soportar distinción entre categorías predeterminadas del sistema y personalizadas, y permitir extender la personalización con iconos adicionales.

### B. Información de Usuario y Preferencias (`src/features/auth/`, `src/store/authSlice.ts`)
- **Estado Actual**:
  - `useAuthStore` maneja el token de acceso OAuth, objeto `user: { email, name, picture }`, y estado de desbloqueo con WebCrypto (Passphrase/PBKDF2).
  - No existe un slice persistido para preferencias de usuario (moneda por defecto ej. CLP/USD, formato de fecha ej. DD/MM/YYYY, preferencia de tema).
- **Oportunidades de Mejora**:
  - Crear un slice de configuración de usuario / preferencias (`userSettingsSlice.ts`) sincronizado como dominio `settings.enc` o en estado local respaldable.
  - Presentar la tarjeta de perfil con avatar, email y estado de seguridad de la bóveda.

### C. Almacenamiento y Google Drive (`src/shared/services/driveClient.ts`, `src/features/sync/`)
- **Estado Actual**:
  - `DriveClient` maneja lectura y escritura binaria en `appDataFolder` de Google Drive.
  - Métodos disponibles: `findFileId`, `uploadBinaryFile`, `downloadBinaryFile`, `readMeta`, `writeMeta`.
  - `SyncStatusIndicator` y `useSyncStore` manejan el ciclo de hidratación y push de datos encriptados.
- **Oportunidades de Mejora**:
  - Agregar a `DriveClient` métodos para consultar el tamaño y metadatos de los archivos remotos (`getFileMetadata` o listar `appDataFolder` con campos `size`, `modifiedTime`).
  - Implementar método para eliminar/purgar archivos de `appDataFolder` (`deleteFile` / `wipeAllAppData`).
  - Desarrollar servicio de exportación de backup (descifrar y consolidar ingresos, obligaciones, pagos, categorías y settings en un JSON estructurado).
  - Desarrollar procedimiento de borrado seguro con confirmación de texto (ej. "BORRAR TODO").

### D. Navegación y UI (`src/app/App.tsx`)
- **Estado Actual**:
  - Pestañas actuales: `matrix`, `calendar`, `income`, `obligations`.
  - Falta agregar la pestaña `settings` ("⚙️ Configuración") en `navItems` tanto en el navbar de escritorio como en el drawer móvil.

---

## 3. Arquitectura Propuesta

```
src/
├── features/
│   ├── settings/                      # Nuevo Feature Module
│   │   ├── components/
│   │   │   ├── SettingsView.tsx       # Vista principal con pestañas/secciones
│   │   │   ├── CategoryManagerTab.tsx # Mantenedor completo de categorías
│   │   │   ├── UserProfileTab.tsx     # Información de usuario y preferencias
│   │   │   ├── DataStorageTab.tsx     # Storage en Drive, backups, reset
│   │   │   └── WipeConfirmModal.tsx   # Modal de confirmación estricta de borrado
│   │   ├── hooks/
│   │   │   ├── useStorageMetrics.ts   # Hook para métricas de Drive
│   │   │   └── useBackupExport.ts     # Hook para generación de backup JSON
│   │   ├── store/
│   │   │   └── settingsSlice.ts       # Store de preferencias del usuario
│   │   └── index.ts
├── shared/
│   ├── services/
│   │   ├── driveClient.ts             # Extensión con getStorageStats y wipeAppData
│   │   └── backupService.ts           # Servicio para exportación y validación JSON
```

---

## 4. Evaluación de Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Borrado accidental de datos en Google Drive | Crítico | Modal de confirmación con doble chequeo requiriendo escribir explícitamente una frase de seguridad (ej. "ELIMINAR MIS DATOS") antes de proceder. |
| Inconsistencia de categorías al eliminar | Medio | Validación estricta que impide borrar categorías si existen obligaciones o ingresos asociados, indicando el número exacto de registros en uso. |
| Falla en la descarga de backup si los datos son voluminosos | Bajo | Exportación en el cliente mediante `Blob` y `URL.createObjectURL` en streaming asíncrono desde los stores ya descifrados en memoria. |
| Cuotas de Google Drive API al consultar tamaños | Bajo | Cachear las métricas de tamaño y consultar bajo demanda con botón de "Actualizar métricas". |

---

## 5. Próximo Paso Recomendado
Proceder a la fase de **Propuesta (`sdd-propose`)** para formalizar el documento de requerimientos y especificaciones del producto.
