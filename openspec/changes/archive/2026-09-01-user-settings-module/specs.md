# SDD Specifications: Módulo de Configuración del Usuario (`user-settings-module`)

## 1. Domain Types & Schemas

### 1.1 User Settings Domain (`src/shared/types/settings.ts`)

```typescript
export type CurrencyCode = "CLP" | "USD" | "EUR" | "UF"
export type DateFormatPattern = "DD/MM/YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY"
export type AppTheme = "dark" | "light" | "system"

export interface UserPreferences {
  currency: CurrencyCode
  dateFormat: DateFormatPattern
  theme: AppTheme
  showCents: boolean
  updatedAt: string // ISO-8601
}

export interface DriveStorageFileInfo {
  name: string
  fileId: string
  sizeBytes: number
  modifiedTime: string
}

export interface DriveStorageMetrics {
  totalSizeBytes: number
  files: DriveStorageFileInfo[]
  lastCheckedAt: string
  schemaVersion: string
}
```

---

## 2. Functional Requirements & Acceptance Criteria

### 2.1 Category Management Module
- **REQ-CAT-01: Listado de Categorías**
  - Debe listar todas las categorías disponibles ordenadas alfabéticamente.
  - Cada ítem debe mostrar su indicador de color, nombre y badge con el conteo de obligaciones activas asociadas.
- **REQ-CAT-02: Creación de Categorías**
  - Formulario con campo de nombre (requerido, trim) y selección de color de la paleta (`CATEGORY_PALETTE`).
  - No permitir nombres vacíos o duplicados (case-insensitive).
- **REQ-CAT-03: Edición de Categorías**
  - Posibilidad de editar el nombre y color de cualquier categoría existente.
  - La actualización debe reflejarse inmediatamente en todas las vistas asociadas.
- **REQ-CAT-04: Eliminación y Protección Referencial**
  - Si el conteo de uso es > 0, el botón de eliminar debe estar deshabilitado con tooltip/alerta explicativa indicando cuántas obligaciones la utilizan.
  - Si el conteo de uso es 0, permitir eliminación directa con confirmación visual.

### 2.2 User Profile & Preferences Module
- **REQ-USR-01: Información de Usuario**
  - Mostrar tarjeta de perfil con Avatar (imagen de Google o placeholder con iniciales), Nombre y Email.
  - Mostrar badge de estado de la Bóveda Cifrada ("Bóveda Desbloqueada", "Cifrado AES-GCM").
- **REQ-USR-02: Configuración de Preferencias**
  - Selector de Moneda Principal: CLP, USD, EUR, UF.
  - Selector de Formato de Fecha: `DD/MM/YYYY`, `YYYY-MM-DD`.
  - Selector de Tema: Oscuro, Claro, Sistema.
  - Botón de "Guardar Preferencias" con feedback toast/alerta y sincronización a Drive (`settings.enc`).

### 2.3 Data Storage & Google Drive Management Module
- **REQ-DRV-01: Diagnóstico de Almacenamiento**
  - Consultar en Google Drive los archivos dentro de `appDataFolder` (`obligations.enc`, `incomes.enc`, `categories.enc`, `settings.enc`, `meta.json`).
  - Mostrar tabla con nombre de archivo, tamaño en KB y última fecha de modificación.
  - Mostrar tamaño total acumulado formateado en KB o MB.
  - Botón de refresco manual con indicador de carga.
- **REQ-DRV-02: Visor de Versión de Schema**
  - Mostrar la versión actual del schema (`v1.1.0` o `meta.schemaVersion`).
  - Mostrar estado: "Compatible & Actualizado".
- **REQ-DRV-03: Exportación de Respaldo JSON (Backup)**
  - Botón "Exportar Respaldo Completo (JSON)".
  - Genera un archivo con timestamp `tu-chauchera-backup-YYYY-MM-DD.json` conteniendo:
    - Metadatos (fecha, versión del schema).
    - Categorías, Obligaciones, Pagos, Ingresos y Preferencias descifradas.
  - Descarga automática en el navegador.
- **REQ-DRV-04: Reseteo Seguro de Bóveda (Wipe All Data)**
  - Botón destacado en Zona de Peligro "Eliminar todos los datos de la Bóveda".
  - Modal de confirmación que exige escribir la frase exacta: `ELIMINAR MIS DATOS`.
  - Al confirmar:
    1. Ejecuta borrado de todos los archivos en `appDataFolder` de Google Drive.
    2. Limpia todos los stores locales de Zustand (`obligations`, `income`, `sync`, `settings`).
    3. Cierra la sesión y bloquea la bóveda, redirigiendo a la pantalla de bienvenida/login.

---

## 3. Non-Functional Requirements
- **Responsive**: Accesible y usable en pantallas móviles (320px+), tablets y escritorio.
- **Seguridad**: Ninguna operación de borrado o exportación debe exponer la passphrase en texto plano en logs ni desproteger los datos no autorizados.
- **Performance**: Las llamadas a Drive para estadísticas de almacenamiento deben ser no bloqueantes y manejar timeouts/errores limpiamente.
